# Player View Encounter Tab

Accessed from the [[player-view-bottom-navigation]]. Displays the active encounter from the player's perspective, corresponding to the GM's [[encounter-combat-flow]]. Three main areas stacked vertically:

1. **Encounter header** — shows the encounter name (e.g. "Route Forest: Wild Oddish"), a round badge (e.g. "Round 1" in a pink/red pill), and the current turn indicator ("Current Turn: Oddish" with the active combatant's name in bold)
2. [[player-view-encounter-vtt-map]] — an interactive grid map with token sprites
3. **Participant lists** — [[player-view-encounter-player-list]] and [[player-view-encounter-enemy-list]] under separate headings

If the selected character is not a combatant, the tab renders a [[player-encounter-tab-shows-spectator-view-for-non-participants|spectator-only view]] without the action panel.
