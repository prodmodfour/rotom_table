# Group View Lobby Player Card

Each card in the [[group-view-lobby-tab]] grid represents one player character. The card has two sections:

**Header** — a gradient-tinted row showing:
- A 64px square avatar with the trainer sprite rendered in pixelated style. If the sprite fails to load, a fallback initial letter is shown instead (the first character of the trainer name on a gradient background).
- The character name and, if assigned, the player name ("played by") below it.
- A level badge on the right (e.g., "Lv 30") styled in violet.

**Team section** — a vertical list of the trainer's Pokemon. Each Pokemon row shows:
- A 48px pixelated sprite (falls back to a placeholder on error).
- Nickname (or species name if no nickname) and level.
- Type pips — small 12px colored circles, one per type.
- An HP bar — a 60px-wide bar that is green above 50%, yellow at 25–50%, red at 0–25%, and collapses to zero width when fainted.

Fainted Pokemon rows are displayed at 50% opacity with partial grayscale. If a trainer has no Pokemon, the team section shows "No Pokemon" in muted italic text.

## See also

- [[group-view-layout-optimized-for-tv]] — at 4K the avatar grows to 96px and sprites to 64px
