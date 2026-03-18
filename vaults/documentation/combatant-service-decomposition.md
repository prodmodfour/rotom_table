# Combatant Service Decomposition

A potential [[extract-class]] to address the [[combatant-service-mixed-domains|five distinct responsibility domains in combatant.service.ts]].

## The idea

Split the 792-line service along its natural seams:

| New service | Responsibility | ~Lines |
|---|---|---|
| `damage-calculation.service.ts` | HP reduction, temp HP absorption, massive damage, marker injuries | ~160 |
| `combat-healing.service.ts` | HP restoration, temp HP, injury healing, fainted removal | ~100 |
| `status-condition.service.ts` | Add/remove conditions, validation, CS auto-effects | ~120 |
| `stage-modifier.service.ts` | Update, validate, clamp combat stages | ~80 |
| `combatant-builder.service.ts` | Build from entity, evasion calculation, initiative | ~120 |

## Principles improved

- [[single-responsibility-principle]] — each service has one reason to change
- [[divergent-change-smell]] — eliminated: status condition changes don't touch damage code
- Testability — smaller, focused services are easier to test in isolation

## Patterns and techniques

- [[extract-class]] — the core refactoring
- The resulting services would be classified as either "pure functions" or "hybrid" in [[service-pattern-classification]] terms — damage calculation and stage modifiers could be fully pure

## Trade-offs

- File proliferation: 1 file becomes 5. The [[service-inventory]] grows from 23 to 27.
- Some consumers currently call 2-3 functions from `combatant.service.ts` in sequence (e.g., apply damage then check heavily injured then apply faint). They'd need to import from multiple services.
- Shared private helpers may exist between domains — these need extraction into a shared utility or duplication.
- The current single import (`from combatant.service`) is convenient. Five imports is more work per consumer.

## Open questions

- Are there shared private helpers between the five domains that would create awkward cross-dependencies?
- Would consumers benefit from a thin facade that re-exports the most common functions from all five services, preserving the single-import convenience?
- Should `combatant-builder.service.ts` include the [[equipment-bonus-aggregation]] logic it currently imports, or keep that as a separate concern?
- Is the line count per service worth the overhead? The smallest (stage-modifier at ~80 lines) may feel over-extracted.

## See also

- [[service-inventory]] — the existing service catalog this would expand
- [[heavily-injured-penalty-extraction]] — an extraction from within this service
- [[service-pattern-classification]] — how the new services would be classified
