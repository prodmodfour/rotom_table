---
review_id: code-review-120b
target: ptu-rule-045 P1 follow-up
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
commits: a0b1466, f163732
---

# Code Review: P1 Equipment Combat Integration Follow-up Fixes

## Scope

Two targeted fixes addressing HIGH issues H1 and H2 from code-review-120.

## H1: Mutation of input entity in `buildCombatantFromEntity()` (commit a0b1466)

### File: `app/server/services/combatant.service.ts`

**Before (mutating):**
```typescript
if (equipmentSpeedDefaultCS !== 0) {
  const currentStages = entity.stageModifiers ?? createDefaultStageModifiers()
  entity.stageModifiers = { ...currentStages, speed: equipmentSpeedDefaultCS }
}
// ...
return { /* ... */ entity }
```

**After (immutable):**
```typescript
const combatantEntity = equipmentSpeedDefaultCS !== 0
  ? {
      ...entity,
      stageModifiers: {
        ...(entity.stageModifiers ?? createDefaultStageModifiers()),
        speed: equipmentSpeedDefaultCS
      }
    }
  : entity
// ...
return { /* ... */ entity: combatantEntity }
```

### Assessment

| Criterion | Pass | Notes |
|-----------|:----:|-------|
| Immutability violation resolved | YES | Input `entity` parameter is never written to. Copy created via spread. |
| Shallow copy sufficient | YES | `StageModifiers` is a flat interface (7 number fields, no nested objects). Shallow spread covers all properties. |
| Entity spread safe for `Pokemon \| HumanCharacter` | YES | Both types are plain data objects from Prisma/JSON deserialization. No prototype chain, getters, or methods to lose. |
| Speed default CS correctly set | YES | `combatantEntity.stageModifiers.speed` receives `equipmentSpeedDefaultCS` (e.g., -1 for Heavy Armor). Other stage fields preserved via spread. |
| Non-armor path unchanged | YES | When `equipmentSpeedDefaultCS === 0`, `combatantEntity` is the original `entity` reference (no unnecessary copy). |
| No caller regression risk | YES | Verified all 3 call sites (`combatants.post.ts:64`, `from-scene.post.ts:106`, `pokemon-generator.service.ts:334`). None access the original entity reference after the call -- they use only the returned combatant. |

The fix is idiomatic. Using a ternary expression to conditionally produce a copy is cleaner than the `let entityForCombatant = entity` reassignment pattern suggested in code-review-120. The developer chose a slightly more concise approach that avoids the intermediate `let` binding entirely. Both approaches are correct; this one is arguably better because it uses `const` throughout.

**Verdict: Resolved.**

## H2: `let` to `const` for `targetEquipBonuses` (commit f163732)

### File: `app/server/api/encounters/[id]/calculate-damage.post.ts`

**Before:** `let targetEquipBonuses = ...`
**After:** `const targetEquipBonuses = ...`

### Assessment

| Criterion | Pass | Notes |
|-----------|:----:|-------|
| Variable never reassigned | YES | Assigned once at declaration (line 176), only read thereafter (lines 179, 180, 183). |
| Semantic accuracy improved | YES | `const` correctly signals single-assignment intent to readers. |
| No behavioral change | YES | `const` vs `let` has no runtime impact when the binding is never reassigned. |

**Verdict: Resolved.**

## Potential Observations (Not Blocking)

1. **No unit test for the immutability fix.** There are no unit tests for `buildCombatantFromEntity()` that would catch a regression if someone re-introduces mutation. A test asserting that the input entity is unchanged after the call would be valuable. This is a pre-existing gap (no unit tests existed before either), not a regression from this fix.

2. **The `let` declarations for `equipmentEvasionBonus` and `equipmentSpeedDefaultCS` on lines 571-572 are correct.** They are initialized to 0 and conditionally reassigned inside an `if` block. These are legitimate uses of `let`.

## Summary

Both fixes are correct, minimal, and introduce no regressions. The immutability fix uses an appropriate shallow-copy pattern for the flat `StageModifiers` type. The `const` fix is trivially correct. No behavioral changes, no new code paths, no side effects.

Both HIGH issues from code-review-120 are resolved. The three MEDIUM issues (M1, M2, M3) were explicitly scoped out of this follow-up and remain open for separate handling.
