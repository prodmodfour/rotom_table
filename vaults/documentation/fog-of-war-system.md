# Fog of War System

Three-state fog model per grid cell in the [[encounter-grid-state|fog of war store]] (`fogOfWar`):

1. **Hidden** — Cell not yet seen. Tokens on hidden cells invisible to players.
2. **Revealed** — Cell currently visible. Tokens visible to all.
3. **Explored** — Previously revealed, now hidden again. Tokens on explored cells hidden from players.

GM sees all three states with distinct visual indicators and can edit any cell's state. Players and group view see only revealed cells; hidden and explored cells are obscured.

State is persisted via dedicated fog GET/PUT endpoints on the encounter (see [[vtt-grid-persistence-apis]]). The [[debounced-persistence|debounced save pattern]] prevents excessive API calls during brush painting.

The fog brush uses a circle of cells based on brush size, which differs from the [[measurement-aoe-modes|measurement burst]] that uses PTU diagonal distance.

## See also

- [[player-grid-interaction]] — fog filtering for player-visible tokens
- [[vision-capability-system]] — Darkvision/Blindsense interaction with fog
- [[map-reactivity-gotcha]] — `Map<string, T>` reactivity for fog state
