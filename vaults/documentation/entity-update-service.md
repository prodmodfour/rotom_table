# Entity Update Service

`entity-update.service.ts` (141 lines) syncs combatant state changes back to the underlying `Pokemon` and `HumanCharacter` database rows after encounter mutations.

When a service modifies combatant data inside the [[denormalized-encounter-combatants|JSON combatant blob]] (HP, status conditions, combat stages), those changes exist only in the encounter's serialized state. The entity-update service propagates relevant changes back to the source-of-truth rows so that out-of-encounter views (character sheets, Pokemon stats) reflect combat outcomes.

Listed in the [[service-inventory]] with a complexity score of 141.

## See also

- [[service-inventory]] — catalog of all services and their complexity
- [[denormalized-encounter-combatants]] — the JSON blob pattern that creates the need for sync-back
- [[encounter-schema-normalization]] — a destructive proposal that would change this service's sync-back pattern fundamentally