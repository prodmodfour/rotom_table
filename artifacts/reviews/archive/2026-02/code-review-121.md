---
review_id: code-review-121
ticket_id: ptu-rule-056
design_spec: design-char-creation-001
tier: P1
scope: Class/Feature/Edge selection, composable extensions, shared constants
reviewer: senior-reviewer
verdict: PASS_WITH_ISSUES
date: 2026-02-20
---

# Code Review 121: P1 Character Creation -- Class/Feature/Edge Selection

## Commits Reviewed

1. `1ed7df6` -- refactor: extract stat constants to shared trainerStats.ts and fix applyBackground immutability
2. `68d4c2e` -- feat: add PTU trainer class constants with categories and descriptions
3. `9be9663` -- feat: add class, feature, and edge state management to useCharacterCreation
4. `295d4dd` -- feat: add ClassFeatureSection component for character creation
5. `a2c638a` -- feat: add EdgeSelectionSection component for character creation
6. `4a0eb0c` -- feat: integrate class, feature, and edge sections into create page
7. `b340aeb` -- docs: update design spec and ticket status for P1 completion

## Files Reviewed

| File | Lines | Status |
|---|---|---|
| `app/constants/trainerStats.ts` | 20 | New |
| `app/constants/trainerClasses.ts` | 101 | New |
| `app/composables/useCharacterCreation.ts` | 303 | Modified |
| `app/components/create/ClassFeatureSection.vue` | 538 | New |
| `app/components/create/EdgeSelectionSection.vue` | 398 | New |
| `app/components/create/StatAllocationSection.vue` | 321 | Modified |
| `app/utils/characterCreationValidation.ts` | 130 | Unchanged |
| `app/pages/gm/create.vue` | 536 | Modified |

All files are within the 800-line limit. Largest is ClassFeatureSection.vue at 538 lines (268 template+script, 270 SCSS) -- acceptable given the template complexity of grouped class picker, branching prompt, and feature input.

## Verdict: PASS WITH ISSUES

The P1 implementation is solid. Architecture is clean: composable holds state, components are prop/emit driven, constants are pure data, validation is wired correctly. The code-review-118 feedback (shared constants, immutability fix) has been addressed. Two issues require fixes before merging; one requires a ticket.

---

## CRITICAL Issues

None.

## HIGH Issues

### H1. Removing a Skill Edge does not revert the skill rank

**File:** `app/composables/useCharacterCreation.ts` lines 185-187
**File:** `app/components/create/EdgeSelectionSection.vue` line 88

When the user clicks the X button on a Skill Edge tag, `removeEdge(index)` is called, which only removes the string from `form.edges`. It does NOT revert the skill rank that `addSkillEdge()` bumped up.

Example scenario:
1. User has background with Athletics at Untrained
2. User clicks "Add Skill Edge" for Athletics -- Athletics becomes Novice, edge "Skill Edge: Athletics" is added
3. User clicks the X on "Skill Edge: Athletics" -- edge string is removed, but Athletics remains Novice
4. Skill grid and validation now show 2 Novice skills, confusing the GM

This is a data integrity issue. The inverse operation must match the forward operation.

**Fix:** Add a `removeSkillEdge` function that parses the skill name from the edge string, decrements the skill rank by one step, and then removes the edge. Wire the component to distinguish Skill Edge removals from regular edge removals.

```typescript
function removeSkillEdge(index: number): void {
  const edge = form.edges[index]
  const match = edge.match(/^Skill Edge: (.+)$/)
  if (match) {
    const skill = match[1] as PtuSkillName
    const rankProgression: SkillRank[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']
    const currentIndex = rankProgression.indexOf(form.skills[skill])
    if (currentIndex > 0) {
      form.skills = {
        ...form.skills,
        [skill]: rankProgression[currentIndex - 1]
      }
    }
  }
  form.edges = form.edges.filter((_, i) => i !== index)
}
```

### H2. Skill background validation false positives when Skill Edges modify ranks

**File:** `app/utils/characterCreationValidation.ts` lines 56-89

`validateSkillBackground()` counts current skill ranks and warns if there is not exactly 1 Adept, 1 Novice, 3 Pathetic. However, when the user adds Skill Edges, skill ranks change (e.g., Untrained -> Novice), causing the Novice count to become 2. This triggers a false warning: "Background should set exactly 1 skill to Novice (found 2)."

Since the validation operates on `form.skills` (which includes Skill Edge modifications), it cannot distinguish background-set ranks from Skill Edge-set ranks.

**Fix options (pick one):**
- A) Track background skills separately from Skill Edge modifications, validate only the background baseline.
- B) Accept the false positive as intentional (the validator reports the current state, and the GM sees it as informational). If choosing this option, update the warning message to clarify: "Background allocations: expected 1 Adept, 1 Novice, 3 Pathetic. Current state includes Skill Edge modifications."
- C) Skip skill background validation when edges contain any "Skill Edge:" entries.

Option B is the lowest-risk approach for P1. Option A is the most correct long-term.

---

## MEDIUM Issues

### M1. `skillEdgeError` ref in EdgeSelectionSection is declared but never written to

**File:** `app/components/create/EdgeSelectionSection.vue` lines 130, 75-77

The `skillEdgeError` ref is declared at line 130 and rendered in the template at lines 75-77, but the `onAddSkillEdge` method (line 171-177) clears it and then emits the event to the parent. The parent's `handleSkillEdge` calls `alert(error)` if there is an error, but never communicates the error back to the component. So `skillEdgeError` is always `''` and the error div never appears.

This is dead code. Either:
- Remove `skillEdgeError` and the error div entirely (the parent alert is sufficient for now), OR
- Change the pattern to have the parent set a reactive error string that is passed as a prop.

The current state is not a bug (the alert works), but dead code is confusing for future maintainers.

### M2. Duplicate CSS class definitions across components

**Files:**
- `.counter` defined in both `ClassFeatureSection.vue` (line 335) and `EdgeSelectionSection.vue` (line 220)
- `.selected-tags` defined in both `ClassFeatureSection.vue` (line 477) and `EdgeSelectionSection.vue` (line 338)
- `.tag` defined in both `ClassFeatureSection.vue` (line 484) and `EdgeSelectionSection.vue` (line 345)
- `.warning-item` defined in `ClassFeatureSection.vue` (line 521), `EdgeSelectionSection.vue` (line 381), `StatAllocationSection.vue` (line 304), and `SkillBackgroundSection.vue` (line 481)

All these are scoped styles, so they do not conflict at runtime. However, 4 identical copies of `.warning-item` is significant duplication. Consider extracting shared tag/warning styles into a partial SCSS file (e.g., `_creation-shared.scss`) or into the global SCSS layer.

This is not blocking -- scoped styles ensure correctness -- but it adds maintenance burden if the styling changes.

### M3. Validation hardcodes `level === 1` without accounting for higher-level character creation

**Files:** `app/utils/characterCreationValidation.ts` lines 28, 37, 107, 114
**File:** `app/composables/useCharacterCreation.ts` line 209

All validation only fires when `level === 1`. If a GM creates a level 10 character, they get zero validation warnings for stats, edges, or features. This is by design for P1 (soft warnings, GM override), but it means:
- A level 5 character could have 0 stat points allocated with no warning
- A level 10 character could have 0 edges with no warning

This is acceptable for the current "soft validation" approach, but worth a ticket for P2 to add level-scaled warnings (e.g., "Level 10 characters typically have X edges by this level").

### M4. `validateStatAllocation` and composable use different magic numbers

**File:** `app/utils/characterCreationValidation.ts` lines 28, 37 -- hardcodes `10` and `5`
**File:** `app/constants/trainerStats.ts` lines 16, 19 -- exports `TOTAL_STAT_POINTS = 10` and `MAX_POINTS_PER_STAT = 5`

The validation utility hardcodes `10` and `5` instead of importing the shared constants from `trainerStats.ts`. This means if the constants are ever updated, the validation would be out of sync.

**Fix:** Import and use `TOTAL_STAT_POINTS` and `MAX_POINTS_PER_STAT` in `characterCreationValidation.ts`.

---

## Positive Observations

1. **Immutability patterns are correct throughout.** All form state mutations use spread operators: `form.statPoints = { ...form.statPoints, [stat]: ... }`, `form.edges = [...form.edges, edgeName]`, `form.trainerClasses = form.trainerClasses.filter(...)`. The `applyBackground` fix from code-review-118 was applied cleanly.

2. **Constants file is well-structured.** `trainerClasses.ts` separates the type, category list, max constant, data array, and utility function. The `getClassesByCategory()` helper uses pure functional approach. 39 classes across 6 categories matches PTU Core Chapter 4.

3. **Branching class specialization is a nice UX touch.** The prompt-before-add pattern with contextual placeholders ("e.g., Fire, Water, Dragon..." for Type Ace) is well-implemented. The `isClassSelected` check correctly matches both base name and `ClassName: Spec` format.

4. **Clean prop/emit boundaries.** Components receive data as props and emit actions -- no direct store access from child components. The composable is the single source of truth. The parent page (`create.vue`) wires everything together via explicit bindings.

5. **Skill Edge validation in the composable is PTU-correct.** Cannot raise Pathetic skills (PTU p. 14), cannot exceed Novice at level 1 (PTU p. 13), Master rank ceiling check. The `addSkillEdge` return-string pattern cleanly communicates errors to the parent.

6. **File sizes are appropriate.** Composable at 303 lines, components between 321-538 lines. No file approaches the 800-line limit.

7. **Section ordering is thoughtful.** Background/Skills -> Edges -> Classes/Features -> Stats. This lets the GM see Skill Edge effects in the skill grid before picking class features, which is the natural PTU creation flow.

---

## Required Fixes Before Merge

| ID | Severity | Description | Effort |
|---|---|---|---|
| H1 | HIGH | Skill Edge removal must revert skill rank | Small |
| H2 | HIGH | Skill background validation false positives from Skill Edges | Small (option B) |
| M4 | MEDIUM | Validation hardcodes magic numbers instead of importing constants | Trivial |

## Tickets to File

| Issue | Suggested Ticket |
|---|---|
| M1 | Clean up dead `skillEdgeError` code in EdgeSelectionSection (can bundle with H1 fix) |
| M2 | Extract shared creation component SCSS into partial (low priority, maintenance quality) |
| M3 | Add level-scaled validation warnings for non-level-1 character creation (P2 scope) |
