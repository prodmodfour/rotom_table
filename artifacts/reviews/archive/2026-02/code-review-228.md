---
review_id: code-review-228
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-012
domain: combat
commits_reviewed:
  - 30cdb43
  - a8bde87
  - 068c202
  - 702d09d
  - cffce87
  - 243d8f9
  - aaac6c5
  - a33d12e
files_reviewed:
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/SignificancePanel.vue
  - app/components/encounter/XpDistributionModal.vue
  - app/composables/useEncounterActions.ts
  - app/pages/gm/index.vue
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/combatant.service.ts
  - app/stores/encounter.ts
  - app/stores/encounterXp.ts
  - app/tests/unit/utils/injuryMechanics.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-02-28T22:30:00Z
follows_up: code-review-225
---

## Review Scope

Re-review of the feature-012 (Death & Heavily Injured Automation) fix cycle. This cycle addressed all issues from code-review-225 (C1, H1, H2, M1, M2, M3) and rules-review-201 (HIGH-001, MEDIUM-001). Eight commits total.

### Original Issues Addressed

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| C1 | CRITICAL | RESOLVED | `standardActionUsed` flag now gates heavily injured penalty in `next-turn.post.ts` |
| H1 | HIGH | RESOLVED | `move.post.ts` returns `targetResults` with death/injury metadata |
| H2 | HIGH | RESOLVED | `next-turn.post.ts` returns `heavilyInjuredPenalty` object, consumed by store and gm/index.vue |
| M1 | MEDIUM | RESOLVED | `CombatantCard.vue` filters Dead/Fainted from `displayStatusConditions` |
| M2 | MEDIUM | PARTIALLY RESOLVED | Move and next-turn paths track defeated enemies, but damage.post.ts has a gap (see H1-NEW below) |
| M3 | MEDIUM | RESOLVED | XP actions extracted to `encounterXp.ts` (91 lines), `encounter.ts` now 758 lines |
| HIGH-001 (rules) | HIGH | RESOLVED | Same as C1 |
| MEDIUM-001 (rules) | MEDIUM | RESOLVED | Test name corrected |
| Decree-005 | DECREE | RESOLVED | `applyFaintStatus` extracted and used in all three faint paths |

## Issues

### HIGH

#### H1-NEW: `damage.post.ts` defeated enemy tracking misses heavily-injured-penalty faint

**File:** `app/server/api/encounters/[id]/damage.post.ts`, line 116
**Commit scope:** Pre-existing bug, but the M2 fix (cffce87) added defeated tracking to move and next-turn without fixing this existing gap in damage.post.ts.

The `isDefeated` check uses `damageResult.fainted || deathCheck.isDead`, but `damageResult.fainted` only captures faint from the initial damage hit. If a combatant survives the initial damage (e.g., HP goes to 3) but faints from the subsequent heavily injured penalty (HP goes to 0), `damageResult.fainted` is `false` and `deathCheck.isDead` may also be `false` (if injuries < 10 and unclamped HP is above death threshold). The combatant is at 0 HP but not tracked as defeated for XP.

The `faintedFromAnySource` variable is already computed at line 109 for the stage sync logic:
```typescript
const faintedFromAnySource = damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)
```

The fix is straightforward -- line 116 should use `faintedFromAnySource` instead of `damageResult.fainted`:
```typescript
const isDefeated = faintedFromAnySource || deathCheck.isDead
```

This is HIGH rather than CRITICAL because the GM can still see the fainted enemy at 0 HP on screen and could end the encounter with correct XP, but the automated tracking silently drops the defeat, which can lead to incorrect XP calculation if the GM relies on the automated count.

### MEDIUM

#### M1-NEW: `combatant.service.ts` exceeds 800-line limit (809 lines)

**File:** `app/server/services/combatant.service.ts`
**Commit:** a33d12e (decree-005 fix)

Before the fix cycle, this file was 797 lines. The `applyFaintStatus` extraction added a new exported function with JSDoc, pushing it to 809 lines. The extraction itself is correct and well-designed, but the file now violates the project's 800-line limit.

The evasion helpers section (lines 664-676) and/or the initiative recalculation section (lines 780-809) are good extraction candidates. Alternatively, the entity builder functions (`buildPokemonEntityFromRecord`, `buildHumanEntityFromRecord`, lines 552-661) could be moved to an `entity-builder.service.ts` since they are pure data transformation with no combat logic dependency.

#### M2-NEW: `app-surface.md` not updated for new `encounterXp` store

**File:** `.claude/skills/references/app-surface.md`
**Commit:** 243d8f9

The new `encounterXp.ts` store was added but `app-surface.md` was not updated to reflect the new store (project now has 14 stores, not 13). Per the review checklist: "If new endpoints/components/routes/stores: was `app-surface.md` updated?"

## What Looks Good

**C1 fix (standardActionUsed gate) -- Correct and thorough.** The heavily injured penalty in `next-turn.post.ts` (line 95-96) now reads `currentCombatant.turnState?.standardActionUsed === true` before applying the penalty. This correctly implements PTU p.250: the penalty fires only when a Standard Action was actually used, not merely when a turn ends. The `standardActionUsed` flag is set in all the right places: `move.post.ts` (line 238), `breather.post.ts` (line 172), and `pass.post.ts` (line 34). The flag is reset on new round (`resetCombatantsForNewRound`, line 499) and on resolution phase entry (`resetResolvingTrainerTurnState`, line 462). Per decree-005, this approach was ruled correct.

**Decree-005 compliance -- `applyFaintStatus` extraction is clean.** The function (lines 170-186 of `combatant.service.ts`) consolidates faint logic that was previously duplicated across three endpoints. It correctly clears persistent/volatile conditions, reverses their CS effects via `reverseStatusCsEffects`, and sets `['Fainted', ...survivingConditions]`. All three faint paths (damage, heavily injured penalty, tick damage) now call this single function. The DB sync for `stageModifiers` is also correctly gated behind `faintedFromAnySource` in all three endpoints.

**H1 fix (move.post.ts metadata) -- Well-structured.** The `targetResults` array collects per-target injury/death metadata inside the target processing loop and returns it alongside the encounter response. The client-side consumption in `useEncounterActions.ts` (lines 151-166) loops through results and shows appropriate GM alerts for heavily injured penalty, death, and league suppression. The type signatures flow cleanly from server to store to composable.

**H2 fix (next-turn.post.ts penalty surfacing) -- Correct.** The `heavilyInjuredPenalty` object is returned from the server (line 433), consumed by the store's `nextTurn` action (line 290-292), and displayed in `gm/index.vue` (lines 440-460). The combatant name resolution in `gm/index.vue` handles both Pokemon (nickname/species) and human entities correctly.

**M1 fix (CombatantCard badge filtering) -- Clean.** The `displayStatusConditions` computed (lines 275-278) filters `Dead` and `Fainted` from the badge list using an immutable `.filter()`. The `v-if` and `v-for` bindings both reference the new computed. Dead has its own dedicated UI section with GM override button; Fainted is indicated by the card's opacity/grayscale styling. No duplicate badge display.

**M3 fix (XP store extraction) -- Well-executed.** The new `encounterXp.ts` (91 lines) takes `encounterId` as a parameter instead of reading from the encounter store, making it a clean, decoupled store. The callers (`SignificancePanel.vue`, `XpDistributionModal.vue`) correctly pass `encounterStore.encounter!.id`. The `encounter.ts` store dropped from 806 to 758 lines. No functionality change, just a clean separation.

**M2 fix (defeated enemy tracking) -- Good coverage in move and next-turn paths.** The `move.post.ts` tracking (lines 242-257) correctly uses immutable spread to add defeated enemies. The `next-turn.post.ts` tracking (lines 328-358) handles both heavily-injured-penalty and tick-damage defeats with a `trackDefeated` helper. Both paths save `defeatedEnemies` to DB and pass it to `buildEncounterResponse`.

**Test name correction (MEDIUM-001) -- Correct.** The test (line 144) now reads "declares death at exactly the threshold" instead of "does NOT declare death at exactly the threshold", accurately reflecting the `<=` comparison in `checkDeath`.

**Commit granularity -- Good.** Each of the 8 commits addresses exactly one issue from the review. Messages are descriptive and use conventional commit format.

## Verdict

**CHANGES_REQUIRED**

The H1-NEW issue (defeated enemy tracking gap in `damage.post.ts`) is a real correctness bug where a heavily-injured-penalty faint silently drops the defeat from XP tracking. The fix is a one-line change. The two MEDIUM issues (file size and app-surface) are straightforward.

## Required Changes

1. **H1-NEW (HIGH):** In `app/server/api/encounters/[id]/damage.post.ts`, line 116, change `damageResult.fainted` to `faintedFromAnySource` in the `isDefeated` check. The variable already exists on line 109.

2. **M1-NEW (MEDIUM):** Reduce `app/server/services/combatant.service.ts` below 800 lines. Suggested approach: extract entity builder functions (`buildPokemonEntityFromRecord`, `buildHumanEntityFromRecord`) to a new `entity-builder.service.ts`.

3. **M2-NEW (MEDIUM):** Update `.claude/skills/references/app-surface.md` to include the new `encounterXp` store in the stores list (14 stores, not 13).
