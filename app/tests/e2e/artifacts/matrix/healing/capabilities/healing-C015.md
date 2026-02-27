---
cap_id: healing-C015
name: Calculate Pokemon Center Time
type: —
domain: healing
---

## healing-C015: Calculate Pokemon Center Time

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculatePokemonCenterTime`
- **Game Concept:** Pokemon Center healing duration calculation
- **Description:** Calculates healing time: 1hr base + 30min per injury (or 1hr per injury if 5+). Returns breakdown and formatted human-readable description.
- **Inputs:** `injuries: number`
- **Outputs:** `{ baseTime, injuryTime, totalTime, timeDescription }`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false
