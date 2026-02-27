---
cap_id: healing-C002
name: Character Extended Rest API
type: —
domain: healing
---

## healing-C002: Character Extended Rest API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/extended-rest.post.ts:default`
- **Game Concept:** Extended rest (4+ hours) -- HP recovery, status clearing, AP restoration
- **Description:** Applies 8 rest periods (4 hours) of HP healing, clears persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), restores all drained AP, clears all bound AP, and sets currentAp to full maxAp.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, apRestored, boundApCleared, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false
