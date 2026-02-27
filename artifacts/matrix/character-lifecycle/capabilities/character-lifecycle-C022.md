---
cap_id: character-lifecycle-C022
name: character-lifecycle-C022
type: —
domain: character-lifecycle
---

### character-lifecycle-C022
- **name:** Character Heal Injury API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/heal-injury.post.ts`
- **game_concept:** PTU injury healing (natural or AP drain)
- **description:** Heals one injury via natural method (24h since last injury) or drain_ap method (drains 2 AP). Daily limit of 3 injuries healed per day.
- **inputs:** URL param: id. Body: { method?: 'natural' | 'drain_ap' }
- **outputs:** `{ success, message, data: { injuriesHealed, injuries, drainedAp?, currentAp?, injuriesHealedToday } }`
- **accessible_from:** gm
