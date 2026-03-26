# SOLID Violation Causal Hierarchy

[[single-responsibility-principle]] and [[dependency-inversion-principle]] violations are root causes. [[interface-segregation-principle]], [[open-closed-principle]], and [[liskov-substitution-principle]] violations are downstream symptoms. Fixing SRP and DIP makes the ISP/OCP/LSP problems tractable; fixing ISP/OCP/LSP without addressing SRP and DIP treats symptoms while the root causes continue generating new violations.

## SRP → ISP

When one module handles multiple domains, its input type must carry fields for all of them. The interface bloats not because anyone designed it that way, but because the consumer never split into focused units that would each demand a narrow interface. If each domain had its own module with its own input type, ISP would be satisfied naturally.

## SRP + DIP → OCP

When game logic is embedded in modules that also handle persistence and orchestration, there is no isolated rule layer where a registry or strategy could be introduced. Switch chains cannot become strategy registries while they live in functions that also manage I/O. Similarly, when rule properties are computed wherever needed rather than owned by a single module, adding a new rule variant requires modifying every consuming site — classic [[shotgun-surgery-smell]].

## DIP → LSP

When domain types are shaped by persistence schemas (tables, columns) rather than the other way around, structural accidents in the storage layer propagate upward into type hierarchies whose subtypes cannot be used interchangeably. If the domain model is defined first and persistence adapts to it ([[dependency-inversion-principle]]), the types share proper base interfaces with compatible contracts.

## Implication for sequencing

This causal ordering suggests a design sequence: address SRP and DIP first, then let ISP/OCP/LSP follow.

1. **Isolate game logic** (SRP + DIP) — pure functions with no persistence dependency, testable in isolation. This creates the boundary where strategy registries (OCP) and narrow input types (ISP) can be introduced.
2. **Define domain types first** (DIP) — domain model owns the type definitions, persistence adapts. This eliminates the structural source of substitution violations (LSP).
3. **Narrow interfaces and introduce registries** (ISP + OCP) — now tractable because the game logic lives in focused modules with explicit inputs.

## See also

- [[solid-principles]] — the five principles and their interrelationships
- [[single-responsibility-principle]] — root cause: mixed domains
- [[dependency-inversion-principle]] — root cause: domain depending on persistence
- [[interface-segregation-principle]] — symptom: interfaces carry fields for all consumers
- [[open-closed-principle]] — symptom: switch chains in logic that lacks isolation
- [[liskov-substitution-principle]] — symptom: subtypes shaped by storage rather than domain
