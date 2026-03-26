# Combatant as Lens

A destructive restructuring to eliminate the Combatant as a concrete type — replacing it with a runtime projection (lens) over entities that participate in combat — addressing [[combatant-interface-bloat|combatant bloat]] not by decomposing the interface but by questioning why the type exists at all.

## The idea

Every existing proposal that addresses the Combatant accepts a hidden premise: that combat participation requires transforming an entity into a different type. [[trait-composed-domain-model]] shatters the Combatant into traits — but traits are still composed into a `FullCombatant`. [[entity-component-system-architecture]] replaces the Combatant with an ECS entity — but the entity still exists as a runtime construct separate from the Pokemon or Trainer it represents.

What if there is no Combatant?

A Pokemon is always a Pokemon. A Trainer is always a Trainer. When they enter combat, they don't become something else. Instead, the combat system creates a **lens** — a temporary, session-scoped projection that attaches combat state (current HP delta, stage modifiers, status conditions, position, turn order) to the entity without modifying it. The lens is not a copy. It is a view. The entity is the source of truth for its intrinsic properties (stats, moves, traits, species, level). The lens is the source of truth for its transient combat state.

> **Note:** This note established the lens concept. The formal design has since been decomposed into 15 ISP sub-interfaces — see [[combat-lens-sub-interfaces]] for the authoritative interface definitions, [[state-delta-model]] for how effects write, and [[game-state-interface]] for the full architecture. The prose concepts below remain valid; the code examples are illustrative of the *motivation*, not the current design.

```typescript
// === ENTITIES ARE ALWAYS ENTITIES ===
// These are the canonical domain models. They do not change shape in combat.

interface Pokemon {
  id: string
  species: string
  level: number
  stats: StatBlock       // HP, ATK, DEF, SPATK, SPDEF, SPD, STAMINA
  moves: Move[]
  traits: Trait[]
  experience: number
  loyalty: number
  heldItem: string | null
}

interface Trainer {
  id: string
  name: string
  stats: StatBlock
  skills: Record<string, number>
  traits: Trait[]
  equipment: Equipment[]
  inventory: InventoryItem[]
}

// === COMBAT STATE IS A SEPARATE, LINKED RECORD ===
// Created when an entity enters combat. Destroyed when combat ends.
// Never embedded in the entity. Never transforms the entity's type.
// In the formal design, this flat struct is decomposed into 15 sub-interfaces
// (see combat-lens-sub-interfaces.md). entityType lives on the entity, not here.

// === PROJECTION: WHAT THE UI SEES ===
// A "combatant view" is computed, never stored.
// In the formal design, effects return StateDelta objects instead of
// new lens copies (see state-delta-model.md).

function projectCombatant(entity: Pokemon | Trainer, lens: CombatLens): CombatantView {
  // Entity fields read through from the entity
  // Derived fields computed from entity + lens (evasion, initiative, effective stats)
  // Lens fields passed through for combat-only state
}

// Effects describe what should change — they don't mutate the lens directly.
// The engine is the single writer.
```

## Why this is destructive

- **The `Combatant` type is deleted.** Not shattered into traits, not decomposed into components — deleted. There is no type called Combatant in the codebase.
- **The `buildCombatant()` function is deleted.** The current code transforms a Pokemon/HumanCharacter database record into a Combatant by copying and reshaping fields. This transformation does not exist. The entity is the entity; the lens is a separate record.
- **The entity snapshot pattern is eliminated.** Currently, adding a Pokemon to combat creates a snapshot of its stats, moves, and traits embedded in the Combatant. If the Pokemon levels up mid-combat (via XP), the Combatant snapshot is stale. With lenses, the Pokemon IS the Pokemon — its current stats are always live.
- **All 23 services that accept `Combatant` are rewritten.** They accept `(entity, lens)` pairs or just the lens. The damage service modifies the lens's `hpDelta`, never the entity's stats.
- **The combatants JSON column is replaced.** Instead of storing an array of full combatant objects in a single JSON TEXT column, the database stores a `CombatLens` table with one row per combat participant. Entity data stays in the `Pokemon` and `HumanCharacter` tables.
- **The encounter builder is eliminated.** Currently, `buildEncounterResponse` assembles combatant objects by merging entity data with combat state. With lenses, the `projectCombatant` function computes the view on demand — no assembly step.
- **Vue components receive `CombatantView` (computed) instead of `Combatant` (stored).** The view is always fresh because it's always computed from the current entity and current lens.
- **End-of-combat cleanup is trivial.** Delete all `CombatLens` rows for the session. The entities are unchanged. Currently, end-of-combat requires extracting entity changes from the Combatant snapshot and reverse-mapping them back to the database — a lossy, bug-prone process.

## How this differs from existing proposals

- [[trait-composed-domain-model]] shatters the Combatant into narrow interfaces. But the traits compose into `FullCombatant`, which IS the Combatant by another name. This proposal says the Combatant concept itself is wrong — entities don't change type in combat.
- [[entity-component-system-architecture]] replaces the Combatant with an ECS entity. But ECS entities are still runtime constructs that exist independently of the Pokemon/Trainer they represent. This proposal says the entity IS the Pokemon/Trainer, always — combat state is a separate linked record, not a component attached to a different entity.
- [[encounter-dissolution]] dissolves the Encounter into containers. This dissolves the Combatant into entity + lens. The two are compatible: lenses could live in the CombatRoster container.

## Principles improved

- [[single-responsibility-principle]] — entities are responsible for intrinsic state (stats, moves, traits). Lenses are responsible for transient combat state (HP delta, status conditions, position). Neither knows about the other's internals.
- [[interface-segregation-principle]] — combat systems receive only what they need. The damage system receives `(entity.stats, lens)`. The movement system receives `(entity.speed, lens.position)`. No system receives a 30-field god object.
- [[open-closed-principle]] — adding a new combat concern (e.g., aura effects) means adding a field to `CombatLens`. The Pokemon and Trainer types don't change. The lens is open for extension; entities are closed for modification.
- [[dependency-inversion-principle]] — combat systems depend on the `CombatLens` abstraction, not on the concrete entity type. A damage function works identically for Pokemon and Trainers because it operates on the lens.
- [[liskov-substitution-principle]] — any entity that can produce a stat block can participate in combat via a lens. The lens doesn't care whether the entity is a Pokemon, Trainer, or a future entity type (NPC, wild Pokemon, environmental hazard).
- Eliminates [[combatant-interface-bloat]] — there is no Combatant interface to bloat.
- Eliminates the entity snapshot staleness problem — entities are always read live, never copied into a snapshot.

## Patterns and techniques

- [[proxy-pattern]] — `CombatantView` is a virtual proxy that presents a unified interface over two data sources (entity + lens)
- [[bridge-pattern]] — the entity abstraction and the combat state abstraction vary independently; the lens bridges them
- [[flyweight-pattern]] — entities are shared, intrinsic state; lenses are per-context, extrinsic state. The same Pokemon can participate in multiple sessions (hypothetically) with different lenses.
- [[adapter-pattern]] — the `projectCombatant` function adapts entity + lens into the view shape expected by UI components
- Projection pattern — current state is computed on demand from separate data sources, never stored as a denormalized blob
- Lens pattern (functional programming) — a composable accessor/modifier that focuses on a subset of a larger structure

## Trade-offs

- **Double lookup on every access.** Rendering a combatant card requires loading both the entity (from the `Pokemon` or `HumanCharacter` table) and the lens (from the `CombatLens` table). This is two queries instead of one — mitigated by caching or by joining at the query level.
- **Projection computation cost.** `projectCombatant` is called on every render for every combatant. If it involves stage modifier calculations, effective stat computation, and status condition processing, it may be expensive. Memoization is necessary.
- **Loss of self-contained combat snapshots.** Currently, an encounter's `combatants` JSON blob is a complete, portable snapshot. With lenses, reconstructing combat state requires loading entities from their tables — the combat state is not self-contained.
- **Entity mutation during combat.** What if a Pokemon levels up mid-combat (via XP from a KO)? The entity changes, and the lens's projections immediately reflect new base stats. This is sometimes desirable (live data) and sometimes not (stat changes shouldn't apply until combat ends). A policy decision is needed.
- **Relationship complexity.** Mount/rider relationships, living weapon engage/wield relationships, and switching tracking all live in the lens. But switching involves removing one lens and creating another — the relationship between "the old lens" and "the new lens" must be explicitly tracked.
- **Migration requires reverse-engineering entity state.** Current combatant snapshots embed entity data. Migrating to lenses requires matching each combatant snapshot to its source entity and computing the delta. If the entity was modified since the snapshot was taken, the delta may be incorrect.

## Open questions

- Should the lens store absolute values (current HP = 45) or deltas (HP delta = -15 from max of 60)? Deltas are cleaner conceptually but require the entity to be loaded for every display. Absolute values are redundant with the entity but self-contained.
- How does the lens handle Pokemon switching? When a Pokemon switches out, is its lens archived (preserving status conditions, stage modifiers) or destroyed? When it switches back in, is a new lens created or the archived one restored?
- Should the `projectCombatant` function be server-side (sending `CombatantView` over the wire) or client-side (sending entity + lens separately and projecting in the component)?
- How does this interact with [[event-sourced-encounter-state]] / [[universal-event-journal]]? If combat state is event-sourced, events modify the lens, not the entity. The lens becomes a projection over combat events.
- How does this interact with [[encounter-dissolution]]? The CombatRoster container could hold lenses instead of full combatant objects, with entity data fetched on demand.
- What about entities that exist ONLY in combat (wild Pokemon with no persistent record)? Do they get a temporary entity record, or does the lens support an embedded entity for ephemeral participants?

## See also

- [[combatant-interface-bloat]] — the problem this addresses (by eliminating the interface, not shrinking it)
- [[trait-composed-domain-model]] — an alternative: decompose the Combatant, don't eliminate it
- [[entity-component-system-architecture]] — an alternative: ECS entities replace Combatants
- [[encounter-dissolution]] — compatible: lenses can live inside the CombatRoster container
- [[event-sourced-encounter-state]] — compatible: events modify lenses, not entities
- [[universal-event-journal]] — compatible: combat events target lenses
- [[proxy-pattern]] — the combatant view is a proxy over entity + lens
- [[bridge-pattern]] — entity and combat state vary independently, bridged by the lens
- [[game-state-interface]] — the formal interface design that builds on this lens architecture
- [[combat-lens-sub-interfaces]] — ISP decomposition of the lens into narrow sub-interfaces
- [[state-delta-model]] — how effects write to the lens via deltas
- [[entity-write-exception]] — the documented exception to entity read-only during combat
