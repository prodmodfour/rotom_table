# Fog of War Tracks Three Cell States

The `fogOfWar` Pinia store tracks each cell as one of three states: `hidden` (fully obscured), `revealed` (fully visible), or `explored` (previously seen but currently in fog — shown dimmed). The GM can paint these states with the tools in [[battle-grid-fog-of-war-controls]].

Fog painting uses Chebyshev distance from the brush center, so a brush size of 2 affects a 5×5 area. Multi-cell token footprints ([[token-size-maps-to-grid-footprint]]) are auto-revealed when a token's area is revealed.

In the GM view, fog renders as a semi-transparent overlay so the GM can see what's underneath. In the player view ([[player-view-encounter-vtt-map]]), hidden cells are fully opaque and tokens in hidden cells are not visible.

## See also

- [[fog-and-terrain-auto-save-with-debounce]] — fog state persists to the server
- [[player-grid-filters-by-ownership-and-fog]] — how fog affects what players see


- [[spatial-stores-share-map-with-xy-key-pattern]] — the Map\<string, T\> pattern shared with terrain
- [[all-stores-use-pinia-options-api]]