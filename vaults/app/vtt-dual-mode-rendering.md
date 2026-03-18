# VTT Dual-Mode Rendering

The VTT supports two rendering modes controlled by the `isometric` boolean on [[grid-config-type]]: a flat 2D grid and an isometric 2.5D grid.

[[vtt-container-orchestrates-toolbars-and-canvas]] switches between the two at the template level — `GridCanvas` for [[flat-grid-uses-canvas-plus-dom-tokens]], `IsometricCanvas` for [[isometric-canvas-renders-everything-on-canvas]]. The two modes share movement logic ([[grid-movement-selects-speed-by-terrain]]), pathfinding ([[pathfinding-uses-flood-fill-with-ptu-diagonal-costs]]), and Pinia stores (fog, terrain, measurement, selection), but have separate rendering and interaction composables.

The [[battle-grid-settings-panel]] exposes the isometric toggle as a checkbox. Switching mode re-renders the entire canvas without changing encounter data.
