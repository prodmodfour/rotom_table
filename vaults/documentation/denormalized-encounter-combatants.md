# Denormalized Encounter Combatants

Full combatant state (HP, position, status conditions, stage modifiers) lives in `Encounter.combatants` as a [[json-as-text-columns|JSON TEXT column]], not as separate database rows.

This means:
- A single encounter read loads all combatant data in one query.
- The `entity-update` service syncs critical field changes back to the canonical `Pokemon` and `HumanCharacter` rows.
- Template combatants (from EncounterTemplate) have `entityId: null` until the encounter starts and real DB records are created. `entity-update` skips them silently.

The client-side [[combatant-type-hierarchy]] wraps raw Pokemon/HumanCharacter entities with encounter-specific state (initiative, turn state, grid position, mount state).

## See also

- [[prisma-schema-overview]]
- [[encounter-schema-normalization]] — a destructive proposal to normalize this pattern into relational tables
- [[event-sourced-encounter-state]] — a destructive proposal to replace mutable state with event sourcing
