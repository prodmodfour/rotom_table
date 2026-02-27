---
cap_id: healing-C004
name: Character Heal Injury API
type: —
domain: healing
---

## healing-C004: Character Heal Injury API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/heal-injury.post.ts:default`
- **Game Concept:** Injury healing -- natural (24h timer) or drain AP (trainers only)
- **Description:** Heals one injury via natural healing (24h since last injury) or AP drain (costs 2 AP, increments drainedAp by 2, decrements currentAp by 2). Enforces daily limit of 3 injuries healed from all sources. Clears lastInjuryTime when all injuries are gone.
- **Inputs:** Character ID (URL param), `{ method: 'natural' | 'drain_ap' }` (body, defaults to 'natural')
- **Outputs:** `{ success, message, data: { injuriesHealed, injuries, drainedAp?, currentAp?, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false
