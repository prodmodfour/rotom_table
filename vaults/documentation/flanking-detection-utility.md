# Flanking Detection Utility

PTU p.232 flanking geometry in `utils/flankingGeometry.ts`. Pure functions with no Vue dependencies.

**Constants:** NEIGHBOR_OFFSETS, FLANKING_FOES_REQUIRED (size-to-count map), FLANKING_EVASION_PENALTY.

**Pure functions:** getOccupiedCells, getAdjacentCells, areAdjacent, checkFlanking (1x1 targets), checkFlankingMultiTile ([[multi-cell-token-footprint|multi-tile]] targets), countAdjacentAttackerCells (multi-tile attacker counting), findIndependentSet (non-adjacent foe selection).

**VTT composable:** `useFlankingDetection.ts` — reactive FlankingMap from combatant positions. Exposes `isTargetFlanked` and `getFlankingPenalty`. Used by `GridCanvas.vue` to pass `isFlanked` prop to `VTTToken` and expose `getFlankingPenalty` for accuracy calculation.

**Component integration:** `VTTToken.vue` `isFlanked` prop drives a CSS pulsing dashed border via the `--flanked` class.

## See also

- [[vtt-component-composable-map]]
