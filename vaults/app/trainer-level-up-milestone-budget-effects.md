Milestone choices in the [[trainer-level-up-milestone-step]] dynamically alter the budgets for later wizard steps. The [[trainer-level-up-composable]] computes three milestone-derived values:

- **milestoneRetroactiveStatPoints** — the Amateur milestone's "Lifestyle Stat Points" choice adds +2 retroactive stat points (for levels 2 and 4), increasing the stat point budget shown in the [[trainer-level-up-stat-allocation-step]].
- **milestoneBonusEdges** — the Capable, Veteran, Elite, or Champion "Bonus Edges" choice adds +2 to the regular edge budget shown in the [[trainer-level-up-edges-step]].
- **milestoneBonusFeatures** — the Amateur, Elite, or Champion "General Feature" choice adds +1 to the feature budget shown in the [[trainer-level-up-feature-step]].

These computed values are added to the base advancement totals (`statPointsTotal`, `regularEdgesTotal`, `featuresTotal`). This is why the milestones step appears first in the wizard — the GM must make milestone choices before the other steps know their budgets.
