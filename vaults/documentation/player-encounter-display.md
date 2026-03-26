# Player Encounter Display

`PlayerEncounterView.vue` is the Encounter tab. It shows the active encounter from the player's perspective.

## Layout

Displays encounter name, round number, and current turn indicator. Combatants are grouped by side (players, allies, enemies). Each combatant is rendered as a `PlayerCombatantInfo` card following [[combatant-card-visibility-rules]].

When it is the player's turn, the [[player-combat-action-panel]] appears. When the grid is enabled, [[player-grid-interaction|PlayerGridView]] is integrated. Shows a waiting state when no active encounter exists. Auto-scrolls to the current combatant when the turn changes.

## PlayerCombatantInfo

Displays a combatant with visibility rules based on ownership:
- **Own:** exact HP, stats, moves, traits, injuries. Teal border.
- **Allied:** exact HP, injuries only.
- **Enemy:** percentage HP only — no exact values, no stats, no injuries.

Shows sprite for Pokemon, avatar initial for trainers. Displays current turn badge (scarlet border), type badges, and status conditions. Fainted combatants are dimmed.

## See also

- [[combatant-card-visibility-rules]]
- [[player-combat-composable]] — isMyTurn detection
- [[encounter-serving-mechanics]] — how the encounter reaches the player
