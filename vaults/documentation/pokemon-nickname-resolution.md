# Pokemon Nickname Resolution

`resolveNickname()` in `server/utils/pokemon-nickname.ts` generates default nicknames when none is provided.

If a nickname is given and non-empty, it returns the trimmed value. Otherwise, it counts existing Pokemon of the same species in the database and produces "Species N+1" (e.g., "Pikachu 3" for the third Pikachu).

Used by both [[pokemon-api-endpoints|POST /api/pokemon]] (manual creation) and the [[pokemon-generator-entry-point]] (generated creation). Also invoked on nickname changes via [[pokemon-api-endpoints|PUT /api/pokemon/:id]].
