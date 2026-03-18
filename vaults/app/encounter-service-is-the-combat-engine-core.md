The encounter service (`app/server/services/encounter.service.ts`) provides the foundational functions that all combat endpoints depend on. It defines `ParsedEncounter`, the canonical shape returned to clients.

Key functions:

- `loadEncounter(id)` — fetches from Prisma, parses all JSON columns (combatants, turnOrder, declarations, moveLog, defeatedEnemies), reconstructs [[living-weapon-state-reconstructed-on-load]].
- `findCombatant(encounter, id)` — locates a combatant by ID within the parsed combatant array.
- `sortByInitiativeWithRollOff(combatants)` — sorts by initiative descending with speed-based rolloff for ties.
- `buildEncounterResponse(encounter)` — constructs the standardized API response from a parsed encounter.
- `saveEncounterCombatants(encounter)` — serializes the combatant array back to JSON and saves to the database.
- `reorderInitiativeAfterSpeedChange(encounter)` — recalculates turn order when a combatant's speed changes mid-combat.

Every encounter mutation endpoint follows the same flow: `loadEncounter` → modify combatants → `saveEncounterCombatants` → `buildEncounterResponse` → return.

## See also

- [[encounter-combatants-are-dual-persisted]] — the dual persistence pattern this flow creates
- [[turn-helpers-extract-round-lifecycle-functions]] — helpers extracted from next-turn logic
- [[route-handlers-delegate-to-services-for-complex-logic]]
- [[encounter-combatant-card]]
- [[services-are-stateless-function-modules]]
