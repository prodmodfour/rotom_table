---
review_id: rules-review-146
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-003-track-c-fix-rereview
domain: player-view
commits_reviewed:
  - 351044d
  - f7fe05e
  - a60801e
  - f790503
  - 42ddbce
  - 4abfcea
  - f3e93b2
  - a183103
  - f11acfd
mechanics_verified:
  - struggle-attack-specification
  - move-frequency-exhaustion
  - league-battle-command-restriction
  - action-economy-turn-state
  - combat-maneuver-request-protocol
  - scene-sync-data-integrity
  - keepalive-game-state-isolation
  - player-action-routing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Struggle Attacks
  - core/07-combat.md#Action Types
  - core/07-combat.md#League Battles
  - core/07-combat.md#Switching
  - core/07-combat.md#Suppressed
  - core/07-combat.md#Move Frequencies
  - core/07-combat.md#Combat Maneuvers
reviewed_at: 2026-02-24T22:50:00Z
follows_up: rules-review-143
---

## Mechanics Verified

### 1. Struggle Attack Specification
- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. [...] Never apply STAB to Struggle Attacks. Struggle Attacks do not count as Moves." (`core/07-combat.md#Page 240`)
- **Implementation:** `usePlayerCombat.ts:258` documents Struggle as "Normal Type, AC 4, DB 4, Melee, Physical. No STAB." and delegates to `encounterStore.executeMove(combatant.id, 'struggle', targetIds)`. The fix commits (C1 provide/inject refactor) changed how `usePlayerCombat` obtains the WebSocket `send` function (now via `inject(PLAYER_WS_SEND_KEY)` instead of direct `useWebSocket()` call), but the Struggle execution path is unchanged -- it still calls `encounterStore.executeMove()` directly as a Standard Action, not via WebSocket. The Struggle specification comment and execution logic are untouched by the fix commits.
- **Status:** CORRECT

### 2. Move Frequency Exhaustion
- **Rule:** Frequencies per PTU: At-Will (unlimited), EOT (every other turn), Scene/Scene x2/Scene x3, Daily/Daily x2/Daily x3, Static (passive). Suppressed lowers frequency: "At-Will Moves become EOT, and EOT and Scene x2 Moves become Scene." (`core/07-combat.md#Page 247`)
- **Implementation:** `usePlayerCombat.ts:159-218` implements `isMoveExhausted()` with identical logic to the pre-fix version:
  - At-Will: always available (line 164)
  - EOT: `lastTurnUsed >= currentRound - 1 && lastUsed > 0` (lines 169-170)
  - Scene/Scene x2/Scene x3: `usedThisScene` against 1/2/3 limits (lines 176-192)
  - Daily/Daily x2/Daily x3: `usedToday` against 1/2/3 limits (lines 194-210)
  - Static: always exhausted (line 212)
- The C1 fix commit only added the `PLAYER_WS_SEND_KEY` injection key and `inject()` call to the composable (lines 10-34). No frequency logic was altered. The `isMoveExhausted` function body is byte-identical to the pre-fix version.
- **Status:** CORRECT

### 3. League Battle Command Restriction
- **Rule:** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon." (`core/07-combat.md#Page 243`)
- **Implementation:** `usePlayerCombat.ts:132-134` computes `canBeCommanded` from `turnState.value.canBeCommanded ?? true`. This reads the server-pushed `canBeCommanded` flag from the combatant's `turnState`. The fix commits did not modify this computed property or the `turnState` computation. The provide/inject refactor only affected how `send` is obtained, not how turn state is read from the encounter store.
- **Status:** CORRECT

### 4. Action Economy / Turn State
- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." Standard can be traded for extra Shift or Swift. (`core/07-combat.md#Page 226`)
- **Implementation:** `usePlayerCombat.ts:102-125` tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` from the combatant's `turnState` and derives `canUseStandardAction`, `canUseShiftAction`, `canUseSwiftAction` via negation. The fix commits did not alter this section. The three independent action types are still correctly tracked.
- **Status:** CORRECT

### 5. Combat Maneuver Request Protocol
- **Rule:** PTU maneuvers (Push, Sprint, Trip, Grapple, Intercept, Take a Breather) require GM adjudication for contested rolls. Push: AC 4, opposed Combat/Athletics. Trip: AC 6, opposed Combat/Acrobatics. Grapple: AC 4, opposed Combat/Athletics. (`core/07-combat.md#Pages 241-245`)
- **Implementation:** `usePlayerCombat.ts:327-335` sends maneuver requests via `player_action` WebSocket message with `action: 'maneuver'`, `maneuverId`, and `maneuverName`. The C1 fix changed `send` from a direct `useWebSocket().send` call to an injected function via `inject(PLAYER_WS_SEND_KEY)`. The injected `send` (provided by `player/index.vue` line 109 from `usePlayerWebSocket`) calls the same underlying `useWebSocket().send`. The message format is unchanged: `{ type: 'player_action', data: request }`. Maneuvers are still correctly forwarded to GM for adjudication rather than executed directly.
- **Regression check:** The `COMBAT_MANEUVERS` constant (`constants/combatManeuvers.ts`) was not modified by any fix commit. Push (AC 4, Standard), Sprint (Standard, no AC), Trip (AC 6, Standard), Grapple (AC 4, Standard), Intercept (Full + Interrupt, no AC), Take a Breather (Full Action, no AC) all remain correct per PTU p.241-245.
- **Status:** CORRECT

### 6. Scene Sync Data Integrity
- **Rule:** PTU scenes link characters, Pokemon, and groups to a location with weather. Scene data must be faithfully transmitted to player clients.
- **Implementation:** The fix commits resolved both medium issues from rules-review-143:
  - **M-1 (isPlayerCharacter hardcoding) -- RESOLVED.** The `scene_activated` handler in `usePlayerWebSocket.ts` (line 126-129) no longer maps scene data with hardcoded `isPlayerCharacter: true`. Instead, it calls `fetchActiveScene()` which queries the REST endpoint `/api/scenes/active`. Commit 42ddbce enriched this REST endpoint (`active.get.ts` lines 27-44) to query `HumanCharacter.isPlayerCharacter` from the DB and build a `pcSet`, then set `isPlayerCharacter: pcSet.has(c.characterId)` per character. The client-side `usePlayerScene.ts` maps this as `c.isPlayerCharacter ?? false` (line 94), correctly defaulting to NPC if the field is missing. This data flow matches the `sendActiveScene()` function in `ws.ts` (lines 143-174) which performs the same DB query pattern.
  - **M-2 (granular scene events not handled) -- RESOLVED.** Commit a60801e added handlers for all 9 granular scene events in `usePlayerWebSocket.ts` (lines 131-144): `scene_update`, `scene_character_added`, `scene_character_removed`, `scene_pokemon_added`, `scene_pokemon_removed`, `scene_group_created`, `scene_group_updated`, `scene_group_deleted`, `scene_positions_updated`. All trigger `fetchActiveScene()` which refreshes the full scene from REST. This is simpler than incremental patching and ensures consistency.
  - **Pokemon ownership enrichment also added** to `active.get.ts` (lines 37-44): queries `Pokemon.ownerId` from DB and maps via `ownerMap.get(p.id) ?? null`. The client receives correct `ownerId` for each Pokemon in the scene.
- **Status:** CORRECT

### 7. Keepalive Game State Isolation
- **Rule:** Keepalive messages must not interfere with game state or combat mechanics.
- **Implementation:** The fix commits did not modify the keepalive mechanism. Server (`ws.ts:243-248`) still responds to `keepalive` with `keepalive_ack` containing only `{ timestamp: Date.now() }`. Client (`useWebSocket.ts:30-39`) still sends keepalive every 45 seconds. The `handleMessage` switch still treats `keepalive_ack` as a no-op (line 182-183). The C1 fix ensures only one WebSocket connection exists per player client, which means only one keepalive timer runs (previously 2-4 timers ran simultaneously, sending redundant keepalives). This is an improvement -- fewer unnecessary keepalive messages.
- **Status:** CORRECT

### 8. Player Action Routing Protocol
- **Rule:** Player actions must be routed to the GM and responses must return to the originating player. Server-authoritative model.
- **Implementation:** The fix commits resolved the H1 issue:
  - **H1 (REST fallback ack dropped) -- RESOLVED.** Commit f7fe05e extracted `pendingRequests` to a shared utility (`server/utils/pendingRequests.ts`). Both `ws.ts` (lines 11-13: imports `registerPendingRequest`, `consumePendingRequest`) and `action-request.post.ts` (line 2: imports `registerPendingRequest`) now use the same shared map. The REST handler (lines 27-29) calls `registerPendingRequest(body.requestId, body.playerId)` before forwarding to GM peers. When the GM later sends `player_action_ack`, `routeToPlayer()` in `ws.ts` calls `consumePendingRequest(requestId)` which looks up the same shared map, finds the characterId, and routes the ack to the correct player peer. The 60s TTL and 30s cleanup sweep are preserved in the shared utility (lines 11-12, 55-62, 65).
  - **C1 interaction verified:** With a single WebSocket connection per player (C1 fix), the `player_action_ack` arrives on the same connection that `usePlayerWebSocket.handlePlayerMessage` listens on. The `handleActionAck` function (lines 79-88) correctly resolves the pending promise, completing the round-trip.
  - The `sendAction` function in `usePlayerWebSocket.ts` (lines 40-74) still uses the 60-second timeout matching the server TTL. Request IDs are still generated with `Date.now() + random` for uniqueness.
- **Status:** CORRECT

## Summary

All 8 mechanics previously verified in rules-review-143 remain correct after the 9 fix commits. The fix commits addressed structural issues (multiple WebSocket connections, dead code, missing event handlers, shared state extraction) without modifying any game logic calculations, combat formulas, or PTU rule implementations. Specifically:

1. **C1 (provide/inject refactor):** Changed how `usePlayerCombat` obtains the `send` function (inject vs direct call). The `send` function signature and behavior are identical. No combat logic touched.

2. **H1 (shared pendingRequests):** Moved the `pendingRequests` map from `ws.ts` closure scope to `server/utils/pendingRequests.ts` module scope. Same data structure, same TTL, same cleanup interval. The REST endpoint now registers requests in the shared map, fixing the ack routing gap.

3. **H2+M1 (granular scene events + fetchActiveScene):** Replaced the hardcoded `isPlayerCharacter: true` mapping with a `fetchActiveScene()` call that queries the DB. The REST endpoint (`active.get.ts`) now enriches scene data with correct `isPlayerCharacter` and `ownerId` from the database, using the same query pattern as the WS `sendActiveScene()` function.

4. **H3 (identification consolidation):** Removed duplicate `watch(isConnected, ...)` and `identify()` calls from `player/index.vue`. All identification now flows through `usePlayerWebSocket`'s watcher (lines 163-178). The single remaining `identify()` call in the page (line 170) is for encounter-specific re-identification after loading an active encounter, which is appropriate since the encounter ID is only known at the page level.

5. **M2 (handleCharacterUpdate implemented):** The previously dead function now has a body (lines 95-102): checks if the updated entity matches the player's character or any of their pokemon, and calls `refreshCharacterData()`. The `character_update` case was added to `handlePlayerMessage` (lines 121-122).

6. **M3, docs, refactor commits:** No code logic changes.

The two medium issues from rules-review-143 (M-1: isPlayerCharacter hardcoding, M-2: granular scene event handling) are both fully resolved. No rules regressions were introduced.

## Rulings

1. **Struggle Attack specification** -- CONFIRMED CORRECT post-fix. The provide/inject refactor changed `send` acquisition, not the Struggle execution path. Struggle still calls `encounterStore.executeMove()` directly. Comment at line 258 accurately states "Normal Type, AC 4, DB 4, Melee, Physical. No STAB." per PTU p.240.

2. **EOT frequency check** -- CONFIRMED CORRECT post-fix. `lastTurnUsed >= currentRound - 1 && lastUsed > 0` is unchanged and correctly blocks usage in the current round and the immediately preceding round.

3. **Scene data fidelity** -- CONFIRMED CORRECT post-fix. Both the WS `sendActiveScene()` and REST `/api/scenes/active` now perform identical DB enrichment (HumanCharacter.isPlayerCharacter lookup via pcSet, Pokemon.ownerId lookup via ownerMap). The `scene_activated` handler calls `fetchActiveScene()` instead of hardcoding `isPlayerCharacter: true`. All 9 granular scene events trigger `fetchActiveScene()` to keep the player view consistent.

4. **Action routing round-trip** -- CONFIRMED CORRECT post-fix. REST fallback now registers in the shared `pendingRequests` map. GM ack routing via `consumePendingRequest()` works identically for WS-originated and REST-originated actions.

5. **Single connection guarantee** -- CONFIRMED CORRECT. `player/index.vue` no longer calls `useWebSocket()` directly. `usePlayerCombat` no longer calls `useWebSocket()` directly. Only `usePlayerWebSocket` calls `useWebSocket()`, and the page consumes everything from `usePlayerWebSocket`. The `provide(PLAYER_WS_SEND_KEY, send)` pattern cleanly passes the send function to child composables without creating additional connections.

## Verdict

**APPROVED** -- No critical, high, or medium issues. All 8 mechanics verified correct post-fix. Both medium issues from rules-review-143 are resolved. No rules regressions introduced by any of the 9 fix commits.

## Required Changes

None.
