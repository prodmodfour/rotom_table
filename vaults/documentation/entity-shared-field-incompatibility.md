# Entity Shared Field Incompatibility

`Pokemon` and `HumanCharacter` share the field names `capabilities` and `skills`, but with structurally incompatible types:

- `Pokemon.capabilities`: a structured object (`PokemonCapabilities` with `overland`, `swim`, `sky`, `burrow`, etc.)
- `HumanCharacter.capabilities`: a flat `string[]`

- `Pokemon.skills`: `Record<string, string>`
- `HumanCharacter.skills`: `Record<string, SkillRank>`

Code accessing `entity.capabilities` on the `Pokemon | HumanCharacter` union gets a TypeScript type error because the field resolves to an incompatible intersection. The shared field names are a trap — they make the two types appear more substitutable than they are.

This worsens the [[liskov-substitution-principle]] violation described in [[entity-union-unsafe-downcasts]]: the actual number of safely shared fields is 14 (not 16), making the case for a `CombatEntity` base interface even stronger — it would include only the fields that are genuinely type-compatible.

## See also

- [[alternative-classes-with-different-interfaces-smell]] — two classes serving the same role with incompatible interfaces
- [[combatant-type-hierarchy]] — the architectural context
- [[combat-entity-base-interface]] — proposes explicitly excluding incompatible fields from the shared base
