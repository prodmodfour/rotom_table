---
review_id: code-review-121b
target: ptu-rule-056 P1 follow-up
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
commits: f29b845, c95a237, f8d7854, 68e33d7
---

# Code Review 121b: P1 Follow-Up Fixes for Character Creation

## Scope

Targeted fixes for 2 HIGH + 2 MEDIUM issues identified in code-review-121:

| ID | Severity | Issue | Commit |
|---|---|---|---|
| H1 | HIGH | Removing a Skill Edge didn't revert skill rank | `f29b845` |
| H2 | HIGH | Skill background validation false positives with Skill Edges | `c95a237` |
| M1 | MEDIUM | Dead `skillEdgeError` ref | `f8d7854` |
| M4 | MEDIUM | Hardcoded stat constants in validation | `68e33d7` |

## Verdict: APPROVED

All four fixes are correct, minimal, and directly address the issues raised. No regressions introduced. Two low-priority observations noted below for future consideration.

---

## H1 Fix Analysis: Skill Edge Removal Reverts Rank (`f29b845`)

**File:** `app/composables/useCharacterCreation.ts` lines 185-202

The fix adds rank reversion logic to `removeEdge()` before the filter step:

```typescript
const skillEdgeMatch = edge?.match(/^Skill Edge: (.+)$/)
if (skillEdgeMatch) {
  const skill = skillEdgeMatch[1] as PtuSkillName
  const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
  const currentIndex = rankProgression.indexOf(form.skills[skill])
  if (currentIndex > 0) {
    form.skills = { ...form.skills, [skill]: rankProgression[currentIndex - 1] }
  }
}
```

**Correctness check:**

1. **Pattern parsing:** `^Skill Edge: (.+)$` matches the exact format produced by `addSkillEdge()` at line 233 (`Skill Edge: ${skill}`). The capture group extracts the skill name. Correct.

2. **Rank progression array:** `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` matches the `SkillRank` type definition exactly (`types/character.ts` line 18) and matches the same array used in `addSkillEdge()` at line 216. Correct.

3. **Decrement logic:** `currentIndex > 0` guard prevents underflow -- if a skill is already at Pathetic (index 0), it stays at Pathetic. This handles the edge case where a skill was somehow at the lowest rank. Correct.

4. **Immutability:** Uses spread operator `{ ...form.skills, [skill]: ... }`. Correct.

5. **Ordering:** Rank is reverted *before* `form.edges.filter()` removes the edge string. This is important because the rank needs to be adjusted while the edge still exists in the array. Correct.

6. **Optional chaining:** `edge?.match()` guards against an undefined edge (if index is out of bounds). Correct defensive coding.

**Edge case analysis:**

- **Normal case (Untrained -> Novice via addSkillEdge, then remove):** Novice (index 2) -> Untrained (index 1). Correct.
- **Adept background skill with Skill Edge (Adept -> Expert, then remove):** Expert (index 4) -> Adept (index 3). Correct.
- **Pathetic rank (should never happen since addSkillEdge blocks Pathetic):** Index 0, guard `> 0` prevents decrement. Correct.
- **Unrecognized skill name:** `indexOf` returns -1, guard `> 0` prevents any mutation. Safe.
- **Non-Skill Edge string:** Regex doesn't match, entire block is skipped. Correct.

**Pass.**

---

## H2 Fix Analysis: Validation Message Clarification (`c95a237`)

**Files:**
- `app/composables/useCharacterCreation.ts` line 243
- `app/utils/characterCreationValidation.ts` lines 62-96

The fix implements Option B from code-review-121 (lowest-risk approach):

1. **New parameter:** `edges: string[] = []` added to `validateSkillBackground()`. Default empty array ensures backward compatibility. Correct.

2. **Skill Edge detection:** `edges.some(e => e.startsWith('Skill Edge:'))` -- uses `startsWith` rather than exact regex, which is fine since all Skill Edge strings are formatted as `Skill Edge: X`. Consistent with the EdgeSelectionSection template (line 80) which uses the same `startsWith` check.

3. **Severity downgrade:** When Skill Edges are present, severity changes from `'warning'` to `'info'`. This correctly signals to the GM that the count difference is expected rather than problematic.

4. **Message suffix:** `', including Skill Edge modifications'` appended to the count. Example output: "Background should set exactly 1 skill to Novice (found 2, including Skill Edge modifications)". This clearly explains *why* the count differs.

5. **Composable wiring:** `validateSkillBackground(form.skills, form.level, form.edges)` now passes the edges array. Correct.

**One observation:** The suffix only appears when *any* Skill Edge exists, even if the count difference is not caused by that specific rank category. For example, if the user has a Skill Edge that raises Untrained -> Novice, the Pathetic count warning would also show "including Skill Edge modifications" even though Skill Edges don't affect Pathetic counts. This is a cosmetic imprecision -- the message is still technically accurate (the validation is operating on a skill set that includes Skill Edge modifications), and separating per-rank causality would be significantly more complex for minimal UX benefit. Acceptable for P1.

**Pass.**

---

## M1 Fix Analysis: Dead Code Removal (`f8d7854`)

**File:** `app/components/create/EdgeSelectionSection.vue`

Removed three artifacts:

1. **Ref declaration:** `const skillEdgeError = ref('')` -- removed.
2. **Template conditional:** `<div v-if="skillEdgeError" ...>{{ skillEdgeError }}</div>` -- removed.
3. **SCSS block:** `&__error { ... }` (10 lines of error styling) -- removed.
4. **Clearing line:** `skillEdgeError.value = ''` in `onAddSkillEdge()` -- removed.

**Completeness check:** Searched the entire `app/` directory for remaining `skillEdgeError` references -- found only in review artifacts and ticket documentation, zero in application code. Complete removal confirmed.

**Pass.**

---

## M4 Fix Analysis: Shared Constants Import (`68e33d7`)

**File:** `app/utils/characterCreationValidation.ts` lines 1-8, 30-45

1. **Import:** `import { TOTAL_STAT_POINTS, MAX_POINTS_PER_STAT } from '~/constants/trainerStats'` -- correct path, correct named exports.

2. **Usage in validation logic:**
   - `total !== TOTAL_STAT_POINTS` replaces `total !== 10` (line 30)
   - `points > MAX_POINTS_PER_STAT` replaces `points > 5` (line 39)

3. **Message templates:** Also updated to use the constants in the message strings (`${TOTAL_STAT_POINTS}` and `${MAX_POINTS_PER_STAT}`). This means if constants change, both the validation logic and the user-facing messages stay in sync. Good attention to detail.

4. **Constants file:** `trainerStats.ts` exports `TOTAL_STAT_POINTS = 10` and `MAX_POINTS_PER_STAT = 5`. These are the same values that were hardcoded. No behavioral change.

**Pass.**

---

## Cross-Cutting Checks

### Regression Risk

- **addEdge flow:** Unchanged. Regular edges are added via `addEdge()` (line 181), which just appends to the array. No interaction with the new rank reversion code.
- **addSkillEdge flow:** Unchanged. The regex pattern in `removeEdge` matches the exact format produced by `addSkillEdge` line 233. The rank progression arrays are identical in both functions.
- **Validation wiring:** `skillWarnings` computed property now passes `form.edges` -- this is a reactive dependency, so warnings will automatically recompute when edges change. Correct.
- **Parent page:** `create.vue` is unchanged. `handleSkillEdge` still calls `creation.addSkillEdge(skill)` and uses `alert()` for errors. The `@remove-edge="creation.removeEdge"` binding at line 88 passes the index directly -- the composable's `removeEdge(index)` now handles both regular and Skill Edge removal transparently.

### Immutability

All mutations in the new code use immutable patterns:
- `form.skills = { ...form.skills, [skill]: ... }` (line 195-198)
- `form.edges = form.edges.filter(...)` (line 202)

No direct property mutation detected.

### Code Quality

- Functions remain under 50 lines
- No console.log statements
- No hardcoded values (the final M4 commit eliminated the last ones)
- Clear comments on the regex intent

---

## Low-Priority Observations (Not Blocking)

### O1. Duplicated `rankProgression` array

The `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` array is now defined three times:
1. `removeEdge()` line 192
2. `addSkillEdge()` line 216
3. `SKILL_RANKS` in `constants/trainerSkills.ts` (same order, but as objects with `rank`, `value`, `dice` fields)

Consider extracting a simple `RANK_PROGRESSION: SkillRank[]` constant from `trainerSkills.ts` (derived from `SKILL_RANKS.map(r => r.rank)`) and importing it in both places. This is purely a DRY improvement -- the current code is correct.

### O2. No unit tests for rank reversion

The `removeEdge` skill rank reversion and the `validateSkillBackground` edge-aware logic are pure functional patterns that would benefit from unit tests. A few test cases covering the normal flow (add edge -> remove edge -> rank returns to original), the Pathetic guard, and the validation severity toggle would provide regression safety. This aligns with the existing ticket for test coverage.

---

## Summary

| Issue | Status | Notes |
|---|---|---|
| H1 | Fixed | Rank reversion logic correct, edge cases handled, immutable |
| H2 | Fixed | Option B implemented cleanly, severity + message both updated |
| M1 | Fixed | All dead code removed, no orphaned references |
| M4 | Fixed | Constants imported, messages also use constants |

All four issues from code-review-121 are resolved. The implementation matches the suggested fixes closely, with appropriate defensive coding (optional chaining, index bounds guard). No regressions detected in the add/remove edge flow or validation pipeline.
