# Combatant Interface Bloat

The `Combatant` interface has grown to 30+ fields because every game subsystem adds its own concerns to the same type. Mount state, living weapon state, vision state, forecast state, out-of-turn usage, hold actions, feature usage tracking, equipment snapshot, injury state — all live as optional fields on one interface.

## The structural problem

The Combatant is passed to every game system. But no game system needs more than a few of its fields:

- **Damage calculation** needs `hp`, `maxHp`, `tempHp`, `entity.stats`, `entity.abilities`, `statusConditions`, `combatStages`
- **Movement** needs `position`, `speed`, `entity.movement`, `mountedOn`, `riddenBy`
- **Fog of war** needs `position`, `visionRange`, `darkvision`, `side`
- **Weather** needs `entity.abilities`, `entity.types`, `statusConditions`
- **Turn order** needs `initiative`, `speed`, `id`, `name`

Each system receives the full Combatant (30+ fields) and ignores most of it. This is a textbook [[interface-segregation-principle]] violation — consumers depend on interfaces they don't use.

## Consequences

- **Adding a new subsystem means modifying Combatant.** Every new mechanic (traps, abilities, auras) adds optional fields to the shared interface. The interface only grows.
- **[[temporary-field-smell]]** — fields like `forecastOriginalType`, `holdAction`, `outOfTurnUsage` are only meaningful during specific encounter phases. They sit as `undefined` most of the time.
- **Type narrowing is manual.** Code that operates on mount state must check `if (combatant.mountedOn)` because the type system doesn't distinguish "mounted combatant" from "unmounted combatant."
- **[[large-class-smell]]** in the data model — the Combatant is a data class with too many fields, mirroring the [[encounter-store-god-object-risk|god object pattern]] at the type level.

## Relationship to [[entity-data-model-rigidity]]

The [[entity-data-model-rigidity]] problem note focuses on the Pokemon/HumanCharacter/Combatant *hierarchy* and its 144 unsafe casts. This note focuses on the Combatant *interface width* — how many unrelated concerns it owns. The Entity-Component-System proposal addresses the hierarchy; a trait-composed model addresses the interface width.

## See also

- [[interface-segregation-principle]] — the principle violated
- [[temporary-field-smell]] — many Combatant fields are only meaningful in specific contexts
- [[large-class-smell]] — applied to a data type rather than a class
- [[entity-data-model-rigidity]] — the related problem of type hierarchy rigidity
- [[entity-component-system-architecture]] — one approach to solving this (runtime composition)
- [[trait-composed-domain-model]] — another approach (compile-time composition via TypeScript intersections)
- [[tell-dont-ask]] — consumers pull 30+ fields and compute externally; pushing behavior to the Combatant would naturally narrow the interface
- [[law-of-demeter]] — consumers reach through Combatant to access entity fields, coupling themselves to internal structure
- [[composition-over-inheritance]] — composing capabilities rather than accumulating fields would prevent bloat
