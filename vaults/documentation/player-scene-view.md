# Player Scene View

`PlayerSceneView.vue` displays the GM's active scene from the player's perspective.

## Display

Shows scene name, weather badge, location image or name, description, characters present (with PC/NPC tags), Pokemon present (with species), and groups. Shows an empty state when no scene is active.

## usePlayerScene Composable

Manages player scene state. Receives `scene_sync` WebSocket events and maps the payload to the `PlayerSceneData` interface. On `scene_deactivated`, clears state. Provides a REST fallback via `GET /api/scenes/active` for reconnection recovery.

## PlayerSceneData

Defines the player-visible scene shape: `id`, `name`, `description`, `locationName`, `locationImage`, `weather`, `isActive`, `characters` (id, name, isPlayerCharacter), `pokemon` (id, nickname, species, ownerId), `groups` (id, name). Excludes GM-only fields like terrains and modifiers (see [[deferred-scene-features]]).

## See also

- [[group-view-scene-interaction]] — how scenes appear in the Group View
- [[scene-components]] — GM-side scene editor
- [[player-websocket-composable]] — delivers scene events
- [[scene-data-model]] — full Scene model fields
- [[scene-websocket-events]] — scene_sync event details
