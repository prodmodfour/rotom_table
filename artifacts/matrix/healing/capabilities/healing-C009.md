---
cap_id: healing-C009
name: Pokemon Heal Injury API
type: —
domain: healing
---

## healing-C009: Pokemon Heal Injury API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/heal-injury.post.ts:default`
- **Game Concept:** Natural injury healing for Pokemon (24h timer)
- **Description:** Heals one injury naturally after 24 hours since last injury. Enforces daily 3-injury limit. Pokemon do NOT have AP drain method (trainers only). Clears lastInjuryTime when all injuries are gone.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { injuriesHealed, injuries, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false
