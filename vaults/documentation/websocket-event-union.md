# WebSocket Event Union

`WebSocketEvent` in `types/api.ts` is a 53-member discriminated union that types every [[websocket-real-time-sync|WebSocket message]] in the system.

It imports from all domain type files (`combat.ts`, `character.ts`, `encounter.ts`, `spatial.ts`, `scene.ts`, `player-sync.ts`) to cover the full event surface.

## See also

- [[type-file-classification]]
- [[combatant-type-hierarchy]]
- [[websocket-union-extensibility]] — how this type follows the open-closed principle
