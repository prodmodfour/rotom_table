# Battle Grid Token Sprites

Pokemon combatants in the active encounter appear as sprite images on the [[battle-grid]] canvas. Each token shows the Pokemon's pixel art sprite and is clickable.

Clicking a token selects it, showing a label with the Pokemon's name and level (e.g. "Spiritomb Lv.10") above the sprite, and opening the [[battle-grid-token-selection-panel]] below the grid.

Tokens from the encounter's enemy list appear placed on the grid in a row by default when loaded from a template. The sprites match the Pokemon species images used elsewhere in the app.

## See also

- [[player-view-encounter-vtt-map]] — the player side also displays token sprites with click-for-coordinates behavior
- [[vtt-token-displays-combat-state-badges]] — the badges, HP bar, and visual states shown on each token
- [[token-size-maps-to-grid-footprint]] — multi-tile tokens occupy NxN grid cells
- [[mounted-token-renders-rider-overlay]] — mounted pairs render as a combined token
