---
cap_id: pokemon-lifecycle-C042
name: POST /api/pokemon/:id/add-experience
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C042: POST /api/pokemon/:id/add-experience
- **cap_id**: pokemon-lifecycle-C042
- **name**: Manual XP Grant
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/add-experience.post.ts`
- **game_concept**: Standalone XP grant (training, manual GM award) (Core p.202)
- **description**: Adds XP to a single Pokemon. Validates amount is positive integer <= MAX_EXPERIENCE. Loads learnset from SpeciesData for move detection. Calls calculateLevelUps(). Updates experience, level, tutorPoints, and maxHp (level component increase). Preserves full-HP state on level-up. Separate from combat XP distribution.
- **inputs**: Route param: id, Body: { amount: number }
- **outputs**: { success: true, data: XpApplicationResult }
- **accessible_from**: gm
