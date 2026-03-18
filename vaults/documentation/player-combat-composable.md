# Player Combat Composable

`usePlayerCombat` is the central combat composable for the player view. It powers the [[player-combat-action-panel]].

## Turn Detection

`isMyTurn` returns true when the current combatant's `entityId` matches the player's character ID or any of their `pokemonIds` from the [[player-identity-system|playerIdentity store]].

## Move Availability

`isMoveExhausted()` checks whether a move has reached its [[move-frequency-system|frequency limit]]:
- At-Will — never exhausted.
- EOT — can't use if used last turn.
- Scene / Scene x2 / Scene x3 — per-scene usage tracking.
- Daily / Daily x2 / Daily x3 — per-day usage tracking.
- Static — always exhausted (passive only).

Returns `{ exhausted: boolean, reason: string }`.

## Direct Actions

Execute immediately without GM approval:
- `executeMove(combatantId, moveId, targetIds)` — executes a Pokemon move.
- `useShiftAction()` — marks the shift action as used.
- `useStruggle(targetIds)` — executes the Struggle attack.
- `passTurn()` — calls `encounterStore.nextTurn()`.

All throw if it is not the player's turn.

## Requested Actions

Require GM approval, sent via [[player-websocket-composable|WebSocket]] `player_action` events with a generated `requestId`:
- `requestUseItem(itemId, itemName)`
- `requestSwitchPokemon(pokemonId)`
- `requestManeuver(maneuverId, maneuverName)`

## Computed Helpers

- `validTargets` — all non-fainted combatants.
- `switchablePokemon` — player's non-fainted Pokemon excluding the active combatant.
- `trainerInventory` — items with quantity > 0.
- `canBeCommanded` — false when a newly switched-in Pokemon cannot act this turn (league battles).
- `isLeagueBattle` / `isTrainerPhase` / `isPokemonPhase` — [[battle-modes|league battle]] phase detection.

## WebSocket Integration

Uses provide/inject for the shared WebSocket send function, provided by the [[player-page-orchestration|player page]].

## See also

- [[player-combat-action-panel]] — the UI component this composable powers
- [[player-websocket-composable]] — WebSocket send/receive
- [[player-capture-healing-interface]] — related request pattern for captures/healing
