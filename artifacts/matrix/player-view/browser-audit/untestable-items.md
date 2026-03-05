# Untestable Items: player-view

Items with no UI terminus -- server-side utilities, API endpoints, composable internals, store logic, WebSocket protocol events, type definitions, and constants. These capabilities are verified by the Implementation Auditor via code review, not browser inspection.

---

## API Endpoints (6 items)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| player-view-C011 | GET /api/characters/:id/player-view | api-endpoint | Server-side only; data surfaces through C017/C025 |
| player-view-C012 | GET /api/characters/players | api-endpoint | Server-side only; data surfaces through C001 |
| player-view-C013 | GET /api/player/export/:characterId | api-endpoint | Server-side only; triggered by C022 export button |
| player-view-C014 | POST /api/player/import/:characterId | api-endpoint | Server-side only; triggered by C023 import button |
| player-view-C015 | POST /api/player/action-request | api-endpoint | Server-side REST fallback for WebSocket action |
| player-view-C016 | GET /api/scenes/active | api-endpoint | Server-side only; data surfaces through C065 |

## Store State/Getters/Actions (4 items)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| player-view-C007 | playerIdentity store | store-action | Internal state; surfaces through C001/C017 |
| player-view-C008 | playerIdentity.isIdentified getter | store-getter | Internal boolean; drives C001 vs C017 display |
| player-view-C009 | playerIdentity.activePokemon getter | store-getter | Internal getter; surfaces through C025 active badge |
| player-view-C010 | playerIdentity.pokemonIds getter | store-getter | Internal getter; surfaces through C028/C029 |

## Composable Functions (42 items)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| player-view-C002 | usePlayerIdentity composable | composable-function | Orchestration logic; surfaces through C001/C017 |
| player-view-C003 | usePlayerIdentity.restoreIdentity | composable-function | Internal; auto-restores identity from localStorage |
| player-view-C004 | usePlayerIdentity.selectCharacter | composable-function | Internal; triggered by C001 button click |
| player-view-C005 | usePlayerIdentity.refreshCharacterData | composable-function | Internal; triggered by WebSocket events |
| player-view-C006 | usePlayerIdentity.clearIdentity | composable-function | Internal; triggered by "Switch character" button |
| player-view-C018 | HP percent and color computation | composable-function | Internal; surfaces as HP bar color in C017 |
| player-view-C019 | Evasion computation with equipment bonuses | composable-function | Internal; surfaces as evasion values in C017 |
| player-view-C021 | useCharacterExportImport composable | composable-function | Internal; surfaces through export/import buttons in C017 |
| player-view-C022 | useCharacterExportImport.handleExport | composable-function | Internal; triggered by export button in C017 |
| player-view-C023 | useCharacterExportImport.handleImportFile | composable-function | Internal; triggered by import button in C017 |
| player-view-C029 | Combatant visibility rules | composable-function | Internal; drives C028 info asymmetry |
| player-view-C031 | usePlayerCombat composable | composable-function | Internal; surfaces through C030 |
| player-view-C032 | usePlayerCombat.isMyTurn | composable-function | Internal; drives C030 display |
| player-view-C033 | usePlayerCombat.isMoveExhausted | composable-function | Internal; drives move button disabled state in C030 |
| player-view-C034 | usePlayerCombat.executeMove | composable-function | Internal; triggered by C046 confirm |
| player-view-C035 | usePlayerCombat.useShiftAction | composable-function | Internal; triggered by Shift button in C030 |
| player-view-C036 | usePlayerCombat.useStruggle | composable-function | Internal; triggered by Struggle button in C030 |
| player-view-C037 | usePlayerCombat.passTurn | composable-function | Internal; triggered by Pass Turn button in C030 |
| player-view-C038 | usePlayerCombat.requestUseItem | composable-function | Internal; triggered by Use Item panel in C030 |
| player-view-C039 | usePlayerCombat.requestSwitchPokemon | composable-function | Internal; triggered by Switch Pokemon panel in C030 |
| player-view-C040 | usePlayerCombat.requestManeuver | composable-function | Internal; triggered by Maneuver panel in C030 |
| player-view-C041 | usePlayerCombat.validTargets | composable-function | Internal; drives C046 target list |
| player-view-C042 | usePlayerCombat.switchablePokemon | composable-function | Internal; drives Switch Pokemon panel in C030 |
| player-view-C043 | usePlayerCombat.trainerInventory | composable-function | Internal; drives Use Item panel in C030 |
| player-view-C044 | usePlayerCombat.canBeCommanded | composable-function | Internal; drives cannot-command warning in C030 |
| player-view-C045 | usePlayerCombat.isLeagueBattle / isTrainerPhase / isPokemonPhase | composable-function | Internal; drives phase indicator in C027/C030 |
| player-view-C048 | usePlayerWebSocket composable | composable-function | Internal; WebSocket orchestration |
| player-view-C049 | usePlayerWebSocket.sendAction | composable-function | Internal; WebSocket send with tracking |
| player-view-C050 | usePlayerWebSocket.handleActionAck | composable-function | Internal; drives toast in C081 |
| player-view-C051 | usePlayerWebSocket.handleTurnNotify | composable-function | Internal; drives C083 auto-switch |
| player-view-C052 | usePlayerWebSocket.handleDamageApplied | composable-function | Internal; drives C076 haptic feedback |
| player-view-C053 | usePlayerWebSocket.handleMoveExecuted | composable-function | Internal; drives C076 haptic feedback |
| player-view-C054 | usePlayerWebSocket.handleCharacterUpdate | composable-function | Internal; triggers data refresh |
| player-view-C055 | Scene event handling (granular) | composable-function | Internal; drives C065 scene update |
| player-view-C066 | usePlayerScene composable | composable-function | Internal; surfaces through C065 |
| player-view-C069 | usePlayerGridView composable | composable-function | Internal; surfaces through C068 |
| player-view-C070 | usePlayerGridView.visibleTokens | composable-function | Internal; drives C068 token display |
| player-view-C071 | usePlayerGridView.confirmMove (move request) | composable-function | Internal; triggered by C073 confirm |
| player-view-C072 | usePlayerGridView.getInfoLevel | composable-function | Internal; drives C068 info asymmetry |
| player-view-C074 | useStateSync composable | composable-function | Internal; auto-syncs on reconnect |
| player-view-C075 | Encounter polling with backoff | composable-function | Internal; auto-detects active encounter |
| player-view-C076 | useHapticFeedback composable | composable-function | Internal; Vibration API -- no visual terminus |

## WebSocket Events (9 items)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| player-view-C056 | identify (player role) | websocket-event | Server protocol; auto-sent on connect |
| player-view-C057 | player_action (WS event) | websocket-event | Server protocol; forwarded to GM |
| player-view-C058 | player_action_ack (WS event) | websocket-event | Server protocol; routed to player |
| player-view-C059 | player_turn_notify (WS event) | websocket-event | Server protocol; routed to player |
| player-view-C060 | player_move_request (WS event) | websocket-event | Server protocol; forwarded to GM |
| player-view-C061 | player_move_response (WS event) | websocket-event | Server protocol; routed to player |
| player-view-C062 | group_view_request (WS event) | websocket-event | Server protocol; forwarded to GM |
| player-view-C063 | group_view_response (WS event) | websocket-event | Server protocol; routed to player |
| player-view-C064 | scene_request (WS event) | websocket-event | Server protocol; triggers scene_sync |

## Types/Constants/Utilities (5 items)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| player-view-C067 | PlayerSceneData type | constant | Type definition; no runtime surface |
| player-view-C084 | getConnectionType utility | utility | Pure function; surfaces through C078 |
| player-view-C085 | QR code generator (generateQrSvg) | utility | Pure function; no player-view UI surface |
| player-view-C087 | PlayerTab type | constant | Type definition; no runtime surface |
| player-view-C088 | Player-sync types (full protocol) | constant | Type definitions; no runtime surface |
| player-view-C089 | PlayerActionType union | constant | Type definition; no runtime surface |

## Server-Side Utility (1 item)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| player-view-C086 | pendingRequests utility | service-function | Server-side only; no UI terminus |

---

**Total untestable: 67 items** (6 API + 4 store + 42 composable + 9 WebSocket + 6 type/constant + 1 server utility -- note C085 counted in type/constant section giving 6 in that group)
