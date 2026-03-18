# Trainer Level-Up Wizard

Multi-step level-up workflow for trainers, triggered when trainer XP causes a level increase.

## Pure Logic

`utils/trainerAdvancement.ts` — `computeTrainerLevelUp`, `computeTrainerAdvancement`, `summarizeTrainerAdvancement`, milestone definitions, lifestyle stat point calculation.

## Composable

`composables/useTrainerLevelUp.ts` — Stat allocation, edge/feature/class selection, milestone choices, effective skills tracking (bonus + regular Skill Edge rank-ups), maxHp preview, update payload builder, warnings. Part of the [[composable-domain-grouping|Character/Trainer domain]].

## Modal

`components/levelup/LevelUpModal.vue` — Wizard with conditional step visibility based on advancement levels crossed. Steps: milestones, stats, edges, features, classes, summary.

Per decree-037: no standalone skill step; skill ranks come from Skill Edges.

## Sub-components

- **LevelUpStatSection.vue** — Stat point allocation with evasion preview.
- **LevelUpMilestoneSection.vue** — Milestone radio choices at L5/10/20/30/40 (Amateur/Capable/Veteran/Elite/Champion) with lifestyle stat points, bonus edges, or general feature options.
- **LevelUpEdgeSection.vue** — Regular edge input + Skill Edge shortcut + bonus Skill Edges at L2/6/12. Rank restriction: cannot raise to newly unlocked rank.
- **LevelUpFeatureSection.vue** — Free-text feature input at odd levels 3+, class hint display, existing features collapsible.
- **LevelUpClassSection.vue** — Searchable class picker at L5/10 with branching specialization (decree-022), max 4 classes. Martial Artist is non-branching (decree-026).
- **LevelUpSummary.vue** — Review step.

## Integration

Level watcher in CharacterModal.vue and `gm/characters/[id].vue` intercepts level increase, opens LevelUpModal, applies results to editData with `isApplyingLevelUp` guard to prevent double-trigger.

## See also

- [[trainer-xp-system]]
- [[trainer-stat-budget]]
- [[trainer-class-catalog]]
- [[character-sheet-modal]]
