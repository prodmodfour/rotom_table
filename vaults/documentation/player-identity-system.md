# Player Identity System

The player selects a character to play as before accessing any features. This identity persists across page reloads via local storage.

## Flow

1. On page load, the system restores identity from local storage.
2. If no stored identity, a full-screen character picker overlay shows all player characters with name, level, trainer classes, and up to 6 Pokemon sprites.
3. On selection, identity (character ID, name, timestamp) is saved to local storage, then full character and Pokemon data is fetched.
4. Character data is re-fetched on restore, selection, WebSocket character update events, and reconnection recovery.
5. Identity can be cleared to reset back to the picker.

## Key State

Character ID, character data, owned Pokemon list, loading/error flags. The `isIdentified` check toggles between the picker and main view. The Pokemon IDs are used for ownership detection in combat, fog filtering, and event filtering.

## See also

- [[triple-view-system]]
