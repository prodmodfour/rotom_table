The time a [[pokemon-center-healing]] visit takes depends on the entity's injury count.

For fewer than 5 injuries: 1 hour base + 30 minutes per injury. For 5 or more injuries: 1 hour per injury.

Examples:

- 0 injuries: 1 hour
- 2 injuries: 2 hours (1h + 2x30min)
- 5 injuries: 5 hours (5x1h)

Implemented as `calculatePokemonCenterTime` in `utils/restHealing.ts`. Returns a breakdown object with base time, per-injury time, total, and a human-readable description.
