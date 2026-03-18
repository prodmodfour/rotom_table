The `useTrainerLevelUp` composable in `app/composables/useTrainerLevelUp.ts` manages all reactive state for the [[trainer-level-up-modal]] wizard.

It tracks: `statAllocations` (per-stat point counts), `edgeChoices`, `bonusSkillEdgeChoices`, `featureChoices`, `newClassChoices`, and `milestoneChoices`.

Key computed properties:
- `effectiveSkills` — skill ranks accounting for all Skill Edge rank-ups
- `warnings` — list of incomplete allocation messages shown on the [[trainer-level-up-summary-step]]

Key methods:
- `initialize()` — sets up the wizard state for a given character and level range
- `reset()` — clears all allocations
- `buildUpdatePayload()` — produces a partial character object with level, stats, maxHp, currentHp, skills, edges, features, and trainerClasses, used by `PUT /api/characters/:id` to save the results

Max HP is computed as `newLevel * 2 + hpStat * 3 + 10`. The [[trainer-level-up-hp-preservation]] logic preserves full-HP state or clamps below-full HP to the new maximum.

Per decree-027, [[trainer-pathetic-skill-edge-policy|Pathetic skills can be raised via Skill Edges during level-up]], unlike creation.

## See also

- [[trainer-xp-composable]]
- [[trainer-level-up-step-order]]
- [[trainer-level-up-regular-skill-edge-storage]]
