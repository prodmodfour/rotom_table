---
cap_id: pokemon-lifecycle-C043
name: POST /api/pokemon/:id/level-up-check
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C043: POST /api/pokemon/:id/level-up-check
- **cap_id**: pokemon-lifecycle-C043
- **name**: Level-Up Preview
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/level-up-check.post.ts`
- **game_concept**: Preview level-up effects before committing
- **description**: Read-only endpoint. Returns level-up information for transitioning from current level to targetLevel. Uses checkLevelUp() + summarizeLevelUps(). Reports stat points, new moves, ability milestones, tutor points, and whether species was found in DB.
- **inputs**: Route param: id, Body: { targetLevel: number }
- **outputs**: { success: true, data: LevelUpSummary }
- **accessible_from**: gm
