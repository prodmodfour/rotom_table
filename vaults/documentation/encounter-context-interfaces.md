# Encounter Context Interfaces

Global combat state shared across all combatants — round tracking, turn order, and the combat event log. Part of the [[game-state-interface]] encounter state layer, alongside [[field-state-interfaces]] and [[deployment-state-model]].

## Round state

```
HasRoundState {
  round: number
  phase: 'declaration' | 'resolution' | 'priority'
  currentTurnIndex: number
}
```

Read by duration countdowns (weather, terrain, blessings expire after N rounds), Flash Fire fizzle timing, and Roar delayed resolution (declares in declaration phase, resolves at end of round). Written by turn advancement.

## Turn order

```
HasTurnOrder {
  turnOrder: CombatantId[]
}
```

The ordered list of combatant IDs for the current round. Written by initiative calculation at round start, Quash (moves target to end by setting initiative to 0), and After You (target goes next). Read by turn resolution and action presentation.

## Combat event log

```
HasCombatLog {
  events: CombatEvent[]
}
```

See [[combat-event-log-schema]] for the full event structure. The log is append-only during combat — events are never modified or deleted. Effects query the log for historical data (Retaliate, Destiny Bond).

## See also

- [[game-state-interface]] — the parent design
- [[field-state-interfaces]] — the other half of encounter state
- [[deployment-state-model]] — per-trainer roster tracking
- [[combat-event-log-schema]] — detailed event struct
- [[turn-lifecycle]] — how rounds and turns advance
