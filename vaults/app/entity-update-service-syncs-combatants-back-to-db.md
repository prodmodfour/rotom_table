The entity update service (`app/server/services/entity-update.service.ts`) writes in-memory combatant changes back to the canonical `Pokemon` and `HumanCharacter` database tables after combat operations.

When the encounter's `combatants` JSON blob is modified (damage, healing, status changes, stage modifiers), those changes only exist in the encounter record. The entity update service copies relevant fields — currentHp, injuries, statusConditions, stageModifiers, temporaryHp — back to the source entity's own database row.

Template-loaded combatants (those without an `entityId`) are skipped, since they have no backing database record.

Functions include `syncDamageToDatabase`, `syncStagesToDatabase`, and `syncEntityToDatabase` for full entity sync.

## See also

- [[encounter-combatants-are-dual-persisted]] — the dual persistence pattern this service enables
- [[prisma-uses-sqlite-with-json-columns-pattern]] — the JSON blob pattern that creates this need
- [[encounter-service-is-the-combat-engine-core]] — the load/save flow this service participates in
