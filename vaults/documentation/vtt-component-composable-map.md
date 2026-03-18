# VTT Component-Composable Map

How the 15 [[vtt-rendering-pipeline|VTT components]] wire to [[composable-domain-grouping|composables]] and [[pinia-store-classification|stores]]:

| Component (lines) | Composables | Stores |
|---|---|---|
| VTTContainer (644) | useFogPersistence, useTerrainPersistence, useCombatantDisplay | selection, measurement, fogOfWar, terrain |
| GridCanvas (521) | useGridMovement, useGridRendering, useGridInteraction, useFlankingDetection | selection, measurement |
| IsometricCanvas (440) | useIsometricCamera, useIsometricRendering, useIsometricInteraction, useGridMovement, useElevation, useRangeParser | fogOfWar, terrain, measurement |
| VTTToken (447) | usePokemonSprite, useTrainerSprite | (none) |
| TerrainPainter (595) | (none) | terrain |
| GridSettingsPanel (293) | (none) | (none) |
| MapUploader (348) | (none) | (none) |
| MeasurementToolbar (274) | (none) | (none) |
| FogOfWarToolbar (268) | (none) | (none) |
| ElevationToolbar (250) | (none) | (none) |
| GroupGridCanvas (140) | (none) | (none) |
| CameraControls (105) | (none) | (none) |
| ZoomControls (85) | (none) | (none) |
| VTTMountedToken (277) | (none) | encounter |
| CoordinateDisplay (60) | (none) | (none) |

DOM vs canvas tokens: 2D `GridCanvas` renders `VTTToken` as DOM elements over the canvas; `IsometricCanvas` draws tokens directly on canvas. Different click/hit-test paths.

Fog brush uses brush-size (circle of cells); measurement burst uses PTU distance. Different radius calculations despite similar UI.

## See also

- [[composable-dependency-chains]]
- [[test-coverage-gaps]]
