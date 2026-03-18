# Deferred Scene Features

Two features were removed from the scene UI (Feb 2026) — database columns and types still exist:

- **Terrain** — Scene-level terrain conditions (grassy, electric, psychic, misty). DB column `Scene.terrains` intact. Type `terrains: string[]` in `types/scene.ts`. Distinct from VTT grid terrain painter.
- **Modifiers** — Custom scene-wide modifiers. DB column `Scene.modifiers` intact. Type `SceneModifier` in `types/scene.ts`.

The `SceneSyncPayload` (in `types/player-sync.ts`) excludes terrains/modifiers from data pushed to players.

## See also

- [[scene-components]]
- [[prisma-schema-overview]]
