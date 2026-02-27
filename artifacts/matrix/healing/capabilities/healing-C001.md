---
cap_id: healing-C001
name: Character 30-Minute Rest API
type: —
domain: healing
---

## healing-C001: Character 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/rest.post.ts:default`
- **Game Concept:** 30-minute rest HP recovery
- **Description:** Applies 30 minutes of rest to a human character, healing 1/16th max HP. Auto-resets daily counters if a new calendar day has started. Blocked at 5+ injuries, capped at 480 min/day, and capped at injury-reduced effective max HP.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false
