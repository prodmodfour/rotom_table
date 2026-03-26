# Combat Entity Base Interface

A potential [[extract-interface]] to address the [[entity-union-unsafe-downcasts|144 unsafe type casts]] from the `Pokemon | HumanCharacter` union.

## The idea

Create a `CombatEntity` interface containing the ~16 fields that are genuinely type-compatible between `Pokemon` and `HumanCharacter`: `id`, `level`, `currentHp`, `maxHp`, `temporaryHp`, `stamina`, `currentEnergy`, `maxEnergy`, `statusConditions`, `stageModifiers`, `injuries`, `traits`, `types`, `heldItem`, `weight`, `size`, `gender`. Both `Pokemon` and `HumanCharacter` would extend `CombatEntity`. `Combatant.entity` would be typed as `CombatEntity`, with narrowing to the full type available via the existing `combatant.type` discriminant. Stamina is a shared stat per [[stamina-stat]], and Energy is the combat resource derived from it per [[energy-resource]].

Combat-stat-only code paths (HP checks, status condition queries, stage modifier reads) would become fully type-safe without any `as` casts.

## Principles improved

- [[liskov-substitution-principle]] — `CombatEntity` subtypes would be genuinely interchangeable for shared operations
- [[interface-segregation-principle]] — consumers needing only combat stats wouldn't be exposed to species-specific or trainer-specific fields

## Patterns and techniques

- [[extract-interface]] — the core refactoring
- Could evolve toward a [[bridge-pattern]] if the entity and combatant hierarchies need to vary independently

## Trade-offs

- Adds a third type to understand and maintain alongside `Pokemon` and `HumanCharacter`
- The 16-field boundary must be chosen carefully — too few fields and casts remain everywhere; too many and [[entity-shared-field-incompatibility|incompatible fields]] sneak in
- Migration of 144 cast sites is mechanical but high-volume — risk of introducing regressions
- The `skills` field is explicitly excluded due to [[entity-shared-field-incompatibility|structural incompatibility]] — consumers needing it must still narrow

## Open questions

- Should `CombatEntity` be a TypeScript `interface` (structural) or a branded type (nominal)?
- Would a `toPokemon()` / `toHuman()` narrowing utility be safer than `as` casts for the remaining entity-specific access?
- Are there contexts where the 14-field base is still too broad — e.g., a `CombatHealthState` sub-slice of just HP/status/injury fields?

## See also

- [[combatant-type-hierarchy]] — the architectural context for this hierarchy
- [[combatant-type-segregation]] — the complementary proposal for the Combatant interface itself
- [[game-state-interface]] — the formal design that supersedes this proposal with a full sub-interface decomposition
- [[combat-lens-sub-interfaces]] — the 15 sub-interfaces that replace the single CombatEntity base
