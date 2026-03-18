# Character Creation Validation

Three validators in `utils/characterCreationValidation.ts` produce soft warnings (not hard blocks) for the [[character-creation-composable]].

## validateStatAllocation

Checks total stat points against the level budget from [[trainer-stat-budget|getStatPointsForLevel]] and per-stat cap (max 5 at level 1). Returns `CreationWarning[]` with `'warning'` or `'info'` severity.

## validateSkillBackground

Validates PTU background skill allocation: 1 Adept, 1 Novice, 3 Pathetic counts. Checks each skill rank against [[trainer-stat-budget|getMaxSkillRankForLevel]]. Downgrades severity to `'info'` when Skill Edges modify counts. Shows level-specific skill rank cap info.

## validateEdgesAndFeatures

Validates edge count against level-based expectations from [[trainer-stat-budget|getExpectedEdgesForLevel]] (base + bonus Skill Edges), feature count from [[trainer-stat-budget|getExpectedFeaturesForLevel]], and class count (max 4 from [[trainer-class-catalog]]). Includes milestone bonus guidance for levels 5+.

## See also

- [[character-creation-composable]]
- [[character-creation-page]]
