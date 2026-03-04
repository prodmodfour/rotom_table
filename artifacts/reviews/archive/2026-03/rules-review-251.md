---
review_id: rules-review-251
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-combat
commits_reviewed:
  - 20cdfc51
  - fe5cce7c
  - 3667c128
  - b3427228
  - 96dea1f2
  - eca48c9b
  - 181f7d09
  - 4c8d1d5a
  - 6a7a455f
  - f5bb1141
  - be612172
mechanics_verified:
  - capture-ball-type-resolution
  - capture-ball-type-passthrough
  - capture-accuracy-check
  - capture-rate-system
  - capture-action-economy
  - breather-action-economy
  - breather-undo-snapshot
  - healing-item-combatant-id
  - healing-item-undo-snapshot
  - capture-null-result-handling
  - gm-approval-workflow
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Page 214 (Capturing Pokemon — AC 6, 1d100 system)
  - core/07-combat.md#Page 245 (Take a Breather — Full Action)
  - core/09-gear-and-items.md#Page 276 (Using Items — Standard Action)
reviewed_at: 2026-03-02T22:30:00Z
follows_up: rules-review-246
---

## Re-Review Context

This is a follow-up review of feature-023 P0 (Player Capture & Healing Interfaces) after 10 fix-cycle commits addressed all issues raised in code-review-270 (CR-1 + 3 HIGH + 4 MEDIUM) and rules-review-246 (CRIT-001 + HIGH-001 + 2 MEDIUM). The task is to verify that every issue has been correctly resolved and that no new PTU rule violations were introduced.

---

## Fix Verification: rules-review-246 Issues

### CRIT-001: 'Poke Ball' vs 'Basic Ball' string mismatch -- RESOLVED

- **Original issue:** `usePlayerCombat.ts` and `PlayerRequestPanel.vue` defaulted `ballType` to the string literal `'Poke Ball'`, which does not exist as a key in `POKE_BALL_CATALOG`. The catalog key is `'Basic Ball'` (`DEFAULT_BALL_TYPE`). This would cause a 400 error on every capture attempt.
- **Fix (commit be612172):** Both files now import and use `DEFAULT_BALL_TYPE` from `~/constants/pokeBalls`.
- **Verification:**
  - `usePlayerCombat.ts:4` imports `DEFAULT_BALL_TYPE` from `~/constants/pokeBalls`
  - `usePlayerCombat.ts:364` uses `params.ballType ?? DEFAULT_BALL_TYPE` -- correct
  - `PlayerRequestPanel.vue:90` imports `DEFAULT_BALL_TYPE` from `~/constants/pokeBalls`
  - `PlayerRequestPanel.vue:278` uses `req.ballType ?? DEFAULT_BALL_TYPE` -- correct
  - `DEFAULT_BALL_TYPE` resolves to `'Basic Ball'` (confirmed in `constants/pokeBalls.ts:351`)
- **Status:** RESOLVED. The ball type now correctly maps to a valid `POKE_BALL_CATALOG` key.

### HIGH-001: ballType not passed to attemptCapture -- RESOLVED

- **Original issue:** `handleApproveCapture` in `usePlayerRequestHandlers.ts` received `data.ballType` but omitted it from the `attemptCapture()` call, silently dropping the player's ball type selection.
- **Fix (commit f5bb1141):** `ballType: data.ballType` added to the `attemptCapture` params.
- **Verification:**
  - `usePlayerRequestHandlers.ts:86` now includes `ballType: data.ballType` in the `attemptCapture` call
  - The flow is: player sends `ballType` in request -> `PlayerRequestPanel.vue` emits it in `approve-capture` event (line 278) -> `handleApproveCapture` receives it as `data.ballType` (line 64) -> passes to `attemptCapture` (line 86) -> `attemptCapture` sends to `/api/capture/attempt` body as `ballType` (line 182 of `useCapture.ts`) -> server resolves from `POKE_BALL_CATALOG` (line 102 of `attempt.post.ts`)
  - End-to-end ball type propagation is now complete.
- **Status:** RESOLVED. Player's ball type selection correctly flows to the capture rate calculation.

### MED-001: entityId vs combatantId in healing item handler -- RESOLVED

- **Original issue:** `handleApproveHealingItem` passed `trainerCombatant.entityId` (the Prisma entity UUID) instead of the combatant wrapper ID. The `use-item.post.ts` endpoint searches by combatant ID, so this would cause a "Combatant not found" 404.
- **Fix:** `usePlayerRequestHandlers.ts:228` now passes `data.trainerCombatantId` (the combatant ID from the request) directly, bypassing the entity lookup entirely.
- **Verification:**
  - `usePlayerRequestHandlers.ts:226-230`: `encounterStore.useItem(data.healingItemName, data.trainerCombatantId, data.healingTargetId)` -- uses combatant ID, not entity ID
  - `data.trainerCombatantId` originates from the player request, which sends the combatant ID (the wrapper ID used in the encounter combatants array)
  - The healing target ID (`data.healingTargetId`) is also expected to be a combatant ID. The P0 type definition in `player-sync.ts:54` names it `healingTargetId` without specifying combatant vs entity, but the `PlayerRequestPanel.vue` emit at line 140 passes the raw `healingTargetId` from the player request, which the player composable would send as a combatant ID (consistent with how the existing GM `UseItemModal` works)
- **Status:** RESOLVED. Both user and target IDs are now combatant IDs.

### MED-002: Null check on attemptCapture result -- RESOLVED

- **Original issue:** When `attemptCapture` returns `null` (network error, validation failure), the ack sent to the player contained `undefined` values for `captureRate`, `roll`, and `reason`, making it look like the ball hit but capture failed.
- **Fix:** `usePlayerRequestHandlers.ts:94-105` now checks `if (!result)` and sends a clear rejection ack with `status: 'rejected'` and `reason: 'Capture attempt failed to execute'`, then calls `setHandlerError` to show the GM an inline error message.
- **Verification:**
  - Lines 94-105: null check is present, sends rejection ack, displays error to GM, returns early
  - The successful ack at lines 121-134 is only reached when `result` is non-null
  - Error display uses `setHandlerError` (non-blocking inline display, replacing the old `alert()`)
- **Status:** RESOLVED. Null capture results now produce clear failure messages to both GM and player.

---

## Fix Verification: code-review-270 Issues (PTU-Relevant Subset)

The code review issues are not strictly PTU rules concerns, but several have game logic implications worth verifying.

### HI-2: Missing undo snapshots (commit 181f7d09) -- RESOLVED

- **Verification:** All three approval handlers now call `encounterStore.captureSnapshot()` before modifying state:
  - `handleApproveCapture` line 70: `captureSnapshot('Capture Attempt')`
  - `handleApproveBreather` line 153: `captureSnapshot('Take a Breather')`
  - `handleApproveHealingItem` line 224: `captureSnapshot('Use Healing Item')`
- This ensures the GM can undo any player-requested action, which is important for game flow corrections.

### HI-3: alert() replaced with inline error display (commit eca48c9b) -- RESOLVED

- **Verification:** `usePlayerRequestHandlers.ts` lines 36-54 implement a reactive `handlerError` ref with auto-clear after 8 seconds. `setHandlerError` replaces all prior `alert()` calls. The GM page renders this at line 68-71 of `gm/index.vue` as a dismissible error banner.

### ME-2: % suffix on capture rate display (commit b3427228) -- RESOLVED

- **Verification:** `PlayerRequestPanel.vue` line 27: `(Capture Rate: {{ req.captureRatePreview }})` -- no `%` suffix. The capture rate in PTU's 1d100 system is an absolute threshold value (0-100+), not a percentage. Displaying it without `%` is correct per decree-013 (1d100 system).

### ME-3: Empty deny reason -- RESOLVED

- **Verification:** `usePlayerRequestHandlers.ts:286` uses `data.reason || 'Request denied by GM'` as a fallback when the reason is empty. `PlayerRequestPanel.vue:311` sends `reason: ''` from `handleDeny`, but the fallback in the handler ensures the player always receives a non-empty rejection reason.

### ME-4: Import path inconsistency (commit 3667c128) -- RESOLVED

- **Verification:** `PlayerRequestPanel.vue:89` now imports from `~/types` (the barrel export) instead of a direct submodule path: `import type { WebSocketEvent, PlayerActionRequest, PlayerActionType } from '~/types'`. The barrel at `types/index.ts:38` re-exports `player-sync.ts` via `export * from './player-sync'`.

### CR-1: gm/index.vue >800 lines (commit 6a7a455f) -- RESOLVED

- **Verification:** `gm/index.vue` is now 770 lines (verified via `wc -l`), under the 800-line cap. The switch modal state was extracted to `useSwitchModalState.ts` (137 lines), a clean composable with proper type safety.

### HI-1: Unused encounterId prop (commit 4c8d1d5a) -- RESOLVED

- **Verification:** `PlayerRequestPanel.vue` has no `props` definition. Line 123 has a comment: "No props needed -- WebSocket server already scopes player_action forwarding to the encounter room, so no client-side filtering required." The component uses `useWebSocket()` directly to listen for events.

---

## Mechanics Verified (Post-Fix)

### 1. Capture Ball Type Resolution

- **Rule:** Different Poke Ball types have different capture modifiers (PTU p.271-273). The default ball is "Basic Ball" (often called "Poke Ball") with modifier 0.
- **Implementation:** `DEFAULT_BALL_TYPE = 'Basic Ball'` is now consistently used across the entire player capture path: `usePlayerCombat.ts:364`, `PlayerRequestPanel.vue:278`, `usePlayerRequestHandlers.ts:86` (passthrough), `useCapture.ts:182`, `attempt.post.ts:101`.
- **Status:** CORRECT

### 2. Capture Ball Type End-to-End Passthrough

- **Rule:** The ball type selected by the player must be used in the capture rate calculation. Each ball has unique modifiers (e.g., Great Ball -10, Ultra Ball -15, Master Ball -100).
- **Implementation:** Player sends `ballType` in `requestCapture` -> WS forwards to GM -> `PlayerRequestPanel.vue` emits `approve-capture` with `ballType` -> `handleApproveCapture` receives `data.ballType` -> passes to `attemptCapture({ ballType: data.ballType })` -> sent to `/api/capture/attempt` body -> resolved from `POKE_BALL_CATALOG` -> passed to `calculateBallModifier` -> applied in `attemptCapture(captureRate, trainerLevel, modifiers, criticalHit, ballResult.total)`.
- **Status:** CORRECT

### 3. Capture Accuracy Check (AC 6)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#Page 214`). The d20 roll must meet AC 6 for the ball to hit.
- **Implementation:** `rollAccuracyCheck()` in `useCapture.ts:227-234` rolls 1d20 and checks for nat 20, but does NOT gate the capture attempt on AC 6. `handleApproveCapture` always proceeds to `attemptCapture()` regardless of the roll result.
- **Status:** This remains a PRE-EXISTING issue, tracked as bug-043 (verified: `artifacts/tickets/open/bug/bug-043.md` exists, P2 severity HIGH, references rules-review-246 PRE-EXISTING-001). Not introduced by the P0 fix cycle. No action required for this review.

### 4. Capture Rate System (1d100)

- **Rule:** Per decree-013, use the core 1d100 capture system exclusively. "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (`core/05-pokemon.md#Page 214`)
- **Implementation:** The player capture path delegates to `attemptCapture` in `useCapture.ts`, which calls `/api/capture/attempt`, which uses `attemptCapture()` from `captureRate.ts` -- the 1d100 system. The `accuracyRoll` is passed through and used for nat-20 crit detection (`criticalHit = body.accuracyRoll === 20` at `attempt.post.ts:98`), correctly applying the -10 capture roll modifier on natural 20.
- **Status:** CORRECT. Per decree-013, the 1d100 system is used exclusively.

### 5. Capture Action Economy (Standard Action)

- **Rule:** "Poke Balls can be thrown as a Standard Action" (`core/05-pokemon.md#Page 214`)
- **Implementation:** `useCapture.ts:189-201` attempts to consume the Standard Action via `/api/encounters/${encounterId}/action`. This endpoint does not exist, so the action is not consumed. This is tracked as bug-044.
- **Status:** PRE-EXISTING issue, tracked as bug-044 (verified: `artifacts/tickets/open/bug/bug-044.md` exists, P3 severity MEDIUM). Not introduced by the P0 fix cycle.

### 6. Breather Action Economy (Full Action)

- **Rule:** "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible" (`core/07-combat.md#Page 245`)
- **Implementation:** `handleApproveBreather` calls `/api/encounters/${encounterId}/breather` which (per rules-review-246 verification) sets `standardActionUsed: true, shiftActionUsed: true`, correctly consuming both actions. The breather shift banner is shown to the GM to handle the movement requirement.
- **Status:** CORRECT

### 7. Breather Effects (Post-Fix)

- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions." (`core/07-combat.md#Page 245`). Per decree-014, Stuck/Slow are separate from volatile conditions.
- **Implementation:** The breather endpoint (verified in rules-review-246) correctly handles: stage reset, temp HP removal, volatile condition cure, Slow/Stuck cure (separate from volatile per decree-014), Tripped + Vulnerable (standard) or Tripped + ZeroEvasion (assisted), initiative reorder. The P0 handler at `usePlayerRequestHandlers.ts:140-208` correctly delegates to this endpoint without bypassing any validation.
- **Status:** CORRECT

### 8. Healing Item Flow (Post-Fix)

- **Rule:** "Applying Restorative Items, or X Items is a Standard Action" (`core/09-gear-and-items.md#Page 276`)
- **Implementation:** `handleApproveHealingItem` calls `encounterStore.useItem()` with combatant IDs (post-fix). The `use-item.post.ts` endpoint performs item validation, HP restoration, and (per P0 scope) defers action economy enforcement to P2.
- **Status:** CORRECT (action economy deferral is intentional and documented)

### 9. GM Approval Workflow

- **Rule:** The GM approval workflow is an app-level design decision. The key requirement is that GM approval does not bypass any PTU validation.
- **Implementation:** The workflow correctly delegates to existing validated endpoints: `attemptCapture` (capture rate, owned check, 0 HP check), `breather.post.ts` (stage reset, condition cure, action consumption), and `encounterStore.useItem` (item validation, HP restoration). The undo snapshots (added in fix cycle) ensure the GM can revert any approved action. Error handling via `setHandlerError` provides non-blocking GM feedback.
- **Status:** CORRECT -- No PTU validation is bypassed.

### 10. WebSocket Protocol for Player Actions

- **Rule:** Player action requests must be routed correctly: player -> server -> GM (forward), GM -> server -> player (ack routing).
- **Implementation:** `ws.ts:372-387` handles `player_action` (forwarded to GM via `forwardToGm` which registers `requestId -> playerId` mapping) and `player_action_ack` (routed to originating player via `routeToPlayer` which consumes the pending request entry). The capture, breather, and healing item action types are all `PlayerActionType` values included in the `player_action` event data.
- **Status:** CORRECT

---

## Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-013 (1d100 capture system) | COMPLIANT | Player capture path delegates to the existing 1d100 `attemptCapture` server endpoint. No d20 playtest system used. |
| decree-014 (Stuck/Slow separate from volatile) | COMPLIANT | Not directly exercised by P0; underlying `captureRate.ts` and `breather.post.ts` handle correctly per rules-review-246 verification |
| decree-015 (Real max HP for capture rate) | COMPLIANT | Not directly exercised by P0; `/api/capture/attempt` reads `pokemon.maxHp` from DB (the real max HP from the Prisma model), per decree-015 |
| decree-017 (PC heals to effective max HP) | N/A | Healing item flow uses existing `use-item.post.ts` with separate HP cap logic |
| decree-029 (Rest healing min 1 HP) | N/A | Breather does not heal HP; rest healing composable not modified |

No decree violations found. No new ambiguities discovered.

---

## Pre-Existing Issues Status

| Issue | Ticket | Status |
|-------|--------|--------|
| PRE-EXISTING-001: AC 6 not enforced on capture accuracy check | bug-043 | Verified open in `artifacts/tickets/open/bug/bug-043.md` (P2/HIGH) |
| PRE-EXISTING-002: Standard Action consumption endpoint missing | bug-044 | Verified open in `artifacts/tickets/open/bug/bug-044.md` (P3/MEDIUM) |

Both pre-existing issues from rules-review-246 were properly filed as tickets per L2 (always file tickets for pre-existing issues). Neither was introduced by or worsened by the P0 fix cycle.

---

## Rulings

1. **All four rules-review-246 issues are correctly resolved.** CRIT-001 (ball type string), HIGH-001 (ball type passthrough), MED-001 (combatant ID), and MED-002 (null check) have all been fixed with correct implementations that match the prescribed fixes.

2. **No new PTU rule violations introduced in the fix cycle.** The 10 fix commits are purely corrective -- they fix the identified issues without introducing new game logic or modifying any PTU calculation paths. The `useSwitchModalState.ts` extraction (commit 6a7a455f) is a structural refactor that preserves identical behavior.

3. **The `useSwitchModalState.ts` composable preserves PTU correctness.** The switch modal state extraction moves trainer/pokemon ID resolution logic from `gm/index.vue` into a dedicated composable. The computed properties (`switchModalTrainerId`, `switchModalPokemonId`, `switchModalTrainerEntityId`) use the same lookup logic (find by combatant ID, resolve entity via `ownerId`). Fainted switch correctly finds the first fainted pokemon by `currentHp <= 0`. No PTU switch mechanics were modified.

4. **Capture rate preview display is now correctly undecorated.** The removal of the `%` suffix from the capture rate preview (commit b3427228) is correct. In the PTU 1d100 capture system, the capture rate is an absolute threshold (e.g., 70 means the d100 roll must be <= 70), not a percentage. Displaying "Capture Rate: 70" is more accurate than "Capture Rate: 70%".

5. **The deny reason fallback is acceptable.** `handleDenyRequest` defaults to `'Request denied by GM'` when the reason is empty. This is a reasonable UX choice -- the GM can always override with a custom reason if desired.

---

## Summary

All 4 issues from rules-review-246 and all 8 issues from code-review-270 have been correctly resolved across 10 fix-cycle commits. The player capture flow now correctly resolves ball types through the `DEFAULT_BALL_TYPE` constant, passes ball type end-to-end from player request through to the server's capture rate calculation, uses combatant IDs (not entity IDs) for healing item operations, and handles null capture results with clear error messages. Undo snapshots are captured before all state-modifying operations. The GM encounter page is now under the 800-line cap. Pre-existing issues (AC 6 enforcement, action endpoint) are properly tracked as bug-043 and bug-044.

No new PTU rule violations were introduced. No decree violations found.

---

## Verdict

**APPROVED**

All issues from the prior review cycle have been addressed. The implementation correctly delegates to existing PTU-validated server endpoints for capture, breather, and healing item mechanics. The fix cycle resolved all identified issues without introducing regressions or new rule violations.

---

## Required Changes

None.
