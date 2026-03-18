# Player Action Discriminated Union

A potential redesign to address the [[player-action-request-optionals|20-optional-field PlayerActionRequest type]].

## The idea

Replace the bag-of-optionals with a discriminated union on the `action` field, following the same pattern used successfully by the [[websocket-union-extensibility|WebSocketEvent type]]. Each action variant carries only its relevant fields:

```
type PlayerMoveAction = { action: 'move'; combatantId: string; moveIndex: number; targetIds: string[]; damageRolls: ... }
type PlayerCaptureAction = { action: 'capture'; combatantId: string; targetPokemonId: string; ballType: string; ... }
type PlayerBreatherAction = { action: 'breather'; combatantId: string; assisted: boolean }
type PlayerHealAction = { action: 'heal'; combatantId: string; healingItemName: string; healingTargetId: string }
...
type PlayerActionRequest = PlayerMoveAction | PlayerCaptureAction | PlayerBreatherAction | PlayerHealAction | ...
```

## Principles improved

- [[interface-segregation-principle]] — each handler receives only the fields relevant to its action type
- [[open-closed-principle]] — adding a new action type means adding a new union member, not adding optional fields to a shared bag
- Type safety — impossible field combinations become compile-time errors

## Patterns and techniques

- Discriminated union pattern (see [[typescript-pattern-techniques]])
- Mirrors the proven [[websocket-union-extensibility|WebSocketEvent]] approach already in the codebase

## Trade-offs

- More type definitions to write and maintain (one per action variant)
- Handlers must narrow (`switch (request.action)`) before accessing fields — but they already do this with the current design
- WebSocket serialization/deserialization must handle the union correctly
- The number of action variants needs auditing — if there are 15+, the union file becomes large

## Open questions

- How many distinct action types currently exist? Are some similar enough to merge?
- Should the response type (`PlayerActionAck`) also become a discriminated union?
- Does the player WebSocket handler currently rely on the bag-of-optionals flexibility for any reason (e.g., partial updates)?

## See also

- [[websocket-event-union]] — the existing 53-member discriminated union to use as a reference implementation
- [[primitive-obsession-smell]] — the smell this addresses
