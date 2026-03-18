# Group Grid Canvas Provides Read-Only Spectating

`GroupGridCanvas.vue` wraps either `GridCanvas` or `IsometricCanvas` with `isGm=false` to provide a read-only spectator view used by the [[group-view-encounter-tab]] and [[player-view-encounter-vtt-map]]. It receives an external movement preview from WebSocket so players can see token movements as they happen.

The group canvas renders the same grid state as the GM view but with fog of war enforced — tokens in hidden cells are not visible to players.

## See also

- [[vtt-dual-mode-rendering]] — determines which canvas mode the group view wraps
- [[player-grid-filters-by-ownership-and-fog]] — the ownership and fog filtering logic
