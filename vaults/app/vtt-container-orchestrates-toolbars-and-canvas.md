# VTT Container Orchestrates Toolbars and Canvas

`VTTContainer.vue` is the top-level VTT component. It renders the [[battle-grid]] header (dimensions, selection counter, settings, gridlines toggle), then stacks the toolbars vertically: [[battle-grid-measurement-toolbar]], [[battle-grid-fog-of-war-controls]], and conditionally the elevation toolbar and [[terrain-painter-supports-four-tool-modes]] (isometric mode only, GM only). Below the toolbars it renders either `GridCanvas` or `IsometricCanvas` based on the [[vtt-dual-mode-rendering]] config flag.

The container also manages fog and terrain auto-persistence ([[fog-and-terrain-auto-save-with-debounce]]), background image upload, the [[battle-grid-token-selection-panel]], and flanking state propagation.
