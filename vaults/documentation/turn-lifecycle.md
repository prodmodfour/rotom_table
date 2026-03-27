# Turn Lifecycle

Combat encounters follow 5 phases:

1. **Declaration** (`currentPhase === 'trainer_declaration'`, [[battle-modes|League]] only) — `DeclarationPanel` collects declarations, store calls `POST /declare`.
2. **Priority Window** (`betweenTurns === true`) — `PriorityActionPanel` after `nextTurn()`. GM declares priority or continues.
3. **Action Phase** (`currentPhase === 'pokemon'` or `'trainer_resolution'`) — `GMActionModal` hub: Standard/Shift/Swift actions, moves, maneuvers.
4. **Out-of-Turn Interrupts** — `AoOPrompt` / `InterceptPrompt` triggered by out-of-turn and intercept services.
5. **Turn End** — `encounterStore.nextTurn()` calls `POST /next-turn`. Server runs weather-automation (Hail/Sandstorm tick) then status-automation (Burn/Poison tick), advances `currentTurnIndex`.

## See also

- [[battle-modes]]
- [[damage-flow-pipeline]]
- [[initiative-and-turn-order]] — how combatant ordering is determined
- [[take-a-breather-mechanics]] — Full Action available during the action phase
- [[energy-for-extra-movement]] — spend 5 Energy for additional movement
- [[combat-maneuver-catalog]] — maneuvers available during the action phase
- [[status-condition-categories]] — condition categories affected by turn-end automation
- [[declaration-system]] — the declaration phase endpoint, components, and WebSocket events
