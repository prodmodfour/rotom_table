The `computeTrainerLevelUp()` function in `app/utils/trainerAdvancement.ts` determines what a trainer gains at each level:

- **Every level**: +1 stat point
- **Even levels**: +1 Edge
- **Odd levels (3+)**: +1 Feature
- **Levels 2, 6, 12**: Bonus Skill Edge (rank cap: Adept at 2, Expert at 6, Master at 12)
- **Levels 5, 10**: Class choice prompts
- **Level 5**: Amateur milestone (lifestyle stat points with +2 retroactive, or general feature)
- **Level 10**: Capable milestone (lifestyle stat points for even levels 12-20, or 2 bonus edges)
- **Level 20**: Veteran milestone (lifestyle stat points for even levels 22-30, or 2 bonus edges)
- **Level 30**: Elite milestone (lifestyle stat points for even levels 32-40, 2 bonus edges, or general feature)
- **Level 40**: Champion milestone (lifestyle stat points for even levels 42-50, 2 bonus edges, or general feature)

Lifestyle stat points from milestones grant +1 Attack or Special Attack per even level in the specified range. The `calculateLifestyleStatPoints()` function computes the accumulated total based on milestone choices and current level.

The per-level gains determine which steps appear in the [[trainer-level-up-modal]].

## See also

- [[trainer-level-up-gains-banner]]
- [[trainer-level-up-milestone-step]]
- [[trainer-level-up-milestone-budget-effects]]
- [[trainer-skill-rank-caps-by-level]]
