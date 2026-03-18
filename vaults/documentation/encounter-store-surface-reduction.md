# Encounter Store Surface Reduction

A potential approach to address the [[encounter-store-god-object-risk|encounter store's role as a God Object facade]].

## The idea

Reduce the encounter store's surface area so components don't depend on the entire 723-line + 1,091-line delegated interface. Three potential approaches:

**A. Direct composable access** — Components import the delegated composables directly instead of going through the store facade. The store manages state; composables provide the action API. The 30+ proxy methods in the store are removed.
```
// Before: const store = useEncounterStore(); store.dealDamage(...)
// After:  const actions = useEncounterCombatActions(context); actions.dealDamage(...)
```

**B. Store split** — Break the encounter store into multiple focused stores:
- `encounterCore` — CRUD, loading, serve/unserve
- `encounterMountState` — mount/wield getters and actions
- `encounterSync` — WebSocket merge logic
- Keep existing `encounterCombat`, `encounterGrid`, `encounterXp` as they are

**C. Focused getter composables** — Create thin read-only composables that wrap the store for specific consumers:
```
function useEncounterMountInfo() {
  const store = useEncounterStore()
  return { mountedCombatants: computed(() => ...), getRider: (id) => ..., ... }
}
```

## Principles improved

- [[interface-segregation-principle]] — consumers depend on the slice they need, not the full surface
- [[single-responsibility-principle]] — each access point has a focused reason to change
- [[large-class-smell]] — reduced by distributing the interface

## Patterns and techniques

- Approach A: removes the [[facade-pattern]] — consumers go directly to subsystems
- Approach B: [[extract-class]] at the store level
- Approach C: [[adapter-pattern]] — thin composables adapting the store's broad interface to focused consumer needs

## Trade-offs

- **Approach A** requires each consumer to build a `_buildContext()` — the manual DI mechanism becomes every consumer's problem instead of the store's
- **Approach B** introduces cross-store coordination challenges. Turn advancement needs data from encounterCore, encounterMountState, and encounterSync simultaneously. The [[cross-store-coordination-rule]] says stores don't import each other, so coordination must happen in composables — adding another layer.
- **Approach C** is the lightest touch but doesn't actually reduce the store — it just hides it behind wrappers. The God Object still exists.
- All approaches add complexity at the consumer level in exchange for reducing it at the store level.
- The current facade, while broad, is simple to use — one import, one object. Any decomposition makes consumption harder.

## Open questions

- Is the facade actually causing problems in practice, or is the breadth a theoretical concern? If components are working fine with `useEncounterStore()`, the motivation for change is weak.
- How many components actually use a narrow slice of the store? If most components use 5+ store features, splitting doesn't save them anything.
- Could a hybrid approach work — keep the facade for convenience, but also expose the composables directly for components that benefit from the narrow interface?
- Would this be better addressed after [[combatant-type-segregation]] and [[combat-entity-base-interface]], which reduce the data surface that flows through the store?

## See also

- [[encounter-store-as-facade]] — the current design being reconsidered
- [[encounter-store-decomposition]] — the existing delegation pattern
- [[pinia-store-classification]] — the zero-state stores as an example of well-segregated interfaces
- [[adapter-pattern]] — Approach C uses adapter composables
