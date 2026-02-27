---
cap_id: healing-C006
name: Pokemon 30-Minute Rest API
type: —
domain: healing
---

## healing-C006: Pokemon 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/rest.post.ts:default`
- **Game Concept:** 30-minute rest HP recovery for Pokemon
- **Description:** Applies 30 minutes of rest to a Pokemon, healing 1/16th max HP. Same rules as character rest: blocked at 5+ injuries, capped at 480 min/day, capped at injury-reduced effective max HP.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false
