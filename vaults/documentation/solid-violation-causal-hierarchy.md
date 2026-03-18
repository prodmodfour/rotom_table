# SOLID Violation Causal Hierarchy

In this codebase, [[single-responsibility-principle]] and [[dependency-inversion-principle]] violations are root causes. [[interface-segregation-principle]], [[open-closed-principle]], and [[liskov-substitution-principle]] violations are downstream symptoms. Fixing SRP and DIP makes the ISP/OCP/LSP problems tractable; fixing ISP/OCP/LSP without addressing SRP and DIP treats symptoms while the root causes continue generating new violations.

## SRP → ISP

The [[combatant-interface-bloat]] (ISP) exists because the [[combatant-service-mixed-domains]] (SRP). When one service handles damage, healing, status conditions, stage modifiers, and combatant construction, its input type must carry fields for all five domains. The Combatant grew to 30+ fields because the service that consumes it never split into focused units that would each demand a narrow interface. If each domain had its own service with its own input type, ISP would be satisfied naturally.

## SRP + DIP → OCP

The [[trigger-validation-switch-chains]] (OCP) exist because the [[game-logic-boundary-absence]] (SRP + DIP). Trigger validation lives inline in services that also handle persistence and orchestration — there is no isolated game-rule layer where a registry or strategy could be introduced. The switch chains cannot become a strategy registry while they are embedded in functions that also call Prisma and broadcast WebSocket events. Similarly, the [[status-condition-ripple-effect]] (OCP) scatters condition properties across 20+ files because there is no single game-logic module that owns condition semantics — each property is computed wherever it is needed, by whatever layer happens to need it.

## DIP → LSP

The [[entity-union-unsafe-downcasts]] and [[entity-shared-field-incompatibility]] (LSP) exist because the [[entity-data-model-rigidity]] (DIP). The `Pokemon | HumanCharacter` union was shaped by two Prisma tables — the domain model depends on the persistence schema rather than the other way around. The database has two separate tables with partial column overlap, and that structural accident propagates upward into a union type whose subtypes cannot be used interchangeably. If the domain model were defined first and persistence adapted to it ([[dependency-inversion-principle]]), the entity types would share a proper base interface with compatible fields, and consumers would not need 144 unsafe `as` casts.

## Implication for sequencing

This causal ordering suggests a refactoring sequence: address SRP and DIP first, then let ISP/OCP/LSP improvements follow. Concretely:

1. **Extract game logic from services** (SRP + DIP) — pure functions with no Prisma dependency, testable in isolation. This creates the boundary where strategy registries (OCP) and narrow input types (ISP) can be introduced.
2. **Invert the entity model dependency** (DIP) — define domain types first, adapt persistence to them. This eliminates the structural source of unsafe downcasts (LSP) and incompatible shared fields.
3. **Narrow interfaces and introduce registries** (ISP + OCP) — now tractable because the game logic lives in focused modules with explicit inputs.

## See also

- [[solid-principles]] — the five principles and their interrelationships
- [[single-responsibility-principle]] — root cause: mixed domains in services and routes
- [[dependency-inversion-principle]] — root cause: domain depending on persistence
- [[interface-segregation-principle]] — symptom: Combatant carries fields for all consumers
- [[open-closed-principle]] — symptom: switch chains in logic that lacks isolation
- [[liskov-substitution-principle]] — symptom: union subtypes shaped by database tables
- [[combatant-service-mixed-domains]] — the SRP violation driving ISP bloat
- [[combatant-interface-bloat]] — the ISP symptom of mixed service domains
- [[game-logic-boundary-absence]] — the SRP+DIP violation driving OCP switch chains
- [[trigger-validation-switch-chains]] — the OCP symptom of absent game-logic boundary
- [[status-condition-ripple-effect]] — the OCP symptom of scattered condition semantics
- [[entity-data-model-rigidity]] — the DIP violation driving LSP downcasts
- [[entity-union-unsafe-downcasts]] — the LSP symptom of persistence-shaped domain types
- [[entity-shared-field-incompatibility]] — the LSP symptom of persistence-shaped field definitions
