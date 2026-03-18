# Flat Grid Uses Canvas Plus DOM Tokens

The 2D flat grid (`GridCanvas.vue`) uses a hybrid rendering approach. An HTML `<canvas>` element draws the grid lines, terrain cells, movement range highlights, measurement overlays, fog of war, and movement preview arrows via `useGridRendering`. A DOM `<div>` overlay positioned on top of the canvas renders [[battle-grid-token-sprites]] as `VTTToken` components and [[mounted-token-renders-rider-overlay]] pairs as `VTTMountedToken` components.

This hybrid approach means tokens are real DOM elements with CSS classes for states like selected, flanked, current turn, and fainted. Mouse and keyboard interaction is handled by `useGridInteraction`, which converts screen coordinates to grid coordinates using the flat cell-size math.

A [[marquee-selection-overlay]] appears during rubber-band multi-selection.

## See also

- [[vtt-dual-mode-rendering]] — this is one of the two rendering modes
- [[isometric-canvas-renders-everything-on-canvas]] — the alternative approach
