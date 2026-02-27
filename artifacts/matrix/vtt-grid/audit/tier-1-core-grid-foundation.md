## Tier 1: Core Grid Foundation

### R001 — Square Grid System

- **Rule:** "Pokemon Tabletop United uses a square combat grid."
- **Expected behavior:** Grid renders as squares in 2D mode; isometric mode uses same underlying square data model.
- **Actual behavior:** `app/stores/encounterGrid.ts` manages grid config with `width`, `height`, `cellSize`. `GridCanvas.vue` (C041) renders 2D top-down square grid. `IsometricCanvas.vue` (C042) renders diamond-projected grid. Both modes use the same square coordinate system underneath. Grid coordinates are integer x,y pairs.
- **Classification:** Correct

### R002 — Grid Scale (1 Meter Per Square)

- **Rule:** "Small and Medium Pokemon take up one space, a 1x1m square."
- **Expected behavior:** Each grid cell = 1 meter.
- **Actual behavior:** `app/utils/gridDistance.ts` — `ptuDiagonalDistance` operates in cell units = meters. `GridSettingsPanel` (C050) configures cell size for display, but movement calculations use cell units directly. The pathfinding and measurement systems treat 1 cell = 1 meter consistently.
- **Classification:** Correct

### R005 — Diagonal Movement Cost

- **Rule:** "The first square you move diagonally costs 1 meter. The second costs 2 meters. The third 1 meter. And so on."
- **Expected behavior:** Alternating 1m/2m pattern. Formula: diag + floor(diag/2) + straights.
- **Actual behavior:** `app/utils/gridDistance.ts:19-25` — `ptuDiagonalDistance`:
  ```
  diagonals = Math.min(absDx, absDy)
  straights = Math.abs(absDx - absDy)
  return diagonals + Math.floor(diagonals / 2) + straights
  ```
  Verification: (3,3) diagonal: diag=3, straight=0. Cost = 3 + floor(3/2) + 0 = 3+1 = 4. Manual: 1+2+1=4. Correct.
  (2,1): diag=1, straight=1. Cost = 1+0+1 = 2. Manual: 1 diagonal (1m) + 1 straight (1m) = 2. Correct.
  (4,4): diag=4, straight=0. Cost = 4+2+0 = 6. Manual: 1+2+1+2=6. Correct.

  Pathfinding implementation in `usePathfinding.ts:96-102` also correctly alternates: `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity`. The parity state tracks which diagonal step is next.
- **Classification:** Correct

### R006 — Adjacency Definition

- **Rule:** "Two combatants are Adjacent if any squares they occupy touch, even corners (diagonal). Cardinally Adjacent does not count diagonal."
- **Expected behavior:** 8-directional adjacency for general Adjacent; 4-directional for Cardinally Adjacent.
- **Actual behavior:** `usePathfinding.ts:56-60` — 8 directions including diagonals used for movement exploration. `useRangeParser.ts:329-341` — `isInRange` for `cardinally-adjacent` type checks that the closest cells are cardinal (dx=1,dy=0 or dx=0,dy=1). Melee range uses adjacency (Chebyshev distance <= 1). Multi-cell token distance correctly uses `chebyshevDistanceTokens`.
- **Classification:** Correct

### R007 — No Split Movement

- **Rule:** "You may not split up a Shift Action."
- **Expected behavior:** Single continuous move, no split.
- **Actual behavior:** Movement is a single drag-and-drop operation. `useGridInteraction.ts` (C013) and `useIsometricInteraction.ts` (C023) handle token movement as one atomic action — drag from A, drop at B. No mechanism exists to interrupt movement with a standard action and continue.
- **Classification:** Correct

---
