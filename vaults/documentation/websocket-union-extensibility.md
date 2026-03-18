# WebSocket Union Extensibility

The `WebSocketEvent` type in `types/api.ts` is a 53-member discriminated union on the `type` field. Adding a new event requires only adding a new union member — no existing code needs modification. TypeScript's exhaustiveness checking ensures all switch-based handlers are updated at compile time.

This follows the [[open-closed-principle]]: open for extension (new event types), closed for modification (existing handlers untouched). The same well-designed pattern appears in `EnvironmentEffect` (5 variants) in `types/encounter.ts`.

This is the strongest [[open-closed-principle]] adherence point in the codebase — discriminated unions are TypeScript's primary mechanism for type-safe extensibility.

## See also

- [[websocket-event-union]] — the architectural documentation of this type
- [[typescript-pattern-techniques]] — discriminated unions as a TypeScript pattern enabler
- [[strategy-pattern]] — each event handler acts as a strategy for its event type
- [[player-action-request-optionals]] — contrast with a type that should be a discriminated union but isn't
