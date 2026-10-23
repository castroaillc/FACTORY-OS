import * as migration_20261023_150614_initial from "./20261023_150614_initial"

export const migrations = [
  {
    up: migration_20261023_150614_initial.up,
    down: migration_20261023_150614_initial.down,
    name: "20261023_150614_initial",
  },
]
