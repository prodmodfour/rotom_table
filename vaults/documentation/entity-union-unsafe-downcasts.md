# Entity Union Unsafe Downcasts

The `Combatant.entity` field is typed `Pokemon | HumanCharacter`, but these two types share only 16 truly compatible fields out of ~60 combined. Consumers cannot use `entity` polymorphically — they must check `combatant.type` and downcast via `as Pokemon` or `as HumanCharacter`.

The scale of the problem: 144 type assertions (`as Pokemon` / `as HumanCharacter`) across 45 files, 92 `combatant.type ===` checks across 42 files, but only 70 proper type guard calls (`isPokemon`/`isHumanCharacter`) across 16 files. The vast majority of downcasts are bare `as` casts with no runtime safety.

This violates the [[liskov-substitution-principle]] — the union's subtypes cannot be used interchangeably for shared operations like reading HP, checking status conditions, or accessing combat stages. A `CombatEntity` base interface containing the 16 truly common fields would make combat-stat-only code paths fully type-safe without downcasting.

See also [[entity-shared-field-incompatibility]] for why the actual safe overlap is even smaller than it appears.

## See also

- [[refused-bequest-smell]] — the union forces consumers to check type before accessing entity-specific features
- [[extract-interface]] — the refactoring that would create a shared CombatEntity base
- [[combatant-type-hierarchy]] — the architectural documentation of this hierarchy
- [[display-name-helper-duplication]] — one consequence: the same type-check helper duplicated in 5 services
- [[combat-entity-base-interface]] — a potential design to address this with a shared base type
