# Group View Wild Spawn Overlay

A full-screen overlay that appears on the [[group-view-lobby-tab]] and [[group-view-encounter-tab]] when a wild spawn preview is active. The overlay covers the entire viewport with an 85% opaque black backdrop and blur.

The overlay shows a card containing:
- "WILD POKEMON APPEARED!" as a gradient-text title with an alternating glow animation.
- A subtitle with the encounter table name that sourced the spawn.
- A flex grid of Pokemon slots, each showing a sprite inside a circular teal radial glow, a level badge in scarlet, and the species name.

Pokemon slots animate in with a staggered pop effect — each slot delays 0.1 seconds longer than the previous one (scale from 0.5 to 1.1 then 1.0). The entire card uses a scale-up entrance animation. The overlay fades in over 0.3 seconds and fades out over 0.5 seconds.

## See also

- [[group-view-layout-optimized-for-tv]] — sprites and text scale up at 4K
- [[group-view-store-manages-wild-spawn-and-map]] — the store that fetches and holds wild spawn state
