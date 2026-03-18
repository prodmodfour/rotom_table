# Trainer Skill Definitions

Constants in `constants/trainerSkills.ts` defining the 17 PTU trainer skills.

## Skill Categories

| Category | Count | Skills |
|---|---|---|
| Body | 6 | Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival |
| Mind | 7 | General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, Perception |
| Spirit | 4 | Charm, Command, Focus, Intuition |

## Rank System

`SKILL_RANKS` array defines six ranks with numeric values and dice: Pathetic (1), Untrained (2), Novice (3), Adept (4), Expert (5), Master (6). `SKILL_RANK_LEVEL_REQS` maps ranks to minimum trainer levels.

## Helpers

- **getDefaultSkills()** — returns all 17 skills set to Untrained, used by [[character-creation-composable]] and [[sample-backgrounds]]

## See also

- [[trainer-derived-stats]]
- [[trainer-stat-budget]]
- [[character-creation-composable]]
