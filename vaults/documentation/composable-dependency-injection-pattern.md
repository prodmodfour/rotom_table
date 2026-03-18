# Composable Dependency Injection Pattern

A potential approach to address the [[composable-store-direct-coupling|direct store coupling in composables]].

## The idea

Composables would receive store references or accessor functions through their options objects rather than calling `useStore()` internally. This follows the [[dependency-inversion-principle]]: depend on injected abstractions, not on global singletons.

Some composables already partially do this — `useMoveCalculation` takes `move`, `actor`, `targets` as injected refs, but then calls `useEncounterStore()` directly for weather and wield state. The proposal is to extend this existing pattern consistently.

Three potential approaches:

**A. Full injection** — every dependency passed explicitly:
```
useMoveCalculation({ move, actor, targets, weather: encounterStore.weather, wieldRelationships: encounterStore.wieldRelationships, terrainCells: terrainStore.cells })
```

**B. Context object** — bundle commonly-used stores into a typed context:
```
const ctx = useEncounterContext() // returns { encounter, terrain, fog, measurement, selection }
useMoveCalculation({ move, actor, targets, ctx })
```

**C. Test-only override** — keep direct store calls but support optional injection for testing:
```
useMoveCalculation({ move, actor, targets, _stores?: { encounter?, terrain? } })
```

## Principles improved

- [[dependency-inversion-principle]] — composables depend on abstractions, not concrete stores
- Testability — composables can be tested by injecting mock data, without mocking Pinia

## Patterns and techniques

- [[strategy-pattern]] — injected dependencies as swappable strategies
- [[dependency-inversion-principle]] — the core principle
- Approach B resembles a [[mediator-pattern]] context

## Trade-offs

- **Approach A** is purest but extremely verbose — `useGridInteraction` uses 8 stores, meaning 8+ additional options params at every call site
- **Approach B** adds one layer but hides which stores a composable actually uses — debugging becomes harder
- **Approach C** is pragmatic but leaves production code tightly coupled — only test code benefits
- Vue's composable convention (call `useStore()` inside the composable) is well-established. Fighting this convention creates friction for anyone reading the code who expects the standard pattern.
- The current codebase has no tests for composables, so the testability benefit is theoretical until tests are written.

## Open questions

- Is full DIP the right goal, or is testability the actual motivation? If testability, Approach C may be sufficient.
- Would a Pinia testing utility (e.g., `createTestingPinia` from `@pinia/testing`) be simpler than redesigning the injection pattern?
- Does Approach B (context object) just move the God Object problem from the encounter store to a context object?
- How many composables would actually be tested in isolation? If the answer is "the 3 most complex ones," targeted injection on just those 3 may be better than a codebase-wide convention change.

## See also

- [[store-independence-from-each-other]] — stores themselves respect DIP; this proposal extends that to composables
- [[technical-debt-cause-tight-coupling]] — the coupling this aims to reduce
- [[singleton-pattern]] — Pinia stores as singletons creating hidden coupling
- [[ioc-container-architecture]] — the destructive alternative that supersedes this incremental approach with a full container
