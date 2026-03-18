Three combatant card variants serve different audiences with different levels of information visibility.

## CombatantCard (GM)

Full control card displaying: name, sprite, exact HP bar, status conditions, combat stages, turn indicator, and inline controls for damage, healing, move execution, stage editing, and equipment bonuses (for human combatants).

## GroupCombatantCard (Group/Projector)

Read-only card for the shared display showing: HP bar, sprite, name, and status conditions. No editing controls.

## PlayerCombatantCard (Player)

Player-facing card with visibility awareness:

- **Own combatants** — exact HP values displayed.
- **Enemy combatants** — HP shown as a percentage only (no exact numbers).
- **Status conditions** — visible for all combatants.

## See also

- [[triple-view-system]] — the three-audience architecture
- [[encounter-serving-mechanics]] — how the encounter reaches group/player views
- [[player-view-architecture]] — the player view that uses PlayerCombatantCard
- [[player-encounter-display]] — PlayerCombatantInfo component implementing these rules
- [[player-grid-interaction]] — info asymmetry levels (full/allied/enemy) on the grid
