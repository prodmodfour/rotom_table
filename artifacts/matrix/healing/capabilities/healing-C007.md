---
cap_id: healing-C007
name: Pokemon Extended Rest API
type: —
domain: healing
---

## healing-C007: Pokemon Extended Rest API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/extended-rest.post.ts:default`
- **Game Concept:** Extended rest (4+ hours) for Pokemon -- HP recovery, status clearing, daily move restoration
- **Description:** Applies 8 rest periods of HP healing, clears persistent status conditions, resets daily move usage using rolling window rule (PTU Core p.252: only moves NOT used today are refreshed). Tracks restoredMoves vs skippedMoves. Also resets non-daily move usedToday counters and scene usage for refreshed moves.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, restoredMoves, skippedMoves, restMinutesToday, restMinutesRemaining } }`
- **Accessible From:** `gm`
- **Orphan:** false
