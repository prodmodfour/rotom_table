# 2026-03-26 — R0.A Effect Engine Design: Documentation Vault Notes

Designed the effect engine — the other half of R0.A alongside the GameState interface. Six atomic vault notes covering the full evaluation architecture. Every note cross-references specific SE patterns, principles, and smells from `vaults/documentation/software-engineering/`.

---

## SE pattern analysis (informed the design)

Before writing, reviewed ~30 SE vault notes to identify which patterns, principles, and smells directly constrain the effect engine architecture. Key findings:

- **solid-violation-causal-hierarchy.md** — SRP and DIP are root causes. The effect engine fixes both: extracts game logic (SRP), depends on GameState abstraction (DIP). ISP/OCP/LSP follow naturally.
- **The atom interface is the DIP pivot.** Everything depends on this abstraction. If it's wrong, the cascade from `solid-violation-causal-hierarchy.md` repeats.
- **Composite Pattern** — atoms and compositions sharing `EffectNode.evaluate()` satisfies LSP (any node substitutes for any other) and enables the composable effect system.
- **Strategy Pattern** — each atom type is a strategy; each condition predicate is a strategy. No switch chains.
- **Observer Pattern** — the trigger system. Traits subscribe to events; engine dispatches.
- **Mediator Pattern** — the engine mediates all effect communication. No direct effect-to-effect coupling.
- **Chain of Responsibility** — damage pipeline steps. Trigger dispatch order.
- **Decorator Pattern** — before-triggers intercept/modify events. Replacement compositions wrap atoms.
- **Command Pattern** — StateDelta and EncounterDelta are commands the engine executes.
- **Tell Don't Ask** — condition predicates are declarative data, not procedural queries. Atoms receive assembled context, return results.
- **Law of Demeter** — atoms access only direct inputs. Derived values (evasion, effective stats) are pre-computed in context.
- **Separation of Concerns** — atom definition, composition orchestration, trigger dispatch, engine application are four distinct concerns.

---

## Notes created (6)

| File | Content | SE patterns cited |
|---|---|---|
| `effect-node-contract.md` | **The DIP pivot.** Shared `EffectNode.evaluate(context) → result` interface. `EffectContext` (ISP-filtered sub-interfaces + resolution inputs). `EffectResult` (combatant deltas + encounter delta + events + triggers). Engine as mediator. | DIP, LSP, OCP, ISP, SRP, Composite, Strategy, Mediator, Observer, Command, Tell Don't Ask, Law of Demeter |
| `encounter-delta-model.md` | **Encounter-level changes.** Companion to `state-delta-model.md`. Mutation types for weather, terrain, hazards, blessings, coats, vortexes, deployment. Each field state type has its own mutation vocabulary reflecting distinct lifecycle rules. | Command, SRP, OCP, Separation of Concerns |
| `effect-atom-catalog.md` | **15 atom types.** 11 state-producing (DealDamage, ApplyStatus, RemoveStatus, ModifyCombatStages, HealHP, ManageResource, DisplaceEntity, MutateInventory, ModifyActionEconomy, ApplyActiveEffect, ModifyMoveLegality). 2 encounter-producing (ModifyFieldState, ClearFieldState, ModifyDeployment). 2 resolution (ResolveAccuracyCheck, ResolveSkillCheck). Each declares `requires` (ISP). | Strategy, SRP, OCP, ISP, CoR, Tell Don't Ask |
| `effect-composition-model.md` | **How atoms combine.** Three categories: Flow (Sequence, Conditional, Repeat), Intervention (Replacement, CrossEntityFilter), Interaction (ChoicePoint, EmbeddedAction). Condition predicates as discriminated union — declarative data, not procedural queries. Boolean composition (and/or/not). Result merging rules. | Composite, Decorator, Strategy, OCP, Tell Don't Ask, SRP, Separation of Concerns |
| `effect-trigger-system.md` | **Event subscriptions.** TriggerDefinition (eventType, timing, condition, effect, scope). Before-triggers intercept/modify; after-triggers react. Dispatch order (priority, speed-based). Recursive trigger handling with depth limit. Trigger sources: traits (static) and active effects (dynamic). Engine as mediator. | Observer, Mediator, CoR, Decorator, Strategy, OCP, SRP, Tell Don't Ask, Separation of Concerns |
| `effect-definition-format.md` | **TypeScript constants.** MoveDefinition and TraitDefinition structs. Helper factory functions (sequence, conditional, dealDamage, etc.). 5 worked examples: Thunderbolt (status on roll), Hex (conditional DB), Sand Tomb (damage + embedded vortex), Safeguard (blessing with choice point), Volt Absorb (type-absorb before-trigger), Opportunist (action economy trait). | Data-driven-rule-engine, Factory Method, OCP, SRP, DIP, Composite, Separation of Concerns |

---

## Existing notes updated with backlinks (8)

| File | Links added |
|---|---|
| `game-state-interface.md` | → all 6 new effect engine notes |
| `state-delta-model.md` | → effect-node-contract, encounter-delta-model, effect-atom-catalog |
| `resolution-context-inputs.md` | → effect-node-contract, effect-composition-model |
| `combat-event-log-schema.md` | → effect-node-contract, effect-trigger-system |
| `active-effect-model.md` | → effect-atom-catalog, effect-trigger-system, effect-definition-format |
| `field-state-interfaces.md` | → encounter-delta-model, effect-atom-catalog |
| `data-driven-rule-engine.md` | → all 5 effect engine design notes |
| `combat-lens-sub-interfaces.md` | → effect-node-contract, effect-atom-catalog |

---

## What the design says

The effect engine evaluates move and trait definitions expressed as composable trees of typed atoms.

**Three layers:**
1. **Atoms** (~15 types) — leaf nodes that read sub-interfaces and produce StateDelta/EncounterDelta. Each is a strategy implementing the shared EffectNode contract.
2. **Compositions** (7 types) — branch nodes that orchestrate atom evaluation: Sequence, Conditional, Repeat (flow); Replacement, CrossEntityFilter (intervention); ChoicePoint, EmbeddedAction (interaction).
3. **Triggers** — event subscriptions that activate effect trees when combat events occur. Before-triggers can intercept; after-triggers react. The engine dispatches.

**The engine mediates everything.** Effects never communicate directly. A move fires atoms → produces deltas + events → engine applies deltas → events trigger traits → traits fire atoms → more deltas. All routing through the engine.

**Definitions are data.** TypeScript constants in `@rotom/engine`. Type-safe, version-controlled, testable. Adding a new move = adding a new constant. The engine doesn't change.

---

## R0.A completion status

| Component | Status |
|---|---|
| GameState Interface (10 notes) | Complete — 3 adversarial reviews, all findings resolved |
| Effect Engine (6 notes) | Complete — ready for adversarial review |
| R0.A exit criterion | Pending — need adversarial review of effect engine, then 45 sample definitions |

**Status:** R0.A effect engine design complete. 6 vault notes created, 8 existing notes updated. All notes cross-reference SE patterns and principles. Ready for adversarial review of the effect engine design, then the 45 sample definition content task.

