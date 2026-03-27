# Pokemon Experience Chart

The experience chart maps levels 1–20 to cumulative XP thresholds per [[ptr-xp-table]]. Level 1 = 0 XP, Level 20 = 20,555 XP. The [[total-xp-unchanged|total XP to max is unchanged]] from PTU despite the compressed [[pokemon-level-range-1-to-20|1–20 level range]].

## Level-Up Detection

When XP is added, the system determines how many levels were gained and produces per-level details: [[five-stat-points-per-level|+5 stat points]], [[evolution-check-on-level-up|evolution check]], and new [[trait-definition|trait]] checks per [[level-up-ordered-steps]].

## XP Sources

XP reaches Pokemon through manual grants and post-combat distribution via the [[xp-distribution-flow]].

## See also

- [[pokemon-hp-formula]] — HP recalculated on level-up
- [[pokemon-stat-allocation]] — stat points allocated per level gained
- [[pokemon-move-learning]] — moves unlocked via conditions, not level-based learnsets
