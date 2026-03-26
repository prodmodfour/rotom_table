# 2026-03-25 — Dependency Analysis (Full App Scope)

The gap analysis above focused on PTR game mechanics — what doesn't exist. This post maps the full dependency graph including systems that exist but need redesign: VTT grid, multi-device views, character sheets, combat UI, scene system, encounter tables, and all the workflows that tie them together.

## Six Parallel Tracks

The work isn't a single linear chain. It's six tracks that can run partially in parallel, with sync points where they converge.

### Track A: Core Architecture
Must start first. Everything else depends on these.

```
A1. Entity Model (Pokemon + Trainer domain types)
 ├→ A2. Combatant-as-Lens (combat projection)
 │   └→ A3. Encounter State Machine (explicit phases)
 ├→ A4. Service Layer / Store Decomposition
 └→ A5. Game Engine scaffold (@rotom/engine — pure rule functions)
```

A1 is the root of the entire project. Pokemon and Trainer as domain types — stats, traits, moves, loyalty, skills, social hierarchy, disposition, equipment. Every other system reads or writes entities.

A5 isn't a one-time extraction — it's a pattern. Each mechanic, as it's designed, puts its rule logic into `@rotom/engine`. But the monorepo structure and engine scaffold need to be set up in Tier 0.

### Track B: VTT / Spatial
Can start once A1 + A2 exist. Independent of game mechanics.

```
A1 + A2 →
  B1. Spatial Engine (projection-agnostic model, coordinate abstraction)
   ├→ B2. Projection Adapters (Square, Isometric — replaces 4,146 duplicated lines)
   ├→ B3. Token System (placement, movement, multi-cell footprints)
   ├→ B4. Fog of War (three-state model, role-filtered visibility)
   ├→ B5. Terrain System (terrain types, movement costs, painting)
   ├→ B6. Measurement / AoE tools (range circles, cones, lines)
   └→ B7. Elevation System (persistent state, movement costs)
```

B1 depends on A1 (tokens represent entities) and A2 (combat positions live in the lens), but NOT on traits, skills, or progression. Large, mostly independent workstream.

### Track C: Views / Real-Time
Can start once A1 + A2 exist. Defines HOW everything gets displayed.

```
A1 + A2 →
  C1. View Capability Projection (single component tree, capability-driven)
   ├→ C2. GM Layout (controls, tools, full access)
   ├→ C3. Player Layout (phone/laptop, restricted info, haptics)
   ├→ C4. Group Layout (TV/projector, spectator, 4-tab)
   └→ C5. WebSocket Redesign (role-based filtering, capability-projected data)
```

C1 gates ALL UI work. No UI can be designed for a specific view until we know how views work. C5 depends on C1 because the server needs to know what data each role can see.

### Track D: Game Mechanics
Requires Track A. The rule systems that combat and gameplay run on.

```
A1 + A4 + A5 →
  D1. Trait System (definitions, categories, CRUD, assignment)
   └→ D2. Skill System (19 skills, 1d20+mod, check resolution, modifiers from traits)
       ├→ D3. Unlock Condition Engine (stat thresholds, trait prereqs, AND/OR, training type)
       └→ D4. Energy/Stamina System (resource, costs, regain, fatigue, overdraft)

A2 + A3 + D-systems →
  D5. Status Condition Registry (categories, automation, immunities, stage mods)
  D6. Weather System (effects, ticks, type immunities, trait interactions)
  D7. Move Resolution Pipeline (target selection, 9-step damage, energy deduction, effects)
  D8. Turn Management (initiative, declarations, resolution, out-of-turn, held actions)
  D9. Capture Workflow (PTR two-step, rate formula, ball modifiers, context toggles)
  D10. Item/Equipment System (healing items, held items, Poke Balls, equipment bonuses)
  D11. Mounting / Living Weapon (combat relationships, shared movement)
```

D7 (Move Resolution) is the heaviest convergence point — needs D4, D5, D6, A2, A3.

### Track E: Entity Lifecycle
Requires Track A + Track D core. How entities are created, grow, and change.

```
D1 + D2 →
  E1. Disposition System (6 dispositions, per-entity, charm DCs)
  E2. Social Skill Hierarchy (per-Pokemon ranking of 5 social skills)
  E3. Loyalty System (7 ranks, command DCs, training bonuses) ← depends on E1

D1 + D2 + D3 →
  E4. Pokemon Creation Workflow (species → stats → traits → moves)
  E5. Trainer Creation Workflow (stats → skills → traits → equipment)
  E6. Level Up Workflow (stat points → evolution check → trait check)
  E7. Evolution Workflow (trigger conditions, stat recalc, trait/move recheck)

D1 + D2 + D3 + E1 + E2 + E3 →
  E8. Training System (dual-check, session management, trait/move unlock)

D1 + D3 →
  E9. Breeding System (trait inheritance, species determination)
```

E8 (Training) is the most dependent system — needs nearly everything above it.

### Track F: Content / World Building
Requires Entity Model + partial game mechanics.

```
A1 + D1 →
  F1. Species Data Model (PTR fields: base stamina, innate traits, evolution conditions)
  F2. Encounter Tables (weighted selection, diversity, budget difficulty)
  F3. Habitat System (biome-based species pools)

A1 + F1 →
  F4. Wild Encounter Generation (species → Pokemon with disposition, stats, traits)

A1 →
  F5. Scene System (creation, activation, weather, groups, positioning)
  F6. Scene-to-Encounter Conversion (scene entities → combatants on grid)
```

## Cross-Track Sync Points

These are moments where tracks must align before work continues:

| Sync Point | Tracks | What must converge |
|---|---|---|
| **"What is a combatant?"** | A + B + C + D | Entity model, lens fields, token rendering, card capabilities — all must agree on what a combat participant looks like |
| **"What is a character sheet?"** | A + C + D + E | The sheet displays entities with traits, skills, loyalty, equipment — can't design until those exist |
| **"How does a turn work?"** | A + B + C + D | A turn touches state machine, moves tokens on grid, presents actions per capability, resolves game mechanics |
| **"How does capture work?"** | A + B + C + D + E | Reads grid state, shows different UI per role, runs capture formula, feeds into loyalty |

## Key Observations

1. **A1 (Entity Model) is the absolute root.** Nothing moves without it.
2. **Three tracks can run in parallel once A1+A2 exist:** Track B (VTT spatial), Track C (view system), Track D (game mechanics). Largely independent, converge at sync points.
3. **Track B (VTT) is a bigger lift than the gap analysis suggested.** 4,000+ lines to replace. Almost no dependency on game mechanics — it's geometry and rendering. Can start early and progress independently.
4. **C1 (View Capabilities) gates all UI.** Every component needs to know "what can this viewer see and do?" Must be designed early, even if implemented incrementally.
5. **D7 (Move Resolution) is the heaviest convergence point** in the mechanics track — needs energy, status, weather, lens, state machine.
6. **E8 (Training) is still the most dependent leaf system.** Needs traits, skills, unlock conditions, loyalty, social skill hierarchy, dispositions.
7. **D10 (Items) and D11 (Mounting/Living Weapon) are semi-independent.** Plug into lens and combat but don't block progression or core mechanics.
8. **UI is not a separate phase.** Each system's UI is designed alongside its backend, gated by Track C (View Capabilities).

## Known concerns

**Trait complexity.** D1 (Trait System) is listed as a single item but the PTR trait vault has ~197 trait definitions across three categories (innate, learned, emergent) with wildly different behaviors. Traits can: grant passive stat bonuses, modify skill checks, trigger on specific combat events, grant new actions, modify existing moves, interact with weather/terrain/status conditions, gate other traits as prerequisites, scale with level, and more. Traits are also the unified replacement for PTU's Abilities, Capabilities, Natures, Features, Edges, and Classes — meaning they carry the weight of six former systems. Like moves, this likely needs a trait effect framework with pluggable effect types, not a flat CRUD system. The dependency analysis may underrepresent how much D1 shapes everything downstream — traits touch combat, skills, training, breeding, evolution, and entity display.

**Move complexity.**

D7 (Move Resolution) is listed as a single item but PTR moves are extremely complex — not a uniform "deal damage" pipeline. The move vault has ~382 moves with widely varying behaviors: multi-hit, multi-turn, self-damage, recoil, stat stage changes, status infliction, field effects, weather interactions, conditional triggers, healing, switching, terrain manipulation, and more. The documentation vault has ~371 move implementation specs. This is not one system — it may need to be decomposed into a move effect framework with pluggable effect types, each with its own design. The dependency analysis currently underrepresents this complexity. The adversarial review should probe whether D7 is actually multiple systems hiding under one label, and what that means for the dependency graph.

**Status:** Posted for adversarial review. This analysis should be challenged broadly — not just the dependency ordering, but the assumptions underneath it. Are the track boundaries real or artificial? Are there systems missing entirely? Does the gap analysis in the thread header still hold, or has it drifted? Are there hidden coupling points that would break the claimed parallelism? Are any systems over- or under-scoped? Does the ordering reflect actual build priority or just logical dependency? Question everything — the goal is a plan we can trust, not one that looks clean.

