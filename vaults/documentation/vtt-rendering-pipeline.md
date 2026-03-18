# VTT Rendering Pipeline

`VTTContainer` (644 lines) is the root orchestrator. It selects between two rendering pipelines based on `config.isometric`:

- **2D Pipeline:** `GridCanvas` draws grid/fog/terrain/measurement on `<canvas>`, then overlays DOM-based `VTTToken` elements in a `token-layer` div. Supports marquee selection overlay.
- **Isometric Pipeline:** `IsometricCanvas` renders everything (grid, tokens, sprites) on a single `<canvas>` — no VTTToken DOM elements. Uses [[isometric-camera-system|CameraControls]] for rotation. Rendering uses [[depth-sorting-layers|painter's algorithm]] and [[isometric-projection-math|isometric coordinate transforms]].
- **Group View:** `GroupGridCanvas` wraps either pipeline in read-only mode (`is-gm="false"`, no event handlers).

The `activeCanvasRef` pattern: VTTContainer uses a computed ref switching between `gridCanvasRef`/`isometricCanvasRef` to call `.render()` and `.resetView()` generically.

See [[three-coordinate-spaces]] for how positions translate between systems. See [[vtt-component-composable-map]] for component wiring.

## See also

- [[multi-cell-token-footprint]]
- [[ptu-movement-rules-in-vtt]]
- [[encounter-grid-state]] — the stores backing both pipelines
- [[elevation-system]] — vertical positioning in isometric mode
