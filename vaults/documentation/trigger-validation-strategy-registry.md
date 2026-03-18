# Trigger Validation Strategy Registry

A potential [[strategy-pattern]] to address the [[trigger-validation-switch-chains|switch/if-chains in validation code]].

## The idea

For each switch/if-chain that dispatches on a type discriminant, create a registry mapping type to handler:

**AoO triggers:**
```
const TRIGGER_VALIDATORS: Record<TriggerType, (combatant, trigger) => boolean> = {
  movement: validateMovementTrigger,
  rangedAttack: validateRangedAttackTrigger,
  // ...
}
```

**Evolution triggers:**
```
const TRIGGER_CHECKS: Array<{ field: keyof EvolutionTrigger; check: (pokemon, value) => boolean }> = [
  { field: 'minimumLevel', check: (p, v) => p.level >= v },
  { field: 'requiredGender', check: (p, v) => p.gender === v },
  // ...
]
```

**AoE shapes:**
```
const SHAPE_CALCULATORS: Record<AoEType, (origin, size, direction?) => Cell[]> = {
  burst: getBurstCells,
  cone: getConeCells,
  // ...
}
```

## Principles improved

- [[open-closed-principle]] — new variants added by registration, not modification
- [[switch-statements-smell]] — eliminated
- [[replace-conditional-with-polymorphism]] — runtime dispatch replaces static branching

## Trade-offs

- The three chains have 3-6 cases each. At this scale, a switch statement is arguably clearer and more debuggable than a registry lookup. The [[strategy-pattern]] shines at 10+ variants; at 3-5, it may be over-engineering.
- Registry entries are harder to navigate with IDE "go to definition" than explicit case branches.
- TypeScript's exhaustiveness checking works naturally with switch/case on discriminated unions. A registry-based approach needs explicit validation that all types are registered (e.g., `satisfies Record<TriggerType, ...>`).
- The evolution trigger chain isn't a discriminated union — it's a sequential check of optional properties. A registry pattern doesn't map as cleanly to this shape.

## Open questions

- At what variant count does a switch deserve a registry? Is 5 the threshold? 8? 10?
- For the evolution triggers specifically, is a registry the right pattern at all, or would a validator-pipeline be more natural (since triggers are checked sequentially, not dispatched by type)?
- Would the AoE shape registry be better placed in the proposed [[geometry-utility-extraction|geometry utility module]]?

## See also

- [[switching-validation-pipeline]] — a related proposal using a pipeline pattern for switching validators
- [[replace-conditional-with-polymorphism]] — the refactoring technique
- [[replace-type-code-with-state-strategy]] — a related data-focused approach
