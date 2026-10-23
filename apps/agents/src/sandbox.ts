import {
  BaseSandbox,
  LangSmithSandbox,
  type ExecuteResponse,
  type FileDownloadResponse,
  type FileUploadResponse,
  type SandboxBackendProtocolV2,
} from "deepagents"
import type { SandboxProxyConfig } from "langsmith/sandbox"

import { config } from "./config.js"

/** Quote a value for a POSIX shell command line. */
export function sh(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/**
 * Network policy for the sandbox. The GitHub token is sent to the proxy as an
 * opaque (write-only) secret and injected only into git traffic for this one
 * repo, so it never exists inside the sandbox and can't be used elsewhere.
 */
export function buildProxyConfig(): SandboxProxyConfig {
  const rules: SandboxProxyConfig["rules"] = []

  if (config.GITHUB_TOKEN && config.GITHUB_REPO) {
    const basic = Buffer.from(`x-access-token:${config.GITHUB_TOKEN}`).toString(
      "base64"
    )
    rules.push({
      name: "github-git",
      description: `Git over HTTPS for ${config.GITHUB_REPO}`,
      match_hosts: ["github.com"],
      match_paths: [`/${config.GITHUB_REPO}.git/*`, `/${config.GITHUB_REPO}/*`],
      headers: [
        { name: "Authorization", type: "opaque", value: `Basic ${basic}` },
      ],
    })
  }

  return {
    rules,
    access_control: { allow_list: config.SANDBOX_ALLOWED_HOSTS },
  }
}

async function run(sandbox: SandboxBackendProtocolV2, command: string) {
  const result = await sandbox.execute(command)
  if (result.exitCode !== 0) {
    throw new Error(`Sandbox setup failed (${command}):\n${result.output}`)
  }
  return result.output
}

/** Clone the repo into the sandbox and configure git identity. Idempotent. */
async function prepareWorkspace(sandbox: SandboxBackendProtocolV2) {
  const dir = sh(config.SANDBOX_WORKDIR)
  const hasRepo = await sandbox.execute(`test -d ${dir}/.git`)
  if (hasRepo.exitCode !== 0) {
    if (!config.GITHUB_REPO) throw new Error("GITHUB_REPO is not set")
    await run(
      sandbox,
      `git clone --branch ${sh(config.GITHUB_BASE_BRANCH)} ${sh(
        `https://github.com/${config.GITHUB_REPO}.git`
      )} ${dir}`
    )
  }
  await run(
    sandbox,
    [
      `git -C ${dir} config user.name ${sh(config.GIT_AUTHOR_NAME)}`,
      `git -C ${dir} config user.email ${sh(config.GIT_AUTHOR_EMAIL)}`,
      // Agent scratch files (plans, notes) must never be committed
      `grep -qx '.sdl/' ${dir}/.git/info/exclude 2>/dev/null || echo '.sdl/' >> ${dir}/.git/info/exclude`,
    ].join(" && ")
  )
}

/**
 * A deepagents sandbox backend that creates the LangSmith sandbox on first use,
 * restarts it if it was stopped for idleness, and runs every shell command from
 * the repo directory. Creating lazily keeps graph construction free of network
 * calls (Studio, typecheck, tests).
 */
export class TeamSandbox extends BaseSandbox {
  #inner: SandboxBackendProtocolV2 | null = null
  #ready: Promise<SandboxBackendProtocolV2> | null = null

  constructor(
    private factory: () => Promise<SandboxBackendProtocolV2> = () =>
      LangSmithSandbox.create({
        snapshotId: config.SANDBOX_SNAPSHOT_ID,
        vCpus: config.SANDBOX_VCPUS,
        memBytes: Math.round(config.SANDBOX_MEMORY_GB * 1024 ** 3),
        idleTtlSeconds: config.SANDBOX_IDLE_TTL_SECONDS,
        deleteAfterStopSeconds: config.SANDBOX_DELETE_AFTER_STOP_SECONDS,
        defaultTimeout: config.SANDBOX_COMMAND_TIMEOUT_SECONDS,
        proxyConfig: buildProxyConfig(),
      })
  ) {
    super()
  }

  /** Swap how the sandbox is created (e.g. a local backend in tests). */
  useFactory(factory: () => Promise<SandboxBackendProtocolV2>) {
    this.factory = factory
    this.#inner = null
    this.#ready = null
  }

  get id() {
    return this.#inner?.id ?? "sdl-team-sandbox (not started)"
  }

  async sandbox(): Promise<SandboxBackendProtocolV2> {
    const inner = this.#inner
    if (inner instanceof LangSmithSandbox && !inner.isRunning) {
      await inner.start()
    }
    this.#ready ??= (async () => {
      const created = await this.factory()
      this.#inner = created
      await prepareWorkspace(created)
      return created
    })().catch((error) => {
      this.#ready = null
      throw error
    })
    return this.#ready
  }

  async execute(command: string): Promise<ExecuteResponse> {
    const sandbox = await this.sandbox()
    return sandbox.execute(`cd ${sh(config.SANDBOX_WORKDIR)} && ${command}`)
  }

  async uploadFiles(
    files: Array<[string, Uint8Array]>
  ): Promise<FileUploadResponse[]> {
    const sandbox = await this.sandbox()
    if (!sandbox.uploadFiles)
      throw new Error("Sandbox does not support uploads")
    return sandbox.uploadFiles(files)
  }

  async downloadFiles(paths: string[]): Promise<FileDownloadResponse[]> {
    const sandbox = await this.sandbox()
    if (!sandbox.downloadFiles) {
      throw new Error("Sandbox does not support downloads")
    }
    return sandbox.downloadFiles(paths)
  }

  /** Delete the sandbox, or just stop it when SANDBOX_KEEP is set. */
  async dispose() {
    const inner = this.#inner
    if (!(inner instanceof LangSmithSandbox)) return
    if (config.SANDBOX_KEEP) await inner.stop()
    else await inner.close()
  }
}

// One sandbox per process, shared by the team and the git tools
export const teamSandbox = new TeamSandbox()
