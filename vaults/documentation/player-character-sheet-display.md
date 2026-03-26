# Player Character Sheet Display

`PlayerCharacterSheet.vue` renders the player's character data in collapsible sections.

## Sections

Six sections, each togglable via header button with `aria-expanded` and `aria-controls`:
- **Stats** (default open) — 6-stat grid with stage modifiers.
- **Combat** (default open) — evasions, injuries, temp HP, status conditions.
- **Skills** (default closed) — alphabetically sorted.
- **Traits** (default closed) — trait lists.
- **Equipment** (default closed) — 6 equipment slots.
- **Inventory** (default closed) — items with quantities and money.

## HP Display

HP percentage (0–100) maps to color classes: healthy (>50%), warning (25–50%), critical (<25%). The HP bar in the header uses these classes.

## Evasion Computation

Physical, special, and speed evasion values are calculated using `calculateEvasion()` from damage-calculation utils. Incorporates [[equipment-bonus-aggregation|equipment bonuses]] from `computeEquipmentBonuses()` — evasion bonus from equipment. Uses calculated stats per [[evasion-from-defensive-stats]] (not base stats).

## See also

- [[player-view-architecture]]
- [[player-identity-system]] — provides the character data
- [[evasion-and-accuracy-system]]
- [[equipment-system]]
