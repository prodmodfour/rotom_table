# Battle Grid

The VTT battle grid appears on the GM encounter page (`/gm`) when [[encounter-list-view-grid-view-toggle]] is set to Grid View. It occupies the left portion of the encounter layout.

The grid header shows "Battle Grid" followed by the [[battle-grid-dimensions-display]], and optionally a [[battle-grid-selection-counter]]. The header also has a [[battle-grid-settings-panel]] button and a [[battle-grid-gridlines-toggle]].

Below the header is the [[battle-grid-measurement-toolbar]], then the [[battle-grid-fog-of-war-controls]], and then the grid canvas itself showing [[battle-grid-token-sprites]] on a square grid with visible cell borders.

Below the grid canvas are [[battle-grid-zoom-controls]] and a [[battle-grid-coordinate-display]]. Selecting a token opens the [[battle-grid-token-selection-panel]].

## See also

- [[encounter-combat-flow]] — the battle grid is used during combat resolution
- [[encounter-list-view-grid-view-toggle]] — toggles between this grid and list view
- [[player-view-encounter-vtt-map]] — the player-side equivalent of this grid
- [[encounter-keyboard-shortcuts-dialog]]
- [[vtt-dual-mode-rendering]] — the grid supports flat 2D and isometric 2.5D modes
- [[vtt-container-orchestrates-toolbars-and-canvas]] — the component that assembles the grid UI
- [[touch-interaction-supports-pan-and-pinch]] — mobile touch support for the grid
