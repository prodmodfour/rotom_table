# Hold, Priority, and Interrupt System

Out-of-turn actions: holding turns, priority declarations, and interrupts.

## Hold

`POST .../hold-action` — PTR p.227. Validates: not acted, not held this round. Adds to `holdQueue`, advances turn.

`POST .../release-hold` — inserts combatant at current turn position with full action economy, removes from `holdQueue`, splices into `turnOrder`.

## Priority

`POST .../priority` — three tiers:

- **Standard**: inserts full turn, removes original.
- **Limited**: consumes Standard Action, rest at normal initiative.
- **Advanced**: consumes Standard Action, forfeits next round if already acted.

Returns `turnInserted` / `skipNextRound` flags.

## Interrupt

`POST .../interrupt` — direct resolve (accept/decline) or creates pending `OutOfTurnAction` for GM. In [[battle-modes|League Battles]], uncommandable Pokemon forfeit next round turn on accept.

## Components

`HoldActionButton.vue` — hold action dialog with target initiative input, confirm/cancel; shown on current combatant's turn when eligible.

`PriorityActionPanel.vue` — between-turns Priority declaration listing eligible combatants with Standard/Limited/Advanced buttons plus "No Priority — Continue" proceed; shown via `betweenTurns` store state.

## Store

Encounter getters: `holdQueue`, `isBetweenTurns`, `holdingCombatants`, `pendingInterrupts`, `priorityEligibleCombatants`. Actions: `holdAction`, `releaseHold`, `declarePriority`, `enterBetweenTurns`, `exitBetweenTurns`, `declareInterrupt`.

## Types

`HoldActionState`, `InterruptTrigger` in `types/combat.ts`.

## Model Fields

`holdQueue` (JSON, cleared per round), `skipNextRound` on Combatant.

## WebSocket

`hold_action`, `hold_released`, `priority_declared`, `interrupt_triggered`.

## See also

- [[turn-lifecycle]]
- [[attack-of-opportunity-system]]
