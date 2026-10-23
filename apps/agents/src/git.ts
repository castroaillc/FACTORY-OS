import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { appendFile, mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { config } from "./config.js"

const exec = promisify(execFile)

const MAX_OUTPUT = 50_000

/**
 * Run git in the workspace with a minimal environment. The GitHub token is
 * passed through GIT_CONFIG_* env vars (not argv, not .git/config) and only for
 * commands that talk to the remote, so it never shows up in `ps`, the repo, or
 * the agents' shell.
 */
export async function git(
  args: string[],
  { auth = false, cwd = config.workspaceDir } = {}
) {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: config.GIT_AUTHOR_NAME,
    GIT_AUTHOR_EMAIL: config.GIT_AUTHOR_EMAIL,
    GIT_COMMITTER_NAME: config.GIT_AUTHOR_NAME,
    GIT_COMMITTER_EMAIL: config.GIT_AUTHOR_EMAIL,
  }

  if (auth) {
    if (!config.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set")
    const basic = Buffer.from(`x-access-token:${config.GITHUB_TOKEN}`).toString(
      "base64"
    )
    Object.assign(env, {
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
    })
  }

  try {
    const { stdout, stderr } = await exec("git", args, {
      cwd,
      env,
      maxBuffer: 10 * 1024 * 1024,
    })
    return truncate(`${stdout}${stderr}`.trim())
  } catch (error) {
    const {
      stdout = "",
      stderr = "",
      message,
    } = error as {
      stdout?: string
      stderr?: string
      message: string
    }
    throw new Error(truncate(`${stdout}${stderr}`.trim() || message))
  }
}

function truncate(text: string) {
  return text.length > MAX_OUTPUT
    ? `${text.slice(0, MAX_OUTPUT)}\n… (truncated ${text.length - MAX_OUTPUT} chars)`
    : text
}

export async function currentBranch() {
  return git(["rev-parse", "--abbrev-ref", "HEAD"])
}

/** Clone GITHUB_REPO into the workspace on first run. */
export async function ensureWorkspace() {
  if (!existsSync(path.join(config.workspaceDir, ".git"))) await clone()

  // Agent scratch files (plans, notes) must never be committed
  const exclude = path.join(config.workspaceDir, ".git/info/exclude")
  const current = existsSync(exclude) ? await readFile(exclude, "utf8") : ""
  if (!current.split("\n").includes(".sdl/")) {
    await mkdir(path.dirname(exclude), { recursive: true })
    await appendFile(
      exclude,
      `${current.endsWith("\n") || !current ? "" : "\n"}.sdl/\n`
    )
  }
}

async function clone() {
  if (!config.GITHUB_REPO) {
    throw new Error(
      `No git repo at ${config.workspaceDir}. Set GITHUB_REPO to clone one, or point WORKSPACE_DIR at an existing clone.`
    )
  }

  await mkdir(path.dirname(config.workspaceDir), { recursive: true })
  await git(
    [
      "clone",
      "--branch",
      config.GITHUB_BASE_BRANCH,
      `https://github.com/${config.GITHUB_REPO}.git`,
      config.workspaceDir,
    ],
    {
      auth: Boolean(config.GITHUB_TOKEN),
      cwd: path.dirname(config.workspaceDir),
    }
  )
}
