Trainer skill ranks are capped by level. The `getMaxSkillRankForLevel()` function in `app/constants/trainerStats.ts` enforces:

- Level 1: Novice maximum
- Level 2+: Adept unlocked
- Level 6+: Expert unlocked
- Level 12+: Master unlocked

The rank progression order is: Pathetic, Untrained, Novice, Adept, Expert, Master. Each rank corresponds to a dice roll: 1d6, 2d6, 3d6, 4d6, 5d6, 6d6 respectively.

The `isSkillRankAboveCap()` function checks whether a given rank exceeds the cap for a trainer's level. The [[trainer-level-up-bonus-skill-edge-picker]] uses these caps to disable skills that cannot be raised further. The [[trainer-advancement-schedule]] grants bonus Skill Edges at the same levels (2, 6, 12) that unlock the new rank caps.

## See also

- [[skill-rank-cap-warning]]
- [[trainer-skill-categories-and-ranks]]
