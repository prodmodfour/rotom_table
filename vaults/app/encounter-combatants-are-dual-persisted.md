Combat entity state lives in two places simultaneously. The `Encounter` model's combatants JSON blob holds the active combat snapshot — positions, turn state, temporary conditions, action tracking. The canonical `Pokemon` and `HumanCharacter` tables hold the persistent entity data — HP, injuries, status conditions, stage modifiers.

When an encounter endpoint applies damage, healing, or status changes, the mutation happens first on the in-memory combatant parsed from the encounter JSON. The [[entity-update-service-syncs-combatants-back-to-db]] then writes the relevant fields back to the entity's own database row.

Template-loaded combatants (those added from an [[encounter-template-stores-combatant-snapshots]] without a backing entity) skip the database sync because they have no `entityId` — their state exists only in the encounter blob.

This dual persistence means that if the app crashes mid-combat, the entity tables still reflect the last successfully synced state. It also means that viewing a character outside of combat shows current HP and conditions even while they are in an active encounter.

## See also

- [[prisma-uses-sqlite-with-json-columns-pattern]] — the JSON blob pattern that creates this duality
- [[encounter-service-is-the-combat-engine-core]] — the load/mutate/save flow where both writes happen
- [[entity-update-service-syncs-combatants-back-to-db]] — the service that performs the sync
