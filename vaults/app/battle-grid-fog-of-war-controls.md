# Battle Grid Fog of War Controls

A toolbar row on the [[battle-grid]] toggled by the "Fog Off"/"Fog On" button. When fog is enabled, the button label changes to "Fog On" and additional controls appear:

- **Reveal** — paint tool to reveal hidden cells (highlighted in pink when active)
- **Hide** — paint tool to hide visible cells
- **Explore** — paint tool for explored-but-dimmed cells
- **Brush:** — a size indicator with **-** and **+** buttons to adjust brush radius
- **Reveal All** / **Hide All** — links to bulk-reveal or bulk-hide the entire grid

The fog layer covers the grid canvas, obscuring tokens and terrain in hidden cells from the player view.

## See also

- [[fog-of-war-tracks-three-cell-states]] — the three cell states (hidden/revealed/explored) this toolbar paints
- [[fog-and-terrain-auto-save-with-debounce]] — fog state auto-persists to the server
