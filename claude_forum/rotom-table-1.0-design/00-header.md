# Rotom Table 1.0 — Destructive Redesign

The current Rotom Table app is incomplete, built on PTU, and poorly engineered. It was assembled incrementally without architectural discipline — features were added as needed, patterns were applied inconsistently, and the codebase accumulated technical debt faster than it delivered value. The documentation vault overhaul (see `closed/documentation-vault-ptr-overhaul/`) fixed the *terminology* but exposed the deeper problem: the app's designs are PTU designs wearing PTR clothes.

This is not a refactoring project. This is a destructive redesign.

## Why destructive

The existing app cannot be iteratively patched into a PTR app. Its foundations are wrong:

- **Trainer progression doesn't exist.** The app had PTU trainer leveling (XP, classes, features, edges, AP). All of that was deleted during the overhaul. What remains is a shell — trainers have stats and that's it. There is no design for how trainers grow, gain traits, or interact with the PTR trait system.
- **The trait system has no architecture.** PTR's central mechanic — Traits replacing Abilities, Capabilities, Natures, Features, Edges, and Classes — has zero app design. No CRUD, no unlock condition engine, no assignment workflow, no UI. The old ability assignment system (Level 20/40 milestones) was deleted because it's PTU. Nothing replaced it.
- **Energy/Stamina is bolted on.** The energy system was described in `move-energy-system.md` but has no dedicated UI design, no fatigue tracking workflow, no overdraft warning system. It's a paragraph, not an architecture.
- **Training doesn't exist.** PTR's dual-check training system (Pokemon test + Trainer test) — the primary way Pokemon unlock traits and moves — has zero documentation, zero design, zero app support.
- **Dispositions don't exist.** Wild Pokemon dispositions (6 types affecting loyalty, behavior, and social interaction) have zero app support.
- **Breeding doesn't exist.** PTR's trait-inheritance breeding system has zero app support.
- **Unlock conditions have no engine.** Moves and traits are gated by unlock conditions (stat thresholds, trait prerequisites, training checks, roleplay conditions). The app has no system for evaluating, tracking, or presenting these conditions.
- **The skill system is a stub.** PTR uses 1d20+Modifier with DC thresholds and trait-derived modifiers. The app has a skill grid but no check resolution system, no modifier computation, no DC framework.
- **The combatant is a god object.** 35 fields, 8 concerns, 144 unsafe type casts. The documentation vault has *five* proposals for fixing this (`combat-entity-base-interface`, `combatant-type-segregation`, `trait-composed-domain-model`, `entity-component-system-architecture`, `combatant-as-lens`). None were implemented. The combatant grew because the app grew without design.
- **The encounter store is a god object.** The documentation vault explicitly flags this (`encounter-store-god-object-risk`). Every encounter feature was wired directly into one Pinia store because there was no decomposition plan.
- **Services bypass the service layer.** The documentation flags this too (`routes-bypass-service-layer`). Business logic lives in API route handlers instead of services, making it untestable and unreusable.
- **The UI was built view-first, not component-first.** Three parallel component trees (GM, Group, Player) with massive duplication. The documentation vault has a full proposal for fixing this (`view-capability-projection`) that was never acted on.

## The opportunity

The documentation vault contains ~219 software engineering reference notes: design patterns, refactoring techniques, code smells, SOLID principles, and architectural styles. These were collected as knowledge but never applied as constraints. A ground-up redesign can use them as the blueprint:

- **Single Responsibility** from the start — services, stores, components each own one concern
- **Interface Segregation** — narrow types for narrow consumers, no god objects
- **Open/Closed** — new mechanics (weather, terrain, traits) extend the system without modifying existing code
- **Dependency Inversion** — combat systems depend on abstractions (CombatEntity, CombatLens), not on concrete Pokemon/Trainer types
- **Composition over Inheritance** — traits compose behavior, entities are views not copies

The PTR vault is complete. The documentation vault's terminology is clean. The SE reference material is ready. The three vaults can converge on a 1.0 design that is correct by construction rather than correct by accident.

## Gap analysis: PTR subsystems with no app design

### Critical (no documentation, no app support)

| PTR Subsystem | PTR Vault Coverage | Documentation Coverage | App Coverage |
|---|---|---|---|
| **Trait management** | `trait-definition.md`, `innate-traits.md`, `learned-traits.md`, `emergent-traits.md` | Zero — `pokemon-ability-assignment.md` deleted, nothing replaced it | Zero |
| **Unlock condition engine** | `unlock-conditions.md`, `unlock-conditions-default-and.md`, `unlock-level-up-split.md` | Zero — mentioned in `pokemon-move-learning.md` and `pokemon-evolution-system.md` but no design | Zero |
| **Training system** | `training-dual-check-system.md`, `training-session-one-hour.md`, `training-trainer-social-skill-choice.md`, `training-pokemon-check.md`, `training-unlocks-traits-and-moves.md` (~8 notes) | Zero | Zero |
| **Disposition system** | `wild-pokemon-six-dispositions.md`, `disposition-is-per-entity.md`, `disposition-determines-starting-loyalty.md`, `disposition-charm-check-dcs.md`, `encounter-table-disposition-weights.md` (~5 notes) | Zero | Zero |
| **Breeding system** | `breeding-species-d20-roll.md`, `breeding-traits-from-education-rank.md`, `breeding-not-trainer-influenced.md`, `breeding-is-for-trait-inheritance.md`, `only-innate-traits-inherit.md`, `inherited-traits-require-unlock.md`, `inheritable-traits-list.md` (~7 notes) | Zero | Zero |
| **Skill check resolution** | `skill-check-1d20-plus-modifier.md`, `skill-check-dc-table.md`, `skill-modifiers-from-traits-or-circumstance.md`, `ptr-skill-list.md` (~27 notes) | `trainer-skill-definitions.md` (stub) | Partial — skill grid exists, no check resolution |

### Thin (some documentation, needs full design)

| PTR Subsystem | Gap |
|---|---|
| **Energy/Stamina UI** | `move-energy-system.md` covers validation. No energy bar design, fatigue tracking UI, overdraft UX, stamina stat display |
| **Trainer entity model** | Files rewritten but no comprehensive "what is a PTR trainer" design. Stats start at 10, no levels, traits — but how does the app present this? |
| **Species data model** | Updated but doesn't describe PTR-specific fields (base stamina, innate traits list, evolution condition references) |
| **Move condition recheck on evolution** | Mentioned in `pokemon-evolution-system.md` but no design for how this works |

### Architectural (documented problems, no implemented solutions)

| Problem | Documentation | Status |
|---|---|---|
| Combatant god object (35 fields, 8 concerns) | 5 proposals: `combat-entity-base-interface`, `combatant-type-segregation`, `trait-composed-domain-model`, `entity-component-system-architecture`, `combatant-as-lens` | None implemented |
| Encounter store god object | `encounter-store-god-object-risk`, `encounter-store-decomposition`, `encounter-store-as-facade` | None implemented |
| Routes bypass service layer | `routes-bypass-service-layer`, `route-to-service-migration-strategy` | None implemented |
| View component duplication | `view-component-duplication`, `view-capability-projection` | None implemented |
| Turn lifecycle as transaction script | `transaction-script-turn-lifecycle`, `turn-advancement-service-extraction` | None implemented |

## Principles

1. **PTR vault is the source of truth** for what the game system IS.
2. **Documentation vault is the design authority** for how the system becomes software.
3. **SE vault provides the constraints** — patterns and principles are not suggestions, they're requirements.
4. **Design before code.** Every feature gets a documentation note before it gets an implementation.
5. **Destructive by default.** If the existing code doesn't match the new design, it's deleted and rewritten. No compatibility shims, no migration hacks, no "we'll fix it later."
6. **Cross-reference SE principles.** Every design must cite the specific SE patterns, principles, or smells from `vaults/documentation/software-engineering/` that justify its structure. "We used Strategy pattern" is not enough — link to the vault note (e.g. `strategy-pattern.md`) and explain why it applies. This makes designs auditable against the SE vault and ensures the ~219 SE reference notes are actively used as constraints, not passively collected.
7. **Designs live in the documentation vault.** When a design is decided, it becomes a note (or updates existing notes) in `vaults/documentation/`, linked and referenced. The thread records decisions and reasoning; the vault holds the authoritative design. No design exists only in this thread — if it's not in the vault, it's not decided.

---
