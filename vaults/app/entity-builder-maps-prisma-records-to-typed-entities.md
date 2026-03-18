The entity builder service (`app/server/services/entity-builder.service.ts`) transforms raw Prisma database records into typed `Pokemon` and `HumanCharacter` objects. It is pure data mapping with JSON parsing — no combat logic.

`buildPokemonEntityFromRecord()` parses JSON fields (nature, abilities, moves, capabilities, skills, statusConditions, stageModifiers, eggGroups), maps column names to interface fields (e.g., `currentSpAtk` becomes `specialAttack`), and applies defaults (loyalty 2 for wild/captured origin, 3 otherwise).

`buildHumanEntityFromRecord()` does the same for trainer records, parsing trainerClasses, skills, features, edges, capabilities, equipment, inventory, and statusConditions from JSON.

These functions are distinct from the [[serializers-parse-json-columns-into-typed-objects]], which format data for API responses to clients. The entity builder produces internal typed objects used by services like [[encounter-service-is-the-combat-engine-core]] when constructing combatants from database records.

## See also

- [[combat-services-cover-ptu-subsystems]] — combatant.service uses entity builder output to construct combatants
- [[services-are-stateless-function-modules]]
