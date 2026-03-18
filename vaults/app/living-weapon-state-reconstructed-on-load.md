Living Weapon wield relationships are not stored in their own database column. Instead, `app/server/services/living-weapon-state.ts` exports `reconstructWieldRelationships()` which derives the relationships from combatant flags on each encounter load.

The function scans all combatants for `isLivingWeapon`, `livingWeaponWielderId`, and related flags, then builds a map of wielder-weapon pairs. This is called by `loadEncounter()` in the [[encounter-service-is-the-combat-engine-core]] and by the WebSocket handler's `sendEncounterState()`.

This means wield state is derived data, not stored state — it is always reconstructed from the combatant data that is already persisted in the encounter's JSON blob.

## See also

- [[prisma-uses-sqlite-with-json-columns-pattern]]
- [[living-weapon-config-constant]] — the species configs, weapon types, and granted moves
