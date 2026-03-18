# Composable Architectural Overreach

Vue composables in the app have grown far beyond their intended purpose — encapsulating reusable reactive logic — into sprawling procedural scripts that own business logic, orchestrate multi-step workflows, manage side effects, and maintain complex internal state. The composable pattern is being used as a general-purpose code organization tool rather than for its designed purpose.

## Symptoms

- **Giant composables.** `useMoveCalculation.ts` (871 lines), `useGridMovement.ts` (26KB), `useGridRendering.ts` (26KB), `usePathfinding.ts` (25KB). These are not "composable reactive logic" — they are application subsystems disguised as composables.
- **Business logic in composables.** `useMoveCalculation` duplicates server-side damage calculation, capture probability, and move validation. `useEncounterLifecycle` manages encounter state transitions. These are domain logic concerns that happen to be packaged as composables because they need reactive access.
- **63 composables in a flat directory.** The composable layer has grown into a second codebase that shadows the service layer. Where services own server-side logic, composables own client-side logic — often duplicating it (see [[client-server-state-mirroring]]).
- **Composables as god functions.** Some composables return 15+ reactive values and methods. `useGridInteraction` returns mouse handlers, selection state, drag state, measurement state, and coordinate conversion — mixing 5 unrelated concerns.
- **Testing impossibility.** [[composable-store-direct-coupling]] documents that 10+ composables directly call `useEncounterStore()` as a global singleton, making them impossible to test in isolation. The composable pattern does not naturally support dependency injection.
- **Lifecycle entanglement.** Some composables set up watchers, event listeners, and side effects in their body, coupling them to Vue's component lifecycle. They cannot be called outside a component setup context, yet their logic has nothing to do with components.

## Structural cause

Composables were adopted as the primary client-side code organization pattern because they are Vue 3's recommended approach. But the app's client-side needs — game rule calculation, multi-step combat workflows, real-time grid rendering — are not composable-shaped problems. They are state machines, pipelines, and rendering engines that need their own architectural patterns.

This violates [[single-responsibility-principle]] — composables mix reactive binding with business logic with side effect management. It violates [[dependency-inversion-principle]] — composables depend directly on concrete stores and utils rather than on abstractions. The [[feature-envy-smell]] is pervasive — composables reach into stores, services, and other composables to orchestrate behavior that doesn't belong to them.

## See also

- [[composable-store-direct-coupling]] — composables import stores as singletons
- [[client-server-state-mirroring]] — composables duplicate server logic
- [[composable-dependency-injection-pattern]] — an incremental proposal for injection
- [[game-logic-boundary-absence]] — composables are one of three layers where game logic hides
- [[command-bus-ui-architecture]] — a destructive proposal to address this
- [[headless-domain-components]] — a destructive proposal to formalize composables as headless logic layers with clear contracts
- [[view-logic-component-entanglement]] — the related problem where components absorb logic that composables should own
