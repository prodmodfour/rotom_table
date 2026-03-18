# Player Combat Action Panel

`PlayerCombatActions.vue` appears when it is the player's turn. Provides the full PTU combat interface on the player's device.

## Turn State Banner

Shows action pips for STD (Standard), SHF (Shift), and SWF (Swift) actions. Each pip indicates used/available state.

## League Battle

In [[battle-modes|league battles]], a phase indicator shows the current phase (trainer declaration, trainer resolution, or pokemon). The `canBeCommanded` check prevents issuing moves to a Pokemon that was just switched in this turn (PTU p.227).

## Move Buttons

Move buttons display type badge, DB, AC, and frequency. Tapping a move opens the target selection overlay. Long-press (500ms touch) or right-click opens the move detail overlay showing range and full effect text.

## Target Selection Overlay

Shows all valid (non-fainted) targets grouped by side. Player toggles target buttons to select multiple targets. Confirm sends the move execution; Cancel dismisses.

## Core Actions

Direct actions that execute immediately without GM approval:
- **Shift** — marks shift action as used.
- **Struggle** — executes the Struggle attack as a standard action.
- **Pass Turn** — ends the turn (requires confirmation dialog).

## Request Actions

Actions requiring GM approval via [[player-websocket-composable|WebSocket]]:
- **Use Item** — expandable panel listing [[player-combat-composable|trainerInventory]] items.
- **Switch Pokemon** — expandable panel listing [[player-combat-composable|switchablePokemon]].
- **Maneuver** — expandable panel for PTU maneuvers (Push, Sprint, Trip, Grapple, Intercept, Take a Breather).

Toast notifications display GM acknowledgment results.

## See also

- [[player-combat-composable]] — the composable backing this panel
- [[player-capture-healing-interface]] — capture/healing requests use the same pattern
- [[combat-maneuver-catalog]]
- [[move-frequency-system]]
