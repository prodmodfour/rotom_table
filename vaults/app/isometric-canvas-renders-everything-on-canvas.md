# Isometric Canvas Renders Everything on Canvas

The isometric grid (`IsometricCanvas.vue`) renders everything — grid diamonds, terrain, tokens, fog, measurement overlays — on a single HTML `<canvas>`. There are no DOM-based token elements; sprites are drawn directly onto the canvas by `useIsometricRendering`.

This pure-canvas approach is necessary because isometric tiles are diamond-shaped and depth-sorted, so tokens must participate in the [[isometric-depth-sorting-uses-painters-algorithm]] alongside terrain and fog layers. The coordinate math is handled by [[isometric-projection-transforms-world-to-screen]], and [[isometric-camera-rotates-cardinal-directions]] enables viewing from four directions.

The component also mounts `CameraControls` (rotation CW/CCW) and [[battle-grid-zoom-controls]], plus a [[battle-grid-coordinate-display]] that includes elevation (Z) in isometric mode.

## See also

- [[vtt-dual-mode-rendering]] — this is one of the two rendering modes
- [[flat-grid-uses-canvas-plus-dom-tokens]] — the alternative approach
