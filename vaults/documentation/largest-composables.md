# Largest Composables

Composables over 20KB in [[composable-domain-grouping]]:

| File | Size | Notes |
|---|---|---|
| `useMoveCalculation.ts` | 28KB | PTU move resolution: accuracy, damage, STAB, crits, effectiveness |
| `useGridMovement.ts` | 26KB | PTU movement rules, diagonal costs, terrain, [[multi-cell-token-footprint]] |
| `useGridRendering.ts` | 26KB | 2D canvas draw: grid, fog, terrain, measurement overlays |
| `usePathfinding.ts` | 25KB | A* with terrain costs, elevation, multi-cell footprints |
| `useIsometricRendering.ts` | 22KB | Full isometric draw loop with sprite caching |
| `useIsometricInteraction.ts` | 22KB | Isometric mouse/touch input with inverse projection |
| `usePokemonSprite.ts` | 22KB | Showdown sprite URLs with [[showdown-sprite-name-mappings]] |
| `useIsometricOverlays.ts` | 22KB | Isometric fog, terrain, measurement drawing |
| `useGridInteraction.ts` | 20KB | 2D mouse/touch input, pan, zoom, marquee selection |
