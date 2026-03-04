---
review_id: code-review-225
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-012
domain: combat
commits_reviewed:
  - e1e5ffe
  - c9fc1b6
  - 0ef8300
  - 158e050
  - 3572de6
  - bcd5bd1
  - 6b341f3
  - 18c54d6
  - 453fe28
  - fec39b1
  - 2b6876b
files_reviewed:
  - app/utils/injuryMechanics.ts
  - app/tests/unit/utils/injuryMechanics.test.ts
  - app/types/combat.ts
  - app/constants/statusConditions.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/components/encounter/CombatantCard.vue
  - app/stores/encounter.ts
  - app/composables/useEncounterActions.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-02-28T23:00:00Z
follows_up: null
---

## Review Scope

Feature-012: Death & Heavily Injured Automation. 10 implementation commits across 11 files (2 new, 9 modified). Covers 5 matrix rules: combat R076 (Heavily Injured 5+ Injuries), R080 (Death Conditions), R081 (Death League Exemption), healing R016, R030.

Three server-side code paths were inspected for consistency: damage.post.ts (manual damage), move.post.ts (move execution), and next-turn.post.ts (turn-end Standard Action penalty). Client-side changes in CombatantCard.vue, encounter store, and useEncounterActions composable were also reviewed.

Decrees checked: decree-001 (minimum damage), decree-004 (temp HP & massive damage), decree-005 (source-tracked CS effects), decree-012 (type immunity enforcement), decree-021 (League Battle two-phase system with HP-based death suppression).

## Issues

### CRITICAL

#### C1: next-turn.post.ts applies heavily injured penalty unconditionally instead of only on Standard Action

**File:** `app/server/api/encounters/[id]/next-turn.post.ts` lines 82-133

PTU p.250: "Whenever a Heavily Injured Trainer or Pokemon **takes a Standard Action** during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."

The current implementation applies the penalty on every turn end (any phase except declaration), regardless of whether the combatant actually used a Standard Action. A combatant who only Shifts, holds their action, or whose turn was skipped (e.g., they were already fainted) should NOT take the penalty.

The combatant data structure already has `turnState.standardActionUsed` (set by `pass.post.ts`, `breather.post.ts`, and the action tracking system). However, `move.post.ts` does not set `standardActionUsed`, which means this field is unreliable as a gate. There are two acceptable fixes:

1. **Preferred:** Ensure `move.post.ts` sets `turnState.standardActionUsed = true` on the actor when a move is executed (it already decrements `actionsRemaining`), then gate the heavily injured penalty in `next-turn.post.ts` behind `currentCombatant.turnState?.standardActionUsed === true`.
2. **Alternative:** Accept the current unconditional approach as a deliberate simplification, but document the deviation from RAW with a comment explaining the design decision and create a decree-need ticket for a human ruling.

This is CRITICAL because it changes the game mechanics in a way that penalizes players unfairly. A combatant that only shifts (a common tactic for heavily injured combatants trying to flee) should not take extra damage for doing so.

### HIGH

#### H1: move.post.ts does not return death/heavily-injured results to the client

**Files:** `app/server/api/encounters/[id]/move.post.ts` line 222, `app/composables/useEncounterActions.ts` line 147

The move endpoint returns `{ success: true, data: response }` with no death or heavily-injured metadata. The damage endpoint returns `damageResult` containing `heavilyInjured`, `heavilyInjuredHpLoss`, and `deathCheck`. The next-turn endpoint returns `heavilyInjuredPenalty`.

As a result, the GM alert notifications in `useEncounterActions.ts` (`handleDamage`, lines 49-62) only fire for direct damage application. When a move kills a target (or triggers heavily injured penalty), the GM gets no alert. The encounter state updates correctly (HP drops, Dead status appears), but the explicit "X has DIED!" alert is missing.

This inconsistency means the GM could miss a death event during move execution -- the most common damage path in actual gameplay.

**Required fix:** Return death/injury metadata from move.post.ts and consume it in `handleExecuteMove` in the composable, or move the alert logic to a reactive watcher that detects death status appearing on any combatant.

#### H2: next-turn.post.ts heavilyInjuredPenalty response is discarded by the store

**Files:** `app/stores/encounter.ts` lines 277-289, `app/server/api/encounters/[id]/next-turn.post.ts` line 291

The next-turn endpoint returns `heavilyInjuredPenalty` in the response (line 291), but the store's `nextTurn()` action only reads `response.data` (the encounter object) and discards the rest. No GM alert fires for the turn-end heavily injured penalty.

**Required fix:** Update the store's `nextTurn()` to return the `heavilyInjuredPenalty` data, and add alert handling in the caller (the page component or composable that calls `nextTurn()`).

### MEDIUM

#### M1: Dead and Fainted appear twice in CombatantCard UI

**File:** `app/components/encounter/CombatantCard.vue` lines 65-86

The "Dead" status has a dedicated section (lines 65-74) with a `death-badge` and GM override button, but "Dead" is also rendered as a regular `status-badge` in the status conditions list (lines 77-86) because `statusConditions` is not filtered. This results in "Dead" appearing twice on the card.

The same issue exists for "Fainted" (which gets a CSS class on the card wrapper at line 6 but also shows as a status badge). Since the Fainted duplication is pre-existing and the Dead display follows the same pattern, this is consistent but still creates visual noise.

**Required fix:** Filter "Dead" (and ideally "Fainted") from the `statusConditions` computed property since they have dedicated display treatments.

#### M2: Defeated enemies not tracked in move.post.ts or next-turn.post.ts death paths

**Files:** `app/server/api/encounters/[id]/move.post.ts`, `app/server/api/encounters/[id]/next-turn.post.ts`

When a target dies from move damage + heavily injured penalty in `move.post.ts`, or from the turn-end heavily injured penalty in `next-turn.post.ts`, the combatant is NOT added to `defeatedEnemies` for XP calculation. Only `damage.post.ts` (lines 116-128) tracks defeated enemies.

The move.post.ts gap is pre-existing (confirmed in the commit history), but the developer was already modifying this file and adding death logic. The next-turn.post.ts gap is new (a combatant could die from the turn-end penalty without being counted for XP).

**Required fix:** Add defeated enemy tracking to both `move.post.ts` and `next-turn.post.ts` when a combatant is marked dead or fainted.

#### M3: encounter.ts store at 806 lines (borderline limit)

**File:** `app/stores/encounter.ts` (806 lines)

The project convention is max 800 lines per file. At 806 lines, this is 6 lines over. The change from this feature (+17 lines for the applyDamage return type) pushed it over the limit. This is not blocking but should be addressed -- the XP-related actions (lines 731-803) could be extracted into a separate `useEncounterXp` composable or store.

**Required fix:** Extract a section (e.g., XP actions) to bring the file under 800 lines.

## Decree Compliance

- **decree-001** (minimum damage): Not directly affected. The heavily injured penalty is HP loss, not attack damage. No violation.
- **decree-004** (temp HP & massive damage): The heavily injured penalty in `damage.post.ts` correctly uses `damageResult.newInjuries` (post-damage injury count including new injuries from massive damage check). Temp HP is already absorbed by `calculateDamage` before the heavily injured check runs. Compliant.
- **decree-005** (source-tracked CS effects): When fainting from heavily injured penalty, the code in `damage.post.ts` (line 70-75) and `next-turn.post.ts` (line 95-100) add "Fainted" status but do NOT reverse CS effects from status conditions. This is handled by `applyDamageToEntity` in the normal damage path, but the heavily-injured-penalty-caused-faint path bypasses `applyDamageToEntity`. **This is addressed below as part of C1's required fix** -- the faint logic in the heavily injured penalty paths should also reverse CS effects, or delegate to a shared utility.

  **Update:** On closer inspection, in `damage.post.ts` the `applyDamageToEntity` already handles faint from the main damage. The heavily injured penalty faint (lines 70-75) only fires when `!damageResult.fainted` -- meaning main damage didn't faint them but the penalty did. In this case, CS effects from status conditions are NOT reversed. This is a sub-issue of C1 but elevating it here: **the heavily-injured-penalty-caused-faint path must also reverse persistent/volatile status CS effects per decree-005.**

- **decree-012** (type immunity enforcement): Not directly affected by this feature. No violation.
- **decree-021** (League Battle death suppression): Correctly implemented. HP-based death is suppressed in League mode (`isLeagueBattle` check in all three endpoints). Injury-based death (10+ injuries) still applies even in League mode. The code matches the decree.

## What Looks Good

1. **Pure utility design in injuryMechanics.ts.** Clean separation of pure functions from side effects. All functions take explicit parameters and return structured results. The `unclampedHp` parameter design for death threshold checks is thoughtful -- it avoids re-deriving the pre-clamp value from stored HP.

2. **Comprehensive unit tests.** The test file covers boundary conditions well: threshold boundaries (4 vs 5 injuries, 9 vs 10), exact-value edge cases (HP exactly equals injury count), the tie case for death threshold (-50 vs -50), and League Battle suppression. 266 lines of focused tests with clear naming.

3. **Constants extracted and exported.** `HEAVILY_INJURED_THRESHOLD`, `LETHAL_INJURY_COUNT`, `DEATH_HP_ABSOLUTE`, `DEATH_HP_PERCENTAGE` are named constants that can be imported by tests and other modules. No magic numbers in the logic.

4. **Death result structure is well-designed.** The `DeathCheckResult` interface includes `leagueSuppressed` as a separate flag, allowing the GM to see "this would have been a death" even in League mode. This informs the GM without changing state.

5. **GM override button on dead combatants.** The CombatantCard includes a "Revoke death (GM override)" button that emits a status change to remove "Dead". This gives the GM narrative control per PTU p.251's "use this rule at your GM's discretion."

6. **Correct death check ordering.** In all three endpoints, the death check happens AFTER the heavily injured penalty is applied. This matches PTU sequencing: damage -> heavily injured penalty -> death check.

7. **Commit granularity is appropriate.** Each commit touches 1-3 files with a focused purpose. The progression (utility -> type system -> endpoints -> UI -> store -> composable -> tests) is logical.

## Verdict

**CHANGES_REQUIRED**

The implementation correctly captures the core PTU mechanics and the pure utility layer is well-designed. However, the critical issue of unconditional heavily injured penalty application on turn end (C1) changes game mechanics in a player-hostile way. The missing GM alerts for the most common damage path (H1, H2) will cause GMs to miss death events. The decree-005 compliance gap in the heavily-injured-faint path must also be addressed.

## Required Changes

1. **C1 (CRITICAL):** Gate the heavily injured penalty in `next-turn.post.ts` behind a Standard Action check. Ensure `move.post.ts` sets `turnState.standardActionUsed = true` on the actor. Add CS-effect reversal when heavily-injured penalty causes fainting (decree-005 compliance).
2. **H1 (HIGH):** Return death/injury metadata from `move.post.ts` and add GM alert handling in `handleExecuteMove`.
3. **H2 (HIGH):** Update the store's `nextTurn()` to surface `heavilyInjuredPenalty` data and add GM alert handling in the calling code.
4. **M1 (MEDIUM):** Filter "Dead" from the `statusConditions` computed in CombatantCard to avoid duplicate display.
5. **M2 (MEDIUM):** Add defeated enemy tracking to `move.post.ts` and `next-turn.post.ts` death paths.
6. **M3 (MEDIUM):** Extract XP or other actions from `encounter.ts` to bring it under 800 lines.
