---
cap_id: vtt-grid-C035
name: vtt-grid-C035
type: —
domain: vtt-grid
---

### vtt-grid-C035
- **name:** ptuDiagonalDistance utility
- **type:** utility
- **location:** `app/utils/gridDistance.ts` — ptuDiagonalDistance()
- **game_concept:** PTU alternating diagonal movement cost
- **description:** Pure function implementing PTU diagonal movement rule: first diagonal costs 1m, second costs 2m, alternating. Formula: diagonals + floor(diagonals/2) + straights.
- **inputs:** dx: number, dy: number
- **outputs:** Movement cost in meters (cells)
- **accessible_from:** gm (via composables)
