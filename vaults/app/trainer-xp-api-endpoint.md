The `POST /api/characters/:id/xp` endpoint in `app/server/api/characters/[id]/xp.post.ts` handles trainer XP awards.

It accepts `{ amount: number, reason?: string }` with amount clamped to -100..100. The endpoint loads the character, calls the [[trainer-xp-bank-system|applyTrainerXp()]] pure function, updates `trainerXp` and `level` in the database, and broadcasts a WebSocket `character_update` event if the level changed.

The endpoint handles the level increment but does not save stat allocations, edges, features, or classes. Those are saved separately via `PUT /api/characters/:id` after the [[trainer-level-up-modal]] wizard completes.

A companion `GET /api/characters/:id/xp-history` endpoint returns current `trainerXp`, `level`, XP to next level, and `ownedSpecies`.

## See also

- [[trainer-xp-composable]]
