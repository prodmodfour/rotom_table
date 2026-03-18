# VTT Grid Components

Component inventory for the VTT grid system.

| Component | Purpose |
|---|---|
| `VTTContainer.vue` | Top-level wrapper; switches between 2D and isometric mode |
| `GridCanvas.vue` | 2D canvas with [[flanking-detection-utility|flanking detection]]; exposes `getFlankingPenalty` for accuracy calculation, passes `isTargetFlanked` to VTTToken |
| `IsometricCanvas.vue` | Isometric canvas with elevation wiring |
| `CameraControls.vue` | Rotation buttons for isometric view |
| `ElevationToolbar.vue` | Token and terrain elevation editing toolbar |
| `TerrainPainter.vue` | Terrain type selector, brush size, elevation brush for isometric |
| `VTTToken.vue` | Token display; `isFlanked` prop drives CSS pulsing dashed border |
| `ZoomControls.vue` | Zoom in/out controls |
| `CoordinateDisplay.vue` | Shows current cursor grid coordinates |
| `GridSettingsPanel.vue` | Grid configuration (cell size, dimensions) |
| `FogToolbar.vue` | Fog of war brush controls |
| `TerrainToolbar.vue` | Terrain painting mode toggle |

## See also

- [[vtt-component-composable-map]]
- [[vtt-rendering-pipeline]]
