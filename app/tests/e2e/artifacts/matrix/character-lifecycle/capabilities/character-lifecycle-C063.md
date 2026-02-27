---
cap_id: character-lifecycle-C063
name: character-lifecycle-C063
type: —
domain: character-lifecycle
---

### character-lifecycle-C063
- **name:** Trainer Stats constants and functions
- **type:** constant
- **location:** `app/constants/trainerStats.ts`
- **game_concept:** PTU stat allocation rules (PTU Core Ch. 2)
- **description:** BASE_HP (10), BASE_OTHER (5), TOTAL_STAT_POINTS (10), MAX_POINTS_PER_STAT (5). Functions: getStatPointsForLevel(level), getMaxSkillRankForLevel(level), isSkillRankAboveCap(rank, level), getExpectedEdgesForLevel(level) returning {base, bonusSkillEdges, total}, getExpectedFeaturesForLevel(level).
- **inputs:** level: number
- **outputs:** Stat point budget, skill rank cap, edge/feature expectations
- **accessible_from:** gm
