The selected character persists across page reloads via localStorage key `ptu_player_identity`. The stored value contains the `characterId`, `characterName`, and a `selectedAt` ISO timestamp.

On page mount, the `usePlayerIdentity` composable reads this key. If found, it restores the character ID and name into the [[player-identity-store-is-populated-externally|player identity store]], then fetches fresh character and Pokemon data from `GET /api/characters/:id/player-view`. If the key is missing or unparseable, the composable removes it and the [[player-view-character-selection]] overlay appears.

When the player clicks [[player-view-switch-character-button|Switch character]], the key is removed from localStorage and the store is cleared.

This localStorage usage is independent of the [[settings-store-persists-to-local-storage|settings store's localStorage]]. The settings store persists under `ptu-settings`; the player identity composable persists under `ptu_player_identity`. The composable is not a Pinia store itself — it wraps the store with persistence and server fetching.


## See also

- [[player-view-api-bundles-character-and-pokemon]] — the endpoint called during identity restoration