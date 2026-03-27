# Encounter Lifecycle State Machine

A destructive restructuring to replace the encounter's implicit lifecycle with an explicit finite state machine that makes illegal state transitions unrepresentable.

## The idea

The encounter lifecycle is currently implicit. An encounter's "phase" is an emergent property of its data — is `turnOrder` populated? Is `currentTurn` set? Are there pending declarations? Different routes check different subsets of these fields, and guards against invalid transitions are scattered, inconsistent, and incomplete.

Model the encounter lifecycle as an explicit state machine with declared states, transitions, and guards:

```typescript
type EncounterPhase =
  | { phase: 'SETUP'; combatants: Combatant[] }
  | { phase: 'DECLARATION'; round: number; declarations: Map<string, Declaration>; remaining: string[] }
  | { phase: 'RESOLUTION'; round: number; turnOrder: string[]; currentTurn: number }
  | { phase: 'BETWEEN_TURNS'; currentActor: string; pendingActions: Action[] }
  | { phase: 'OUT_OF_TURN'; trigger: OutOfTurnTrigger; resolver: string }
  | { phase: 'ROUND_END'; round: number; automations: PendingAutomation[] }
  | { phase: 'ENDED'; result: EncounterResult }

type EncounterTransition =
  | { type: 'ADD_COMBATANT'; combatant: Combatant }         // SETUP → SETUP
  | { type: 'START_ENCOUNTER' }                               // SETUP → DECLARATION
  | { type: 'DECLARE_MOVE'; combatantId: string; move: Move } // DECLARATION → DECLARATION
  | { type: 'ALL_DECLARED' }                                  // DECLARATION → RESOLUTION
  | { type: 'RESOLVE_TURN' }                                  // RESOLUTION → BETWEEN_TURNS
  | { type: 'NEXT_TURN' }                                     // BETWEEN_TURNS → RESOLUTION
  | { type: 'TRIGGER_OOT'; trigger: OutOfTurnTrigger }       // RESOLUTION → OUT_OF_TURN
  | { type: 'RESOLVE_OOT' }                                  // OUT_OF_TURN → RESOLUTION
  | { type: 'END_ROUND' }                                     // RESOLUTION → ROUND_END
  | { type: 'NEW_ROUND' }                                     // ROUND_END → DECLARATION
  | { type: 'END_ENCOUNTER' }                                 // any → ENDED
```

Every transition has explicit guards. A `DECLARE_MOVE` in `RESOLUTION` phase is a type error, not a runtime bug. API routes check the encounter's phase before acting — or the state machine rejects invalid transitions automatically.

## Why this is destructive

- The Encounter data model gains a `phase` discriminant that replaces all implicit lifecycle inference
- All 44 encounter routes must validate transitions against the state machine instead of ad-hoc field checks
- The encounter store is restructured around phases — each phase has its own set of valid actions
- Services like `out-of-turn.service.ts` and `switching.service.ts` are constrained to specific phases
- The 846-line `next-turn.post.ts` route is decomposed — each transition becomes a separate handler
- The WebSocket protocol changes to broadcast state transitions, not raw state

## Principles improved

- [[state-pattern]] — the encounter delegates behavior to its current phase object
- [[single-responsibility-principle]] — each phase handler knows only about its phase
- [[open-closed-principle]] — new phases can be added without modifying existing ones
- [[liskov-substitution-principle]] — all phases implement the same transition interface
- Eliminates the [[switch-statements-smell]] — phase-specific behavior is dispatched by the machine, not by conditionals
- Eliminates the [[temporary-field-smell]] — fields like `declarations` only exist in the `DECLARATION` phase, not as nullable fields on all encounters

## Patterns and techniques

- [[state-pattern]] — the core pattern
- [[strategy-pattern]] — each phase is a strategy for handling transitions
- [[template-method-pattern]] — phases share common structure (validate → apply → emit) with phase-specific overrides
- [[replace-type-code-with-state-strategy]] — the refactoring technique
- TypeScript discriminated unions — the phase type makes illegal states unrepresentable at compile time

## Trade-offs

- **Encounter complexity.** PTR encounters are not simple linear state machines. Out-of-turn actions, held actions, interrupts, and priority moves create deeply nested states. The machine may need hierarchical states (states within states), adding significant complexity.
- **Phase granularity.** Too few phases (`SETUP`, `ACTIVE`, `ENDED`) don't improve on the current approach. Too many (20+) make the machine hard to reason about. Finding the right granularity is a design challenge.
- **Persistence.** Storing the phase discriminant is simple, but storing hierarchical state (encounter is in `RESOLUTION` → `OUT_OF_TURN` → `INTERCEPT`) requires careful serialization.
- **Migration.** Existing encounters have no phase field. A migration must infer the current phase from existing data — exactly the kind of implicit-to-explicit conversion that surfaces edge cases.
- **Framework choice.** A hand-rolled machine with discriminated unions is simpler but lacks visualization, debugging, and guard composition. A library like XState adds dependencies and a learning curve.

## Open questions

- Should this use a state machine library (XState) or hand-rolled TypeScript discriminated unions?
- How to handle hierarchical states (out-of-turn actions within turn resolution)?
- Does the state machine live on the server only (with the client reflecting phase), or on both sides?
- How does this interact with [[event-sourced-encounter-state]]? Event sourcing + state machine is a powerful combination (events are transitions, state is computed), but also maximal complexity.
- What happens to routes that currently work in "any" phase (e.g., updating combatant notes, adjusting HP manually)?

## See also

- [[state-pattern]] — the design pattern
- [[switch-statements-smell]] — the smell this eliminates
- [[event-sourced-encounter-state]] — a compatible destructive proposal where events are state transitions
