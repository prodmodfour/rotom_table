# Player Identity System

The player selects a character to play as before accessing any features. This identity persists across page reloads via localStorage.

## Flow

1. On page load, `usePlayerIdentity.restoreIdentity()` reads from localStorage key `ptu_player_identity`.
2. If no stored identity, the full-screen **PlayerIdentityPicker** overlay shows all characters with `characterType='player'` (fetched via `GET /api/characters/players`). Each entry shows name, level, trainer classes, and up to 6 Pokemon sprites.
3. On selection, `selectCharacter()` saves `characterId`, `characterName`, and a timestamp to localStorage, then fetches full character + Pokemon data from `GET /api/characters/:id/player-view`.
4. `refreshCharacterData()` re-fetches the same endpoint. Called on restore, selection, [[player-websocket-composable|WebSocket character_update events]], and reconnection recovery.
5. `clearIdentity()` removes from localStorage and resets all store state.

## playerIdentity Store

Pinia store at `stores/playerIdentity.ts`. State: `characterId`, `characterName`, `character` (HumanCharacter), `pokemon` (Pokemon[]), `loading`, `error`. Getters: `isIdentified` (characterId not null — toggles picker vs main view), `activePokemon` (Pokemon matching `activePokemonId`), `pokemonIds` (used for ownership detection in combat, fog filtering, and event filtering).

## See also

- [[player-view-architecture]]
- [[player-page-orchestration]]
- [[pinia-store-classification]] — playerIdentity is a global store
