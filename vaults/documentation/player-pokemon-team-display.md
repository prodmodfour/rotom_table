# Player Pokemon Team Display

The Team tab shows the player's Pokemon party as a list of collapsible cards.

## PlayerPokemonTeam

Container component rendering a `PlayerPokemonCard` for each Pokemon. Shows an empty state with PawPrint icon when the team is empty. Highlights the active Pokemon via `activePokemonId`.

## PlayerPokemonCard

Each card has a collapsed summary and expandable details.

**Summary:** sprite, nickname/species, type badges, level, HP bar.

**Expanded details:** status conditions, held item, 6-stat grid with stage modifiers, traits (name + effect text), moves (via `PlayerMoveList`), and [[movement-trait-types|movement traits]] (Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter).

Active Pokemon is highlighted with a teal badge. Fainted Pokemon are dimmed.

## PlayerMoveList

Displays moves with type badge, name, damage class, DB, AC, and energy cost. Each move is clickable to expand and show range and effect text. Used for reference only — combat move execution happens through the [[player-combat-action-panel]].

## See also

- [[player-view-architecture]]
- [[player-identity-system]] — provides the Pokemon data
