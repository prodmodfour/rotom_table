The scene API at `/api/scenes/` provides full CRUD plus lifecycle management. Beyond standard create, read, update, and delete, it supports:

- `active.get` — returns the currently active scene
- `[id]/activate.post` — sets a scene as active, deactivating any previously active scene
- `[id]/deactivate.post` — deactivates a scene, triggering [[scene-service-restores-ap-on-deactivation]] and [[scene-service-restores-ap-on-deactivation]]

Scenes have nested entity management:

- `[id]/pokemon.post` and `[id]/pokemon/[pokemonId].delete` — add and remove Pokemon
- `[id]/characters.post` and `[id]/characters/[charId].delete` — add and remove characters
- `[id]/groups.post`, `[id]/groups/[groupId].put`, `[id]/groups/[groupId].delete` — manage groups
- `[id]/positions.put` — batch-update entity positions within the scene

Deactivation is the most complex operation because it triggers side effects: AP restoration for all characters in the scene and scene-frequency move counter resets for all Pokemon.

## See also

- [[scene-manager-page]] — the UI that interacts with these endpoints
- [[scene-activation-resets-canvas-state]] — client-side effect of activation
- [[server-uses-nuxt-file-based-rest-routing]]
