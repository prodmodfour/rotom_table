The app uses a single distance calculation for all purposes: movement costs, attack ranges, ability areas, measurement overlays.

Players and GMs see identical distance values. This prevents confusion from inconsistent metrics and ensures [[player-grid-tools]] give accurate information. There is no separate "ruler" distance vs "game" distance — one formula governs all spatial measurements.

The shared metric is implemented via [[grid-distance-calculation]], which accounts for diagonal movement (alternating 1m, 2m per diagonal) and is used by [[measurement-aoe-modes]] for area previews.

## See also
- [[player-grid-tools]]
- [[grid-distance-calculation]]
- [[measurement-aoe-modes]]
