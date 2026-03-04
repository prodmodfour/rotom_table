---
review_id: rules-review-232
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-011
domain: combat
commits_reviewed:
  - d84d3d60
  - 3fee2a90
  - f6ae7952
  - 2b4a7623
  - db6e81cc
  - dea273fe
mechanics_verified:
  - recall-volatile-condition-clearing
  - recall-side-effects-extraction
  - turn-validation-recall-release
  - release-placement-fallback
  - websocket-recall-release-sync
  - recall-release-pair-detection
  - immediate-act-logic
  - league-switch-restriction
  - recall-range-check
  - fainted-release-block
  - trapped-recall-block
  - action-cost-shift-standard
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Pokemon-Switching (p.229-261)
  - core/07-combat.md#Volatile-Afflictions (p.247, lines 1577-1581)
  - core/07-combat.md#Trapped (p.247)
  - core/07-combat.md#Take-a-Breather (p.247, lines 1447-1463)
reviewed_at: 2026-03-01T18:45:00Z
follows_up: rules-review-225
---

## Decrees Checked

- **decree-033** (Fainted switch on trainer's turn): Not directly modified by these commits, but the existing fainted switch validation in `switch.post.ts` (line 168-181) continues to enforce trainer-turn-only fainted switches via `validateFaintedSwitch`. The recall and release endpoints do not introduce any fainted-switch path that would contradict this decree. No violations.

- **decree-034** (Roar recall range / Whirlwind push): Not directly modified by these commits. The forced switch validation in `switching.service.ts` continues to use the standard 8m range for general forced switches, with Roar-specific 6m range noted as future scope. Whirlwind is not treated as a forced switch. No violations.

- **decree-038** (Sleep volatile but persists through recall): The extracted `applyRecallSideEffects` function (switching.service.ts lines 752-770) uses `RECALL_CLEARED_CONDITIONS` which is derived from per-condition `clearsOnRecall` flags. Verified in `statusConditions.ts`: Asleep has `clearsOnRecall: false` (line 91), Bad Sleep has `clearsOnRecall: false` (line 100). Sleep correctly persists through recall. No violations.

- **decree-039** (Roar blocked by Trapped): Not directly modified by these commits. The recall endpoint (recall.post.ts lines 114-118) checks for Trapped/Bound and blocks recall. The forced switch path in `switch.post.ts` continues to skip the Trapped check (as noted in prior review, forced switch Trapped interaction is tracked by ptu-rule-129). No violations introduced.

## Mechanics Verified

### 1. Recall Side-Effects Extraction (commit 3fee2a90)

- **Rule:** "Volatile Afflictions are cured completely... from Pokemon by recalling them into their Poke Balls." (`core/07-combat.md`, p.247, lines 1578-1579). Take a Breather parallel (p.247 lines 1459-1461): "set their Combat Stages back to their default level, lose all Temporary Hit Points."
- **Implementation:** `applyRecallSideEffects()` in `switching.service.ts` (lines 752-770) fetches the DB record, filters status conditions through `RECALL_CLEARED_CONDITIONS`, zeros `temporaryHp`, and resets `stageModifiers` to `{}`. Both `switch.post.ts` (line 224) and `recall.post.ts` (line 186) now call this single function.
- **Verification:** The diff shows the extracted logic is identical to what was previously inline in both endpoints. The `RECALL_CLEARED_CONDITIONS` array is derived from per-condition `clearsOnRecall` flags per decree-038. Conditions with `clearsOnRecall: true`: Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed, Stuck, Slowed, Tripped, Vulnerable. Conditions with `clearsOnRecall: false`: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned, Asleep, Bad Sleep, Fainted, Dead, Trapped. This matches PTU: persistent conditions survive recall, Sleep survives per decree-038, Trapped prevents recall entirely (checked earlier in validation).
- **Status:** CORRECT

### 2. Turn Validation on Recall/Release Endpoints (commit f6ae7952)

- **Rule:** "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`core/07-combat.md`, p.229, lines 235-237). "Recall and Release actions can also be taken individually by a Trainer as Shift Actions." (p.229, lines 250-251). These are trainer actions performed on the trainer's or Pokemon's initiative.
- **Implementation (recall):** `recall.post.ts` lines 82-98 validate that `currentTurnCombatantId` is either the trainer (`isTrainerTurn`) or one of the trainer's owned Pokemon (`isOwnedPokemonTurn`). The owned Pokemon check correctly verifies `ownerId === trainer.entityId`, not just the specific Pokemon being recalled -- any of the trainer's Pokemon's turns suffice.
- **Implementation (release):** `release.post.ts` lines 88-104 perform the identical check. The release endpoint correctly checks if the current combatant is the trainer or any of the trainer's owned Pokemon.
- **PTU Compliance:** PTU says these actions can be performed "on either the Trainer's or the Pokemon's Initiative." The implementation correctly allows recall/release on any of the trainer's Pokemon turns, not just the specific Pokemon involved. This is consistent with the full switch endpoint's `validateActionAvailability` which checks `isTrainerTurn || isPokemonTurn` (where `isPokemonTurn` specifically checks the recalled Pokemon's turn). The standalone endpoints are actually slightly more permissive -- any owned Pokemon's turn qualifies, not just the recalled/released one's turn. This is a reasonable interpretation since PTU says "the Pokemon's Initiative" without specifying which Pokemon.
- **Status:** CORRECT

### 3. Grid-Wide Fallback Placement (commit 2b4a7623)

- **Rule:** PTU does not specify exact grid placement mechanics for released Pokemon. This is an application-level behavior for the VTT grid. The design spec (Section L, line 212) specifies `findPlacementPosition` as the fallback.
- **Implementation:** `findAdjacentPosition()` in `switching.service.ts` (lines 676-719) first tries 8 adjacent cells, then expands to radius 2-5, then falls back to `findPlacementPosition(occupiedCells, side, tokenSize, gridWidth, gridHeight)` which performs a grid-wide search. The `side` parameter is passed from the release endpoint (line 193: `trainer.side`), ensuring the fallback respects side-based placement.
- **Previous Issue (M3):** The old code fell back to the trainer's own position, causing token overlap. The fix correctly uses grid-wide search instead.
- **Status:** CORRECT (no PTU mechanic to verify, but application behavior is sound)

### 4. WebSocket Recall/Release Handlers (commit d84d3d60)

- **Rule:** Not a PTU mechanic -- this is real-time sync infrastructure. However, the correctness of multi-view display of switching actions depends on these handlers.
- **Implementation:** `useWebSocket.ts` (lines 199-205) adds `case 'pokemon_recalled':` and `case 'pokemon_released':` handlers that call `getEncounterStore().updateFromWebSocket(message.data.encounter)`. This matches the existing `pokemon_switched` handler pattern (line 196-197).
- **Type Definitions:** `types/api.ts` (lines 54-55) adds:
  - `pokemon_recalled`: `{ encounterId, trainerId, trainerName, recalledNames, actionCost, encounter }`
  - `pokemon_released`: `{ encounterId, trainerId, trainerName, releasedNames, releasedCombatantIds, actionCost, countsAsSwitch, encounter }`
- **Verification:** The broadcast payloads in `recall.post.ts` (lines 248-258) and `release.post.ts` (lines 314-326) match the type definitions. Both include the full `encounter` object for state sync.
- **Status:** CORRECT

### 5. Recall-Release Pair Detection Preservation

- **Rule:** "Recalling and then Releasing by using two Shift Actions in one Round still counts as a Switch, even if they are declared as separate actions, and you may not do this to Recall and then Release the same Pokemon in one round." (`core/07-combat.md`, p.229, lines 251-255)
- **Implementation:** `checkRecallReleasePair()` in `switching.service.ts` (lines 787-811) is unchanged by the fix commits. Both `recall.post.ts` (lines 131-141, 211-222) and `release.post.ts` (lines 107-115, 274-288) continue to use this function for:
  1. Same-Pokemon validation (before execution): blocks releasing a recalled Pokemon or recalling a released Pokemon within the same round.
  2. League restriction application (after execution): applies `canBeCommanded = false` when a recall+release pair is detected in a League battle.
- **Verification with turn validation:** The new turn validation (commit f6ae7952) does not interfere with pair detection. Turn validation runs before pair detection, which is correct -- if it's not the trainer's turn, the action is blocked entirely before any pair checking occurs.
- **Status:** CORRECT

### 6. Immediate-Act Logic Preservation

- **Rule:** "If a player has a Pokemon turn available, a Pokemon may act during the round it was released. If the Pokemon's Initiative Count has already passed, then this means they may act immediately." (`core/07-combat.md`, p.229, lines 258-261)
- **Implementation:** `release.post.ts` (lines 221-226) calculates `canActImmediately = isFullContact && hasInitiativeAlreadyPassed(newCombatant, currentCombatantForInit)`. This is passed to `insertIntoTurnOrder()` which, when `canActImmediately` is true, inserts the Pokemon at `currentTurnIndex + 1` (next-to-act).
- **Verification:** The fix commits did not modify the immediate-act logic. The release endpoint correctly applies Section K for Full Contact battles. League battles use phase-based ordering (no immediate-act). The turn validation (commit f6ae7952) ensures the release only happens on a valid turn, but does not interfere with the immediate-act determination.
- **Status:** CORRECT

### 7. Action Cost Enforcement

- **Rule:** "Recall and Release actions can also be taken individually by a Trainer as Shift Actions." (p.229, line 250). "A Trainer may also spend a Standard Action to Recall two Pokemon or Release two Pokemon at once." (p.229, lines 255-257)
- **Implementation (recall):** `recall.post.ts` lines 144-150: `actionType = pokemonCombatantIds.length === 1 ? 'shift' : 'standard'`. Shift Action checked for single recall, Standard Action for double recall.
- **Implementation (release):** `release.post.ts` lines 148-154: identical logic.
- **Verification:** The fix commits did not modify action cost logic. The 1=Shift, 2=Standard mapping correctly implements PTU.
- **Status:** CORRECT

### 8. Trapped Recall Block

- **Rule:** "A Pokemon or Trainer that is Trapped cannot be recalled." (`core/07-combat.md`, p.247)
- **Implementation:** `recall.post.ts` lines 114-118 check both `statusConditions` and `tempConditions` for "Trapped" or "Bound". The fix commits did not modify this validation.
- **Status:** CORRECT

### 9. Fainted Release Block

- **Rule:** Implied by PTU -- a fainted Pokemon cannot battle. Sending a fainted Pokemon into combat is nonsensical.
- **Implementation:** `release.post.ts` lines 140-142: `if (pokemonRecord.currentHp <= 0)` blocks release.
- **Status:** CORRECT

### 10. Recall Range Check

- **Rule:** "A Trainer cannot Switch or Recall their Pokemon if their active Pokemon is out of range of their Poke Ball's recall beam -- 8 meters." (`core/07-combat.md`, p.229, lines 237-240). "During a League Battle, Trainers are generally considered to always be in Switching range." (p.229, lines 240-241)
- **Implementation:** `recall.post.ts` lines 122-128 call `checkRecallRange(trainer.position, pokemon.position, isLeague)`. The function in `switching.service.ts` (lines 42-66) returns `inRange: true` for League battles and calculates `ptuDiagonalDistance` for Full Contact.
- **Verification:** Unchanged by fix commits.
- **Status:** CORRECT

### 11. League Switch Restriction on Pair Detection

- **Rule:** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon." (`core/07-combat.md`, p.229, lines 243-248)
- **Implementation:** When `checkRecallReleasePair` returns `countsAsSwitch: true` and the battle is League, both endpoints apply `canSwitchedPokemonBeCommanded(true, false, false)` which returns `false`. The released Pokemon gets `turnState.canBeCommanded = false`.
- **Previous Issue (rules-review-225 MEDIUM-001):** The pair detection hardcodes `isFaintedSwitch: false`, so a standalone recall of a fainted Pokemon followed by a standalone release would incorrectly apply the League restriction. This was noted as a low-impact edge case since fainted switches would normally use the full switch endpoint. The rules-review-225 approved despite this, and it remains unchanged. The ticket ptu-rule-130 was filed.
- **Status:** CORRECT (known edge case tracked by ptu-rule-130)

### 12. App Surface Documentation

- **Rule:** Not a PTU mechanic, but documentation accuracy affects downstream skill correctness.
- **Implementation:** `app-surface.md` (line 129-130) lists both endpoints with correct descriptions. Line 163 comprehensively documents the switching system including `executeRecall`, `executeRelease`, `applyRecallSideEffects`, `hasInitiativeAlreadyPassed`, `findAdjacentPosition`, `checkRecallReleasePair`, and the three new WS events.
- **Status:** CORRECT

## Fix Cycle Resolution Verification

All 6 issues from code-review-249 have been addressed:

| Issue | Severity | Fix Commit | Resolution | PTU Impact |
|-------|----------|------------|------------|------------|
| CRIT-001 | CRITICAL | d84d3d60 | WS handlers added for `pokemon_recalled`/`pokemon_released` + type defs | No PTU mechanic change; sync infrastructure |
| H1 | HIGH | db6e81cc | app-surface.md updated with endpoints, WS events, system description | No PTU mechanic change; documentation |
| H2 | HIGH | f6ae7952 | Turn validation added matching PTU p.229 initiative requirement | Correctly enforces PTU turn constraint |
| M1 | MEDIUM | Filed as refactoring-112 | Non-blocking, store size pre-dates P2 | No PTU impact |
| M2 | MEDIUM | 3fee2a90 | `applyRecallSideEffects` extracted to switching.service.ts | No behavior change; same condition clearing logic |
| M3 | MEDIUM | 2b4a7623 | Grid-wide `findPlacementPosition` fallback replaces trainer overlap | No PTU mechanic change; grid placement |

## Rulings

1. **Turn validation scope for standalone recall/release:** The new turn validation allows recall/release on any of the trainer's owned Pokemon's turns (not just the specific Pokemon involved). PTU p.229 says "on either the Trainer's or the Pokemon's Initiative" without specifying which Pokemon. This permissive interpretation is reasonable -- a trainer should be able to recall Pokemon A during Pokemon B's turn, as long as both belong to the same trainer. The full switch endpoint is more restrictive (only trainer's turn or the recalled Pokemon's turn), but that difference is acceptable since the full switch involves consuming the recalled Pokemon's Standard Action.

2. **Recall side-effects on combatant vs DB record:** The `applyRecallSideEffects` function modifies the DB record (Pokemon table), while the in-memory combatant is removed from the encounter entirely. This is correct -- the DB record reflects the Pokemon's state in its Poke Ball (volatile conditions cleared, temp HP gone, stages reset), while the combatant object is discarded since it's no longer in the encounter.

3. **Turn validation guard clause:** Both endpoints have `if (currentTurnCombatantId)` guard before the turn check (recall line 84, release line 91). This means if there's no current turn combatant (e.g., encounter not yet started, or turn order is empty), the validation is skipped. This is a reasonable safety fallback for edge cases, and doesn't weaken the PTU compliance for normal gameplay.

## Summary

The P2 fix cycle correctly resolves all 6 issues identified by code-review-249 without introducing any new PTU rule violations. The critical WebSocket sync gap is closed. Turn validation now enforces the PTU initiative requirement for standalone recall/release. The recall side-effects extraction preserves the exact same decree-038-compliant condition clearing logic. The placement fallback eliminates the token overlap issue.

All 12 mechanics verified in this re-review (combining the original rules-review-225 scope with the fix cycle changes) remain correctly implemented. No new PTU rule issues discovered.

## Verdict

**APPROVED** -- All fix cycle issues resolved correctly. No PTU rule violations. The previously approved mechanics from rules-review-225 remain intact. The MEDIUM-001 edge case (fainted recall+release pair detection) from rules-review-225 continues to be tracked by ptu-rule-130 and does not block approval.
