# Flanking Detection Scales with Token Size

`useFlankingDetection` reactively computes whether combatants are flanked. The flanking threshold scales with token size per PTU p.232: a 1×1 token needs 2 enemy foes in opposite adjacent cells, a 2×2 (Large) needs 3, a 3×3 (Huge) needs 4, and a 4×4 (Gigantic) needs 5.

The geometry check in `utils/flankingGeometry.ts` (`checkFlankingMultiTile`) considers all cells adjacent to the token's footprint ([[token-size-maps-to-grid-footprint]]) and counts qualifying enemy occupants. Foes must be on opposite sides of the footprint.

When flanking status changes, a callback fires to broadcast the update via WebSocket so the [[player-view-encounter-vtt-map]] can reflect it. Flanked tokens receive the `vtt-token--flanked` CSS class in 2D mode.
