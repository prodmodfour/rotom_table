# Group View Combatant Details Panel

The right sidebar in the [[group-view-encounter-tab]] shows detailed information about the current turn combatant. It is 320px wide (450px at 4K).

The panel header shows the combatant sprite or avatar, name, and a side badge (Player/Ally/Enemy) color-coded by side.

For Pokemon, type badges appear below the header.

The HP bar displays exact values (current/effective max) for player-side combatants and percentage only for enemies. When a combatant has injuries, the original max HP appears struck through next to the effective max. HP coloring uses the same four tiers as the [[group-view-initiative-tracker]].

Injuries are shown as a count with red circular pips.

Player-side combatants additionally display:
- A five-column stat grid (ATK, DEF, SP.ATK, SP.DEF, SPD)
- Abilities as teal-colored tags (Pokemon only)
- Moves as type-colored cards showing name, damage class (Physical/Special/Status), damage base, accuracy check, and frequency (Pokemon only)
- Combat stages — only non-zero stages appear, colored green for positive and red for negative

Status conditions appear for all combatants as colored tags matching their condition type (burn=fire, frozen=ice, paralyzed=electric, etc.).

A flanking badge appears when the combatant is flanked.

## See also

- [[group-view-initiative-tracker]] — the left sidebar listing all combatants in order
- [[group-view-layout-optimized-for-tv]] — sprite and panel dimensions scale at 4K