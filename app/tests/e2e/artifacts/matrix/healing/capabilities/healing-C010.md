---
cap_id: healing-C010
name: Pokemon New Day API
type: —
domain: healing
---

## healing-C010: Pokemon New Day API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/new-day.post.ts:default`
- **Game Concept:** Per-Pokemon daily counter reset
- **Description:** Resets a single Pokemon's daily healing counters: restMinutesToday and injuriesHealedToday to 0. Does NOT reset move usage (that is done by the character new-day or global new-day endpoints).
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, lastRestReset } }`
- **Accessible From:** `gm`
- **Orphan:** false
