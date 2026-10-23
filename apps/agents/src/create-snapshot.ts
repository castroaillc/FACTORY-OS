// Build a reusable LangSmith sandbox snapshot with the team's toolchain.
// Usage: pnpm --filter agents sandbox:snapshot [docker-image]
// Then set SANDBOX_SNAPSHOT_ID in .env to the printed id.
import { SandboxClient } from "langsmith/sandbox"

const image = process.argv[2] ?? "node:22-bookworm" // includes git + corepack (pnpm/yarn)
const name = `sdl-team-${image.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}`
const fsCapacityBytes = 20 * 1024 ** 3

const client = new SandboxClient()
console.log(`Building snapshot "${name}" from ${image}…`)
const snapshot = await client.createSnapshot(name, image, fsCapacityBytes, {
  timeout: 600,
})
console.log(
  `Ready. Add this to apps/agents/.env:\nSANDBOX_SNAPSHOT_ID=${snapshot.id}`
)
