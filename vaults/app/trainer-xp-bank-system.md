Trainer XP uses a "bank" system implemented in `app/utils/trainerExperience.ts`. The `applyTrainerXp()` pure function takes a current XP value, current level, and an amount to add (or subtract).

When the bank reaches 10, it subtracts 10 and increments the level by 1. Multi-level jumps are possible (e.g., bank 8 + 15 = 23, which yields 2 levels gained with 3 remaining). The maximum trainer level is 50.

Constants: `TRAINER_XP_PER_LEVEL = 10`, `TRAINER_MAX_LEVEL = 50`. Milestone levels are defined as `[5, 10, 20, 30, 40]`.

Deductions clamp the bank to 0 but never reduce the level.

The function returns `previousXp`, `newXp`, `previousLevel`, `newLevel`, `levelsGained`, and `milestoneLevelsCrossed`.

## See also

- [[trainer-xp-api-endpoint]]
- [[xp-award-updates-level-immediately]]
- [[trainer-xp-suggestion-tiers]]
