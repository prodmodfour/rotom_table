# Game Logic Boundary Absence

Game rules have no isolation boundary. PTR formulas, validations, and state transitions are scattered across three layers with no package or module boundary separating "game logic" from "app infrastructure":

- **38 utils** (`app/utils/`) contain damage formulas, capture rates, type effectiveness, flanking geometry, weather rules, equipment bonuses — pure functions, but mixed into the app's utility namespace.
- **23 services** (`app/server/services/`) embed game rules alongside persistence logic. [[combatant-service-mixed-domains|combatant.service.ts]] mixes HP math with Prisma calls. [[switching-validation-pipeline|switching.service.ts]] validates game rules while managing database transactions.
- **64 composables** (`app/composables/`) duplicate server-side game logic for client-side preview. `useMoveCalculation` (871 lines) and `useDamageCalculation` recalculate damage, type effectiveness, and STAB on the client — the same logic the server uses via utils.

The consequence: there is no single place to answer "how does this game rule work?" A developer must check utils, the relevant service, and the composable to understand the full picture. Changes to a formula require updating multiple layers — a textbook [[shotgun-surgery-smell]].

The client/server duplication is particularly dangerous. When a game rule changes, the server-side calculation (authoritative) and the client-side preview (cosmetic) must be updated in lockstep. If they diverge, players see incorrect damage previews or capture probabilities.

## See also

- [[service-inventory]] — services that embed game logic alongside persistence
- [[composable-domain-grouping]] — composables that duplicate server-side game logic
- [[damage-pipeline-as-chain-of-responsibility]] — a pipeline split across layers
- [[duplicate-code-smell]] — the client/server rule duplication
- [[shotgun-surgery-smell]] — rule changes ripple across layers
- [[game-engine-extraction]] — a potential restructuring to address this
- [[headless-game-server]] — a destructive proposal to extract the entire game server from Nuxt
- [[composable-architectural-overreach]] — the client-side composables that duplicate server logic
- [[repository-use-case-architecture]] — a destructive proposal where use cases become the explicit game logic boundary
- [[service-responsibility-conflation]] — services conflate game logic with persistence, preventing a clean boundary
