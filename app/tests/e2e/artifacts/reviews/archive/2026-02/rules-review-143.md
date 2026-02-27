---
review_id: rules-review-143
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003-track-c-p0
domain: player-view
commits_reviewed:
  - bdb7375
  - 9fff54d
  - 36cfe0a
  - 9cef926
  - 9faf826
  - 9baaede
  - 5ecf99c
  - 2c04785
  - 7a09ef0
  - 7d9956b
  - 2c7b2af
  - df3d331
mechanics_verified:
  - scene-sync-data-integrity
  - struggle-attack-specification
  - move-frequency-exhaustion
  - league-battle-command-restriction
  - action-economy-turn-state
  - combat-maneuver-request-protocol
  - keepalive-game-state-isolation
  - player-action-routing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Struggle Attacks
  - core/07-combat.md#Action Types
  - core/07-combat.md#League Battles
  - core/07-combat.md#Switching
  - core/07-combat.md#Suppressed
  - core/07-combat.md#Move Frequencies
reviewed_at: 2026-02-24T20:45:00Z
follows_up: (none -- first review)
---

## Mechanics Verified

### 1. Struggle Attack Specification
- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. [...] Never apply STAB to Struggle Attacks. Struggle Attacks do not count as Moves." (`core/07-combat.md#Page 240`)
- **Implementation:** `usePlayerCombat.ts:240-250` documents Struggle as "Normal Type, AC 4, DB 4, Melee, Physical. No STAB." and delegates to `encounterStore.executeMove(combatant.id, 'struggle', targetIds)`. The actual damage calculation is handled server-side by the existing encounter action system, which was validated in prior reviews. The comment accurately reflects PTU rules.
- **Status:** CORRECT

### 2. Move Frequency Exhaustion
- **Rule:** Frequencies per PTU: At-Will (unlimited), EOT (every other turn), Scene/Scene x2/Scene x3, Daily/Daily x2/Daily x3, Static (passive). Suppressed lowers frequency: "At-Will Moves become EOT, and EOT and Scene x2 Moves become Scene." (`core/07-combat.md#Page 247`)
- **Implementation:** `usePlayerCombat.ts:141-199` implements `isMoveExhausted()` with correct frequency checks:
  - At-Will: always available (line 147)
  - EOT: blocked if used within last round (line 149-155) -- correctly uses `lastTurnUsed >= currentRound - 1`
  - Scene/Scene x2/Scene x3: correctly checks `usedThisScene` against 1/2/3 limits
  - Daily/Daily x2/Daily x3: correctly checks `usedToday` against 1/2/3 limits
  - Static: always exhausted (passive only)
- **Note:** The Suppressed condition interaction (frequency downgrade) is NOT handled in `isMoveExhausted()`. However, this is the player-side UI composable -- frequency downgrade from Suppressed is tracked server-side and should be reflected in the move data pushed to the client. This is consistent with the server-authoritative model.
- **Status:** CORRECT

### 3. League Battle Command Restriction
- **Rule:** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon." (`core/07-combat.md#Page 229`)
- **Implementation:** `usePlayerCombat.ts:110-116` exposes `canBeCommanded` computed from `turnState.value.canBeCommanded ?? true`. The `canBeCommanded` field exists in the `TurnState` type (`types/combat.ts:60`). The actual enforcement is server-side in the encounter store, which manages the `canBeCommanded` flag on switch actions -- this composable correctly reads and surfaces it.
- **Status:** CORRECT

### 4. Action Economy / Turn State
- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." Standard can be traded for extra Shift or Swift. (`core/07-combat.md#Page 226`)
- **Implementation:** `usePlayerCombat.ts:84-107` correctly tracks three independent action types (`standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`) and derives `canUseStandardAction`, `canUseShiftAction`, `canUseSwiftAction` from negation. The action-trading (Standard -> extra Shift/Swift) is handled server-side.
- **Status:** CORRECT

### 5. Scene Sync Data Integrity
- **Rule:** PTU scenes link characters, Pokemon, and groups to a location with weather. Scene data must be faithfully transmitted.
- **Implementation:** Two paths deliver scene data to players:
  1. **WS `scene_sync` on identify** (`ws.ts:156-228`): `sendActiveScene()` queries DB, resolves `isPlayerCharacter` via HumanCharacter lookup, resolves `ownerId` via Pokemon lookup. Produces `SceneSyncPayload` with correct fields (id, name, description, locationName, locationImage, weather, isActive, characters with PC flag, pokemon with owner, groups).
  2. **WS `scene_activated` event** (`usePlayerWebSocket.ts:119-151`): Maps the broadcast scene data to `SceneSyncPayload`. However, the activate endpoint (`activate.post.ts:45-61`) broadcasts the full scene object including raw `characters` array (which has `characterId` and `name` but NOT `isPlayerCharacter`). The mapping at line 135 hardcodes `isPlayerCharacter: true` for all characters, which is incorrect for NPCs in the scene.
- **Status:** NEEDS REVIEW (see Medium issue M-1 below)

### 6. Scene Sync - Granular Event Handling
- **Rule:** Scene state must remain consistent across views. When characters/pokemon/groups are added or removed mid-scene, the player view must update.
- **Implementation:** The server broadcasts granular scene sub-events (`scene_character_added`, `scene_character_removed`, `scene_pokemon_added`, `scene_pokemon_removed`, `scene_group_created`, `scene_group_updated`, `scene_group_deleted`, `scene_positions_updated`) to both group AND player clients via `broadcastToGroupAndPlayers()`. The group view handles ALL of these in `useGroupViewWebSocket.ts:19-51`. However, `usePlayerWebSocket.ts` handles NONE of them -- it only handles `scene_sync`, `scene_activated`, and `scene_deactivated`. This means the player's scene state will become stale during an active scene if the GM adds/removes characters or pokemon.
- **Status:** NEEDS REVIEW (see Medium issue M-2 below)

### 7. Keepalive Game State Isolation
- **Rule:** Keepalive messages must not interfere with game state or combat mechanics.
- **Implementation:** Server (`ws.ts:274-279`) responds to `keepalive` with `keepalive_ack` containing only a timestamp. Client (`useWebSocket.ts:30-39`) sends keepalive every 45 seconds with only `{ timestamp: Date.now() }`. The `handleMessage` switch (`useWebSocket.ts:182-183`) treats `keepalive_ack` as a no-op. No game state mutation occurs. Timer is properly cleaned up on disconnect (`stopKeepalive` in `disconnect`).
- **Status:** CORRECT

### 8. Player Action Routing Protocol
- **Rule:** Player actions must be routed to the GM and responses must return to the originating player. Server-authoritative model.
- **Implementation:**
  - Forward path: `forwardToGm()` (`ws.ts:53-68`) registers `requestId -> characterId` in `pendingRequests` map, then sends to all GM peers in the encounter. 60-second TTL with 30-second cleanup sweep prevents unbounded growth.
  - Return path: `routeToPlayer()` (`ws.ts:75-86`) looks up `characterId` from `pendingRequests`, sends to matching player peer, deletes entry.
  - REST fallback: `action-request.post.ts` forwards to GM peers with proper validation.
  - Client tracking: `usePlayerWebSocket.ts:19-72` tracks pending actions with promise-based resolution and 60-second timeout matching server TTL.
- **Status:** CORRECT

### 9. Combat Maneuver Request Protocol
- **Rule:** PTU maneuvers (Push, Sprint, Trip, Grapple, Intercept, Take a Breather) require GM adjudication for contested rolls. (`core/07-combat.md#Page 241-245`)
- **Implementation:** `usePlayerCombat.ts:309-317` sends maneuver requests via `player_action` WebSocket message with `action: 'maneuver'`, `maneuverId`, and `maneuverName`. These are forwarded to GM for approval rather than executed directly. This is correct -- maneuvers involve opposed checks (Athletics vs Athletics for Push, etc.) that require GM resolution.
- **Status:** CORRECT

## Summary

Track C P0 implements a sound WebSocket protocol expansion for player-GM communication. The core game mechanics referenced in the player combat composable (Struggle attacks, move frequencies, league battle restrictions, action economy) are all correctly specified and consistent with PTU 1.05 rules. The server-authoritative model is properly maintained: the player composable surfaces turn state and action availability from server-pushed data rather than calculating independently.

The protocol design (requestId tracking, 60s TTL, pendingRequests map, REST fallback) is mechanically sound and does not interfere with game state. Keepalive messages are properly isolated from game logic.

Two medium-severity issues were found related to scene data fidelity, both involving the player's scene view receiving incomplete or incorrect data under specific conditions.

## Rulings

1. **Struggle Attack specification in usePlayerCombat** -- CONFIRMED CORRECT. The comment at line 240 accurately states "Normal Type, AC 4, DB 4, Melee, Physical. No STAB." which matches PTU p.240 exactly. The expert-rank upgrade (AC 3, DB 5) is not relevant at the player composable level since it is applied server-side.

2. **EOT frequency check logic** -- CONFIRMED CORRECT. `lastTurnUsed >= currentRound - 1 && lastUsed > 0` correctly blocks usage if the move was used in the current round OR the immediately preceding round, while the `> 0` guard ensures moves with no usage history are available.

3. **`isPlayerCharacter: true` hardcoding in scene_activated handler** -- RULING: This is a data fidelity issue, not a game-breaking bug. The activate endpoint broadcasts raw scene data without the `isPlayerCharacter` distinction. The `sendActiveScene()` function in ws.ts correctly resolves this by querying the DB. The workaround of hardcoding `true` in the fallback path means NPCs will temporarily display as PCs in the player scene view when the scene_activated event arrives. The next scene_sync (on reconnect or scene_request) will correct this. Medium severity because it affects display only, not game mechanics.

4. **Missing granular scene event handlers in player view** -- RULING: This is a scene state consistency gap. The player's scene data will become stale if characters/pokemon/groups are modified mid-scene. The full scene_sync is only sent on identify/reconnect and on scene_request. This does not affect combat mechanics or game calculations, but it means the player's "Characters present" and "Pokemon present" lists may be outdated until the next reconnect or tab switch. Medium severity.

## Verdict

**APPROVED** -- No critical or high severity issues. Two medium issues found that affect scene display fidelity but not game mechanics or combat calculations. These should be addressed in Track C P1 when scene interaction is expanded.

## Required Changes

None required for P0 gate passage. The following are recommended for P1:

### M-1: `isPlayerCharacter` hardcoded to `true` in `scene_activated` handler (MEDIUM)
- **File:** `app/composables/usePlayerWebSocket.ts:135`
- **Issue:** When `scene_activated` broadcast arrives, all characters are mapped with `isPlayerCharacter: true` because the activate endpoint does not include this field.
- **Recommendation:** Either (a) have the activate endpoint query `isPlayerCharacter` before broadcasting, or (b) send a `scene_request` after receiving `scene_activated` to get the full data from `sendActiveScene()` which does resolve the PC flag.

### M-2: Granular scene events not handled by player WebSocket (MEDIUM)
- **File:** `app/composables/usePlayerWebSocket.ts` (lines 105-153)
- **Issue:** The server broadcasts 8 granular scene sub-events to player clients, but `handlePlayerMessage` does not process any of them. The group view (`useGroupViewWebSocket.ts`) handles all 8.
- **Recommendation:** Either (a) add handlers for `scene_character_added`, `scene_character_removed`, `scene_pokemon_added`, `scene_pokemon_removed`, `scene_group_created`, `scene_group_updated`, `scene_group_deleted` to update `activeScene` incrementally, or (b) trigger a `scene_request` on any scene sub-event to re-fetch the full scene state.
