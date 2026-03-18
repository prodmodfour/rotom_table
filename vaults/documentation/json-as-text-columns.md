# JSON-as-TEXT Columns

SQLite has no native JSON column type. All JSON fields in the [[prisma-schema-overview|schema]] are declared as `String` with `@default("[]")` or `@default("{}")`. Parsing and serializing is manual in every service.

Key models and their JSON-as-TEXT columns:

| Model | JSON columns |
|---|---|
| **HumanCharacter** | trainerClasses, skills, features, edges, capabilities, equipment, inventory, statusConditions, stageModifiers, ownedSpecies |
| **Pokemon** | nature, stageModifiers, abilities, moves, capabilities, skills, statusConditions, eggGroups |
| **Encounter** | combatants, turnOrder, trainerTurnOrder, pokemonTurnOrder, declarations, switchActions, pendingActions, holdQueue, fogOfWarState, terrainState, moveLog, defeatedEnemies |
| **[[scene-data-model|Scene]]** | pokemon, characters, groups, terrains, modifiers |
| **EncounterTemplate** | combatants, tags |
| **SpeciesData** | abilities, learnset, evolutionTriggers, skills, capabilities |

All other models use scalar columns only.

## See also

- [[trainer-skill-definitions]]
- [[trainer-class-catalog]]
- [[equipment-system]]
