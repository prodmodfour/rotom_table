---
review_id: code-review-120
ticket_id: ptu-rule-045
design_spec: designs/design-equipment-001.md
tier: P1
reviewer: senior-reviewer
status: APPROVED_WITH_ISSUES
date: 2026-02-20
commits_reviewed:
  - 61203a8  # feat: auto-apply equipment DR, evasion, and Focus bonuses in damage calc
  - 978f529  # feat: equipment bonuses in combatant builder (evasion, initiative, speed CS)
  - 6027e57  # feat: Take a Breather respects Heavy Armor speed default CS
  - 8f79acb  # feat: equipment bonuses in client-side move calculation composable
  - 6067a61  # docs: update design spec and ticket
---

# Code Review: P1 Equipment Combat Integration (ptu-rule-045)

## Status Table

| Feature | Design Spec | Implemented | Correct | Notes |
|---------|:-----------:|:-----------:|:-------:|-------|
| E: DR from Armor (server) | YES | YES | YES | Auto-reads equipment DR, helmet crit DR, caller override preserved |
| E: DR from Armor (client) | YES | YES | YES | Client-side DR in `targetDamageCalcs` |
| F: Evasion from Shields (server) | YES | YES | YES | Added to `calculate-damage.post.ts` evasion calc |
| F: Evasion from Shields (client) | YES | YES | YES | Added to `getTargetEvasion` and `getTargetEvasionLabel` |
| F: Evasion in combatant builder | YES | YES | YES | Initial evasion includes shield bonus |
| G: Focus stat bonus (server) | YES | YES | YES | `applyStageModifierWithBonus()` helper, `attackBonus`/`defenseBonus` in `DamageCalcInput` |
| G: Focus stat bonus (client) | YES | YES | YES | Applied to `attackStatValue` and `targetDamageCalcs` |
| H: Heavy Armor speed CS (builder) | YES | YES | ISSUE | Mutation on input entity |
| H: Heavy Armor speed CS (breather) | YES | YES | YES | Resets to equipment default, not 0 |

## Issues

### CRITICAL

None.

### HIGH

#### H1: Mutation of input entity in `buildCombatantFromEntity()` (`combatant.service.ts:587-590`)

The function mutates the `entity` parameter directly:

```typescript
// combatant.service.ts:587-590
if (equipmentSpeedDefaultCS !== 0) {
  const currentStages = entity.stageModifiers ?? createDefaultStageModifiers()
  entity.stageModifiers = { ...currentStages, speed: equipmentSpeedDefaultCS }
}
```

This violates the project's immutability rules. The `entity` object is passed in by the caller and mutating it creates a hidden side effect. The caller's reference to the entity is silently modified before the function returns the combatant wrapper. Since `entity` is then embedded in the returned `Combatant` object, the mutation happens to "work" in practice (the same object ends up inside the combatant), but it is still a side-effect on an input parameter.

**Fix:** Create a shallow copy of the entity and set stage modifiers on the copy. Pass the copy into the returned combatant:

```typescript
// Create entity copy to avoid mutating input
let entityForCombatant = entity
if (equipmentSpeedDefaultCS !== 0) {
  const currentStages = entity.stageModifiers ?? createDefaultStageModifiers()
  entityForCombatant = {
    ...entity,
    stageModifiers: { ...currentStages, speed: equipmentSpeedDefaultCS }
  }
}

return {
  // ...
  entity: entityForCombatant
}
```

#### H2: `let` where `const` suffices for `targetEquipBonuses` (`calculate-damage.post.ts:176`)

```typescript
let targetEquipBonuses = target.type === 'human'
  ? computeEquipmentBonuses((target.entity as HumanCharacter).equipment ?? {})
  : null
```

This is assigned once and never reassigned. Should be `const`. Using `let` signals to readers that the value may change later, which is misleading.

**Fix:** Change `let` to `const`.

### MEDIUM

#### M1: Server-side helmet DR only applied when no caller-provided DR override (`calculate-damage.post.ts:179-188`)

When `body.damageReduction` is provided (GM manual override), the server completely bypasses helmet conditional DR. This means if a GM manually sets DR to 5 (e.g., for some custom scenario), a critical hit will NOT get the +15 helmet DR. This is arguably the wrong behavior: helmet DR on crits is a separate, conditional bonus that should stack even when the GM manually adjusts base DR.

On the client side (`useMoveCalculation.ts:432-445`), equipment DR (including helmet) is always computed regardless of any override, because the client has no "override" concept. This creates a server/client parity gap for the edge case where a GM manually passes `damageReduction` to the server endpoint.

The current behavior is documented and deliberate per the design spec ("Caller-provided DR overrides equipment DR"), but the design does not distinguish between "replace base armor DR" and "replace all equipment DR including conditional." Filing as MEDIUM because it is an edge case that only matters when the GM uses the raw API with a manual DR override during a critical hit against a helmeted target.

**Fix (ticket-worthy):** When `body.damageReduction` is provided, still check for conditional DR from equipment and add it:

```typescript
let effectiveDR = body.damageReduction ?? 0
if (body.damageReduction === undefined && targetEquipBonuses) {
  effectiveDR = targetEquipBonuses.damageReduction
}
// Always apply conditional DR regardless of override
if (body.isCritical && targetEquipBonuses) {
  for (const cdr of targetEquipBonuses.conditionalDR) {
    if (cdr.condition === 'Critical Hits only') {
      effectiveDR += cdr.amount
    }
  }
}
```

#### M2: Redundant `computeEquipmentBonuses()` calls in `useMoveCalculation.ts`

Equipment bonuses are computed independently in four separate locations within the same composable:
1. `getTargetEvasion()` (line 204) -- per target, called reactively
2. `getTargetEvasionLabel()` (line 245) -- per target, called reactively
3. `attackStatValue` computed (line 350) -- per actor, reactive
4. `targetDamageCalcs` computed (line 434) -- per target, in a loop

For a human target, `computeEquipmentBonuses()` is called up to 3 times for the same target's equipment during a single render cycle (evasion, evasion label, damage calc). While the function is pure and cheap, this is still unnecessary redundancy.

**Fix:** Extract a computed or cached helper that returns equipment bonuses per combatant, so each combatant's bonuses are computed once per reactive cycle rather than recomputed in each function.

#### M3: `effectiveDR` can be `undefined | number` but is added to with `+=` (`calculate-damage.post.ts:185`)

```typescript
let effectiveDR = body.damageReduction  // possibly undefined
// ...
if (effectiveDR === undefined && targetEquipBonuses) {
  effectiveDR = targetEquipBonuses.damageReduction
  if (body.isCritical) {
    for (const cdr of targetEquipBonuses.conditionalDR) {
      if (cdr.condition === 'Critical Hits only') {
        effectiveDR += cdr.amount  // safe here because we just assigned a number
      }
    }
  }
}
```

The `+=` on line 185 is technically safe because `effectiveDR` was just assigned a number on line 180. However, TypeScript infers the type as `number | undefined` from the initial assignment, which means the `+=` relies on control-flow narrowing within the `if` block. This works correctly but is fragile -- a future refactor that moves the `+=` outside the `if` would silently produce `NaN`. Initializing to a clear type would make intent obvious.

**Fix:** Initialize as `let effectiveDR: number | undefined = body.damageReduction` to make the type explicit, or restructure to avoid the `undefined` path entirely.

## What Looks Good

1. **Clean separation of concerns.** The `applyStageModifierWithBonus()` helper in `damageCalculation.ts` is a well-designed pure function that composes with the existing `applyStageModifier()`. Adding `attackBonus`/`defenseBonus` to `DamageCalcInput` keeps the damage formula extensible without changing its core logic.

2. **Correct PTU rules interpretation.** Focus bonuses are applied AFTER combat stage multipliers (PTU p.295), not before. The implementation correctly uses `applyStageModifier(baseStat, stage) + postStageBonus` rather than `applyStageModifier(baseStat + postStageBonus, stage)`. This distinction matters at non-zero combat stages.

3. **Caller-provided DR override preserved.** The server endpoint correctly uses `body.damageReduction ?? equipmentDR` rather than always using equipment DR, preserving the GM's ability to manually override for special scenarios.

4. **Consistent server/client parity.** All four P1 features (DR, evasion, Focus, speed CS) are implemented on both server (`calculate-damage.post.ts`, `combatant.service.ts`, `breather.post.ts`) and client (`useMoveCalculation.ts`). The logic paths match.

5. **Breather stage reset is correct.** The `hadStages` check was updated to compare against the equipment-adjusted defaults rather than all-zeros. This prevents false "stages reset" messages for a Heavy Armor wearer whose speed CS is already at -1.

6. **Pokemon combatants are correctly excluded.** All equipment checks are gated by `type === 'human'` or `entityType === 'human'`, so Pokemon (which have no equipment system) are never affected.

7. **Good commit granularity.** Five commits for four features, each focused on a specific integration point. The commits are well-scoped and have clear, descriptive messages.

8. **Design spec accurately updated.** The implementation log in the design spec matches the actual commits and correctly describes what each commit does.

## Recommended Next Steps

1. **Fix H1 (mutation).** Replace the entity mutation in `buildCombatantFromEntity()` with an immutable pattern. This is a correctness concern that could cause subtle bugs if the entity reference is used after calling the builder.

2. **Fix H2 (`let` to `const`).** Trivial one-line fix.

3. **File a ticket for M1 (helmet DR with manual override).** The current behavior is defensible but creates a subtle parity gap. A separate ticket can address it without blocking P1 completion.

4. **Consider M2 for future refactoring.** Not urgent, but the redundant `computeEquipmentBonuses()` calls will become more noticeable if equipment grows more complex.
