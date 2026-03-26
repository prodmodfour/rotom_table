# Player View Architecture

The Player View lives at `/player`. Part of the [[triple-view-system]].

## Components

- **PlayerIdentityPicker.vue** — Character selection overlay. See [[player-identity-system]].
- **PlayerNavBar.vue** — Bottom tab navigation (Character / Team / Encounter / Scene). See [[player-page-orchestration]].
- **PlayerCharacterSheet.vue** — Read-only stats, skills, features, equipment, inventory. See [[player-character-sheet-display]].
- **PlayerPokemonTeam.vue** + **PlayerPokemonCard.vue** + **PlayerMoveList.vue** — Team display. See [[player-pokemon-team-display]].
- **PlayerEncounterView.vue** + **PlayerCombatantInfo.vue** — Encounter state with combatant cards grouped by side. See [[player-encounter-display]].
- **PlayerCombatActions.vue** — Full PTR combat action panel. See [[player-combat-action-panel]].
- **PlayerSceneView.vue** — Read-only scene display. See [[player-scene-view]].
- **PlayerGridView.vue** + **PlayerMoveRequest.vue** — Tactical grid from player perspective. See [[player-grid-interaction]].
- **PlayerGroupControl.vue** — Group View tab change requests. See [[player-group-view-control]].
- **PlayerSkeleton.vue** — Skeleton loading screen.
- **ConnectionStatus.vue** — Connection state indicator. See [[connection-utilities]].

## Composables

- **usePlayerIdentity.ts** — See [[player-identity-system]].
- **usePlayerCombat.ts** — See [[player-combat-composable]].
- **useCharacterExportImport.ts** — See [[character-export-import-composable]].
- **usePlayerWebSocket.ts** — See [[player-websocket-composable]].
- **usePlayerScene.ts** — See [[player-scene-view]].
- **usePlayerGridView.ts** — See [[player-grid-interaction]].
- **useStateSync.ts** — See [[player-reconnection-sync]].
- **useHapticFeedback.ts** — See [[haptic-feedback-patterns]].

## Store

- **playerIdentity** — See [[player-identity-system]].

## Types

- `PlayerTab` in `types/player.ts`
- `PlayerActionRequest`, `WebSocketEvent` in `types/api.ts`
- `PlayerActionRequest`, `PlayerActionAck`, `PlayerTurnNotification`, `PlayerMoveRequest`, `PlayerMoveResponse`, `GroupViewRequest`, `GroupViewResponse`, `SceneSyncPayload` in `types/player-sync.ts`

## REST fallback

`POST /api/player/action-request` registers in a shared [[pending-request-routing|pendingRequests]] map and forwards to GM peers.

## See also

- [[player-page-orchestration]] — root page orchestrating the player experience
- [[combatant-card-visibility-rules]] — how PlayerCombatantCard differs from GM/Group variants
- [[combat-maneuver-catalog]] — maneuvers requestable via WebSocket
- [[move-energy-system]] — move availability validation in usePlayerCombat
- [[player-websocket-events]]
