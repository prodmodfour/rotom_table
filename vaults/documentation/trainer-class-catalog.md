# Trainer Class Catalog

Constants in `constants/trainerClasses.ts` defining the 38 PTU trainer classes.

## Categories

| Category | Count |
|---|---|
| Introductory | 6 |
| Battling Style | 7 |
| Specialist Team | 3 |
| Professional | 5 |
| Fighter | 9 |
| Supernatural | 8 |

Each `TrainerClassDef` has: `name`, `category`, `associatedSkills[]`, `description`, and optional `isBranching` flag for classes that specialize at higher levels.

## Constants

- **MAX_TRAINER_CLASSES** — 4, the PTU cap on simultaneous trainer classes
- **getClassesByCategory()** — groups classes by category for picker UIs

## Consumers

- [[character-creation-composable]] — class add/remove during creation
- [[trainer-level-up-wizard]] — class picker at L5/10 with branching specialization

## See also

- [[character-creation-composable]]
- [[trainer-level-up-wizard]]
