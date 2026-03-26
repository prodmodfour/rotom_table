# GameState Interface

The shared abstraction that both the effect engine and entity model depend on. Per [[dependency-inversion-principle]], high-level modules (effect engine, turn management) and low-level modules (entity model, field state) both depend on this abstraction rather than on each other.

## Three layers

GameState decomposes into three layers, each with distinct ownership and lifecycle:

1. **Entity state** — permanent, intrinsic data (stats, species, level, types, moves, traits, held items). Read-only during combat except for [[entity-write-exception|tagged entity-write effects]]. Owned by the entity model. Survives combat.
2. **Combat lens state** — transient, per-combatant projection created on encounter entry and destroyed on encounter end. The primary write target for effects. Decomposed into [[combat-lens-sub-interfaces]] per [[interface-segregation-principle]]. Owned by the encounter.
3. **Encounter state** — global combat context shared across all combatants. Includes [[field-state-interfaces]] (weather, terrain, hazards, blessings, coats, vortexes), [[encounter-context-interfaces]] (round tracking, turn order, [[combat-event-log-schema|combat event log]]), and [[deployment-state-model|per-trainer deployment state]].

## How effects consume GameState

Effects do not receive the full GameState. Per [[interface-segregation-principle]], each effect atom declares which [[combat-lens-sub-interfaces]] it requires. A damage atom receives `HasStats & HasCombatStages & HasHealth`. A displacement atom receives `HasPosition & HasMovement`. No atom receives state it does not use.

Effects produce [[state-delta-model|StateDelta]] objects containing only lens-writable fields. The engine applies deltas to the lens. Entity fields are excluded from the delta type, making accidental entity mutation a compile-time error. The small number of effects that must write entity state (e.g., Thief stealing a held item) are [[entity-write-exception|tagged explicitly]].

## How the lens relates to entities

Per [[combatant-as-lens]], entities do not change type when they enter combat. A Pokemon is always a Pokemon. The combat system creates a lens — a separate record that attaches transient combat state to the entity without modifying it. The lens is the source of truth for combat state; the entity is the source of truth for intrinsic properties.

Both Pokemon and Trainers participate in combat through the same [[combat-lens-sub-interfaces]]. Trainers implement all sub-interfaces except `HasTypes` — they are typeless per PTR rules. The `entityType` discriminator lives on the entity, not the lens. The lens is entity-type-agnostic, defined entirely by which sub-interfaces it satisfies. Per [[open-closed-principle]], adding a third entity type requires only implementing the appropriate sub-interfaces.

## Derived vs stored

If a value can be computed from other lens or entity state, it belongs in the projection function (`projectCombatant`), not in the lens. The lens stores only independent mutable state — values that cannot be derived from anything else in the system.

Two values that initially appeared to be lens state are actually derived:

- **Evasion** — derived from defensive stats (`floor(stat / 5)`, capped at 6) minus flat penalties from fatigue and flanking. Three distinct values (Physical, Special, Speed), not a single combat stage. See [[combat-lens-sub-interfaces]] HasCombatStages.
- **Initiative** — derived from Speed stat + Speed combat stage multiplier. Recalculates immediately when Speed CS changes. An override mechanism (`initiativeOverride`) handles Quash and After You. See [[combat-lens-sub-interfaces]] HasInitiative.

The test: "If another field in the lens or entity changes, does this value need to change too?" If yes, it's derived. Store the inputs, compute the output.

## External inputs

Effect functions are pure. Random values (dice rolls), player choices (blessing activation, interrupt use), and multi-hit counts are not generated inside the function — they are injected via [[resolution-context-inputs]]. This makes effects deterministic and testable.

## SE principles applied

- [[dependency-inversion-principle]] — entity model and effect engine both depend on this abstraction
- [[interface-segregation-principle]] — narrow sub-interfaces for narrow consumers; see [[combat-lens-sub-interfaces]]
- [[open-closed-principle]] — new effect atoms extend the transformation vocabulary without modifying the state shape
- [[single-responsibility-principle]] — entity state, lens state, and encounter state each have one owner and one reason to change
- [[liskov-substitution-principle]] — any entity implementing the required sub-interfaces can participate in combat

## See also

- [[combatant-as-lens]] — the architectural foundation: entities are permanent, lenses are transient
- [[trait-composed-domain-model]] — ISP applied to the state shape via narrow interfaces
- [[data-driven-rule-engine]] — the engine that evaluates effect definitions against this state
- [[combat-entity-base-interface]] — predecessor proposal; superseded by the sub-interface decomposition here
- [[state-delta-model]] — how effects write to game state
- [[active-effect-model]] — generic tracking for open-ended buffs and debuffs
- [[deployment-state-model]] — per-trainer team roster tracking
- [[combat-event-log-schema]] — structured historical queries
- [[resolution-context-inputs]] — external inputs injected into pure functions
- [[effect-node-contract]] — the shared interface for all effect atoms and compositions
- [[effect-atom-catalog]] — the ~15 atomic effect types that read and write game state
- [[effect-composition-model]] — how atoms compose into move and trait effect trees
- [[effect-trigger-system]] — how traits react to combat events
- [[effect-definition-format]] — how moves and traits are expressed as TypeScript constants
- [[encounter-delta-model]] — how effects write to encounter-level state
