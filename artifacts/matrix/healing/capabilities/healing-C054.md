---
cap_id: healing-C054
name: Calculate Max AP
type: —
domain: healing
---

## healing-C054: Calculate Max AP

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateMaxAp`
- **Game Concept:** Trainer max Action Points calculation (PTU Core p.221)
- **Description:** Calculates max AP for a trainer: 5 AP + 1 more for every 5 Trainer Levels. Level 1 = 5 AP, Level 5 = 6 AP, Level 10 = 7 AP, Level 15 = 8 AP.
- **Inputs:** `level: number`
- **Outputs:** `number` (max AP)
- **Accessible From:** `api-only` (used by extended-rest, new-day endpoints)
- **Orphan:** false
