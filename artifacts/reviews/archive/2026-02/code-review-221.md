---
review_id: code-review-221
review_type: code
reviewer: senior-reviewer
trigger: re-review
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 9a2b7e2
  - 96aee22
  - 3e23317
  - 67a7d39
  - 35d69b9
files_reviewed:
  - app/tests/unit/api/league-battle-phases.test.ts
  - app/assets/scss/_variables.scss
  - app/components/encounter/DeclarationPanel.vue
  - app/components/encounter/DeclarationSummary.vue
  - app/components/gm/EncounterHeader.vue
  - app/components/gm/CombatantSides.vue
  - app/components/group/InitiativeTracker.vue
  - .claude/skills/references/app-surface.md
  - app/server/api/encounters/[id]/next-turn.post.ts
  - artifacts/tickets/open/ptu-rule/ptu-rule-107.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T13:25:00Z
follows_up: code-review-217
---

## Review Scope

Re-review of the P1 fix cycle for ptu-rule-107 (League Battle two-phase trainer system). The previous review (code-review-217) found 4 issues: 1 HIGH (no unit tests for skip functions) and 3 MEDIUM (app-surface.md gaps, hardcoded violet hex, fainted trainers in progress denominator). The developer addressed all 4 across 5 commits (9a2b7e2, 96aee22, 3e23317, 67a7d39, 35d69b9).

This is a verification pass -- confirming each issue is fully resolved with no regressions or new issues introduced.

## Decree Compliance

- **decree-021** (two-phase trainer system): Fully compliant. All P1 changes preserve the two-phase declaration/resolution flow. The skip logic correctly handles edge cases without violating the decree's mandated phase ordering. Phase labels remain accurate (Declaration Low->High, Resolution High->Low).
- **decree-006** (dynamic initiative reorder): Not modified by this fix cycle. Phase-aware reorder remains intact.
- **decree-005** (status CS auto-apply): Not affected.
- **decree-012** (type-based status immunities): Not affected.
- **decree-001** (minimum 1 damage): Not affected.

## Issue Resolution Verification

### H1: Unit tests for skipFaintedTrainers and skipUndeclaredTrainers -- RESOLVED

**Commit:** 9a2b7e2

The developer added 7 test cases across 2 new describe blocks:

1. **skipFaintedTrainers** (3 tests):
   - Single fainted trainer skipped during declaration: Advances past fainted trainer to next alive trainer. Verified correct by checking `currentTurnIndex` lands on the alive trainer at index 2.
   - Multiple consecutive fainted trainers: Both fainted trainers skipped, landing on index 3. Tests the while loop correctly advances past sequential fainted combatants.
   - All trainers fainted cascade: Uses `skipFaintedTrainers()` directly to verify the index goes past `turnOrder.length`, confirming the cascade-to-pokemon-phase path.

2. **skipUndeclaredTrainers** (4 tests):
   - Undeclared trainer skipped during resolution: Trainer with no declaration (fainted during declaration) is skipped. Tests via `simulateNextTurn` with `declarations` parameter.
   - All trainers with no declarations: Verifies index goes past end when no declarations exist.
   - Trainer WITH declaration not skipped: Confirms the function stops at index 0 when the first trainer has a declaration. This is an important correctness test -- ensures the skip only fires for missing declarations.
   - Different round declarations not matched: Declarations from round 1 are not matched when checking round 2. Tests the round-matching guard.

**Quality assessment:** The test helpers (`skipFaintedTrainers`, `skipUndeclaredTrainers`) are faithful mirrors of the production code in `next-turn.post.ts` (lines 305-343). The `createTrainerCombatant` factory was extended with a `currentHp` parameter (default 100) to support fainted-trainer test scenarios. The `simulateNextTurn` helper was updated to accept a `declarations` parameter and integrates all 5 skip call sites from the production code:
- Line 201: Skip fainted during declaration (after index advance)
- Line 205: Skip undeclared during resolution (after index advance)
- Line 220: Skip undeclared at start of resolution phase
- Line 264: Skip fainted at new round start from resolution->declaration
- Line 283: Skip fainted at new round start from pokemon->declaration

This matches the 5 call sites in `next-turn.post.ts` (lines 87, 91, 110, 163, 183). Per Senior Reviewer L1, the behavioral delta (new skip functions affecting turn progression) now has dedicated test coverage. **RESOLVED.**

### M1: app-surface.md missing new components and WebSocket events -- RESOLVED

**Commit:** 67a7d39

Two additions verified in `app-surface.md`:

1. **Components:** `DeclarationPanel.vue` and `DeclarationSummary.vue` added to the "Key encounter components" line with accurate descriptions:
   - DeclarationPanel: "GM declaration form for League Battle trainer_declaration phase -- action type select, description input, submit + next turn"
   - DeclarationSummary: "declaration list display for Group View -- collapsible round declarations with resolving/resolved state indicators"

2. **WebSocket events:** New line added at line 68: "GM WebSocket events (League Battle): `trainer_declared` (GM broadcasts to encounter room after a trainer records a declaration), `declaration_update` (GM broadcasts updated declarations array to encounter room for Group View sync)."

Both additions are accurate and provide sufficient context for future auditors and skills. **RESOLVED.**

### M2: Hardcoded violet colors replaced with SCSS variables -- RESOLVED

**Commit:** 96aee22

Verified via search: zero remaining instances of `#7c3aed` or `#a78bfa` in:
- `app/components/encounter/DeclarationPanel.vue` -- 0 matches (was 8+ instances)
- `app/components/encounter/DeclarationSummary.vue` -- 0 matches (was 5+ instances)
- `app/components/gm/EncounterHeader.vue` -- 0 matches (was 2 instances)
- `app/components/gm/CombatantSides.vue` -- 0 matches (was 1 instance)

All replaced with `$color-accent-violet` and `$color-accent-violet-light`. The new SCSS variable `$color-accent-violet-light: #a78bfa` was added to `_variables.scss` (line 22), positioned correctly next to the existing `$color-accent-violet` with a descriptive comment "(declaration UI)".

Note: `InitiativeTracker.vue` was checked and has 0 instances of either hex value -- it was not part of the M2 fix because it did not use those colors. **RESOLVED.**

### M3: Declaration progress counter denominator fixed -- RESOLVED

**Commit:** 3e23317

The `declarationProgress` computed in `DeclarationPanel.vue` (line 76-81) now filters fainted trainers:

```typescript
const declarationProgress = computed(() => {
  const trainers = encounterStore.trainersByTurnOrder
  const aliveTrainers = trainers.filter(t => (t.entity as { currentHp: number }).currentHp > 0)
  const declared = encounterStore.currentDeclarations.length
  return `${declared + 1} of ${aliveTrainers.length}`
})
```

The denominator now uses `aliveTrainers.length` instead of `trainers.length`. The numerator (`declared + 1`) remains correct because fainted trainers never submit declarations (they are auto-skipped by `skipFaintedTrainers`), so `encounterStore.currentDeclarations.length` only counts alive trainers who have declared.

The type assertion `(t.entity as { currentHp: number })` is consistent with the pattern used elsewhere in this component (line 67: `(c.entity as { name: string }).name`). **RESOLVED.**

## What Looks Good

1. **Commit granularity.** Each of the 5 commits addresses exactly one issue from code-review-217, plus one documentation commit for the ticket resolution log. Clean, reviewable, and traceable.

2. **Test helper fidelity.** The `simulateNextTurn` function in the test file now faithfully mirrors all branching paths in the production `next-turn.post.ts` for league battle mode, including the 5 skip call sites. The weather decrement is correctly omitted as it's a separate concern from phase transitions.

3. **SCSS variable placement.** The new `$color-accent-violet-light` variable is placed in the Accent Colors section of `_variables.scss`, directly below `$color-accent-violet`, making the relationship clear. The comment "(declaration UI)" provides provenance without being overly verbose.

4. **Ticket resolution log.** Commit 35d69b9 updates `ptu-rule-107.md` with a detailed P1 fix cycle section documenting each commit, which files were changed, and which issue was addressed. This aids future auditors.

5. **No regressions in existing code.** The SCSS variable replacement is a pure find-and-replace with no behavioral change. The progress counter fix is a single computed property change. The test additions are purely additive. No existing tests were modified in ways that could mask regressions.

## Verdict

**APPROVED**

All 4 issues from code-review-217 are fully resolved. The HIGH-1 skip function tests cover the critical edge cases (single skip, multi-skip, all-fainted cascade, undeclared skip, round boundary, different-round guard). The MEDIUM issues are straightforward fixes verified by file-level search. No new issues introduced. No decree violations. The P1 implementation of ptu-rule-107 is complete.

## Required Changes

None.
