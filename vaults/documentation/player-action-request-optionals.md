# Player Action Request Optionals

The `PlayerActionRequest` type in `types/player-sync.ts` has 26 fields where 20 are optional. Different action types use different field subsets:

- **Capture actions** use `targetPokemonId`, `ballType`, `captureRatePreview`
- **Breather actions** use `combatantId`, `assisted`
- **Healing actions** use `healingItemName`, `healingTargetId`
- **Move actions** use `moveIndex`, `targetIds`, `damageRolls`

Consumers must inspect the `action` discriminant and trust that the right optional fields are present — there is no compile-time guarantee that a capture request actually carries `ballType`. This violates the [[interface-segregation-principle]] — every handler receives 20+ fields it doesn't use — and introduces the risk of impossible field combinations at runtime.

A proper discriminated union per action type (like the well-designed [[websocket-union-extensibility|WebSocketEvent union]]) would make each variant self-documenting and eliminate impossible states. This is also an instance of the [[primitive-obsession-smell]]: using a bag of optional primitives where a structured type would be safer.

## See also

- [[websocket-union-extensibility]] — the same codebase's example of doing this correctly
- [[data-class-smell]] — the type carries data without enforcing its own invariants
- [[player-action-discriminated-union]] — a potential redesign using a discriminated union
