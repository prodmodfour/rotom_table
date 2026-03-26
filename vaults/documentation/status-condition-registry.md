# Status Condition Registry

A potential [[strategy-pattern]] / registry to address the [[status-condition-ripple-effect|shotgun surgery when adding a status condition]].

## The idea

Create a centralized registry that maps each `StatusCondition` to all of its properties:

```
const STATUS_REGISTRY: Record<StatusCondition, StatusDefinition> = {
  Burning: {
    blocksAoO: false,
    blocksIntercept: false,
    tickDamage: { formula: 'level * 1.5', type: 'fire' },
    csEffects: [{ stat: 'defense', modifier: -2 }],
    immuneTypes: ['Fire'],
    volatile: false,
    displayColor: '#f97316',
  },
  // ...
}
```

Consumers would query the registry instead of maintaining their own lookup tables. Adding a new condition means adding one entry to the registry.

## Principles improved

- [[open-closed-principle]] — new conditions added by registration, not by modifying 20+ files
- [[shotgun-surgery-smell]] — eliminated: one file to change per new condition
- [[single-responsibility-principle]] — condition definition separated from condition consumption

## Patterns and techniques

- [[strategy-pattern]] — each condition's behavior defined as a strategy object
- [[replace-conditional-with-polymorphism]] — registry lookups replace scattered switch/if checks
- Could use [[typescript-pattern-techniques|satisfies operator]] to preserve literal types while enforcing the registry shape

## Trade-offs

- TypeScript's exhaustiveness checking on discriminated unions is compile-time and free. A registry adds runtime indirection. If the registry entry is missing, the error is runtime, not compile-time.
- Some condition properties are context-dependent: weather interactions (e.g., Hydration cures Burning in rain) don't fit neatly into a static property bag. The registry entry would need to support callbacks or be supplemented by separate logic.
- The registry becomes a new coordination point — a central file that many modules depend on. This is better than the current scatter, but it's still a coupling hub.
- Risk of the registry growing into a god object if too many concerns are packed into `StatusDefinition`.

## Open questions

- Should the registry be a compile-time `const` object (preserving TypeScript literal type narrowing) or a runtime `Map` (enabling dynamic registration)?
- How to handle context-dependent properties like weather-cured conditions? Callbacks in the registry, or separate lookup?
- Should the registry cover UI concerns (color, icon) or only game logic? Mixing UI and domain data in one registry blurs responsibilities.
- Are there conditions that are better modeled as runtime state than as static definitions (e.g., Badly Poisoned with its escalating tick)?

## See also

- [[status-condition-categories]] — the existing categorization of conditions
- [[trigger-validation-switch-chains]] — a similar OCP concern that could also benefit from a registry approach
- [[status-cs-auto-apply-with-tracking]] — the CS auto-effect system that would consume this registry
