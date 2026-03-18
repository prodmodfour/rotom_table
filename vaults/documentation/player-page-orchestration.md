# Player Page Orchestration

`pages/player/index.vue` is the root page that orchestrates the entire player experience.

## Tab Management

Four tabs defined by the `PlayerTab` type: character, team, encounter, scene. Tab order (0–3) drives directional slide transitions — switching to a higher-index tab slides left, lower slides right.

## Auto-Switch on Turn Notification

Watches the `turnNotification` ref from [[player-websocket-composable|usePlayerWebSocket]]. When a turn notification arrives, automatically switches the active tab to `encounter` so the player immediately sees the [[player-combat-action-panel]].

## Provide/Inject Pattern

The page provides the WebSocket send function to all child components via Vue's provide/inject. The [[player-combat-composable|usePlayerCombat]] composable consumes this to send action requests.

## Subsystem Integration

Integrates: [[player-identity-system|identity management]], [[player-websocket-composable|WebSocket connection]], [[player-reconnection-sync|encounter polling]], turn notification handling, action acknowledgment toasts, reconnection recovery, and tab-based content switching via [[player-character-sheet-display|Character]], [[player-pokemon-team-display|Team]], [[player-encounter-display|Encounter]], and [[player-scene-view|Scene]] tabs.

## See also

- [[player-view-architecture]] — component and composable inventory
- [[triple-view-system]] — the Player View within the three-view architecture
