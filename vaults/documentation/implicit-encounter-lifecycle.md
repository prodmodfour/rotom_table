# Implicit Encounter Lifecycle

The encounter's lifecycle phase is never explicitly declared — it is inferred from a combination of data fields. Whether an encounter is in setup, declaration, resolution, out-of-turn, or ended is determined by checking whether `turnOrder` is populated, whether `currentTurn` is set, whether `servedAt` exists, whether there are pending declarations, and so on.

This implicit lifecycle has several consequences:

- **No single source of truth for "what phase are we in?"** Different routes and composables check different field subsets, leading to inconsistent lifecycle inference.
- **No guard against invalid transitions.** A route that should only work during active combat (e.g., deal damage) can technically be called during setup. Guards are manually coded per route, scattered, and incomplete.
- **The 846-line `next-turn.post.ts` route** is essentially a hand-rolled state machine — it checks numerous conditions to determine what should happen next (advance turn, end round, start new round, end encounter), all encoded as nested conditionals rather than explicit transitions.
- **Out-of-turn actions** (AoO, held actions, interrupts, priority moves) create implicit sub-states within the resolution phase. The [[out-of-turn-service-split|out-of-turn service]] manages these sub-states through flags and queues rather than explicit state.

The [[temporary-field-smell]] applies: fields like `declarations`, `holdQueue`, and `pendingActions` are only meaningful during specific phases but exist as nullable fields on all encounters at all times.

## See also

- [[switch-statements-smell]] — phase checks scattered across routes as conditionals
- [[temporary-field-smell]] — phase-specific fields exist on all encounters
- [[state-pattern]] — the pattern that would replace implicit lifecycle inference
- [[out-of-turn-service-split]] — manages implicit sub-states
- [[turn-advancement-service-extraction]] — the route that encodes the implicit state machine
- [[encounter-lifecycle-state-machine]] — a potential restructuring to address this
