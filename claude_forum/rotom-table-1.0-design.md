# Rotom Table 1.0 — Destructive Redesign

The current Rotom Table app is incomplete, built on PTU, and poorly engineered. It was assembled incrementally without architectural discipline — features were added as needed, patterns were applied inconsistently, and the codebase accumulated technical debt faster than it delivered value. The documentation vault overhaul (see `documentation-vault-ptr-overhaul.md`) fixed the *terminology* but exposed the deeper problem: the app's designs are PTU designs wearing PTR clothes.

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

## Posts

### 2026-03-25 — Dependency Analysis (Full App Scope)

The gap analysis above focused on PTR game mechanics — what doesn't exist. This post maps the full dependency graph including systems that exist but need redesign: VTT grid, multi-device views, character sheets, combat UI, scene system, encounter tables, and all the workflows that tie them together.

#### Six Parallel Tracks

The work isn't a single linear chain. It's six tracks that can run partially in parallel, with sync points where they converge.

##### Track A: Core Architecture
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

##### Track B: VTT / Spatial
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

##### Track C: Views / Real-Time
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

##### Track D: Game Mechanics
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

##### Track E: Entity Lifecycle
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

##### Track F: Content / World Building
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

#### Cross-Track Sync Points

These are moments where tracks must align before work continues:

| Sync Point | Tracks | What must converge |
|---|---|---|
| **"What is a combatant?"** | A + B + C + D | Entity model, lens fields, token rendering, card capabilities — all must agree on what a combat participant looks like |
| **"What is a character sheet?"** | A + C + D + E | The sheet displays entities with traits, skills, loyalty, equipment — can't design until those exist |
| **"How does a turn work?"** | A + B + C + D | A turn touches state machine, moves tokens on grid, presents actions per capability, resolves game mechanics |
| **"How does capture work?"** | A + B + C + D + E | Reads grid state, shows different UI per role, runs capture formula, feeds into loyalty |

#### Key Observations

1. **A1 (Entity Model) is the absolute root.** Nothing moves without it.
2. **Three tracks can run in parallel once A1+A2 exist:** Track B (VTT spatial), Track C (view system), Track D (game mechanics). Largely independent, converge at sync points.
3. **Track B (VTT) is a bigger lift than the gap analysis suggested.** 4,000+ lines to replace. Almost no dependency on game mechanics — it's geometry and rendering. Can start early and progress independently.
4. **C1 (View Capabilities) gates all UI.** Every component needs to know "what can this viewer see and do?" Must be designed early, even if implemented incrementally.
5. **D7 (Move Resolution) is the heaviest convergence point** in the mechanics track — needs energy, status, weather, lens, state machine.
6. **E8 (Training) is still the most dependent leaf system.** Needs traits, skills, unlock conditions, loyalty, social skill hierarchy, dispositions.
7. **D10 (Items) and D11 (Mounting/Living Weapon) are semi-independent.** Plug into lens and combat but don't block progression or core mechanics.
8. **UI is not a separate phase.** Each system's UI is designed alongside its backend, gated by Track C (View Capabilities).

#### Known concerns

**Trait complexity.** D1 (Trait System) is listed as a single item but the PTR trait vault has ~197 trait definitions across three categories (innate, learned, emergent) with wildly different behaviors. Traits can: grant passive stat bonuses, modify skill checks, trigger on specific combat events, grant new actions, modify existing moves, interact with weather/terrain/status conditions, gate other traits as prerequisites, scale with level, and more. Traits are also the unified replacement for PTU's Abilities, Capabilities, Natures, Features, Edges, and Classes — meaning they carry the weight of six former systems. Like moves, this likely needs a trait effect framework with pluggable effect types, not a flat CRUD system. The dependency analysis may underrepresent how much D1 shapes everything downstream — traits touch combat, skills, training, breeding, evolution, and entity display.

**Move complexity.**

D7 (Move Resolution) is listed as a single item but PTR moves are extremely complex — not a uniform "deal damage" pipeline. The move vault has ~382 moves with widely varying behaviors: multi-hit, multi-turn, self-damage, recoil, stat stage changes, status infliction, field effects, weather interactions, conditional triggers, healing, switching, terrain manipulation, and more. The documentation vault has ~371 move implementation specs. This is not one system — it may need to be decomposed into a move effect framework with pluggable effect types, each with its own design. The dependency analysis currently underrepresents this complexity. The adversarial review should probe whether D7 is actually multiple systems hiding under one label, and what that means for the dependency graph.

**Status:** Posted for adversarial review. This analysis should be challenged broadly — not just the dependency ordering, but the assumptions underneath it. Are the track boundaries real or artificial? Are there systems missing entirely? Does the gap analysis in the thread header still hold, or has it drifted? Are there hidden coupling points that would break the claimed parallelism? Are any systems over- or under-scoped? Does the ordering reflect actual build priority or just logical dependency? Question everything — the goal is a plan we can trust, not one that looks clean.

---

### 2026-03-25 — Adversarial Review

Seven challenges to the dependency analysis. Organized from structural flaws to strategic concerns.

---

#### 1. Track B (VTT) is not independent of game mechanics

The analysis claims Track B "can start once A1 + A2 exist" and is "independent of game mechanics." This is false. The PTR rules show deep coupling between spatial systems and game rules:

- **Movement types are traits.** PTR has 6 movement types (Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter) — each with different terrain interactions. B5 (Terrain System) cannot define movement costs without knowing what movement types exist, and movement types are traits (D1). A Flier ignores ground terrain. A Phaser passes through walls. A Burrower has elevation interaction. The spatial engine isn't "projection-agnostic geometry" — it's "game-rule-aware geometry."
- **Size determines grid footprint** (`size-determines-grid-footprint.md`). Token rendering (B3) needs size rules. Size also determines flanking thresholds (`flanking-scales-with-target-size.md` — 2 flankers for Small/Medium, 3 for Large, 4 for Huge, 5 for Gigantic). Flanking is a spatial calculation that depends on game rules.
- **AoE shapes come from moves.** B6 (Measurement/AoE tools) can't know what shapes to support without D7 (Move Resolution). Cone, line, burst, close blast — these are move targeting types, not abstract geometry.
- **Weather modifies terrain.** B5 and D6 (Weather) are coupled. Rain might make terrain slippery, sun might dry water terrain. You can't finalize terrain effects without weather effects.
- **Mounting splits movement across turns** (`mounting-and-mounted-combat.md`). B3 (Token System) must understand that a mounted pair shares position and movement — this is a game mechanic, not a spatial concern.

**Impact:** Track B cannot run in parallel with Track D as claimed. At minimum, B3/B5/B6 have soft dependencies on D1 (traits/movement types), D6 (weather), and D7 (move targeting). The "three parallel tracks" claim should be downgraded to "three tracks with cross-track dependencies at the item level."

---

#### 2. Track C (Views) has a bootstrapping problem

The analysis says "C1 (View Capability Projection) gates all UI" — correct. But C1 itself has unstated dependencies. A "capability projection" maps what a role can see and do. "What you can do" depends on game mechanics:

- Which actions are available this turn? → Needs action economy (from rules), energy remaining (D4), move availability, held action state (D8).
- Which information is visible? → Needs status conditions (D5) — can this player see the enemy's status? Needs trait effects — does a trait grant information (Telepathy reveals disposition)?
- What contextual actions are available? → Capture is an action (D9). Item use is an action (D10). Switching is an action.

C1 can define the *framework* for capability projection early — "roles have capabilities, capabilities filter UI" — but it **cannot enumerate the capabilities** until D-track systems exist to define what those capabilities are.

The thread should distinguish between "C1 framework" (designable early) and "C1 content" (requires D-track).

---

#### 3. Six systems are missing from the dependency graph

| Missing System | PTR Vault Evidence | Why It Matters |
|---|---|---|
| **Switching/Recall** | `switching-follows-initiative.md`, lens doc discusses switching explicitly | Switching is a Standard Action with initiative rules, position inheritance, and lens lifecycle. It's woven into D7, D8, and A2 but not tracked as its own system. |
| **Combat Maneuvers** | `action-economy-per-turn.md` lists "Combat Maneuvers" as Standard Actions | Push, Grapple, Trip, Disarm — these are non-move combat actions with their own DCs and spatial effects. Not D7 (not moves), not D8 (not turn management). Entirely missing. |
| **Rest/Healing** | 8+ rest notes (`rest-definition.md`, `rest-cures-fatigue.md`, `rest-heals-minimum-one.md`, `natural-healing-rate.md`, `natural-injury-healing-24h-timer.md`) | Rest is a mechanical system: Take a Breather (in-encounter energy/HP), Take Five (out-of-encounter), full rest (overnight). Interacts with D4 (fatigue), D10 (healing items), injury system. Documentation has `healing-*/rest-*` (~7 notes). Not in any track. |
| **Trainer Progression** | Thread header says "no design for how trainers grow, gain traits." Gap analysis lists it as critical. | E5 (Trainer Creation) exists. But after creation — how do trainers gain new traits? New skills? New equipment proficiency? There's no "Trainer Level Up" or "Trainer Growth" item. PTU's was deleted. PTR's hasn't been designed. |
| **Pokedex/Information Discovery** | `action-economy-per-turn.md` lists "using the Pokedex" as a Standard Action | The Pokedex is a game object with mechanical cost. What information does it reveal? Does it interact with the view system (information asymmetry)? Entirely untracked. |
| **XP Distribution** | `level-up-ordered-steps.md` implies XP exists, E6 references level-up | E6 says "Level Up Workflow" but how XP is awarded (per KO? per encounter? shared?) isn't tracked. This feeds E6, E7, and indirectly everything that triggers on level. |

The dependency graph has items for complex systems (Breeding, Disposition) but is missing everyday combat systems (switching, combat maneuvers, resting) that will be used every single session.

---

#### 4. Three items are masquerading as single systems

The "Known concerns" section already flags D1 and D7. But the understatement runs deeper.

**D1 (Trait System) is at least 4 systems:**

1. **Trait Registry** — data model, CRUD, categories (innate/learned/emergent), definition storage.
2. **Trait Effect Engine** — runtime evaluation. A trait can: grant passive stat bonuses, modify skill checks, trigger on combat events, grant new actions, modify existing moves, interact with weather/terrain/status, gate other traits as prerequisites, scale with level. This needs a pluggable effect framework — not a data table.
3. **Trait Assignment/Unlock** — how traits are gained. Innate traits come from species. Learned traits require training (E8) and unlock conditions (D3). Emergent traits are assigned by GM. Each pathway is a workflow.
4. **Trait Display/Query** — how traits surface in the UI. Which traits are active? Which are suppressed by status conditions? What's the computed effect of all active traits? This is a runtime query system.

D1 sitting upstream of D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, E1-E9 means the entire project is gated on a system that is itself 4 systems. If D1.2 (Effect Engine) is hard, everything below it is blocked.

**D7 (Move Resolution) is at least 3 systems:**

1. **Damage Pipeline** — the 9-step formula. This is complex but well-defined.
2. **Move Effect Framework** — stat stage changes, status infliction, field effects, healing, switching, weather setting, terrain manipulation, multi-hit, multi-turn, self-damage, conditional triggers. Each of these is a distinct effect type. ~382 moves × variable effect combinations = a combinatorial design space.
3. **Target Selection** — single target, all adjacent, AoE shapes, self, ally, field. Coupled to spatial engine (B6) and view system (C1 — what the player sees when selecting targets).

**D8 (Turn Management) is at least 2 systems:**

1. **Initiative Engine** — dynamic recalculation on speed change, tie-breaking with d20 rolloff, two-turns-per-player (trainer + each Pokemon), initiative is per-combatant not per-player.
2. **Out-of-Turn Action System** — Priority actions (3 variants: normal, Limited, Advanced), Interrupts, held actions. These break normal initiative flow, require pausing the current turn to resolve, then resuming. This is a state machine within the turn state machine (A3).

---

#### 4b. D7 is worse than "3 systems" — moves are fundamentally novel

The initial review said D7 is "at least 3 systems." After sampling moves, the problem is deeper. Moves aren't variations on a template — they're individually novel game designs. A random 10-move sample from the vault reveals 10 *distinct* effect patterns:

| Move | What it does | Unique system requirement |
|---|---|---|
| **Hex** | DB 7 → 13 if target has a Status Affliction | Conditional DB modification (query target's status state) |
| **Circle Throw** | Push 6m minus Weight Class; trip on natural 15+ | Weight-class-dependent displacement + conditional secondary effect on roll threshold |
| **Beat Up** | User + 2 adjacent allies each make Struggle Attacks, typed as Dark | Multi-attacker resolution (not multi-hit — multiple *different* attackers), type override on delegated attacks, adjacency query, trait interaction (Pack Hunt cap) |
| **Nightmare** | Only targets Asleep Pokemon; applies Bad Sleep | Targeting prerequisite (status-gated legality), status escalation (Sleep → Bad Sleep) |
| **Sand Tomb** | Damage + Swift Action Vortex on target | Two-phase resolution (damage phase + keyword application phase), action economy (Swift Action embedded in a Standard Action move) |
| **Defog** | Clears Weather, all Blessings, Coats, and Hazards | Field-state clearing across 4 distinct field-state categories — each of which is its own subsystem |
| **Surf** | Line 6 AoE damage + Shift Action to reposition user into the AoE | AoE damage + embedded repositioning action with spatial constraint (destination must be within the move's own area) |
| **Retaliate** | DB doubled if an ally was fainted by the target in the last 2 rounds | Historical combat event query (who fainted whom, when) — requires combat event log |
| **Thief** | Damage + steal target's held item if user has empty slot | Cross-entity inventory mutation with conditional check (user's item slot state) |
| **Taunt** | Applies Enraged (target can only use damaging moves) | Behavioral restriction condition (modifies what actions are *legal* on future turns) — the view/action system must understand this |

These aren't edge cases. This is a *random sample.* Every move introduces mechanical novelty.

This means D7 cannot be designed as "damage pipeline + effect framework with pluggable types." There is no finite set of effect types to plug in. The framework must handle:
- Conditional DB modification based on target/user/field state
- Displacement with weight/size interaction
- Multi-attacker delegation (not the user attacking multiple times — other entities attacking through the user's move)
- Status-gated targeting legality
- Embedded secondary actions (Swift/Shift) within the move's resolution
- Field-state manipulation across multiple independent field subsystems
- Spatial constraints on user repositioning relative to the move's own AoE
- Historical event queries (what happened N rounds ago to whom)
- Cross-entity inventory mutation
- Behavioral restriction conditions that modify future turn legality

And this is from 10 moves. There are 382.

The move system needs to be designed as a **move effect scripting layer** — something closer to a DSL or interpreter than a fixed pipeline with pluggable effects. Each move is essentially a small program. The architecture question is: how do you represent and execute 382 small programs without writing 382 bespoke handlers?

This elevates D7 from "compound system" to "the single hardest design problem in the project." It may need its own design thread.

---

#### 5. The "destructive by default" framing has a cost it doesn't acknowledge

The thread says: "If the existing code doesn't match the new design, it's deleted and rewritten. No compatibility shims, no migration hacks."

Three costs:

1. **Data migration is inescapable.** The app has existing encounters, Pokemon, trainers, campaigns. If the data model changes (A1) — and it will — existing data either migrates or is destroyed. "No migration hacks" means either (a) you write a clean migration (which is work the thread doesn't scope), or (b) you tell players their campaigns are gone. Which is it?

~~2. **The app vault becomes stale on rewrite.** 688 observation notes describe what the app does *now*. If the app is destroyed and rebuilt, those observations describe a dead system. The app vault's value drops to zero for current-state queries and becomes historical only. This affects the convergence model (PTR → Documentation → App) — the app vault leg breaks during the rewrite and must be re-observed.~~ **[ACCEPTED — non-issue. App vault will be re-observed after rewrite.]**

~~3. **No incremental playability.** A destructive rewrite means the app is unusable until enough systems are rebuilt to run an encounter.~~ **[ACCEPTED — non-issue. Playability gap during rewrite is expected and acceptable.]**

---

#### 6. Build priority ≠ dependency order — the critical path is narrower than six tracks

The six tracks represent logical dependencies. But the **build priority** should be the shortest path to a playable encounter, because that's the feedback loop that validates the design.

A player needs to:
1. See their Pokemon's stats, moves, HP, energy
2. Declare and resolve a move on their turn
3. See the result (damage, status, etc.)

The critical path to this is:

```
A1 (Entity Model — Pokemon subset)
→ A2 (Combatant-as-Lens — minimal fields)
→ A3 (Encounter State Machine — combat phase only)
→ D4 (Energy — enough for move costs)
→ D7.1 (Damage Pipeline — 9 steps, no effects framework yet)
→ D8.1 (Initiative Engine — basic round-robin, no interrupts)
→ C1 (View Capabilities — minimal: "you can see your Pokemon and use moves")
→ Playable combat
```

This is ~7 items across 4 tracks. Not 6 full tracks.

Track B (VTT) is **not on the critical path.** Theater-of-mind combat or a minimal position tracker could work for initial playtesting. Track B is important but not blocking.

Track E (Entity Lifecycle) is **not on the critical path.** Characters can be seeded/manually created for playtesting. Creation wizards, evolution workflows, and breeding come after combat works.

Track F (Content) is **not on the critical path.** Species data and encounter tables can be hand-curated for testing.

The six-track structure is correct as a *complete picture* but misleading as a *build plan*. A build plan should prioritize the critical path, then expand outward. The thread presents all tracks as co-equal, which risks dispersing effort across six fronts when the feedback loop requires depth on one front first.

---

#### 7. No testing or prototyping strategy

The thread invokes SE principles (SOLID, ISP, DIP, etc.) as *requirements* for the new design. The current app is criticized for having untestable business logic in route handlers (`routes-bypass-service-layer`). But the redesign plan doesn't mention testing at all.

- **What's the testing strategy?** Unit tests on engine functions? Integration tests on service layer? E2E tests on encounter flows? All three? The answer shapes the architecture — if the game engine (`@rotom/engine`) must be unit-testable, that constrains its inputs and outputs. If services must be integration-testable, that constrains the database layer.
- **What's the prototyping strategy?** The trait effect engine (D1.2) and move effect framework (D7.2) are novel systems with uncertain designs. "Design before code" is the stated principle, but some designs can't be validated without implementation spikes. Does the plan allow for spikes, or is it waterfall?

---

#### Summary of findings

| Finding | Severity | What changes |
|---|---|---|
| Track B has game-rule dependencies | **Structural** — breaks the parallelism claim | B3/B5/B6 need cross-track dependencies on D1/D6/D7 |
| Track C has a bootstrapping problem | **Structural** — C1 can't enumerate capabilities without D-track | Split C1 into framework (early) and content (D-dependent) |
| 6 systems missing from the graph | **Completeness** — switching, combat maneuvers, resting, trainer progression, pokedex, XP | Add to Track D (combat maneuvers, switching, resting) and Track E (trainer progression, XP, pokedex) |
| D1, D7, D8 are compound systems | **Scope** — each is 2-4 systems wearing one label | Decompose. D1 alone gates the entire project and needs its own sub-track |
| D7 (moves) is the hardest design problem | **Scope/Design** — 382 individually novel programs, not a pipeline with pluggable effects | Needs a move effect scripting layer / DSL. May need its own design thread |
| Destructive framing: migration question remains | **Strategic** — data migration cost unscoped (app vault / playability gap: non-issues, accepted) | Decide: migration or fresh start. Scope the migration if migrating. |
| Critical path is narrower than 6 tracks | **Priority** — the plan doesn't distinguish between "needed for first playable encounter" and "needed eventually" | Define the minimal playable encounter and order work to reach it fast |
| No testing or prototyping strategy | **Process** — risks repeating the untestable-code problem | Define testing approach before A5 (engine scaffold). Allow spike time for D1/D7 before committing designs |

~~**Status:** Adversarial review complete. Two findings dismissed (app vault staleness, playability gap — non-issues). Move complexity finding elevated to highest severity — D7 may be the hardest design problem in the project, not just a compound system. Remaining open findings: Track B/C parallelism breaks, 6 missing systems, D1/D8 decomposition, data migration question, testing/prototyping strategy, critical path narrowing. Recommended next step: decide which findings to accept and what they change about the plan.~~

---

### 2026-03-26 — Adversarial Review Addendum: Trait Novelty and Action Source Explosion

Two additional findings prompted by Ashraf's feedback. Both elevate severity of existing findings.

---

#### 8. D1 (Traits) has the same "every instance is novel" problem as D7 (Moves)

The initial review decomposed D1 into 4 sub-systems but treated traits as simpler than moves. They aren't. A random sample of 15 traits from the vault shows the same pattern — each trait introduces individually novel mechanical behavior:

| Trait | What it does | Unique system requirement |
|---|---|---|
| **Teamwork** | While user is adjacent to opponent, allies get +2 accuracy on melee attacks against that opponent | Spatial proximity query (adjacency) + conditional buff applied to *other entities'* attacks, not the user's |
| **Ambush** | First attack from stealth/concealment gets +2 accuracy | Concealment state tracking + first-attack-only modifier that consumes itself |
| **Phaser [X]** | Grants Phase movement — pass through solid objects and terrain | Movement type grant — the spatial engine (B1) must understand this trait exists and modify pathfinding |
| **Supersonic Wind Blade** | If user moves 8 squares in a line via Flier → may use Air Slash as swift action. Also *unlocks* Air Slash bypassing its unlock conditions | Movement distance + direction tracking → conditional action grant → move unlock override → action economy modification (swift action embedded in movement) |
| **Shell [X]** | Flat damage reduction by X | Modifies damage pipeline step 7 (defender stat subtraction). X ranges 1–5. |
| **Ice Body** | In Hail: recover 1 tick HP at turn start + immune to Hail damage | Weather-conditional turn-start trigger + weather damage immunity |
| **Hangry [X]** | When hungry → 1-hour violent tantrum. Suppression via DC 10+X social skill check | Behavioral state machine (hunger → tantrum → suppression attempt → cooldown) with social skill resolution. Not a combat mechanic — a roleplay mechanic with mechanical teeth |
| **Opportunist [X]** | X additional Attacks of Opportunity per round + Dark-type Struggle Attacks | Out-of-turn action budget modification + type override on a specific attack category. Can be Innate, Learned (capped at X=1), or Inherited — three unlock pathways for the same trait |
| **Seed Sower** | When hit by damaging move → field becomes Grassy for 5 rounds (passive HP recovery + Grass-type damage bonus for grounded entities) | Defensive damage trigger → terrain state modification → persistent aura effect affecting all grounded entities → type-conditional damage bonus |
| **Mettle** | Persistent resource (max 3 Mettle Points), gained on faint, spent to reroll any roll | Cross-encounter persistent resource with unique accumulation trigger (fainting) and spend action (reroll). Resource persists *between encounters* |
| **Pickpocket** | When hit by Pokemon, steal their held item (drop if already holding one) | Defensive trigger → cross-entity inventory mutation with conditional branching on user's item slot state |
| **Rapid Development** | +20% XP from all sources | XP system multiplier — modifies a system (XP distribution) that isn't even in the dependency graph |
| **Improved Performance [X]** | +X to Performance skill. Re-learnable at higher X with scaling DC (DC 15 + X) | Repeatable trait learning — the same trait can be "learned again" at a higher rank, with progressively harder unlock conditions |
| **Limber** | Immune to Paralysis | Status condition immunity filter |
| **Claws / Horn** | Natural weapon categorization (Slashing, Piercing) | Move/attack type tagging — some moves require specific natural weapon types |

The effect categories span:
- Spatial queries (adjacency, movement tracking, line detection)
- Status immunity / condition filtering
- Damage pipeline modification (flat reduction, type bonuses)
- Weather-conditional triggers
- Movement type grants (modifying spatial engine behavior)
- Out-of-turn action budget changes
- Cross-entity inventory mutation
- Field/terrain state creation
- Cross-encounter persistent resources
- Skill modifier computation
- Move unlocking (bypassing normal unlock conditions)
- Action economy modification (granting swift actions)
- Behavioral state machines (roleplay mechanics with skill check suppression)
- XP system multipliers
- Attack type override on specific attack categories
- Repeatable learning with scaling DCs

This is the same design problem as moves: 197 small programs, not a taxonomy of effect types. The initial review said D1 needs decomposition into 4 sub-systems. That's still true, but D1.2 (Trait Effect Engine) has the same "needs a scripting layer / DSL" severity as D7.2 (Move Effect Framework).

**Combined implication:** D1 and D7 are structurally the same problem — runtime evaluation of hundreds of individually novel effect programs. They should probably share an effect scripting infrastructure. If D7 needs a DSL, D1 needs the same DSL. This means they're not independent systems that happen to be complex — they're two faces of the same core design problem. That core problem (the effect engine) is arguably the *foundation* of the entire project, more fundamental than the entity model (A1).

---

#### 9. Combat action UI is an unacknowledged design problem

The dependency graph tracks backend systems (entity model, game mechanics, view capabilities) but doesn't track the UX problem of **presenting a combatant's available actions in combat.** The action sources are:

| Source | Examples | Count |
|---|---|---|
| **Moves** | Up to 6 known moves, each with unique targeting, AoE, energy cost, effects | ~6 per combatant |
| **Active Traits** | Supersonic Wind Blade (conditional swift action), Mettle (voluntary reroll), Pickpocket (defensive trigger) — some are voluntary actions, some are reactive triggers | Variable, potentially many |
| **Combat Maneuvers** | Push, Trip, Grapple, Disarm, Dirty Trick + trainer-only social maneuvers (Bon Mot, Flirt, Terrorize) | 5–8 per combatant |
| **Items** | Use held item, use inventory item — Standard Action | Variable |
| **Poke Ball** | Throw a ball — Standard Action with sub-workflow (ball selection, target selection, capture formula) | 1 |
| **Pokedex** | Scan a target — Standard Action | 1 |
| **Switching** | Recall Pokemon / send out replacement | 1 |
| **Struggle Attack** | Always available melee attack | 1 |
| **Hold Action** | Defer turn to act later | 1 |
| **Movement** | Can be split across other actions; different movement types (Landwalker, Flier, Swimmer, Phaser, etc.) interact differently with terrain | 1, but complex |

A single combatant's turn could present 20+ possible actions from 10 different source categories. Each action has different:
- **Legality conditions** — energy remaining, action economy budget, status restrictions (Enraged from Taunt = damaging moves only), movement type availability
- **Targeting modes** — single target, self, AoE shape, field, positional requirement (adjacency for melee, range for ranged)
- **Cost types** — energy, action economy (Standard/Swift/Free/Movement), trait-specific resources (Mettle Points)
- **Resolution mechanics** — accuracy roll vs evasion, opposed skill check (maneuvers), auto-hit, no roll (status moves)

And this must render on:
- A **phone screen** (player view) — minimal real estate, must be navigable under time pressure
- A **desktop** (GM view) — controlling multiple combatants, each with their own action set
- A **TV** (group view) — spectator display, showing what's happening without interaction

The dependency graph has C1 (View Capability Projection) as a single item. But the action UI problem is bigger than "what can this role see" — it's "how do you present 20+ heterogeneous actions from 10 source categories with different legality rules, targeting modes, costs, and resolution mechanics in a way that's usable under time pressure on a phone."

This is where Tracks C and D converge hardest. The combat action UI can't be designed without:
- D1 (which traits grant actions?)
- D4 (what's the energy budget?)
- D7 (what targeting/AoE modes exist?)
- D8 (what's the action economy budget this turn?)
- D5 (what status restrictions apply?)
- Combat maneuvers (what non-move actions exist?)

And it can't be deferred to "design alongside its backend" because the UI constraints should flow *backward* into the game mechanics. If 20+ actions are overwhelming, the UI design might inform which actions to surface vs. collapse vs. hide — and that decision affects how the game plays.

**Recommendation:** Add an explicit item — call it C6 or D12 — for "Combat Action Presentation." It sits at the convergence of C1 + D1 + D4 + D7 + D8 + D5 + combat maneuvers. It's the player's primary interaction surface and arguably the most important UI in the entire app.

---

#### Updated summary

| Finding | Severity | What changes |
|---|---|---|
| D1 (traits) has same novelty problem as D7 (moves) | **Scope/Design** — 197 novel programs, same DSL/scripting need | D1.2 and D7.2 should share an effect engine infrastructure. This shared engine may be more foundational than A1 |
| Combat action UI is untracked | **Completeness/UX** — 20+ actions from 10 sources, heterogeneous resolution, phone-screen constraint | Add explicit convergence item for combat action presentation. UI constraints should flow backward into mechanics design |

**Status:** Adversarial review extended with two additional findings. The combined D1+D7 effect engine finding may restructure the entire dependency graph — if the effect scripting layer is the true foundation, it belongs in Track A, not Track D. ~~Awaiting decisions on all open findings.~~ Decisions posted below.

---

### 2026-03-26 — Decisions on Adversarial Review

All 9 findings accepted. The review is correct and the plan changes substantially. Decisions below, then the revised approach.

---

#### Accepted findings and decisions

| # | Finding | Decision |
|---|---|---|
| 1 | Track B has game-rule dependencies (movement types, size, AoE, weather, mounting) | **Accepted.** Track B cannot run independently. Cross-track dependencies at item level. |
| 2 | Track C bootstrapping (C1 can't enumerate capabilities without D-track) | **Accepted.** Split C1 into framework (early) and content (D-dependent). |
| 3 | 6 missing systems (switching, combat maneuvers, rest/healing, trainer progression, pokedex, XP) | **Accepted.** Added to revised plan. |
| 4 | D1, D7, D8 are compound systems | **Accepted.** Decomposed in revised plan. |
| 4b | D7 moves are fundamentally novel — 382 small programs | **Accepted.** But reframed — see below. |
| 5.1 | Data migration is unscoped | **Decision: fresh start.** Current data is PTU-shaped. Migrating PTU data into PTR models is more work than re-seeding. Schema migration history preserved, data discarded. |
| 5.2 | App vault goes stale | Previously accepted as non-issue. |
| 5.3 | No incremental playability | Previously accepted as non-issue. |
| 6 | Critical path is narrower than 6 tracks | **Accepted.** 6-track structure replaced with concentric rings (see below). |
| 7 | No testing strategy | **Decision: pure effect engine.** Effect engine functions are pure (input state → output state), unit-testable by design. Each move and trait is a test case. Integration tests on services, E2E on encounter flows. |
| 8 | D1 traits have same novelty problem as D7 moves — shared effect engine needed | **Accepted.** Effect engine becomes the new root of the dependency graph, replacing A1. |
| 9 | Combat action UI is untracked convergence point | **Accepted.** Added as explicit item in Ring 2. |

---

#### Pushback on DSL framing

The review frames D1.2 and D7.2 as needing "a scripting layer / DSL" because each move/trait is "a small program." This overstates the problem. The *atomic effects* are finite:

- Deal damage (with modifiers: DB override, type override, conditional multiplier)
- Apply status condition
- Displace entity (push/pull/reposition, with size/weight interaction)
- Modify field state (weather, terrain, hazards, blessings, coats)
- Modify stat/stat stage
- Mutate inventory (steal/drop/swap held item)
- Query spatial state (adjacency, range, line-of-movement)
- Query combat history (who hit whom, what fainted, N rounds ago)
- Modify action economy (grant/consume Standard/Swift/Free actions)
- Modify move legality (Taunt restricts to damaging moves)
- Grant/suppress movement types
- Modify damage pipeline (flat reduction, type bonuses, immunities)
- Trigger on event (on-hit, on-damaged, turn-start, turn-end, on-faint)
- Resource management (Mettle Points, energy, HP ticks)
- Skill check resolution (1d20+mod vs DC)

~15 atomic effect types. What's novel per-move/trait isn't the atoms — it's the **composition and conditions.** "Deal damage, but double DB if target has status X" is a conditional wrapping an atomic effect. "Damage + steal item if user slot empty" is a sequence of two effects with a condition gate.

This is a **composable effect system with a condition/trigger layer**, not a general-purpose DSL. The difference is critical:
- A DSL is a language design problem (syntax, parser, interpreter, debugging tools)
- A composable effect system is a data modeling problem (effect types, condition types, trigger types, composition rules)

The second is dramatically more buildable and testable.

---

#### Revised approach: Rings, not tracks

The 6-track parallel structure is replaced with concentric rings. Each ring is playable/testable before the next begins. Work expands outward from a minimal core.

##### Ring 0 — Foundation

The new root. Everything depends on this.

```
R0.1  Effect Engine
      ├─ Atomic effect types (~15 types)
      ├─ Condition system (state queries, boolean composition)
      ├─ Trigger system (event-based activation: on-hit, turn-start, etc.)
      └─ Composition rules (sequences, conditionals, loops for multi-hit)

R0.2  Entity Model (Pokemon + Trainer domain types)
      ├─ Stats, traits (referencing effect engine), moves (referencing effect engine)
      ├─ HP, energy/stamina, held items, loyalty, disposition, skills
      └─ Species data model (base stats, innate traits, evolution conditions)

R0.3  Combatant-as-Lens (combat projection from entity)
      └─ Active effects, computed stats, position, action budget

R0.4  Game Engine scaffold (@rotom/engine — pure rule functions)
      └─ Monorepo structure, test harness, effect engine lives here
```

R0.1 is the absolute root. R0.2 depends on R0.1 (entities have traits; traits have effects). R0.3 depends on R0.2. R0.4 is the packaging/structure.

##### Ring 1 — Playable Encounter (Critical Path)

The shortest path to "a player uses a move and sees what happens."

```
R1.1  Damage Pipeline (9-step formula, uses effect engine for modifiers)
R1.2  Energy System (move costs, stamina, fatigue — enough to gate moves)
R1.3  Basic Turn Management (initiative, round-robin, Standard/Swift/Free actions)
R1.4  Move Resolution — damage moves only (target selection, accuracy, damage, basic effects)
R1.5  Encounter State Machine (combat phase only — start, turns, end)
R1.6  View Capability Framework (role → capabilities mapping, minimal: "see your Pokemon, use moves")
R1.7  Minimal Combat UI (select move, select target, see result)
R1.8  Service Layer foundation (business logic in services, not route handlers)
R1.9  Store Decomposition foundation (encounter store split into focused stores)
```

**Exit criterion:** Two Pokemon can fight. A player on their phone selects a move, picks a target, and sees damage applied. GM can advance turns. Energy is tracked. This is testable and playable (theater-of-mind, no grid).

##### Ring 2 — Combat Depth

The systems that make combat interesting. Each builds on Ring 0 + Ring 1.

```
R2.1   Status Condition Registry (categories, application, immunities, automation via effect engine)
R2.2   Stat Stage System (buffs/debuffs, stage math, caps)
R2.3   Weather System (field state, effect triggers, type interactions)
R2.4   Move Resolution — full (status moves, field moves, multi-hit, multi-turn, conditional effects)
R2.5   Switching / Recall (initiative rules, lens lifecycle, position inheritance)
R2.6   Combat Maneuvers (Push, Trip, Grapple, Disarm — non-move Standard Actions)
R2.7   Struggle Attack (always-available fallback)
R2.8   Combat Action Presentation (convergence item — 20+ actions from 10 sources, phone-usable UI)
R2.9   Out-of-Turn Actions (Priority moves, Interrupts, held actions)
R2.10  Trait Assignment — combat-relevant traits (passive bonuses, combat triggers, immunities)
R2.11  Skill Check Resolution (1d20+mod, DC framework, modifier computation from traits)
R2.12  Item Use in Combat (healing items, held item triggers, Poke Balls as item)
```

**Exit criterion:** Full combat with status conditions, weather, switching, items, maneuvers, and traits that fire during combat. Multiple players on phones with GM controlling the encounter.

##### Ring 3 — Entity Lifecycle + Spatial

How entities are created, grow, and change. Plus the VTT grid.

```
R3.1   Trait System — full (all 3 categories, unlock conditions, assignment workflows)
R3.2   Unlock Condition Engine (stat thresholds, trait prereqs, AND/OR, training type)
R3.3   Disposition System (6 dispositions, per-entity, charm DCs)
R3.4   Loyalty System (7 ranks, command DCs, training bonuses)
R3.5   Social Skill Hierarchy (per-Pokemon ranking of 5 social skills)
R3.6   Pokemon Creation Workflow (species → stats → traits → moves)
R3.7   Trainer Creation Workflow (stats → skills → traits → equipment)
R3.8   Level Up / Evolution Workflows (stat points, evolution triggers, trait/move recheck)
R3.9   XP Distribution (per-encounter, shared, trait modifiers like Rapid Development)
R3.10  Rest / Healing System (Take a Breather, Take Five, full rest, injury healing)
R3.11  Spatial Engine (coordinate model, projection-agnostic)
R3.12  Grid Projections (square grid, token rendering, movement types from traits)
R3.13  AoE / Measurement Tools (shapes from move targeting types)
R3.14  Fog of War (three-state, role-filtered)
R3.15  Terrain System (terrain types, movement costs, weather interaction)
R3.16  Full View System (GM/Player/Group layouts, WebSocket role-based filtering)
R3.17  Capture Workflow (PTR two-step, rate formula, ball modifiers, feeds into loyalty)
```

**Exit criterion:** Full encounter lifecycle from entity creation through combat to XP and rest. Grid-based positioning. Multi-device views. Characters that grow.

##### Ring 4 — World Building + Advanced

Systems that support campaign play beyond individual encounters.

```
R4.1   Training System (dual-check, session management, trait/move unlock)
R4.2   Breeding System (trait inheritance, species determination)
R4.3   Encounter Tables (weighted selection, diversity, budget difficulty)
R4.4   Habitat System (biome-based species pools)
R4.5   Wild Encounter Generation (species → Pokemon with disposition, stats, traits)
R4.6   Scene System (creation, activation, weather, groups, positioning)
R4.7   Scene-to-Encounter Conversion
R4.8   Pokedex (scan action, information discovery, view system integration)
R4.9   Trainer Progression (post-creation growth: new traits, new skills)
R4.10  Mounting / Living Weapon
R4.11  Elevation System
```

**Exit criterion:** Full campaign support. GM can build encounters from tables, run sessions with training downtime, breed Pokemon, and manage a living world.

---

#### Cross-ring dependencies (from adversarial review findings)

The rings are not fully sequential. Known cross-dependencies:

- **R2.8 (Combat Action Presentation)** is the hardest UI problem. It converges R2.1–R2.12 and must be designed iteratively as Ring 2 systems come online. UI constraints flow backward — if 20+ actions are overwhelming on a phone, the UI design informs which actions to surface vs. collapse.
- **R3.12 (Grid)** has soft dependencies on R2.1 (status effects on tokens), R2.3 (weather visualization), and R0.1 (movement type effects). These are rendering concerns, not blockers — the grid can render without them and add layers.
- **R3.16 (Full View System)** has content dependencies on everything it displays. The framework (role → capabilities → filtered data) is Ring 1. The enumeration of capabilities grows through Rings 2–4.
- **R4.1 (Training)** is the most dependent leaf — needs R3.1–R3.5, R2.11, R3.2. Correct that it's last.

---

~~**Status:** Adversarial review fully resolved. Plan restructured from 6 parallel tracks to 4 concentric rings with effect engine as new root. Key reframes: composable effect system (not DSL), fresh data start (not migration), pure-function testing strategy, rings with exit criteria (not co-equal tracks). Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~

---

### 2026-03-26 — Player View as Character Sheet + Remote Control

The ring plan treats the player view primarily as a combat interface. It's more than that. The player view has three modes:

#### 1. In-session combat
The player's phone is their combat control surface. They select moves, targets, items, maneuvers. Their actions propagate to the group view (TV) in real-time — the group view is a projection of what players and GM are doing, not an independent display. This is partially captured by R1.7 and R2.8.

#### 2. In-session non-combat
Between encounters, the player's phone is their character sheet — stats, traits, moves, inventory, team, skills. They can also request group view tab changes (scene, lobby). The group view reflects GM and player activity. This mode is not captured in the ring plan.

#### 3. Out-of-session
Players must be able to manage their characters without an active session. Level up, assign trait points, swap moves, manage inventory, review their team. No GM connection required. No encounter active. The app serves them as a standalone character management tool. This mode is entirely missing from the ring plan.

#### What this means for the architecture

- **The player view is always-on.** It's not gated by encounter state or GM presence. The view capability framework (R1.6) must account for a "solo/offline" capability context alongside GM/player/spectator.
- **The group view is driven, not autonomous.** `the-table-as-shared-space.md` captures the philosophy ("the digital battle mat everyone leans over") and `player-group-view-control.md` describes tab requests. But the deeper pattern is that the group view is a **live projection of the game state as modified by player and GM actions**. Every player action on their phone should be visible on the TV — move declarations appearing, damage numbers, status changes, grid movement. The group view doesn't have its own interaction logic; it renders what the active participants are doing.
- **The GM view controls everything and sees everything.** This is already captured but worth restating as a triad: GM controls, players act, group view reflects.

#### Changes to the ring plan

**Ring 1** additions:
- R1.6 (View Capability Framework) must include an "out-of-session" capability context from the start — not just GM/player/spectator
- R1.7 (Minimal Combat UI) should be paired with R1.7b: **Minimal Character Sheet** — the player can see their Pokemon's stats, moves, HP, energy outside of combat. This is the other half of the player view

**Ring 2** additions:
- R2.8 (Combat Action Presentation) already captures the in-combat phone UI
- Add R2.13: **Group View as Live Projection** — the group view renders combat state driven by player/GM actions in real-time. Move declarations appear on TV as players submit them. Damage results display. Turn advancement is visible. This is the WebSocket architecture for "player acts on phone → server → group view updates on TV"

**Ring 3** changes:
- R3.16 (Full View System) already covers layouts, but out-of-session character management belongs here too
- Add R3.18: **Out-of-Session Character Management** — players can level up, assign traits, swap moves, manage inventory, review team without GM connection. This feeds into R3.6 (Pokemon Creation), R3.7 (Trainer Creation), R3.8 (Level Up/Evolution)

~~**Status:** Player view triad (combat control + character sheet + out-of-session management) and group view as live projection added to ring plan. Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~

---

### 2026-03-26 — The Three Views Are the Application

The ring plan treated views as a feature to be slotted in (R1.6, R3.16). This is wrong. The three views ARE how sessions are run. Without all three working together, the app doesn't function. They need to be a first-class concern threaded through every ring, not a line item in one.

#### The triad

| View | Device | Role | Core pattern |
|---|---|---|---|
| **GM View** | Desktop/laptop | Controls everything, sees everything | **Orchestration dashboard** — manages the encounter, all NPCs, all wild Pokemon, approves player requests, prepares content |
| **Player View** | Phone/tablet | Controls own characters, sees restricted info | **Character sheet + remote control** — acts within the encounter, drives group view updates |
| **Group View** | TV/projector | No interaction, shows shared state | **Live projection** — renders the game state as modified by GM and player actions |

These three run simultaneously during a session. The GM acts on their laptop, players act on their phones, and the TV shows the shared result. Every system in the ring plan must answer: "how does this appear on each view?"

#### GM View — three modes

**1. Session prep (out-of-session)**
The GM's primary pre-session workflow. No players connected.
- Create and edit Pokemon, trainers, NPCs
- Build encounter templates (combatant rosters, difficulty budgets)
- Design scenes (maps, weather, positioned groups)
- Manage encounter tables and habitats
- Review player characters (stats, traits, progression)
- Campaign-level management (party roster, story state)

**2. Session orchestration (in-session, non-combat)**
Players are connected. No active encounter.
- Activate scenes, set weather, narrate
- Manage the group view (what's shown on TV)
- Handle player requests
- Trigger encounters from scenes or encounter tables
- Award XP, manage rest/healing

**3. Encounter command (in-session, combat)**
The heaviest mode. The GM is simultaneously:
- **Multi-entity controller** — resolving turns for every NPC and wild Pokemon (could be 6-10+ entities). Each entity has its own moves, traits, energy, action budget. The UI must let the GM quickly select an entity, choose an action, and resolve it without hunting through menus. This is the biggest UX difference from the player view — players control 1-2 entities, the GM controls many.
- **Encounter manager** — advancing turns, tracking initiative, spawning/despawning combatants mid-encounter, ending the encounter
- **Rule arbiter** — applying damage manually, toggling status conditions, overriding rules when the situation demands it (e.g. applying environmental damage, ruling an improvised action)
- **Request handler** — reviewing and approving/rejecting player action requests as they come in. This is an inbox/queue pattern — requests arrive asynchronously as players submit them on their phones
- **Information monitor** — seeing all combatant HP, energy, status, traits, positions, weather, terrain simultaneously. This is an information density problem — the GM needs a dashboard, not a card view

#### What changes in the ring plan

The three views must appear in every ring, not just Ring 3. Each ring's exit criterion already implies view behavior — now it's explicit.

**Ring 0** — no change (pure data model and effect engine, no UI)

**Ring 1** additions:
- R1.6 becomes: **View Capability Framework** — three capability contexts (GM, player, out-of-session) from day one. Not "minimal player can see moves" — minimal versions of all three views
- R1.7 becomes: **Minimal Player Combat UI** — player selects move, picks target, sees result on phone
- R1.7b: **Minimal Character Sheet** — player sees their Pokemon stats/moves/HP outside combat (already added)
- Add R1.7c: **Minimal GM Combat UI** — GM sees all combatants, can select an NPC, choose its action, resolve it, advance turns. This is the other half of the combat loop — without it, Ring 1's exit criterion ("two Pokemon can fight") doesn't work, because someone has to control the opponent
- Add R1.7d: **Minimal Group View** — TV shows the encounter state (who's fighting, whose turn it is, what just happened). Even in Ring 1, the group view matters — it's what the table sees

**Ring 2** additions:
- R2.8 (Combat Action Presentation) is the player phone UI — keep as-is
- Add R2.14: **GM Multi-Entity Combat UI** — the GM's interface for controlling 6+ NPCs/wild Pokemon efficiently. Entity quick-select, action shortcuts, bulk status management. This is the GM-side equivalent of R2.8
- Add R2.15: **GM Request Queue** — inbox for player action requests. Approve/reject with context (what the player wants to do, current game state). Must handle concurrent requests from multiple players
- R2.13 (Group View as Live Projection) — already added, keep as-is

**Ring 3** additions:
- R3.16 (Full View System) — already covers layouts, but now explicitly includes all three views at full fidelity
- R3.18 (Out-of-Session Character Management) — already added for players
- Add R3.19: **GM Session Prep** — encounter building, NPC creation, scene design, encounter tables, campaign management. The GM's out-of-session workflow

**Ring 4** — no change (world-building systems feed into GM session prep tools from R3.19)

#### Why this was missing

The original dependency analysis was mechanics-first — "what game systems exist and how do they depend on each other." The adversarial review was also mechanics-first — "what's missing from the game systems graph." Neither asked "how does a session actually run?" The three views answer that question, and they should have been the starting point, not an afterthought.

The documentation vault already understood this — `the-table-as-shared-space.md`, `triple-view-system.md`, `gm-delegates-authority-into-system.md`, `view-capability-projection.md` all describe the view triad as foundational. The ring plan failed to carry that understanding forward.

~~**Status:** Three views elevated from line items to first-class concerns threaded through every ring. GM view decomposed into three modes (session prep, session orchestration, encounter command). Ring 1 now includes minimal versions of all three views. Ring 2 adds GM multi-entity UI and request queue. Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~

---

### 2026-03-26 — Functionality Catalog from Previous App

The previous app's implementation is being discarded. This catalog preserves the **functionality and UX behaviors** that must survive into the redesign. Organized by domain, not by view or component. Sourced from the app vault (~688 observations).

---

#### Session Infrastructure

- **QR code connection.** GM's Connect panel shows LAN URLs with QR codes. Players scan with their phone, no accounts or passwords. Joining should be as frictionless as sitting down at the table.
- **WebSocket roles.** Three roles (gm, group, player) with role-based broadcast targeting. GM is single writer — all state mutations originate from GM, either from direct action or approved player requests.
- **Serve/Unserve.** GM explicitly pushes an encounter to the group and player views ("Serve to Group"). Unserving removes the encounter from all connected views. This gate controls when combat is visible on the TV.
- **GM controls the group view.** Lobby/Scene/Encounter/Map toggle buttons on the GM nav bar instantly switch what the TV shows. Players can request tab changes (with 30-second cooldown), GM approves/rejects.
- **Real-time sync.** All three views stay synchronized via WebSocket broadcasts after every GM mutation. Group view has polling fallback for missed messages.

#### GM Navigation and Content Management

- **Persistent nav bar.** Always visible: Encounter, Encounters (library), Scenes, Habitats, Sheets (character library), Create, Map. Plus Connect button and group view tab toggles.
- **Character library.** List of all characters (trainers + Pokemon) with search. Cards link to detail pages.
- **Character detail page.** Tabbed view: Stats, Classes, Skills, Equipment, Pokemon, Healing, Notes. Edit mode toggle for inline editing. XP section with grant and tracking.
- **Pokemon detail page.** Tabbed view: Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes. Edit mode toggle. Evolve button.
- **Character creation.** Two tracks: Human and Pokemon. Form-based creation flow.

#### Encounter Lifecycle

- **Encounter creation.** From scratch (empty encounter + add combatants) or from scene (converts scene entities into combatants).
- **Add combatant modal.** Two tabs: Pokemon and Humans. Search box. Shows sprites, names, levels, types. Add to Players/Allies/Enemies columns.
- **Encounter templates.** Save current encounter as template. Load from template library. Templates store combatant snapshots. Duplicate, edit, delete. Search/sort/filter. List and grid view toggle.
- **Scene-to-encounter conversion.** "Start Encounter" from scene editor. Choose battle type (Full Contact or League) and significance (Insignificant/Everyday/Significant for XP multiplier). Wild Pokemon in the scene become full DB-backed enemies via generator service.
- **Encounter serving.** Explicit "Serve to Group" pushes to TV and player phones. "Unserve" removes from all views and ends the encounter.

#### Combat Flow

- **Two battle types.** Full Contact (all combatants act in speed order) and League/Trainer (trainers declare first, then Pokemon act).
- **Declaration phase.** Lowest speed declares first. Action type dropdown + description text. "Declare & Next" advances through declarers.
- **Resolution phase.** Highest initiative resolves first. Current turn combatant highlighted with green border.
- **Priority actions.** Between each phase, a panel offers every combatant three priority options: Full Turn, Limited, Advanced. "No Priority — Continue" skips.
- **Combat log.** Running record of actions taken.
- **Undo/Redo.** Toolbar buttons for reversing GM actions.
- **Keyboard shortcuts.** Comprehensive shortcut dialog (Ctrl+Z undo, grid navigation, VTT tools, selection, AoE tools, fog/terrain tools).

#### Combatant Card and Actions

- **Combatant card.** Avatar/sprite, name, level, HP bar (color-coded: green >50%, yellow 25-50%, red <25%), initiative value. Current turn card gets green border highlight.
- **HP controls.** Spinbutton + "-HP" button with damage type selector. Spinbutton + "+HP" button. Immediate visual feedback.
- **Action buttons per combatant.** +T (temp HP), CS (combat stages modal), ST (status conditions modal), Item (use item modal), Act (act modal), Switch, Force Switch (GM override), Remove.
- **Act modal.** Header with avatar, name, types, action economy display (Standard/Shift counters). Move list with type-colored buttons. Selecting a move opens target panel. Standard actions: Shift, Struggle, Pass Turn. Combat maneuvers (collapsible): Push, Sprint, Trip, Grapple, Disarm, Dirty Trick, Disengage, Intercept Melee/Ranged, Take a Breather (solo and assisted).
- **Move target panel.** Move info card (type, class, DB, AC, range, attack stat, effect text). Target list showing all combatants with HP, out-of-range targets disabled. Cancel and "Use [MoveName]" buttons.
- **Combat stages modal.** Per-combatant stat stage adjustments.
- **Status conditions modal.** Apply/remove status conditions.
- **Damage mode toggle.** "Set" (pre-calculated) vs "Rolled" (dice-rolled) damage modes.

#### Capture Flow

- **Capture section on wild Pokemon cards.** Only appears when a trainer is present. Per-wild-Pokemon: trainer selector, ball type selector, context condition checkboxes, capture rate display, throw button.
- **Capture API.** Preview endpoint (calculates rate considering level, HP%, evolution stage, status, injuries, shiny, legendary, ball modifier) and attempt endpoint (accuracy roll with nat 1/20 rules, capture roll, on-success: links Pokemon to trainer with origin 'captured', loyalty 2/Wary, ball-specific post-capture effects).
- **Ball effects.** Heal Ball restores HP, Friend Ball +1 loyalty, Luxury Ball notes happiness. New species = +1 trainer XP.
- **WebSocket broadcast.** Capture attempt results broadcast to all clients.

#### Battle Grid (VTT)

- **Dual rendering modes.** Flat 2D square grid and isometric 2.5D. Toggle between them.
- **Token sprites.** Pokemon sprites and trainer avatars on the grid. Selection highlighting, multi-select (Shift+Click, Shift+Drag marquee).
- **Grid controls.** Zoom in/out/reset, pan (arrow keys, middle-click drag, scroll wheel), coordinate display, dimensions display, gridlines toggle.
- **Measurement tools.** Distance mode, burst AoE, cone AoE, line AoE, cycle direction, resize AoE. All keyboard-shortcut accessible.
- **Fog of war.** Reveal tool, hide tool, explore tool, brush size adjustment. Three-state model.
- **Terrain painting.** Four tool modes, accessible via T shortcut.
- **Token selection panel.** Opens on token select, shows combatant details.
- **Movement range toggle.** W shortcut to show movement range overlay.
- **Player grid view.** Read-only version of the grid on the player's phone with zoom controls.
- **Group grid view.** Read-only spectating version on the TV.
- **Touch support.** Pan and pinch gestures on the player grid view (phone).

#### Scenes

- **Scene manager.** Grid of scene cards with name, entity count, activate/deactivate toggle, edit link, delete button. Active scene gets green border + "Active" badge.
- **Scene editor.** Three-column layout: Groups panel (left), Canvas (center), Properties/Add/Habitat panels (right, collapsible).
- **Scene canvas.** Drag-and-drop positioning of entities. Percentage-based positions. Sprites with name labels. Groups as dashed-border rectangles with resize handles. Drag entity onto group to assign.
- **Scene groups.** Create, name (inline-editable), delete. Deleting a group unassigns members (doesn't remove from scene). Move groups to move all members together.
- **Scene properties.** Location name, background image URL, description, narrative weather (distinct from encounter game weather).
- **Scene add panel.** Two tabs: Characters (list all characters, add to scene) and Pokemon (character-owned Pokemon expandable list + "Add Wild Pokemon" with species search and level spinner).
- **Scene activation.** Activating a scene resets move counters and restores AP. Deactivation restores AP. Active scene shows on group view scene tab. Real-time sync to connected clients.
- **Scene-to-encounter.** Start encounter from scene. Battle type and significance selection. Wild Pokemon become DB-backed enemies. Characters become player combatants.

#### Habitats (Encounter Tables)

- **Habitat list page.** Grid of habitat cards with search and sort.
- **Habitat detail page.** Header with name, Settings/Generate/Delete buttons. Metadata: description, level range, population density, total weight.
- **Pokemon entries table.** Columns: sprite + species name, weight (editable spinbutton), chance (calculated percentage, color-coded green=common/red=rare), level range (editable min/max overrides), remove button. Sorted by weight descending. Inline editing with optimistic updates.
- **Weight → chance.** Entry weight / total weight = encounter probability. Adjusting any weight immediately recalculates all percentages.
- **Add Pokemon modal.** Species search, add to table. Duplicate species prevented.
- **Sub-habitats.** Named variants (e.g. "Night") with modification entries that override parent weights. Create, edit (name/description), delete. Each modification shows affected Pokemon and modified weight.
- **Encounter generation.** Weighted random selection with diversity decay (weight halved per selection, per-species cap of ceil(count/2)). Level randomized within entry-specific or table-default range. "Generate" button on habitat page opens modal showing results.
- **Wild spawn overlay.** When generation triggers, the group view shows a dramatic full-screen "WILD POKEMON APPEARED!" overlay with staggered sprite animations, species names, and levels.

#### Player View

- **Character selection.** Identity picker on first load — choose which character to play as.
- **Bottom tab navigation.** Character, Team, Encounter, Scene. Active tab highlighted. Encounter tab shows notification dot when encounter is active.
- **Character tab.** Read-only collapsible sections: Stats (default open), Combat Info (default open), Skills, Features/Edges, Equipment, Inventory (default closed). HP bar with color coding and percentage.
- **Team tab.** Expandable Pokemon cards: sprite, name, level, types. Expand to see stats, abilities, capabilities, moves. All read-only.
- **Pokemon moves display.** Collapsed: type badge, move name, damage category, DB, AC, frequency. Expanded: adds range line and effect description text.
- **Encounter tab.** Header (name, round, current turn). VTT map with zoom. Player/enemy participant lists. Action panel for submitting combat actions.
- **Scene tab.** Passive display of active scene.
- **Player action requests.** Player submits actions via WebSocket promise. GM receives, approves/rejects. Player gets acknowledgment. Specialized handlers for capture, breather, healing item; generic handler for everything else.
- **Group view control.** Request tab changes on TV (with 30-second cooldown, 30-second GM response timeout, pending state feedback).
- **Connection status indicator.** Shows WebSocket connection state.
- **Export/Import.** Export character data. Import limited to safe fields (background, personality, goals, notes, Pokemon nicknames/held items/move order).
- **Auto-connect.** WebSocket connects automatically on page load.

#### Group View (TV)

- **Four tabs.** Lobby, Scene, Encounter, Map. GM-controlled, no local interaction.
- **Lobby tab.** Player character cards in responsive grid. Each card: trainer sprite/avatar, name, player name, level badge, Pokemon team list (sprite, nickname, level, type pips, HP bar). Fainted Pokemon at 50% opacity + grayscale.
- **Encounter tab.** Three-column: initiative sidebar (280px/400px@4K), central grid (read-only), combatant details panel (320px/450px@4K). Header with encounter name, round badge, weather badge with remaining rounds, current turn indicator.
- **Initiative tracker.** All combatants sorted by initiative. Color-coded by side. Current turn highlighted with glow. "Cannot Act" label on incapacitated combatants. "Flanked" badge. HP bars with four-tier coloring. Phase-aware title ("Declaration Low→High", "Resolution High→Low", "Pokemon Phase").
- **Declaration summary.** In League battles: trainer declarations with action type badges (color-coded), description, resolution checkmarks. Currently resolving gets violet highlight. Resolved at 60% opacity.
- **Combatant details panel.** Sprite/avatar, name, side badge. Type badges. HP bar (exact for players, percentage for enemies). Injuries as red pips. Player-side: stat grid, abilities, moves as type-colored cards, non-zero combat stages. Status conditions for all.
- **Wild spawn overlay.** Full-screen dramatic reveal: "WILD POKEMON APPEARED!" with staggered sprite pop-in animations, encounter table name, species name/level/sprite per slot. Dark backdrop with blur.
- **4K optimization.** At viewport >3000px: base font to 1.5rem, all sprites/elements/padding scale up (avatars 64→96px, sprites 120→240px, sidebar 280→400px, etc.).
- **TV-optimized layout.** Dark radial gradient background with subtle violet/scarlet accents. Full-height, no scrolling.

#### Environment and Weather

- **Weather selector.** Dropdown: No Weather, Sunny, Rain, Sandstorm, Hail, Snow, Fog, Harsh Sunlight, Heavy Rain, Strong Winds. Mechanical effects in combat.
- **Environment presets.** Dropdown: None, Dim Cave (Blindness), Dark Cave (Total Blindness), Frozen Lake, Hazard Factory, Custom. Preset effects displayed as typed cards.
- **Scene weather vs encounter weather.** Scene weather is narrative only ("it's raining in the story"). Encounter weather has mechanical combat effects. Explicitly different systems.

#### XP and Progression

- **Encounter XP section.** Significance multiplier display. Breakdown appears after enemies defeated.
- **XP distribution modal.** Distributes XP to participants after encounter.
- **Trainer XP.** GM grants XP from character detail page. XP bank system. Suggestion tiers.
- **Level-up modal.** Triggered by XP grant or manual level edit. Multi-step wizard: class selection, stat allocation, skill ranks, edges. Advancement schedule governs what's available per level.

---

**Note:** The previous app's *implementation* (god-object stores, bypassed service layer, component duplication, PTU data models, 144 unsafe type casts) is being discarded. This catalog records *what the app did for users* — the functionality, workflows, and UX patterns that the redesign must preserve or improve upon. It is not a specification — some behaviors will change under PTR rules (e.g. classes → traits, abilities → traits, PTU capture formula → PTR capture formula). But the user-facing workflows (create character, run encounter, capture Pokemon, manage habitats, generate wild encounters) must have equivalents in the new app.

**Status:** Functionality catalog complete. Habitats confirmed as important — encounter generation, weighted species pools, sub-habitat modifications, and the wild spawn overlay are key session-running features. ~~Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~ Handoff for adversarial review posted below.

---

### 2026-03-26 — Handoff for Adversarial Review

Since the last adversarial review (findings 1–9), the plan has changed substantially. This section summarizes everything that was added or decided, for a fresh adversarial pass.

#### What changed

**Structural decisions:**
1. All 9 adversarial findings accepted. Plan restructured from 6 parallel tracks to 4 concentric rings.
2. **Effect engine is the new root** (R0.1), replacing the entity model (A1) as the foundation. Rationale: traits and moves are both "hundreds of individually novel effect programs" that share infrastructure.
3. **Composable effect system, not DSL.** ~15 atomic effect types composed with conditions and triggers. Data modeling problem, not language design problem.
4. **Fresh data start.** Current PTU-shaped data discarded, schema migration history preserved. No migration effort.
5. **Pure-function testing strategy.** Effect engine functions are pure (input state → output state). Each move/trait is a test case.

**Principles added:**
6. (Principle 6) Every design must cross-reference and link to specific SE patterns/principles from `vaults/documentation/software-engineering/`.
7. (Principle 7) Decided designs become documentation vault notes. The thread records decisions; the vault holds authoritative designs.

**Views elevated to first-class:**
8. **Player view has three modes:** in-session combat (remote control), in-session non-combat (character sheet), out-of-session (character management without GM).
9. **Group view is a live projection** driven by player/GM actions, not autonomous.
10. **GM view has three modes:** session prep (content creation, no players), session orchestration (in-session, non-combat), encounter command (multi-entity combat control + request queue + rule arbitration).
11. **Three views threaded through every ring.** Ring 1 now includes minimal versions of all three views (R1.7, R1.7b, R1.7c, R1.7d). Ring 2 adds GM multi-entity UI (R2.14), GM request queue (R2.15), group view live projection (R2.13). Ring 3 adds out-of-session management (R3.18) and GM session prep (R3.19).

**Functionality catalog added:**
12. Complete catalog of previous app functionality across 12 domains (session infrastructure, GM nav/content, encounter lifecycle, combat flow, combatant interaction, capture, battle grid, scenes, habitats, player view, group view, XP/progression). Records what users could do, not how it was implemented.

#### What to challenge

This review should be broader than the first. The first review challenged the dependency graph. This one should challenge the *entire plan as it now stands* — rings, principles, view model, functionality coverage, and the decisions themselves.

Specific areas to probe:

- **Ring structure.** Are the ring boundaries correct? Do the exit criteria actually prove the ring works? Are items in the wrong ring? Is there a missing ring?
- **Effect engine as root.** Is the composable effect system (R0.1) actually more foundational than the entity model (R0.2)? Could you design entities without knowing what effects look like? What if the effect engine design is wrong — does it cascade and invalidate everything above it? Is this putting too much weight on a single unproven system?
- **~15 atomic effects claim.** The pushback on the DSL framing claims a finite set of ~15 atomic effect types. Is this actually true? Sample more traits and moves — are there effects that don't decompose into the listed atoms? Are there composition patterns (e.g. "trigger on event X, then conditionally do Y if state Z, modifying how the next instance of W resolves") that the simple "sequence + conditional" model can't express?
- **Three-view threading.** Does adding minimal versions of all three views to Ring 1 bloat the critical path? Ring 1 went from 9 items to 13. Is that still "shortest path to playable encounter" or is it now "shortest path to full session infrastructure"?
- **Functionality catalog completeness.** Is anything missing from the previous app that should be preserved? Is anything listed that shouldn't survive (PTU-specific workflows that don't apply to PTR)?
- ~~**Scope creep.**~~ Not a concern. We're sharpening the saw.
- **Habitat/scene/encounter table placement.** These are in Ring 4 but the functionality catalog shows they're core session-running features. Should any of them move earlier?
- **The "design before code" vs "composable effect engine" tension.** The effect engine is the most novel and uncertain system. The plan says "design before code" (Principle 4). But can the effect engine be designed without implementation spikes? The first review flagged this (Finding 7) and the answer was "pure functions are testable." But testable ≠ designable-without-prototyping.
- **Data model implications.** Fresh data start is decided, but the plan doesn't describe the new data model at all. How do effects get stored? Are move/trait definitions in the database, in code, or in vault files that get compiled? This affects Ring 0 fundamentally.
- **What's the actual first deliverable?** Ring 0 has no exit criterion. Rings 1–4 do. When is Ring 0 "done"?

~~**Status:** Awaiting adversarial review of the full plan as it now stands.~~

---

### 2026-03-26 — Adversarial Review of Full Plan

Eleven findings organized into three categories: structural problems with the ring model, gaps in the effect engine design, and unscoped work the plan doesn't acknowledge.

---

#### Structural

---

##### 10. R0.1 and R0.2 are co-dependent, not sequential

The plan says R0.1 (Effect Engine) is "the absolute root" and R0.2 (Entity Model) depends on it. This ordering is false. They're mutually dependent:

- Effects need to know what state exists to modify it. "Deal damage" implies HP. "Modify stat stage" implies stat stages. "Steal held item" implies an inventory model. You cannot define atomic effect types without knowing the entity model's shape.
- Entities need to know what effects look like to reference them. A Pokemon's traits are effect programs. A move is an effect program. The entity model references the effect engine.

This is a co-design problem, not a sequence. If you lock R0.1 first, you'll discover during R0.2 that the entity model needs state the effect engine didn't anticipate (e.g. field state categories — see finding 14). If you lock R0.2 first, you'll discover during R0.1 that the effects need entity fields that don't exist.

**Impact:** R0.1 and R0.2 should be treated as a single design unit — "R0.A: Effect Engine + Entity Model" — co-designed, co-validated, and shipped together. Trying to sequence them will produce rework.

---

##### 11. Ring 1 is no longer the critical path

Ring 1 was supposed to be "the shortest path to a playable encounter." It grew from 9 items to 13:

| Original Ring 1 (9 items) | Added items |
|---|---|
| R1.1 Damage Pipeline | R1.7b Minimal Character Sheet |
| R1.2 Energy System | R1.7c Minimal GM Combat UI |
| R1.3 Basic Turn Management | R1.7d Minimal Group View |
| R1.4 Move Resolution (damage only) | R1.7e? (out-of-session capability context) |
| R1.5 Encounter State Machine | |
| R1.6 View Capability Framework | |
| R1.7 Minimal Player Combat UI | |
| R1.8 Service Layer foundation | |
| R1.9 Store Decomposition foundation | |

R1.7c (Minimal GM Combat UI) is genuinely on the critical path — someone must control the opponent. The others are not:

- **R1.7b (Minimal Character Sheet):** Not needed to prove "two Pokemon can fight." Character data can be viewed in the database or via API during testing.
- **R1.7d (Minimal Group View):** Not needed to prove combat works. The TV can be empty during early testing.
- **Out-of-session capability context in R1.6:** Not needed for combat. The out-of-session mode is a Ring 3 concern.

Ring 1's exit criterion says "two Pokemon can fight. A player on their phone selects a move, picks a target, and sees damage applied." That requires: effect engine, entity model, lens, damage pipeline, energy, turn management, move resolution, encounter state machine, service layer, store, player combat UI, GM combat UI. That's Ring 0 (4 items) + Ring 1 (9 items, original scope) = 13 items total. Adding character sheet, group view, and out-of-session mode pushes the exit criterion to "a full session works on three devices," which is Ring 2–3 scope disguised as Ring 1.

**Impact:** Move R1.7b, R1.7d, and out-of-session capability context back to Ring 2 or Ring 3. Keep R1.7c (GM Combat UI). Ring 1 should prove combat works, not that sessions work.

-

##### 12. Ring 3 is three rings wearing a trenchcoat

Ring 3 has 19 items spanning four unrelated domains:

| Domain | Items | Dependency chain |
|---|---|---|
| **Entity lifecycle** | R3.1–R3.9 (traits, unlock conditions, disposition, loyalty, social skills, creation, level-up, XP) | Heavily inter-dependent, sequential |
| **Spatial/VTT** | R3.11–R3.15 (spatial engine, grid, AoE, fog, terrain) | Mostly self-contained, parallel |
| **Views** | R3.16 (full view system) | Depends on everything it displays |
| **Capture** | R3.17 (capture workflow) | Depends on entity model + spatial + disposition |

These have different dependencies, different risk profiles, and different value deliveries. Entity lifecycle and spatial/VTT can run in parallel — they barely interact until sync points (e.g. token rendering on grid needs entity data, but grid geometry doesn't need traits).

Ring 3's exit criterion ("full encounter lifecycle from entity creation through combat to XP and rest, grid-based positioning, multi-device views, characters that grow") is really three exit criteria:
- "Characters can be created, level up, and evolve" (entity lifecycle)
- "Combat happens on a grid with fog and terrain" (spatial)
- "All three views work at full fidelity" (views)

**Impact:** Consider splitting Ring 3 into Ring 3A (entity lifecycle — creation through growth), Ring 3B (spatial — grid through terrain), and Ring 3C (views + capture — what ties them together). 3A and 3B can run in parallel. 3C is the sync point.

---

#### Effect Engine Design Gaps

---

##### 13. The atomic effect count is ~20, not ~15 — and the missing ones are structurally important

The plan lists ~15 atomic effect types. Sampling from the move and trait vaults reveals at least 5 missing categories:

| Missing atom | Example | Why it's structurally different from listed atoms |
|---|---|---|
| **Replacement effect** | Wide Guard ("targets are *instead* not hit"), Psyshock ("subtract Defense *instead of* Special Defense") | Not additive. Replaces how another effect resolves. Requires an interception/override mechanism in the effect resolution pipeline — the engine must check for active replacement effects before resolving the original effect. |
| **Effect suppression / meta-effect** | Heal Block ("may not gain Hit Points from *any source*") | Modifies what OTHER effects can do, not what this effect does. The engine must check for active suppression effects on the target before allowing any healing effect to resolve. |
| **Initiative/turn order manipulation** | After You (insert target's turn immediately after user's), Quash (set target initiative to 0) | Not "modify stat" — initiative isn't a stat, it's a position in a sequence. Manipulating turn order means mutating the turn management state machine (R1.3) from within an effect. The effect engine reaches into a system that's supposed to be above it in the dependency graph. |
| **Object/entity creation** | Rock Creation (create physical objects in the spatial field) | The listed atoms modify existing state. This one creates new state — a rock that persists indefinitely, occupies space, provides cover, and can be interacted with by other systems. The entity model must account for non-combatant objects. |
| **Usage counters on persistent effects** | Safeguard (3 activations then disappears), Light Screen (2 activations then disappears) | Not just "apply and track duration." These effects have a budget that's consumed by the target's CHOICE to activate them. Requires: counter tracking, optional activation (user decision point), and self-removal on exhaustion. |

The composable model still works — these are atoms, not new composition patterns. But ~20 atoms is meaningfully different from ~15 when designing the type system, the effect resolution pipeline, and the test matrix.

More importantly, three of these (replacement, suppression, initiative manipulation) affect the **resolution order** of other effects. The plan's implicit model is "effects happen, then the result is applied." Replacement and suppression effects mean "before resolving effect X, check if any active effect modifies or prevents X." This is an effect resolution ordering problem that the plan doesn't address.

---

##### 14. Field state categories (Coat, Blessing, Hazard, Vortex) are a hidden subsystem

The plan lists "Modify field state (weather, terrain, hazards, blessings, coats)" as a single atomic effect type. But these are four distinct field state categories with different lifecycles:

| Category | Scope | Duration | Removal | Stacking | User agency |
|---|---|---|---|---|---|
| **Coat** | Single entity (self) | Indefinite (until removed) | Defog, switching, specific moves | No | Passive (auto-triggers) |
| **Blessing** | Team-wide | Usage-counted (2–3 activations) | Defog, usage exhaustion | No | Active (user chooses to activate) |
| **Hazard** | Spatial (specific squares) | Indefinite (until removed) | Defog, type-specific removal (Poison-type walks over Toxic Spikes) | Yes (Toxic Spikes layers 1 and 2 have different effects) |  Passive (triggers on entry) |
| **Vortex** | Single target | Until target escapes or caster switches | Switching, specific moves | No | Passive (damage per turn + trapped) |

Each category needs:
- Its own creation and destruction rules
- Its own trigger conditions
- Interaction rules with other field effects (Defog clears all four)
- For Hazards: spatial placement, layering, type-conditional removal
- For Blessings: usage counter, voluntary activation

This isn't "modify field state." It's four field state subsystems that happen to be clearable by the same move (Defog). The plan puts weather in R2.3 but doesn't track Coats, Blessings, Hazards, or Vortexes anywhere. They're necessary for Ring 2 (R2.4 — full move resolution includes Safeguard, Toxic Spikes, Aqua Ring, Whirlpool).

**Impact:** Add a Ring 2 item: "R2.X: Field State Registry (Coat, Blessing, Hazard, Vortex — creation, removal, triggers, layering, Defog interaction)." This is a prerequisite for R2.4 (full move resolution).

---

##### 15. Instinct traits are outside the effect engine's scope

The plan frames the effect engine as the unified foundation for traits and moves. But instinct traits (Queen's Proxy, Parental Guardian Instinct, Hiding Instinct, Hangry, Territorial, etc. — at least 10 defined in the vault) are behavioral state machines, not combat effects:

- **Trigger:** narrative event (feels threatened, sees unattended item, becomes hungry), not combat event (on-hit, turn-start)
- **Effect:** behavioral compulsion (refuses to fight, attacks indiscriminately, flees), not state modification (deal damage, apply status)
- **Resolution:** social skill check by trainer (DC 10 + X, modified by social skill hierarchy), not effect resolution
- **Duration:** 1 hour (real-time), not turn-based

These don't fit the combat-state-in, combat-state-out pure function model. They operate in narrative time, require GM judgment about trigger conditions ("feels threatened" is subjective), and resolve through a social skill check system (R2.11) rather than the effect engine.

Options:
1. Expand the effect engine's scope to include narrative triggers and behavioral compulsions. This makes it much more complex and arguably unbounded (what counts as "feels threatened"?).
2. Accept that instinct traits are outside the effect engine. The trait system (R3.1) must then have two subsystems: effect-based traits (handled by the engine) and behavioral traits (handled by GM interpretation with mechanical suppression checks). The engine is not actually universal.

Option 2 is more honest. The effect engine handles ~187 of ~197 traits (the ones with combat/mechanical effects). ~10 instinct traits need a simpler "trigger description + suppression check" model. This should be stated explicitly — the plan currently implies the effect engine covers ALL traits.

---

##### 16. Composition is harder than "sequence + conditional"

The plan describes move/trait novelty as "compositions and conditions" over atomic effects, implying a simple composition model: sequences of effects with conditional gates. Sampling reveals at least five composition patterns the plan doesn't account for:

| Pattern | Example | Why "sequence + conditional" can't express it |
|---|---|---|
| **Replacement** | Psyshock: "subtract Defense instead of Special Defense" | Not "do X then Y." It's "modify how another effect (damage calculation) internally resolves." The composition must intercept and modify ANOTHER effect's execution, not just sequence after it. |
| **Voluntary activation** | Safeguard: "affected user MAY activate it when receiving a Status Affliction" | A choice point in the middle of effect resolution. The engine must pause, present a decision to the player/GM, receive the answer, then continue. Not a pure function — requires a decision interface. |
| **Cross-entity modification** | Heal Block: blocks healing on target from ANY source | The composition doesn't describe what THIS effect does — it describes what OTHER effects CANNOT do to this target. The engine must check for active modification effects on every target before resolving any healing effect. This is aspect-oriented (cross-cutting concern), not sequential. |
| **Reactive chains** | Rough Skin (on-hit: attacker loses HP) + Destiny Bond (if user faints from attack: attacker faints) | Effect A triggers, causes damage, which triggers Effect B on a different entity. The engine must support recursive event propagation: effect → state change → event → triggered effect → state change → event → ... with cycle detection. |
| **Embedded action economy** | Sand Tomb: "Damage + Swift Action Vortex on target" — a Standard Action move that embeds a Swift Action as part of its resolution | The move grants an action within its own resolution. The composition doesn't just modify state — it modifies what actions the user can take, mid-resolution. |

The composition layer needs at minimum: **sequence, conditional, replacement, choice point, cross-entity filter, recursive trigger, and embedded action**. This is significantly more complex than the implied "sequence + conditional" model. It's still not a DSL (the composition primitives are finite), but it's a more sophisticated data model than the plan suggests.

---

#### Unscoped Work

---

##### 17. 579 effect definitions are unscoped content work

The plan scopes the effect engine (build the system) and validates it against samples. But 382 moves and 197 traits must each be defined as compositions of atomic effects. This is a massive content authoring effort:

- **Who writes the definitions?** Each move's vault note describes its behavior in natural language. Someone must translate "The target reveals their Speed Stat. If it is higher than the user's, subtract the user's Speed from the target's and apply the difference as Bonus Damage" (Gyro Ball) into a formal effect composition. This requires understanding both the game rules and the effect engine's composition model.
- **In what format?** TypeScript objects? JSON? A structured vault note format? The format determines the tooling needed.
- **How are they validated?** Each definition must be verified against the PTR vault to ensure it correctly captures the move/trait's behavior. 579 verification passes.
- **When does this happen?** Ring 1 needs "damage moves only" — maybe 50 moves. Ring 2 needs "full move resolution" — all 382 moves. Ring 3 needs "full trait system" — all 197 traits. The content work scales with each ring but isn't tracked in any ring.

This is arguably the largest single work item in the project by volume. 579 individual translations from natural language to formal specification. It's not engineering work — it's content work — and the plan doesn't track it, estimate it, or assign it.

**Impact:** Each ring that expands move/trait coverage needs an explicit content authoring task. Ring 1: define ~50 representative damage moves. Ring 2: define all 382 moves + combat-relevant traits. Ring 3: define all 197 traits. These should be Ring items, not implied consequences of "the effect engine exists."

---

##### 18. Ring 0 needs an exit criterion

Already flagged in the handoff, but worth formalizing. Without an exit criterion, Ring 0 can expand indefinitely as edge cases are discovered ("we need one more atom type," "the composition model doesn't handle X").

Proposed exit criterion: **"The effect engine can express and correctly evaluate 30 representative moves and 15 representative traits, hand-selected to cover all identified atomic effect types and composition patterns. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect engine functions have unit tests. The engine, entity model, and lens are co-designed and documented in the documentation vault."**

The 30/15 sample should include at minimum: a pure damage move, a status-only move, a self-buff, an AoE, a multi-hit, a conditional DB modifier (Gyro Ball), a field move (Toxic Spikes), a Blessing (Safeguard), a Coat (Aqua Ring), an Interrupt (Wide Guard), a Vortex (Whirlpool), a displacement move, an initiative manipulator (Quash), a replacement effect (Psyshock), a healing-denial effect (Heal Block), a type-absorb trait (Volt Absorb), a contact-retaliation trait (Rough Skin), a passive stat modifier, a movement type trait, an action economy modifier (Opportunist).

If these 45 definitions work, the engine is validated. If any can't be expressed, the engine needs revision before moving to Ring 1.

---

##### 19. Data model for effect definitions is unspecified

Where do move/trait definitions live? The plan doesn't say. Three options, each with architecture-shaping consequences:

| Option | Pros | Cons | Affects |
|---|---|---|---|
| **In code** (TypeScript constants) | Type-safe, version-controlled, IDE support, tree-shakeable | Requires deploy to change; no CRUD; content authoring = code authoring | R0.4 (engine scaffold), R1.8 (service layer — no runtime definition loading) |
| **In database** (Prisma models) | Dynamic, CRUD-able, GM could eventually create custom moves | Hard to version control, schema migration for each new atom type, serialization complexity | R0.2 (entity model), R0.4 (engine must deserialize and interpret at runtime) |
| **In vault files** (compiled at build) | Human-readable, bridges vault→app, vault IS the source of truth | Needs parser/compiler infrastructure, new tool to build and maintain | R0.4 (engine scaffold needs compiler), adds infrastructure Ring 0 doesn't scope |

This decision interacts with finding 17 (content authoring). If definitions are in code, content authoring requires TypeScript fluency. If in the database, content authoring happens through a UI (which doesn't exist yet). If in vault files, content authoring happens in Obsidian (which exists) but requires a build pipeline (which doesn't).

**Impact:** The data model question must be answered in Ring 0. It shapes the engine scaffold (R0.4), the entity model's relationship to effect definitions (R0.2), and the content authoring workflow (finding 17).

---

##### 20. "Pure functions" breaks at choice points and event attribution

The testing strategy says "effect engine functions are pure (input state → output state), unit-testable by design." This holds for deterministic effects (damage pipeline, stat modification, status application) but breaks for:

- **Choice points:** Safeguard says "affected user MAY activate." This is a player decision mid-resolution. A pure function can't pause for player input. Either the choice is an input parameter (which means the caller must know to ask the player and pass the answer) or the effect function must interact with a decision interface (not pure).
- **Event attribution:** Destiny Bond asks "did THIS target cause the user to faint?" This requires a combat event log that tracks causality — who caused each HP change, which attack triggered a faint. The input state must include a structured event history, not just current stats.
- **Randomness:** Lava Plume "Burns on 16+" requires a d20 roll. Pure functions don't generate random numbers. Either the roll is an input parameter (testable — you can pass 16 to verify the burn triggers) or the function calls a random source (not pure).

These are solvable — randomness is typically handled by injecting the roll result as a parameter, and choice points can be modeled as inputs. But the plan should acknowledge that "pure function" means "pure function with an expanded input surface that includes roll results, player decisions, and event history" — not the simpler model the plan implies.

---

#### Summary of findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 10 | R0.1 and R0.2 are co-dependent, not sequential | **Structural** | Ring model |
| 11 | Ring 1 is bloated beyond critical path | **Priority** | Ring model |
| 12 | Ring 3 is three rings (entity lifecycle, spatial, views) | **Scope** | Ring model |
| 13 | Atomic effects are ~20 not ~15; missing ones affect resolution ordering | **Design** | Effect engine |
| 14 | Field states (Coat/Blessing/Hazard/Vortex) are a hidden subsystem | **Completeness** | Effect engine |
| 15 | Instinct traits are outside the effect engine's scope | **Scope** | Effect engine |
| 16 | Composition needs 7 primitives, not 2 (sequence + conditional) | **Design** | Effect engine |
| 17 | 579 effect definitions are unscoped content work | **Completeness** | Unscoped work |
| 18 | Ring 0 needs an exit criterion | **Process** | Unscoped work |
| 19 | Data model for effect definitions is unspecified | **Design** | Unscoped work |
| 20 | "Pure functions" breaks at choice points and event attribution | **Design** | Unscoped work |

#### What the plan gets right

The ring structure (concentric expansion from minimal core) is the correct model. Composable effects over DSL is the correct framing — the atoms are finite (~20), the novelty is in composition. Fresh data start is correct. The three-view triad is correctly identified as foundational. The functionality catalog is comprehensive. The "shortest path to playable encounter" principle is correct — Ring 1 just drifted from it.

The most important finding is **16 (composition complexity)**. The plan's implicit model for composition is simple ("sequences of effects with conditional gates"). The actual composition model needs replacement effects, choice points, cross-entity filters, recursive triggers, and embedded actions. This is the gap between "data modeling problem" and "small but real interpreter" — still not a DSL, but more machinery than the plan currently scopes.

The most actionable finding is **18 (Ring 0 exit criterion)**. Without it, Ring 0 has no definition of done. The proposed exit criterion (30 moves + 15 traits covering all atoms and composition patterns) makes Ring 0 bounded and testable.

**Status:** Adversarial review of full plan complete. ~~Awaiting decisions on findings 10–20.~~ Decisions posted below.

---

### 2026-03-26 — Decisions on Adversarial Review (Findings 10–20)

All 11 findings accepted. Six accepted outright, four accepted with reframes, one challenged and resolved.

---

#### Accepted outright

| # | Finding | Decision |
|---|---|---|
| 10 | R0.1 and R0.2 are co-dependent | **Accepted.** Co-design as single unit "R0.A: Effect Engine + Entity Model." No sequencing between them. |
| 11 | Ring 1 bloated beyond critical path | **Accepted.** Move R1.7b (character sheet), R1.7d (group view), and out-of-session capability context back to Ring 2/3. Keep R1.7c (GM Combat UI). Ring 1 proves combat works, not that sessions work. |
| 12 | Ring 3 is three rings | **Accepted.** Split into R3A (entity lifecycle — creation through growth), R3B (spatial — grid through terrain), R3C (views + capture — sync point). 3A and 3B run in parallel. |
| 15 | Instinct traits outside engine | **Accepted — option 2.** The effect engine handles ~187 of ~197 traits. ~10 instinct traits (Hangry, Territorial, Queen's Proxy, etc.) are GM-interpreted behavioral state machines with a suppression check (DC 10+X social skill). The trait system (R3.1) has two subsystems: effect-based traits (engine) and behavioral traits (trigger description + suppression check). Stated explicitly. |
| 17 | 579 definitions are unscoped content work | **Accepted.** Each ring that expands move/trait coverage gets an explicit content authoring task. Ring 0: 30 moves + 15 traits (exit criterion sample). Ring 1: ~50 damage moves. Ring 2: all 382 moves + combat-relevant traits. Ring 3: all 197 traits. These are ring items, not implied consequences. |
| 18 | Ring 0 exit criterion | **Accepted as proposed.** Ring 0 is done when: the effect engine can express and correctly evaluate 30 representative moves and 15 representative traits, hand-selected to cover all identified atomic effect types and composition patterns. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect engine functions have unit tests. The engine, entity model, and lens are co-designed and documented in the documentation vault. The 30/15 sample must include the specific coverage list from the review (pure damage, status-only, self-buff, AoE, multi-hit, conditional DB modifier, field move, Blessing, Coat, Interrupt, Vortex, displacement, initiative manipulator, replacement effect, healing-denial, type-absorb trait, contact-retaliation trait, passive stat modifier, movement type trait, action economy modifier). |

---

#### Accepted with reframes

##### 13. Atomic effects — two layers, not a flat list

The 5 missing categories are real but the architecture is cleaner as two layers, not ~20 peer atoms:

| Layer | Types | What they do |
|---|---|---|
| **Atoms** (~15) | Deal damage, apply status, displace, modify field state, modify stat/stage, mutate inventory, query spatial, query history, modify action economy, modify move legality, grant/suppress movement type, modify damage pipeline, trigger on event, manage resource, resolve skill check | Produce state changes |
| **Resolution modifiers** (~5) | Replacement effect, effect suppression/meta-effect, initiative manipulation, object/entity creation, usage counters on persistent effects | Intercept or modify how atoms resolve |

Atoms are "do X." Resolution modifiers are "before X happens, check if anything changes how X works." This distinction drives the resolution pipeline design — the engine must check for active resolution modifiers before executing any atom.

##### 14. Field state categories — R0 concern, not R2 addition

Coat, Blessing, Hazard, and Vortex are four field state types with distinct lifecycles (scope, duration, removal, stacking, user agency). This is an entity model concern, not a new Ring 2 item. Since R0.1 and R0.2 are co-designed (finding 10), field state lifecycle diversity is part of that co-design. The effect engine handles creation/removal/triggers; the entity model defines the lifecycle rules. Reclassified from "add R2.X" to "R0.A must account for field state lifecycle diversity across 4 categories."

##### 16. Composition primitives — three categories

The 7 composition primitives group into 3 categories with different architectural implications:

| Category | Primitives | Character |
|---|---|---|
| **Flow** | Sequence, Conditional, Recursive trigger | Pure — control order of operations |
| **Intervention** | Replacement, Cross-entity filter | Resolution modifier layer (finding 13) — modify how OTHER effects resolve |
| **Interaction** | Choice point, Embedded action | Require expanded inputs — player decisions, action economy mutations |

Flow is straightforward composition. Intervention drives the resolution modifier layer. Interaction drives the expanded input surface (finding 20). Designing the composition model in these three categories keeps the architecture aligned with the two-layer effect model.

##### 20. Pure functions — documentation fix, not architecture change

The observation is correct: choice points, event attribution, and randomness mean the input surface is larger than "current game state." The fix is what the review suggests — expand the inputs:

- Randomness → injected roll results (pass 16 to verify burn triggers)
- Choice points → player decisions as input parameters
- Event attribution → structured event history in input state

The functions remain pure. The plan should explicitly state: **"pure function with expanded input surface: game state + roll results + player decisions + event history."** This is a documentation clarification, not an architecture change.

---

#### Challenged and resolved

##### 19. Data model for definitions — TypeScript constants

The review frames this as three equal options. It's not. The answer is **in code (TypeScript constants).**

- Move/trait definitions change when PTR rules change, which is rarely. They don't need runtime CRUD.
- The PTR vault is the source of truth (Principle 1). TypeScript constants are a compiled representation of vault content. Rule change → update vault note → update constant.
- "In database" adds serialization complexity and makes definitions harder to version control, test, and review. GMs won't create custom moves in v1.0.
- "In vault files compiled at build" adds parser/compiler infrastructure that isn't needed.
- TypeScript constants are type-safe, version-controlled, tree-shakeable, testable, and reviewable in PR diffs.
- Content authoring requires TypeScript fluency — acceptable, since the content author is the developer building the app.

**Decision:** Effect definitions are TypeScript constants in `@rotom/engine`. Resolved, not open.

---

#### What changes in the plan

**Ring 0** restructured:
- R0.1 + R0.2 merge into **R0.A: Effect Engine + Entity Model** (co-designed)
- R0.A includes: ~15 atomic effect types, ~5 resolution modifiers, 3 composition categories (flow/intervention/interaction), 4 field state lifecycle types (Coat/Blessing/Hazard/Vortex), entity model for Pokemon + Trainer
- R0.3 (Combatant-as-Lens) and R0.4 (Engine scaffold) unchanged
- **Exit criterion defined:** 30 moves + 15 traits, all atoms and composition patterns covered, unit-tested, documented in vault

**Ring 1** trimmed:
- R1.7b (character sheet), R1.7d (group view), out-of-session capability context moved out
- R1.7c (GM Combat UI) stays — on critical path
- Ring 1 returns to "shortest path to playable encounter"

**Ring 2** receives:
- R1.7b (character sheet) and R1.7d (group view) — moved from Ring 1

**Ring 3** split:
- **R3A:** Entity lifecycle (R3.1–R3.9 + R3.10 rest/healing)
- **R3B:** Spatial/VTT (R3.11–R3.15)
- **R3C:** Views + capture (R3.16–R3.18) — sync point, depends on 3A and 3B

**Content tasks added per ring:**
- Ring 0: 30 moves + 15 traits (exit criterion sample)
- Ring 1: ~50 damage moves
- Ring 2: all 382 moves + combat-relevant traits
- Ring 3: all 197 traits (including explicit split: ~187 effect-based, ~10 behavioral/instinct)

**Effect engine architecture clarified:**
- Two layers (atoms + resolution modifiers)
- Three composition categories (flow, intervention, interaction)
- Pure functions with expanded input surface (game state + rolls + decisions + event history)
- Definitions stored as TypeScript constants in `@rotom/engine`

**Status:** All findings from both adversarial reviews (1–20) resolved. Plan fully restructured. Consolidated ring reference posted below.

---

### 2026-03-26 — Consolidated Ring Plan (Post-Review Reference)

This is the authoritative ring plan incorporating all decisions from both adversarial reviews (findings 1–20), the three-view elevation, the player view triad, and the functionality catalog. Supersedes all prior ring descriptions in this thread.

---

#### Principles

1. **PTR vault is the source of truth** for what the game system IS.
2. **Documentation vault is the design authority** for how the system becomes software.
3. **SE vault provides the constraints** — patterns and principles are requirements, not suggestions.
4. **Design before code.** Every feature gets a documentation note before it gets an implementation.
5. **Destructive by default.** Existing code that doesn't match the new design is deleted. No compatibility shims. Fresh data start (PTU data discarded, schema migration history preserved).
6. **Cross-reference SE principles.** Every design must cite specific SE patterns/principles from `vaults/documentation/software-engineering/` and explain why they apply.
7. **Designs live in the documentation vault.** Decided designs become vault notes. The thread records decisions; the vault holds authoritative designs.

---

#### Effect Engine Architecture

The effect engine is the foundation of the entire system. Moves and traits are both "hundreds of individually novel effect programs" that share this infrastructure.

**Two layers:**

| Layer | Count | What they do |
|---|---|---|
| **Atoms** | ~15 | Produce state changes: deal damage, apply status, displace entity, modify field state, modify stat/stage, mutate inventory, query spatial state, query combat history, modify action economy, modify move legality, grant/suppress movement type, modify damage pipeline, trigger on event, manage resource, resolve skill check |
| **Resolution modifiers** | ~5 | Intercept or modify how atoms resolve: replacement effect, effect suppression/meta-effect, initiative manipulation, object/entity creation, usage counters on persistent effects |

**Three composition categories:**

| Category | Primitives | Character |
|---|---|---|
| **Flow** | Sequence, Conditional, Recursive trigger | Pure — control order of operations |
| **Intervention** | Replacement, Cross-entity filter | Resolution modifier layer — modify how OTHER effects resolve |
| **Interaction** | Choice point, Embedded action | Require expanded inputs — player decisions, action economy mutations |

**Key decisions:**
- **Composable effect system, not DSL.** Atoms are finite. Novelty is in composition and conditions. Data modeling problem, not language design problem.
- **Pure functions with expanded input surface.** Input = game state + roll results + player decisions + event history. Functions are deterministic given inputs.
- **Definitions stored as TypeScript constants** in `@rotom/engine`. Type-safe, version-controlled, testable, reviewable in PR diffs.
- **Field state lifecycle diversity.** Four field state types (Coat, Blessing, Hazard, Vortex) with distinct scope, duration, removal, stacking, and user agency rules — modeled in the entity model, manipulated by the effect engine.
- **Instinct traits excluded from engine.** ~10 behavioral traits (Hangry, Territorial, Queen's Proxy, etc.) are GM-interpreted with a suppression check (DC 10+X social skill). The trait system has two subsystems: effect-based (~187 traits, engine-handled) and behavioral (~10 traits, trigger description + suppression check).

---

#### The Three Views

Every system in every ring must answer: "how does this appear on each view?"

| View | Device | Role | Core pattern |
|---|---|---|---|
| **GM View** | Desktop/laptop | Controls everything, sees everything | **Orchestration dashboard** |
| **Player View** | Phone/tablet | Controls own characters, sees restricted info | **Character sheet + remote control** |
| **Group View** | TV/projector | No interaction, shows shared state | **Live projection** of GM and player actions |

**GM View — three modes:**
1. **Session prep** (out-of-session) — create/edit entities, build encounters, design scenes, manage habitats
2. **Session orchestration** (in-session, non-combat) — activate scenes, handle requests, trigger encounters, award XP
3. **Encounter command** (in-session, combat) — multi-entity controller, encounter manager, rule arbiter, request handler, information monitor

**Player View — three modes:**
1. **In-session combat** — remote control surface (select moves, targets, items, maneuvers)
2. **In-session non-combat** — character sheet (stats, traits, moves, inventory, team)
3. **Out-of-session** — standalone character management (level up, assign traits, swap moves, manage inventory)

**Group View** — live projection driven by player/GM actions. No autonomous interaction logic.

---

#### Ring 0 — Foundation

The new root. Everything depends on this. No UI.

```
R0.A  Effect Engine + Entity Model (CO-DESIGNED as single unit)
      ├─ Effect Engine
      │   ├─ ~15 atomic effect types (state-producing)
      │   ├─ ~5 resolution modifiers (interception/override)
      │   ├─ Condition system (state queries, boolean composition)
      │   ├─ Trigger system (event-based activation: on-hit, turn-start, etc.)
      │   └─ Composition: flow (sequence, conditional, recursive trigger),
      │       intervention (replacement, cross-entity filter),
      │       interaction (choice point, embedded action)
      ├─ Entity Model
      │   ├─ Pokemon: stats, traits, moves, HP, energy/stamina, held items,
      │   │   loyalty, disposition, skills, species data
      │   ├─ Trainer: stats, skills, traits, equipment, inventory
      │   └─ Field state types: Coat (self, indefinite, no stack),
      │       Blessing (team, usage-counted, voluntary activation),
      │       Hazard (spatial, indefinite, layers),
      │       Vortex (single target, until escape/switch)
      └─ Instinct trait model (trigger description + suppression check, outside engine)

R0.B  Combatant-as-Lens (combat projection from entity)
      └─ Active effects, computed stats, position, action budget

R0.C  Game Engine scaffold (@rotom/engine)
      └─ Monorepo structure, test harness, TypeScript constant definitions
```

**Content task:** Define 30 representative moves + 15 representative traits as TypeScript constants, hand-selected to cover all atoms and composition patterns.

**Required coverage in 30/15 sample:** pure damage, status-only, self-buff, AoE, multi-hit, conditional DB modifier (Gyro Ball), field move (Toxic Spikes), Blessing (Safeguard), Coat (Aqua Ring), Interrupt (Wide Guard), Vortex (Whirlpool), displacement, initiative manipulator (Quash), replacement effect (Psyshock), healing-denial (Heal Block), type-absorb trait (Volt Absorb), contact-retaliation trait (Rough Skin), passive stat modifier, movement type trait, action economy modifier (Opportunist).

**Exit criterion:** The effect engine can express and correctly evaluate all 45 sample definitions. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect engine functions have unit tests. The engine, entity model, and lens are co-designed and documented in the documentation vault.

---

#### Ring 1 — Playable Encounter (Critical Path)

The shortest path to "a player uses a move and sees what happens." Theater-of-mind, no grid.

```
R1.1   Damage Pipeline (9-step formula, uses effect engine for modifiers)
R1.2   Energy System (move costs, stamina, fatigue — enough to gate moves)
R1.3   Basic Turn Management (initiative, round-robin, Standard/Swift/Free actions)
R1.4   Move Resolution — damage moves only (target selection, accuracy, damage, basic effects)
R1.5   Encounter State Machine (combat phase only — start, turns, end)
R1.6   View Capability Framework (GM + player capability contexts for combat)
R1.7   Minimal Player Combat UI (select move, select target, see result on phone)
R1.7c  Minimal GM Combat UI (see all combatants, select NPC, choose action, resolve, advance turns)
R1.8   Service Layer foundation (business logic in services, not route handlers)
R1.9   Store Decomposition foundation (encounter store split into focused stores)
```

**Content task:** ~50 damage moves defined as TypeScript constants.

**Exit criterion:** Two Pokemon can fight. A player on their phone selects a move, picks a target, and sees damage applied. GM controls the opponent and advances turns. Energy is tracked.

---

#### Ring 2 — Combat Depth

Full combat mechanics + all three views at minimal fidelity.

```
R2.1   Status Condition Registry (categories, application, immunities, automation via effect engine)
R2.2   Stat Stage System (buffs/debuffs, stage math, caps)
R2.3   Weather System (field state, effect triggers, type interactions)
R2.4   Move Resolution — full (status moves, field moves, multi-hit, multi-turn, conditional effects)
R2.5   Switching / Recall (initiative rules, lens lifecycle, position inheritance)
R2.6   Combat Maneuvers (Push, Trip, Grapple, Disarm — non-move Standard Actions)
R2.7   Struggle Attack (always-available fallback)
R2.8   Combat Action Presentation (20+ actions from 10 sources, phone-usable UI)
R2.9   Out-of-Turn Actions (Priority moves, Interrupts, held actions)
R2.10  Trait Assignment — combat-relevant traits (passive bonuses, combat triggers, immunities)
R2.11  Skill Check Resolution (1d20+mod, DC framework, modifier computation from traits)
R2.12  Item Use in Combat (healing items, held item triggers, Poke Balls as item)
R2.13  Group View as Live Projection (WebSocket: player phone → server → TV updates)
R2.14  GM Multi-Entity Combat UI (entity quick-select, action shortcuts, bulk status management)
R2.15  GM Request Queue (inbox for player action requests, approve/reject with context)
R2.16  Minimal Character Sheet (player sees Pokemon stats/moves/HP outside combat — from R1.7b)
R2.17  Minimal Group View (TV shows encounter state: who's fighting, whose turn, what happened — from R1.7d)
```

**Content task:** All 382 moves + combat-relevant traits defined as TypeScript constants.

**Exit criterion:** Full combat with status conditions, weather, switching, items, maneuvers, and traits that fire during combat. Multiple players on phones with GM controlling the encounter. Group view on TV reflecting combat in real-time. Character sheets accessible outside combat.

---

#### Ring 3A — Entity Lifecycle

How entities are created, grow, and change. **Runs in parallel with Ring 3B.**

```
R3A.1   Trait System — full (all 3 categories, unlock conditions, assignment workflows)
        Including: ~187 effect-based traits (engine) + ~10 behavioral/instinct traits (trigger + suppression)
R3A.2   Unlock Condition Engine (stat thresholds, trait prereqs, AND/OR, training type)
R3A.3   Disposition System (6 dispositions, per-entity, charm DCs)
R3A.4   Loyalty System (7 ranks, command DCs, training bonuses)
R3A.5   Social Skill Hierarchy (per-Pokemon ranking of 5 social skills)
R3A.6   Pokemon Creation Workflow (species → stats → traits → moves)
R3A.7   Trainer Creation Workflow (stats → skills → traits → equipment)
R3A.8   Level Up / Evolution Workflows (stat points, evolution triggers, trait/move recheck)
R3A.9   XP Distribution (per-encounter, shared, trait modifiers like Rapid Development)
R3A.10  Rest / Healing System (Take a Breather, Take Five, full rest, injury healing)
```

**Content task:** All 197 traits defined (~187 effect-based as TypeScript constants, ~10 behavioral as trigger/suppression definitions).

**Exit criterion:** Characters can be created, level up, gain traits, and evolve. XP distributes correctly. Rest and healing work.

---

#### Ring 3B — Spatial / VTT

Grid-based combat positioning. **Runs in parallel with Ring 3A.**

```
R3B.1   Spatial Engine (coordinate model, projection-agnostic)
R3B.2   Grid Projections (square grid, token rendering, movement types from traits)
R3B.3   AoE / Measurement Tools (shapes from move targeting types)
R3B.4   Fog of War (three-state, role-filtered)
R3B.5   Terrain System (terrain types, movement costs, weather interaction)
```

**Exit criterion:** Combat happens on a grid with tokens, AoE visualization, fog of war, and terrain. Movement types from traits interact correctly with terrain.

---

#### Ring 3C — Views + Capture (Sync Point)

Depends on Ring 3A + Ring 3B. Where entity lifecycle and spatial converge into the full user experience.

```
R3C.1   Full View System (GM/Player/Group at full fidelity, WebSocket role-based filtering)
R3C.2   Capture Workflow (PTR two-step, rate formula, ball modifiers, feeds into loyalty)
R3C.3   Out-of-Session Character Management (level up, assign traits, swap moves, manage inventory — no GM)
R3C.4   GM Session Prep (encounter building, NPC creation, scene design, campaign management)
```

**Exit criterion:** All three views at full fidelity. Capture works end-to-end. Players manage characters independently. GM can prepare session content.

---

#### Ring 4 — World Building + Advanced

Systems that support campaign play beyond individual encounters.

```
R4.1   Training System (dual-check, session management, trait/move unlock)
R4.2   Breeding System (trait inheritance, species determination)
R4.3   Encounter Tables (weighted selection, diversity, budget difficulty)
R4.4   Habitat System (biome-based species pools)
R4.5   Wild Encounter Generation (species → Pokemon with disposition, stats, traits)
R4.6   Scene System (creation, activation, weather, groups, positioning)
R4.7   Scene-to-Encounter Conversion
R4.8   Pokedex (scan action, information discovery, view system integration)
R4.9   Trainer Progression (post-creation growth: new traits, new skills)
R4.10  Mounting / Living Weapon
R4.11  Elevation System
```

**Exit criterion:** Full campaign support. GM can build encounters from tables, run sessions with training downtime, breed Pokemon, and manage a living world.

---

#### Cross-Ring Dependencies

The rings are not fully sequential. Known cross-dependencies:

- **R2.8 (Combat Action Presentation)** is the hardest UI problem. Converges R2.1–R2.12. UI constraints flow backward into mechanics — if 20+ actions are overwhelming on a phone, the UI informs which actions to surface vs. collapse.
- **R3B.2 (Grid)** has soft dependencies on R2.1 (status effects on tokens), R2.3 (weather visualization), R0.A (movement type effects). These are rendering layers, not blockers.
- **R3C.1 (Full View System)** — the framework is R1.6, but capability enumeration grows through Rings 2–4.
- **R4.1 (Training)** is the most dependent leaf — needs R3A.1–R3A.5, R2.11, R3A.2.
- **Ring 3A and 3B** run in parallel. **Ring 3C** is the sync point that depends on both.

---

#### Item Count Summary

| Ring | Items | Content work |
|---|---|---|
| Ring 0 | 3 (R0.A, R0.B, R0.C) | 30 moves + 15 traits |
| Ring 1 | 10 | ~50 damage moves |
| Ring 2 | 17 | All 382 moves + combat traits |
| Ring 3A | 10 | All 197 traits |
| Ring 3B | 5 | — |
| Ring 3C | 4 | — |
| Ring 4 | 11 | — |
| **Total** | **60** | **382 moves + 197 traits** |

---

**Status:** Consolidated ring plan complete. This is the authoritative reference. ~~Next step: begin Ring 0 design — R0.A (Effect Engine + Entity Model co-design).~~

---

### 2026-03-26 — R0.A: GameState Interface — State Inventory from 45 Sample Definitions

Per the SE principles (DIP: depend on abstractions; ISP: narrow interfaces; OCP: extensible without modification), the first design task for R0.A is the **GameState interface** — the shared abstraction that both the effect engine and entity model depend on. This post enumerates every piece of game state that the 45 exit-criterion definitions read or write, derived from the PTR vault.

---

#### Approach

The existing documentation vault proposals converge on this:
- **`combatant-as-lens.md`** — entities are permanent; combat state is a separate lens (delta layer). The lens IS the combat portion of the GameState. Functions are `(entity, lens) → lens`.
- **`trait-composed-domain-model.md`** — entities decompose into narrow interfaces (HasHealth, HasCombatStats, HasPosition...). ISP applied to the state shape.
- **`data-driven-rule-engine.md`** — rules are data; a generic evaluator processes definitions against a context. That context IS the GameState.
- **`damage-pipeline-as-chain-of-responsibility.md`** — the damage formula is a chain where each step receives state and passes modified state forward.

Per `dependency-inversion-principle.md`: both high-level modules (effect engine) and low-level modules (entity model) depend on this abstraction. Per `interface-segregation-principle.md`: the GameState decomposes into narrow sub-interfaces so each effect atom receives only the state it needs. Per `open-closed-principle.md`: new atoms extend the transformation vocabulary without modifying the state shape.

---

#### The 45 Definitions

**30 Moves:**

| # | Move | Coverage pattern |
|---|---|---|
| 1 | Thunderbolt | Pure damage + conditional status (Paralyze 19+) |
| 2 | Thunder Wave | Status-only, auto-hit, type immunity check |
| 3 | Will-O-Wisp | Status-only with AC |
| 4 | Swords Dance | Self-buff (Attack CS +2) |
| 5 | Dragon Dance | Multi-stat self-buff (Atk +1, Spd +1) |
| 6 | Earthquake | AoE (Burst 3), Groundsource, hit underground targets |
| 7 | Bullet Seed | Multi-hit (Five Strike, 2–5 hits) |
| 8 | Struggle Bug | AoE (Cone 2) + debuff (SpAtk -1 CS on hit) |
| 9 | Circle Throw | Displacement (Push 6m - Weight Class) + conditional (Trip 15+) |
| 10 | Roar | Forced displacement + forced recall, delayed resolution |
| 11 | Gyro Ball | Conditional bonus damage (Speed stat comparison) |
| 12 | Hex | Conditional DB override (7→13 if target has status affliction) |
| 13 | Retaliate | Historical event query (ally fainted by target in last 2 rounds → DB doubled) |
| 14 | Toxic Spikes | Hazard (spatial placement, layerable to 2, type-conditional removal) |
| 15 | Stealth Rock | Hazard (proximity trigger, 1 tick damage with type effectiveness) |
| 16 | Safeguard | Blessing (3 activations, voluntary, blocks status affliction) |
| 17 | Light Screen | Blessing (2 activations, voluntary, resists Special damage one step) |
| 18 | Aqua Ring | Coat (turn-start heal, 1 tick/turn) |
| 19 | Wide Guard | Interrupt (negate hit for all adjacent allies, replacement effect) |
| 20 | Protect | Interrupt (negate hit for self, replacement effect) |
| 21 | Whirlpool | Damage + Vortex (embedded swift action, Trapped) |
| 22 | Quash | Initiative manipulation (set target initiative to 0 for round) |
| 23 | After You | Initiative manipulation (target goes next, swift action) |
| 24 | Psyshock | Replacement effect (subtract Defense instead of SpDef) |
| 25 | Heal Block | Effect suppression (no HP/TempHP gain from any source, persistent) |
| 26 | Taunt | Behavioral restriction (Enraged — damaging moves only) |
| 27 | Thief | Damage + inventory mutation (steal held item if user slot empty) |
| 28 | Beat Up | Multi-attacker delegation (user + 2 adjacent allies each Struggle Attack, Dark-typed) |
| 29 | Defog | Field clearing (weather → Clear, destroy all Blessings/Coats/Hazards) |
| 30 | Recover | Self-heal (50% max HP) |

**15 Traits:**

| # | Trait | Coverage pattern |
|---|---|---|
| 1 | Volt Absorb | Type-absorb (Electric immunity → energy recovery) |
| 2 | Water Absorb | Type-absorb (Water immunity → HP recovery) |
| 3 | Flash Fire | Type-absorb (Fire immunity → offensive buff, fizzles if unused) |
| 4 | Rough Skin | Contact-retaliation (attacker loses 1 tick HP) |
| 5 | Opportunist [X] | Action economy modifier (X additional AoO/round + Dark Struggle Attacks) |
| 6 | Teamwork | Spatial query + conditional buff (adjacent to opponent → allies +2 accuracy on melee) |
| 7 | Shell [X] | Damage pipeline modifier (flat DR by X) |
| 8 | Ice Body | Weather-conditional trigger (Hail → turn-start heal 1 tick + Hail damage immunity) |
| 9 | Phaser [X] | Movement type grant (Phase movement, ignore solid objects/Slow Terrain) |
| 10 | Limber | Status immunity (immune to Paralysis) |
| 11 | Mettle | Cross-encounter persistent resource (max 3, +1 on faint, spend to reroll) |
| 12 | Seed Sower | Defensive trigger → terrain creation (hit by damage → field becomes Grassy 5 rounds) |
| 13 | Pack Hunt | Reactive out-of-turn attack (ally melee hits adjacent foe → user AoO) |
| 14 | Sniper | Damage pipeline modifier (crits deal +5 bonus damage, multiplied) |
| 15 | Technician | DB modifier (moves with DB ≤ 6 gain +2 DB, always applies to Double/Five Strike) |

---

#### Coverage Verification

| Atom / Composition Pattern | Covered by |
|---|---|
| **Deal damage** | Thunderbolt, Earthquake, Gyro Ball, etc. |
| **Apply status** | Thunder Wave, Will-O-Wisp, Taunt (Enraged) |
| **Displace entity** | Circle Throw (Push), Roar (forced shift + recall) |
| **Modify field state** | Toxic Spikes (Hazard), Stealth Rock (Hazard), Safeguard (Blessing), Light Screen (Blessing), Aqua Ring (Coat), Whirlpool (Vortex), Rain Dance-equivalent via Defog, Grassy Terrain via Seed Sower |
| **Modify stat/stage** | Swords Dance (+2 Atk CS), Dragon Dance (+1 Atk/Spd CS), Struggle Bug (-1 SpAtk CS) |
| **Mutate inventory** | Thief |
| **Query spatial state** | Teamwork (adjacency), Beat Up (allies adjacent to target), Wide Guard (allies adjacent to user) |
| **Query combat history** | Retaliate (ally fainted by target in last 2 rounds) |
| **Modify action economy** | Opportunist (additional AoO), Whirlpool/Sand Tomb (embedded swift action) |
| **Modify move legality** | Taunt (Enraged = damaging moves only) |
| **Grant/suppress movement type** | Phaser (Phase movement) |
| **Modify damage pipeline** | Shell (flat DR), Sniper (crit bonus), Technician (DB boost for weak moves), STAB (+2 DB) |
| **Trigger on event** | Rough Skin (on contact hit), Volt/Water/Flash Absorb (on type hit), Ice Body (turn start), Seed Sower (on damage received), Pack Hunt (on ally melee hit) |
| **Resource management** | Mettle (points), Energy (move costs) |
| **Skill check resolution** | (Not directly in the 45, but training unlock conditions reference it) |
| **Replacement effect** | Psyshock (Defense instead of SpDef), Wide Guard/Protect (negate hit entirely) |
| **Effect suppression** | Heal Block (blocks all healing) |
| **Initiative manipulation** | Quash (set to 0), After You (target goes next) |
| **Object/entity creation** | Stealth Rock (creates rock objects in field), Toxic Spikes (creates hazard zones) |
| **Usage counters** | Safeguard (3 activations), Light Screen (2 activations) |
| **Conditional** | Hex (DB override if status), Gyro Ball (bonus damage from speed diff), Thunderbolt (Paralyze on 19+) |
| **Sequence** | Thief (damage then steal), Whirlpool (damage then Vortex) |
| **Recursive trigger** | Rough Skin (hit → attacker HP loss → could trigger Destiny Bond chain) |
| **Replacement** | Psyshock, Wide Guard, Protect |
| **Cross-entity filter** | Heal Block (prevents OTHER effects from healing target) |
| **Choice point** | Safeguard (user MAY activate when receiving status) |
| **Embedded action** | Whirlpool (Swift Action Vortex inside Standard Action move) |
| **Multi-attacker** | Beat Up (up to 3 entities attack through one move) |
| **Status-gated targeting** | (Nightmare would cover this — stretch goal) |
| **Weather-conditional** | Ice Body (Hail), Seed Sower/Grassy Terrain interaction |
| **Delayed resolution** | Roar (declares, then resolves end of round) |
| **Cross-encounter persistence** | Mettle (points survive encounters) |
| **Type immunity** | Limber (Paralysis), Volt/Water/Flash Absorb (type-based) |

All ~20 atoms, all ~5 resolution modifiers, and all 7 composition patterns are covered.

---

#### State Inventory

Every piece of game state that the 45 definitions read or write, organized by domain. This is the raw material for the GameState sub-interfaces.

---

##### 1. Entity State (permanent, intrinsic — survives combat)

Read by almost every definition. Never written by effects during combat (per combatant-as-lens: effects modify the lens, not the entity).

**Pokemon:**
- `id: string`
- `species: string`
- `level: number`
- `types: Type[]` — read by: STAB (step 3), type effectiveness (step 8), Thunder Wave immunity, Toxic Spikes type-conditional removal, Limber, Volt/Water/Flash Absorb
- `stats: { hp, atk, def, spatk, spdef, spd, stamina }` — read by: damage formula (steps 6, 7), Gyro Ball (speed comparison), effective stat calculation, energy derivation, HP tick calculation
- `moves: MoveRef[]` — read by: Taunt/Enraged (filters to damaging moves only), action presentation
- `traits: TraitRef[]` — read by: movement type checks (Phaser, Roar's "highest movement trait"), trait triggers
- `heldItem: ItemRef | null` — read by: Thief (target has item?), user slot check
- `accessorySlotItem: ItemRef | null` — read by: Thief (alternative steal target)
- `weightClass: number` — read by: Circle Throw (push distance = 6 - WC)
- `movementTypes: MovementType[]` — read by: Roar (forced shift uses highest), terrain interaction, Phaser grants Phase type
- `experience: number` — written by: XP distribution (Ring 3)
- `loyalty: number` — read by: command checks (Ring 3+)
- `skills: Record<SkillName, number>` — read by: skill checks, unlock conditions

**Trainer:**
- `id, name, stats, skills, traits, equipment, inventory` — parallel structure, subset of fields

---

##### 2. Combat Lens State (transient, per-combatant — created on encounter entry, destroyed on end)

The primary write target for effects. Each field below is cited with which definitions read/write it.

| Field | Type | Read by | Written by |
|---|---|---|---|
| `entityId` | string | All (links to entity) | Created on entry |
| `entityType` | 'pokemon' \| 'trainer' | Type-conditional logic | Created on entry |
| `side` | 'allies' \| 'enemies' \| 'neutral' | Beat Up (ally check), targeting | Created on entry |
| `hpDelta` | number | HP display, faint check, Recover, healing effects | Thunderbolt/damage, Recover, Aqua Ring tick, Water Absorb heal, Stealth Rock tick, Rough Skin retaliation, Ice Body heal |
| `tempHp` | number | Damage application, Heal Block (blocks TempHP too) | Take a Breather clears |
| `injuries` | number | HP effective max calculation | Damage that crosses injury thresholds |
| `energyCurrent` | number | Move cost validation, fatigue check | Move use (subtract cost), Volt Absorb (+5), energy regain per turn |
| `combatStages` | `{ atk, def, spatk, spdef, spd, accuracy, evasion }` | Damage formula (steps 6, 7), Gyro Ball (speed comparison), accuracy check | Swords Dance (atk +2), Dragon Dance (atk +1, spd +1), Struggle Bug (spatk -1), Take a Breather resets to 0 |
| `statusConditions` | StatusInstance[] | Hex (has affliction?), Nightmare (asleep?), Taunt/Enraged (restricts moves), Thunder Wave/Will-O-Wisp (apply), Limber (immune to Paralysis) | Thunder Wave, Will-O-Wisp, Thunderbolt (19+), Taunt, Toxic Spikes (Poisoned/Badly Poisoned), Safeguard (blocks), Take a Breather (clears volatile) |
| `volatileConditions` | VolatileInstance[] | Flinch, Trapped (Vortex), Bound (Destiny Bond), Enraged (Taunt), Heal Block | Whirlpool (Trapped), Taunt (Enraged), Heal Block, Circle Throw (Tripped), Rock Slide (Flinch 17+) |
| `initiative` | number | Turn order, Quash, After You | Quash (set to 0), After You (reorder) |
| `position` | GridPosition \| null | Circle Throw (push destination), Roar (shift direction), Teamwork/Beat Up/Wide Guard (adjacency queries), Toxic Spikes (spatial placement), Stealth Rock (proximity) | Circle Throw (push), Roar (forced shift), Surf-like repositioning |
| `actionBudget` | `{ standard, movement, swift }` | Move use validation, embedded actions (Whirlpool swift action), After You (swift action) | Move use consumes standard, Whirlpool/Sand Tomb embed swift action within resolution |
| `outOfTurnUsage` | `{ aooRemaining, interruptUsed }` | Pack Hunt (AoO available?), Wide Guard/Protect (interrupt available?), Opportunist (AoO budget) | Opportunist (sets aooRemaining = 1 + X), Pack Hunt (decrements AoO), Wide Guard/Protect (marks interrupt used) |
| `actedThisRound` | boolean | After You (can only target someone who hasn't acted) | Turn resolution (set true after turn) |
| `mountedOn / riddenBy` | string \| null | Mounting rules (Ring 4) | — |
| `engagedWith / wieldedBy` | string \| null | Living weapon (Ring 4) | — |

---

##### 3. Persistent Combatant State (survives combat but tracked per-combatant)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `mettlePoints` | number (max 3) | Mettle (spend to reroll) | Mettle (+1 on faint, persists across encounters) |
| `stealthRockHitThisEncounter` | boolean | Stealth Rock (can only hit once per entry) | Stealth Rock trigger, recall resets |

---

##### 4. Buff/Debuff Tracking (transient state for time-limited effects)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `flashFireBonus` | `{ active: boolean, expiresEndOfTurn: number }` | Flash Fire (next Fire damage +5) | Flash Fire trigger (set active), user's next Fire move or turn end (consumed/fizzled) |
| `healBlocked` | boolean | All healing effects (Recover, Aqua Ring, Water Absorb, items) | Heal Block (set true), switch out or Take a Breather (clears) |
| `boundTo` | string[] | Destiny Bond (if bound target causes faint → mutual faint) | Destiny Bond (adds entity IDs), user's next turn end (expires) |

Note: Many status conditions (Burned, Poisoned, Paralyzed, etc.) have their own tick behaviors and mechanical effects. These are currently modeled as instances in `statusConditions[]` and `volatileConditions[]` on the lens.

---

##### 5. Field State (per-encounter, not per-combatant)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `weather` | `{ type: WeatherType, roundsRemaining: number }` | Ice Body (is Hail?), Rain Dance effects (+5 Water/-5 Fire damage rolls), Solar Beam (Sunny skips charge), Defog (clears) | Rain Dance (set Rainy, 5 rounds), Defog (set Clear) |
| `terrain` | `{ type: TerrainType, roundsRemaining: number }` | Seed Sower / Grassy Terrain (Grassy = grounded heal + Grass damage bonus), movement costs | Seed Sower (set Grassy, 5 rounds), Grassy Terrain (set Grassy, 5 rounds), Defog (does NOT clear terrain — only weather/blessings/coats/hazards) |
| `hazards` | `HazardInstance[]` | Toxic Spikes (layer count for poison severity, Poison-type removal), Stealth Rock (proximity trigger, type effectiveness) | Toxic Spikes (create 8sqm, stackable to 2 layers), Stealth Rock (create 4sqm rocks), Defog (destroy all) |
| `blessings` | `BlessingInstance[]` | Safeguard/Light Screen (voluntary activation when receiving status/Special damage) | Safeguard (create, 3 uses), Light Screen (create, 2 uses), activation (decrement counter), Defog (destroy all) |
| `coats` | `CoatInstance[]` | Aqua Ring (turn-start heal trigger) | Aqua Ring (create on user), Defog (destroy all) |
| `vortexes` | `VortexInstance[]` | Trapped condition (blocks recall), residual damage per turn | Whirlpool/Sand Tomb (create on target), switch out or caster switch (destroy) |

**Hazard detail** (from Toxic Spikes + Stealth Rock):
```
HazardInstance {
  type: 'toxic-spikes' | 'stealth-rock' | ...
  positions: GridPosition[]
  layers: number              // Toxic Spikes can layer to 2
  ownerSide: Side
}
```

**Blessing detail** (from Safeguard + Light Screen):
```
BlessingInstance {
  type: 'safeguard' | 'light-screen' | ...
  teamSide: Side
  activationsRemaining: number  // Safeguard=3, Light Screen=2
  effectDescription: string     // "block status" or "resist Special damage one step"
}
```

**Coat detail** (from Aqua Ring):
```
CoatInstance {
  type: 'aqua-ring' | ...
  entityId: string              // Coats are per-entity, not team-wide
  triggerTiming: 'turn-start'   // When the effect activates
}
```

**Vortex detail** (from Whirlpool/Sand Tomb):
```
VortexInstance {
  targetId: string
  casterId: string              // Destroyed if caster switches
  appliesTrapped: boolean       // Blocks recall
}
```

---

##### 6. Encounter State (global combat context)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `round` | number | Retaliate (last 2 rounds), Flash Fire (fizzle timing), Blessing/Weather/Terrain duration countdown | Turn advancement |
| `phase` | 'declaration' \| 'resolution' \| 'priority' | Roar (delayed resolution = declares but resolves end of round) | Phase advancement |
| `turnOrder` | CombatantId[] | After You (reorder), Quash (set to 0 = move to end) | Initiative calculation, Quash, After You |
| `currentTurnIndex` | number | Whose turn it is | Turn advancement |

---

##### 7. Combat Event Log (historical queries)

| Field | Type | Read by | Written by |
|---|---|---|---|
| `events` | CombatEvent[] | Retaliate ("ally fainted by target in last 2 rounds"), Destiny Bond ("bound target caused user to faint") | Every damage application, every faint, every status application, every move use |

**CombatEvent structure** (from Retaliate + Destiny Bond):
```
CombatEvent {
  round: number
  type: 'damage' | 'faint' | 'status-applied' | 'move-used' | ...
  sourceId: string             // Who caused it
  targetId: string             // Who it happened to
  moveId?: string              // Which move (for "fainted by damaging move" queries)
  isDamagingMove?: boolean     // Retaliate checks "fainted by a Damaging Move"
  amount?: number              // Damage dealt, for attribution
}
```

---

##### 8. Resolution Context (expanded inputs for pure functions)

Per finding 20: pure functions need an expanded input surface beyond game state.

| Input | Type | Read by | Written by |
|---|---|---|---|
| `accuracyRoll` | number (1d20) | Thunderbolt (19+ = Paralyze), Rock Slide (17+ = Flinch), Circle Throw (15+ = Trip), all AC-based moves | Injected by caller |
| `damageRolls` | number[] | Damage formula step 5, Bullet Seed (per-hit) | Injected by caller |
| `multiHitCount` | number (2–5) | Bullet Seed (Five Strike roll) | Injected by caller |
| `playerDecisions` | `{ activateBlessing?: BlessingId, activateMettle?: boolean, ... }` | Safeguard/Light Screen (voluntary activation), Mettle (spend to reroll) | Injected by caller (from UI interaction) |
| `interruptDecisions` | `{ useProtect?: boolean, useWideGuard?: boolean, ... }` | Wide Guard, Protect (Interrupt trigger) | Injected by caller |

---

##### 9. Move Definition Properties (read-only reference data)

Every move definition has properties that effects read:

| Property | Type | Read by |
|---|---|---|
| `type` | Type | STAB, type effectiveness, absorb traits (Volt/Water/Flash), weather damage modifiers |
| `damageClass` | 'physical' \| 'special' \| 'status' | Which stats to use in damage formula (Atk/Def or SpAtk/SpDef), Psyshock override, Light Screen (Special only) |
| `damageBase` | number \| null | Damage formula step 1, Hex (override to 13), Technician (boost if ≤6), Retaliate (double) |
| `ac` | number \| null | Accuracy check threshold |
| `range` | RangeSpec | Target selection, AoE shape, Beat Up (adjacency), Roar (Burst 1) |
| `energyCost` | number | Energy deduction, cost validation |
| `keywords` | string[] | Five Strike, Double Strike (Technician), Push (Circle Throw), Interrupt/Shield/Trigger (Wide Guard/Protect), Hazard, Blessing, Coat, Vortex, Social, Sonic, Groundsource, Set-Up |
| `isContact` | boolean | Rough Skin trigger, Pickpocket trigger |
| `isDamaging` | boolean | Taunt/Enraged filter (damaging moves only), Retaliate (fainted by damaging move) |

---

#### Candidate Sub-Interfaces (ISP decomposition)

Following `trait-composed-domain-model.md` and `interface-segregation-principle.md`, the state groups into narrow interfaces that effect atoms can depend on individually:

| Sub-interface | Fields | Consumed by |
|---|---|---|
| `HasIdentity` | id, name, side, entityType | All effects (targeting, attribution) |
| `HasTypes` | types[] | STAB, type effectiveness, absorb traits, type immunity |
| `HasStats` | stats (7 individual stats) | Damage formula, Gyro Ball, effective stat calc, HP/Energy derivation |
| `HasCombatStages` | combatStages (7 stages) | Damage formula, Gyro Ball (speed with CS), stage modifiers |
| `HasHealth` | hpDelta, tempHp, injuries, maxHp (derived) | Damage application, healing, faint check, tick calculation |
| `HasEnergy` | energyCurrent, maxEnergy (derived from stamina) | Move cost, Volt Absorb, energy regain |
| `HasStatus` | statusConditions[], volatileConditions[] | Hex, Limber, Safeguard, Taunt/Enraged, healing, Take a Breather |
| `HasPosition` | position | Push, adjacency queries, AoE targeting, hazard placement |
| `HasInitiative` | initiative, actedThisRound | Turn order, Quash, After You |
| `HasActions` | actionBudget, outOfTurnUsage | Move use, embedded actions, Opportunist AoO budget, interrupts |
| `HasInventory` | heldItem, accessorySlotItem | Thief |
| `HasMovement` | movementTypes[], weightClass | Circle Throw push, Roar forced shift, Phaser, terrain interaction |
| `HasMoves` | moves[] | Taunt/Enraged filter, action presentation |
| `HasTraits` | traits[] | Trait trigger evaluation, movement type grants |
| `HasBuffTracking` | flashFireBonus, healBlocked, boundTo, ... | Per-definition buff/debuff state |
| `HasPersistentResources` | mettlePoints, stealthRockHitThisEncounter | Mettle, Stealth Rock one-hit-per-entry |

**Field state interfaces:**

| Sub-interface | Fields | Consumed by |
|---|---|---|
| `HasWeather` | weather { type, roundsRemaining } | Ice Body, Rain Dance effects, Solar Beam, Defog |
| `HasTerrain` | terrain { type, roundsRemaining } | Seed Sower, Grassy Terrain, movement costs |
| `HasHazards` | hazards[] | Toxic Spikes, Stealth Rock, Defog |
| `HasBlessings` | blessings[] | Safeguard, Light Screen, Defog |
| `HasCoats` | coats[] | Aqua Ring, Defog |
| `HasVortexes` | vortexes[] | Whirlpool, Sand Tomb, Trapped condition |

**Encounter context interfaces:**

| Sub-interface | Fields | Consumed by |
|---|---|---|
| `HasRoundState` | round, phase, currentTurnIndex | Duration countdowns, Roar delayed resolution |
| `HasTurnOrder` | turnOrder[] | Quash, After You, initiative display |
| `HasCombatLog` | events[] | Retaliate, Destiny Bond |

---

#### Observations

1. **The lens/entity split from `combatant-as-lens.md` holds perfectly.** Every effect writes to lens fields (hpDelta, combatStages, statusConditions, etc.) — never to entity fields (stats, species, level, type). The entity is read-only during combat. The 45 definitions confirm this pattern without exception.

2. **Field state is four distinct systems, as predicted by finding 14.** Hazards, Blessings, Coats, and Vortexes have completely different lifecycle rules (scope, duration, stacking, removal, user agency). They share only Defog as a cross-cutting clear operation.

3. **The combat event log is structurally necessary.** Retaliate and Destiny Bond both require historical queries ("who did what to whom, when"). This isn't optional logging — it's load-bearing game state that effects read from. The log must be structured, not just a text record.

4. **Buff/debuff tracking is open-ended.** Flash Fire's timed bonus, Heal Block's persistent suppression, Destiny Bond's bound state — these are per-entity, per-effect stateful conditions that don't fit cleanly into the status condition system (they're not "Burned" or "Paralyzed" — they're effect-specific tracking). This may need a generic `activeEffects: EffectInstance[]` rather than named fields.

5. **The resolution context (finding 20) is confirmed.** Roll results, multi-hit counts, and player decisions (Safeguard activation, Mettle reroll, interrupt use) must be inputs, not generated inside the function. The 45 definitions require at least 5 distinct input categories beyond game state.

6. **Move definition properties are a reference data layer.** The effect engine reads move properties (type, DB, AC, range, keywords, isContact, isDamaging) but never writes them. This is a separate read-only data model, not part of the mutable GameState.

**Status:** State inventory complete. 45 definitions enumerated across 9 state domains, 16 combatant sub-interfaces, 6 field state sub-interfaces, and 3 encounter context sub-interfaces. ~~Next step: synthesize these into the formal GameState interface design (documentation vault note) with SE principle cross-references.~~ Adversarial review posted below.

---

### 2026-03-26 — Adversarial Review of R0.A State Inventory

Eight findings organized into three categories: contradictions within the post, missing state that the 45 definitions require but the inventory doesn't capture, and structural problems with the ISP decomposition.

---

#### Contradictions

---

##### 21. Thief contradicts observation 1 — the entity is NOT always read-only during combat

Observation 1 states: "every effect writes to lens fields — never to entity fields. The entity is read-only during combat. The 45 definitions confirm this pattern without exception."

Thief steals the target's held item and attaches it to the user. `heldItem` and `accessorySlotItem` are explicitly listed in section 1 (Entity State) as permanent, intrinsic fields that "survive combat." They are NOT in section 2 (Combat Lens State). So Thief writes to entity state. The "without exception" claim is wrong — there is at least one exception in the 45 definitions the post itself selected.

Two options:
1. **Add inventory delta fields to the lens.** Something like `heldItemOverride: ItemRef | null | 'removed'` on the lens, applied back to the entity when combat ends. This preserves the lens/entity boundary but adds complexity — the lens now tracks item changes as deltas, and entity reconciliation must happen at encounter end.
2. **Acknowledge that certain effects write entity state.** Item theft, and potentially XP distribution (also listed as entity state written by a Ring 3 system), are boundary cases where combat effects mutate the permanent entity.

Either way, observation 1 as stated is false. The entity is *mostly* read-only during combat, with inventory mutation as a known exception. This needs to be resolved before the formal GameState interface, because it determines whether the lens/entity boundary is absolute (enforced in the type system) or advisory (enforced by convention with documented exceptions).

---

##### 22. BlessingInstance's `effectDescription: string` is the effect engine's job

The BlessingInstance struct contains:
```
effectDescription: string  // "block status" or "resist Special damage one step"
```

This is a free-text string describing what a blessing does mechanically. But formalizing "what an effect does mechanically" is the *entire purpose* of the effect engine. Safeguard's "block status" is a cross-entity filter (composition category: Intervention). Light Screen's "resist Special damage one step" is a damage pipeline modifier (atom: modify damage pipeline).

If the engine can express these as compositions of atoms, then BlessingInstance shouldn't store a prose description — it should reference an effect definition (a TypeScript constant). If the engine CAN'T express what a blessing does on activation, that's an effect engine gap, not a data modeling problem to solve with a string field.

As written, `effectDescription` creates two sources of truth for the same mechanic: the formal effect definition (TypeScript constant) AND the string field on the instance. These will drift.

This is textbook `[[primitive-obsession-smell]]` — using a string primitive where a domain object (an effect definition reference) should be. Per that smell's description: "Primitives scatter validation logic and reduce type safety. Small domain objects keep related behavior together and make the code more expressive." It also violates `[[single-source-of-truth]]` — the blessing's activation behavior is defined both in the effect engine's TypeScript constant AND in this string field.

**Impact:** Replace `effectDescription: string` with `activationEffect: EffectDefinitionRef` — a reference to the effect composition that fires when the blessing is voluntarily activated. The actual description can be derived from the effect definition for display purposes. Fix per `[[replace-data-value-with-object]]`.

---

#### Missing State

---

##### 23. StatusInstance and VolatileInstance are missing source tracking

The PTR vault explicitly requires condition source tracking. From `status-cs-auto-apply-with-tracking.md`:

> When Burning or Poison is applied, the app automatically applies their inherent combat stage effects (Burn: −2 Def CS, Poison: −2 SpDef CS), **tagged by source.** On cure, **only the source-tagged stages are reversed.** After Take a Breather (which resets all stages), **condition-sourced stages are re-applied.**

From `recall-clears-then-source-reapplies.md`:

> Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) **clear on recall** RAW, regardless of source. However, **if the source (terrain, weather) is still active** when the Pokemon is sent back out, **the condition is automatically re-applied** with the appropriate source tag.

This means:
- Every status/volatile condition must track its **source** (which move, trait, or environmental effect caused it)
- Source tracking drives mechanical behavior: cure reversal, re-application on re-entry, CS coupling
- The state inventory lists `statusConditions: StatusInstance[]` and `volatileConditions: VolatileInstance[]` but never defines what StatusInstance or VolatileInstance contain

At minimum, each instance needs:
```
StatusInstance {
  condition: StatusType       // Burned, Poisoned, Paralyzed, etc.
  source: EffectSource        // Which move/trait/terrain/weather applied it
  appliedCombatStages?: Record<StatName, number>  // CS changes to reverse on cure
}
```

Without source tracking, Take a Breather can't correctly re-apply condition-sourced CS, and recall can't correctly re-apply source-dependent conditions on re-entry. These aren't edge cases — they're every-session mechanics.

The documentation vault already acknowledges this: `status-condition-categories.md` references a `[[condition-source-rules]]` system for "source-dependent clearing," and `status-cs-auto-apply-with-tracking.md` calls it `[[condition-source-tracking]]`. The state inventory omitted a system that both the PTR vault and the documentation vault treat as load-bearing.

---

##### 24. Missing state: deployment model (bench, reserve, fainted)

Roar forces recall — the target shifts away and, if within 6m of their Poke Ball, is immediately recalled (`roar-has-own-recall-mechanics.md`). Switching follows initiative — fainted Pokemon switching happens on the trainer's next available turn (`switching-follows-initiative.md`). Recall is a Shift Action, release is a Free Action (`pokemon-switching-action-costs.md`).

All of this requires knowing which Pokemon are NOT currently fighting:
- Which Pokemon are in **reserve** (available to send out)?
- Which are **fainted** (unavailable)?
- Which are **active** (currently deployed as combatants)?

The state inventory tracks active combatants (section 2, lens state) and permanent entities (section 1, entity state). It does not track **deployment state** — the relationship between a trainer's team roster and the subset currently on the field.

This isn't just a bookkeeping concern. Switching is a Standard Action (or Shift Action for fainted Pokemon). The action presentation UI (R2.8) needs to know: "can this trainer switch? do they have reserve Pokemon?" The encounter state machine needs to know: "Roar recalled this Pokemon — is there a replacement available?" If all Pokemon are fainted, the encounter may end.

**Impact:** Add deployment state to the inventory. Either as a per-trainer field:
```
deploymentState: {
  active: EntityId[]        // Currently on field (have lenses)
  reserve: EntityId[]       // Available to deploy
  fainted: EntityId[]       // Cannot deploy
}
```
Or as a per-entity field on the lens: `deploymentStatus: 'active' | 'reserve' | 'fainted'`. Reserve Pokemon don't have lenses (they're not in combat), so this probably lives on the trainer entity or encounter state, not on the lens.

---

##### 25. VortexInstance is missing per-turn damage and move reference

Whirlpool's vault note (`whirlpool.md`) says: "Trapping move that deals residual damage over time via Vortex status." The VortexInstance struct has:
```
VortexInstance {
  targetId: string
  casterId: string
  appliesTrapped: boolean
}
```

Where does the per-turn damage come from? Three Vortex moves exist in the vault — Whirlpool (DB 4, Water, Special), Sand Tomb (DB 4, Ground, Physical), Fire Spin (DB 4, Fire, Special). They share the same DB but differ in type and damage class, which affect the damage calculation (type effectiveness, STAB, Atk vs SpAtk).

VortexInstance needs at minimum:
- `sourceMoveId: string` — to look up the move's type, damage class, and DB for per-turn damage calculation
- OR `damageSpec: { db: number, type: Type, damageClass: DamageClass }` — embedded at creation time

Without one of these, the engine can't resolve Vortex per-turn damage. It knows a vortex exists on the target but doesn't know what damage to deal or what type it is.

Additionally, does a Vortex have a duration? The struct has no `roundsRemaining` or similar field. If Vortexes are indefinite until escape or caster switch, that should be explicitly stated and consistent with the PTR rules.

---

#### ISP Decomposition Problems

---

##### 26. Sub-interfaces don't encode the read/write boundary that combatant-as-lens requires

The 15 entity sub-interfaces (HasIdentity, HasTypes, HasStats, HasCombatStages, HasHealth, etc.) mix entity-sourced and lens-sourced fields without distinguishing them:

| Sub-interface | Entity-sourced (read-only) | Lens-sourced (read-write) |
|---|---|---|
| `HasTypes` | types[] | — |
| `HasStats` | stats (7 individual stats) | — |
| `HasCombatStages` | — | combatStages (7 stages) |
| `HasHealth` | — | hpDelta, tempHp, injuries |
| `HasHealth` (derived) | maxHp (from entity stats) | — |
| `HasMoves` | moves[] | — |
| `HasTraits` | traits[] | — |
| `HasPosition` | — | position |

The lens/entity boundary is the core architectural invariant — observation 1 calls it the most important finding. But the sub-interfaces don't encode it. An effect atom that consumes `HasHealth` gets `hpDelta` (writable) and `maxHp` (read-only, derived from entity stats) through the same interface. Nothing in the type system prevents an effect from trying to write to `maxHp`.

Per `interface-segregation-principle.md` and `dependency-inversion-principle.md`: the abstraction should enforce the contract, not just describe it. If the lens/entity boundary is "the most important finding," it should be type-level, not documentation-level.

Options:
1. **Tag sub-interfaces as read-only or read-write.** `HasTypes extends ReadOnly`, `HasCombatStages extends ReadWrite`. Effects declare which read-write interfaces they need.
2. **Split mixed interfaces.** `HasHealth` becomes `HasHealthState` (lens: hpDelta, tempHp, injuries) + `HasMaxHp` (entity-derived: maxHp). Effects that only read HP maximum don't get write access to HP delta.
3. **Return type enforcement.** Effect functions return a `StateDelta` that can only contain lens fields. The engine applies deltas to the lens. Entity fields aren't in the delta type, so they can't be mutated.

Option 3 is most consistent with the lens model — effects produce deltas, not mutations.

---

##### 27. HasBuffTracking is a self-acknowledged ISP violation

The post proposes this sub-interface:
```
HasBuffTracking: flashFireBonus, healBlocked, boundTo, ...
```

Then observation 4 immediately says: "This may need a generic `activeEffects: EffectInstance[]` rather than named fields."

This is an ISP violation *discovered and acknowledged within the same post*. Three named fields for three definitions from the 45-sample. When the remaining 337 moves and 182 traits are defined, how many more named fields appear? Each timed buff, persistent debuff, and effect-specific tracking state becomes a new field. The sub-interface grows unboundedly — the opposite of "narrow interfaces for narrow consumers."

Three documented smells converge here:
- `[[large-class-smell]]` — HasBuffTracking will accumulate fields as definitions scale, becoming a bloated grab bag with unclear primary purpose.
- `[[divergent-change-smell]]` — every new effect-specific tracking state (a new trait, a new move with persistent state) requires modifying HasBuffTracking. One interface, many unrelated change vectors.
- `[[temporary-field-smell]]` — most named fields are only meaningful when their specific effect is active. `flashFireBonus` is empty for every entity that doesn't have Flash Fire. `boundTo` is empty unless Destiny Bond is in play. Fields that are "only populated under certain circumstances and remain empty or unused the rest of the time."

The observation IS the finding. The state inventory should commit to the generic model now, not defer it to a future observation:
```
HasActiveEffects {
  activeEffects: ActiveEffect[]
}

ActiveEffect {
  effectId: string              // Which effect definition created this
  sourceEntityId: string        // Who applied it
  state: Record<string, unknown> // Effect-specific mutable state
  expiresAt?: { round: number } | { onEvent: EventType }
}
```

Flash Fire becomes `{ effectId: 'flash-fire-boost', state: { bonusDamage: 5 }, expiresAt: { round: currentRound } }`. Heal Block becomes `{ effectId: 'heal-block', state: {} }`. Destiny Bond becomes `{ effectId: 'destiny-bond', state: { boundTo: ['entity-123'] }, expiresAt: { onEvent: 'user-turn-end' } }`.

This is what `trait-composed-domain-model.md` calls for — composable, open-ended state — and it's the only model that doesn't violate ISP as definitions scale from 45 to 579.

---

##### 28. The coverage verification is circular — and the harder question is untested

The post verifies that the 45 definitions cover all ~20 atoms, ~5 resolution modifiers, and 7 composition patterns. But the 45 definitions were HAND-SELECTED specifically to provide this coverage (per the Ring 0 exit criterion from finding 18). Of course they cover everything — definitions that didn't contribute coverage wouldn't have been selected.

The real validation isn't "do the 45 definitions cover all atoms?" It's: **"can the atoms and composition patterns actually compose to express each definition?"**

The state inventory tells us what state each definition reads and writes. It does NOT show a single definition composed from atoms. For example, Thunderbolt should compose as something like:

```
Thunderbolt = Sequence(
  DealDamage({ formula: standardDamage }),
  Conditional(
    { check: 'accuracyRoll', operator: '>=', value: 19 },
    ApplyStatus({ condition: 'Paralyzed', target: 'moveTarget' })
  )
)
```

No definition in the post is expressed this way. The claim "the atoms compose correctly" is an untested assertion. The state inventory answers "what state is needed" but not "can the engine produce the right state changes from the atom vocabulary."

This is explicitly the next step ("synthesize into formal GameState interface"), but the post's coverage verification section presents itself as validation when it's actually just a selection audit. The verification should be relabeled or deferred to the actual composition step.

---

#### Summary of findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 21 | Thief writes entity state — observation 1 is wrong | **Correctness** — lens/entity boundary has at least one exception | Contradiction |
| 22 | BlessingInstance uses prose string for mechanical effect | **Design smell** — `[[primitive-obsession-smell]]` + `[[single-source-of-truth]]` violation | Contradiction |
| 23 | Status/volatile conditions missing source tracking | **Completeness** — PTR rules require source tags for cure reversal, recall re-application, CS coupling | Missing state |
| 24 | No deployment model (bench, reserve, fainted) | **Completeness** — switching, Roar, faint handling all require it | Missing state |
| 25 | VortexInstance missing damage, type, and move reference | **Completeness** — can't resolve per-turn Vortex damage without it | Missing state |
| 26 | Sub-interfaces don't encode read/write boundary | **Design** — core architectural invariant isn't type-level | ISP decomposition |
| 27 | HasBuffTracking is self-acknowledged ISP violation | **Design** — `[[large-class-smell]]` + `[[divergent-change-smell]]` + `[[temporary-field-smell]]` | ISP decomposition |
| 28 | Coverage verification is circular; composition untested | **Process** — validates selection, not composability | ISP decomposition |

---

#### Additional Smell Findings

Four additional smells found in the state inventory, cross-referenced to the SE vault.

---

##### 29. Trainer entity reproduces `[[alternative-classes-with-different-interfaces-smell]]`

The post defines Pokemon entity state across 13+ named fields with detailed "read by" annotations. Trainer gets one line:

> `id, name, stats, skills, traits, equipment, inventory` — parallel structure, subset of fields

The documentation vault's own `entity-shared-field-incompatibility.md` documents this *exact* problem in the current app — Pokemon and HumanCharacter share field names (`capabilities`, `skills`) with structurally incompatible types. It links to `[[alternative-classes-with-different-interfaces-smell]]`: "Two classes that perform identical functions but expose different method names." The post's sub-interfaces (HasTypes, HasMoves, HasEnergy, HasCombatStages, etc.) were all derived from Pokemon combat needs. Which of them does a Trainer implement?

- `HasTypes`? Do trainers have types in PTR?
- `HasMoves`? Trainers don't use moves — they use items, skills, combat maneuvers.
- `HasEnergy`? Do trainers have energy/stamina?
- `HasCombatStages`? Can trainers receive combat stage buffs/debuffs?
- `HasMovement`? Trainers on the grid need movement, but do they have movement types (Flier, Phaser)?

"Parallel structure, subset of fields" hand-waves exactly the question the sub-interfaces exist to answer. The ISP decomposition can't be validated until both entity types are mapped to their sub-interfaces. If Trainer implements HasMoves but has an empty array, that's `[[refused-bequest-smell]]`. If Trainer doesn't implement HasMoves, then effects targeting "all entities with moves" exclude trainers — which may or may not be correct.

**Impact:** The entity state section needs Trainer fields enumerated at the same level of detail as Pokemon, with explicit sub-interface mapping for both. Per `combat-entity-base-interface.md`: "include only the fields that are genuinely type-compatible."

---

##### 30. Field state instance structs are `[[data-class-smell]]` exhibiting `[[feature-envy-smell]]`

All four field state instance structs (HazardInstance, BlessingInstance, CoatInstance, VortexInstance) are pure data containers — fields only, no behavior. Per `[[data-class-smell]]`: "A class that contains only fields and crude methods for accessing them, serving as a passive data container for other classes to manipulate."

The effect engine will reach into these to:
- Check HazardInstance layers and type for Toxic Spikes severity
- Decrement BlessingInstance activation counters on voluntary use
- Resolve CoatInstance trigger timing for turn-start heals
- Calculate VortexInstance per-turn damage (finding 25)

This is textbook `[[feature-envy-smell]]`: "A method that accesses the data of another object more than its own." Per `[[tell-dont-ask]]`: "push behavior to the data owner." The decrement-and-check-exhaustion logic for Blessings belongs on BlessingInstance, not scattered across the engine.

**Impact:** Each instance struct should own its lifecycle behavior: `BlessingInstance.activate()` decrements and returns whether exhausted. `HazardInstance.triggerEffect(entity)` resolves based on layers and type. This keeps behavior with data and prevents the engine from becoming an anemic orchestrator of data classes.

---

##### 31. Ring 4 fields on the lens are `[[speculative-generality-smell]]`

The combat lens (section 2) includes:

> `mountedOn / riddenBy: string | null` — Mounting rules (Ring 4)
> `engagedWith / wieldedBy: string | null` — Living weapon (Ring 4)

These are Ring 4 fields in a Ring 0 design. They will be null for every entity in Rings 0, 1, 2, 3A, 3B, and 3C. Per `[[speculative-generality-smell]]`: "Unused classes, methods, fields, or parameters created 'just in case' for anticipated future needs. Code should solve today's problem."

Including them now means every sub-interface consumer, every lens creation, every lens serialization, and every test must account for nullable fields that won't have values until Ring 4. This is four `[[temporary-field-smell]]` instances that are "temporary" for the entire project until Ring 4.

**Impact:** Remove Ring 4 fields from the R0 state inventory. They'll be added to the lens when Ring 4 is designed. The state inventory should reflect Ring 0's exit criterion, not the project's full scope.

---

##### 32. `entityType` discriminator invites `[[switch-statements-smell]]`

The combat lens includes `entityType: 'pokemon' | 'trainer'`. This is a type discriminator — its purpose is to let consumers branch on entity type. Per `[[switch-statements-smell]]`: "Complex switch operators or long sequences of if statements that branch on object type. This pattern typically indicates that polymorphism should be used instead."

The sub-interfaces (HasTypes, HasMoves, HasStats, etc.) exist precisely to replace type-checking with capability-checking. An effect atom should depend on `HasStats & HasCombatStages`, not check `if (entityType === 'pokemon')`. But `entityType` on the lens invites the shortcut — and once the field exists, it will be used.

Per `[[replace-conditional-with-polymorphism]]` and `[[open-closed-principle]]`: adding a third entity type (e.g. wild Pokemon with different combat behavior, or an object/construct) would require updating every `entityType` switch. If the system depends on sub-interfaces instead, a new entity type just implements the interfaces it supports.

**Impact:** Consider whether `entityType` belongs on the lens at all. If it's needed for display purposes (rendering a Pokemon card vs. a trainer card), it should be on the entity, not the lens. The lens should be entity-type-agnostic — defined entirely by which sub-interfaces it satisfies.

---

#### Updated summary of findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 21 | Thief writes entity state — observation 1 is wrong | **Correctness** — lens/entity boundary has at least one exception | Contradiction |
| 22 | BlessingInstance uses prose string for mechanical effect | **Design smell** — `[[primitive-obsession-smell]]` + `[[single-source-of-truth]]` violation | Contradiction |
| 23 | Status/volatile conditions missing source tracking | **Completeness** — PTR rules require source tags for cure reversal, recall re-application, CS coupling | Missing state |
| 24 | No deployment model (bench, reserve, fainted) | **Completeness** — switching, Roar, faint handling all require it | Missing state |
| 25 | VortexInstance missing damage, type, and move reference | **Completeness** — can't resolve per-turn Vortex damage without it | Missing state |
| 26 | Sub-interfaces don't encode read/write boundary | **Design** — core architectural invariant isn't type-level | ISP decomposition |
| 27 | HasBuffTracking is self-acknowledged ISP violation | **Design** — `[[large-class-smell]]` + `[[divergent-change-smell]]` + `[[temporary-field-smell]]` | ISP decomposition |
| 28 | Coverage verification is circular; composition untested | **Process** — validates selection, not composability | ISP decomposition |
| 29 | Trainer entity is a one-liner; sub-interface mapping unstated | **Design** — `[[alternative-classes-with-different-interfaces-smell]]`, reproduces `entity-shared-field-incompatibility.md` | Smell audit |
| 30 | Field state instance structs are pure data, engine will envy them | **Design** — `[[data-class-smell]]` + `[[feature-envy-smell]]` + `[[tell-dont-ask]]` violation | Smell audit |
| 31 | Ring 4 fields on Ring 0 lens | **Design** — `[[speculative-generality-smell]]` + `[[temporary-field-smell]]` | Smell audit |
| 32 | `entityType` discriminator invites type-branching | **Design** — `[[switch-statements-smell]]` + `[[open-closed-principle]]` violation | Smell audit |

#### What the post gets right

The state inventory is thorough work — 9 state domains derived from 45 concrete definitions, not from abstract speculation. The 45 definitions themselves are well-chosen (each covers a distinct mechanical pattern). The four field state types (Coat, Blessing, Hazard, Vortex) are correctly modeled with distinct lifecycle rules, confirming finding 14's prediction. The resolution context (section 8) properly addresses finding 20 with 5 input categories. Move definition properties as a separate read-only data layer (section 9, observation 6) is architecturally clean.

The most important finding is **23 (source tracking)**. The PTR vault has an entire subsystem (`condition-source-tracking`, `status-cs-auto-apply-with-tracking`, `recall-clears-then-source-reapplies`) built around tracking WHO applied a condition. Without this in the state inventory, Take a Breather, recall, and cure mechanics can't work correctly. This isn't a future concern — it's load-bearing state for every-session mechanics.

The most actionable finding is **27 (HasBuffTracking → generic active effects)**. The post already contains the answer in its own observation 4. Converting to a generic model now prevents the sub-interface from accreting named fields as more definitions are added.

**Status:** Adversarial review of R0.A state inventory complete. Twelve findings: one correctness issue (Thief), one design smell (BlessingInstance string), three missing state domains (source tracking, deployment model, vortex damage), two ISP problems (read/write boundary, buff tracking scaling), one process observation (circular coverage verification), four additional smell findings (Trainer interface gap, data class instances, speculative Ring 4 fields, entityType discriminator). Decisions posted below.

---

### 2026-03-26 — Decisions on Adversarial Review (Findings 21–32)

Ten of twelve findings accepted. One pushed back on, one relabeled.

---

#### Must-fix before formal GameState interface

| # | Finding | Decision |
|---|---|---|
| 23 | Status/volatile conditions missing source tracking | **Accepted.** Add `EffectSource` to every condition instance. Proposed struct accepted: `StatusInstance { condition, source, appliedCombatStages }`. Without source tracking, Take a Breather, recall, and cure mechanics can't resolve. This is every-session state, not an edge case. |
| 24 | No deployment model (bench, reserve, fainted) | **Accepted.** Add per-trainer deployment state: `{ active: EntityId[], reserve: EntityId[], fainted: EntityId[] }`. Lives on trainer entity or encounter state, not on the lens — reserve Pokemon don't have lenses. Required for switching, Roar, faint replacement, and action presentation. |
| 21 | Thief writes entity state — observation 1 is wrong | **Accepted — option 2 with refinement.** The lens/entity boundary is not absolute. Certain effects (Thief, and potentially XP distribution) write entity state. The model becomes: "entity is read-only during combat *except* for explicitly tagged entity-write effects." Tag such effects with `entityWrite: true` in the effect definition; the engine explicitly permits the write. This avoids the complexity of lens overrides (`heldItemOverride` + reconciliation at encounter end + every item-reading effect checking override first). The boundary remains enforceable — just not absolute. Observation 1 is corrected to: "the entity is *mostly* read-only during combat, with inventory mutation as a documented, engine-permitted exception." |
| 27 | HasBuffTracking is self-acknowledged ISP violation | **Accepted.** Commit to the generic model now. Replace `HasBuffTracking` with `HasActiveEffects { activeEffects: ActiveEffect[] }`. Proposed struct accepted: `ActiveEffect { effectId, sourceEntityId, state: Record<string, unknown>, expiresAt }`. Flash Fire, Heal Block, Destiny Bond all become instances of this generic model. This also resolves finding 22 — BlessingInstance's `effectDescription: string` is replaced by an `activationEffect: EffectDefinitionRef` since the generic model expects all mechanical behavior to reference effect definitions, not prose strings. |

---

#### Apply during formal GameState interface design

| # | Finding | Decision |
|---|---|---|
| 26 | Sub-interfaces don't encode read/write boundary | **Accepted — option 3.** Effects return `StateDelta` that can only contain lens fields. The engine applies deltas to the lens. Entity fields aren't in the delta type, so they can't be mutated (except for tagged entity-write effects per finding 21). This is the most consistent model with combatant-as-lens and eliminates the read/write problem at the type level. |
| 31 | Ring 4 fields on Ring 0 lens | **Accepted.** Remove `mountedOn`, `riddenBy`, `engagedWith`, `wieldedBy` from the R0 state inventory. They'll be added when Ring 4 is designed. No reason to carry nullable fields through 4 rings. |
| 32 | `entityType` discriminator invites type-branching | **Accepted.** Move `entityType` to the entity, remove from the lens. The lens is entity-type-agnostic — defined entirely by which sub-interfaces it satisfies. Display code reads `entityType` from the entity when rendering Pokemon cards vs trainer cards. Effects depend on capability interfaces (HasStats, HasMoves, etc.), not type checks. |

---

#### Requires PTR vault check

| # | Finding | Decision |
|---|---|---|
| 29 | Trainer entity is a one-liner; sub-interface mapping unstated | **Accepted — deferred to PTR vault check.** The finding is correct: the trainer entity needs the same level of detail as Pokemon, with explicit sub-interface mapping. But the answers depend on PTR rules — do trainers have combat stages? Types? Energy? This is a "stop and look in the PTR vault" moment. Will enumerate trainer fields and sub-interface mapping after consulting the vault. |
| 25 | VortexInstance missing damage, type, and move reference | **Accepted.** Add `sourceMoveId: string` to VortexInstance (reference the move definition for type, damage class, DB). Also add `roundsRemaining: number | null` — if Vortexes are indefinite until escape, state that explicitly; if they have a duration, track it. Verify duration rules against PTR vault. |

---

#### Pushed back

##### 30. Field state instance structs as data classes — kept as data

The review recommends pushing lifecycle behavior onto instance structs (`BlessingInstance.activate()`, `HazardInstance.triggerEffect()`). With finding 26 accepted (effects return `StateDelta`, engine applies), this recommendation conflicts — if the engine produces deltas, then `BlessingInstance.activate()` doesn't belong on the instance. The instance is state. The engine reads state, produces a delta, and the delta is applied.

Data classes are a smell when they have no behavioral home. Here the behavioral home is explicitly the effect engine, which owns all state transformations via the delta model. Keeping instances as pure data is consistent with the architecture.

**Decision: pushed back.** Instance structs remain pure state. The effect engine owns lifecycle behavior through delta production.

---

#### Relabeled

##### 28. Coverage verification — relabeled from "verification" to "selection audit"

The review is correct that the coverage check validates selection diversity, not composability. The composability test is the next step — writing real compositions (e.g. the Thunderbolt `Sequence(DealDamage, Conditional(ApplyStatus))` example). The section should be relabeled from "Coverage Verification" to "Selection Audit" and the actual composability validation happens when effect definitions are written as TypeScript constants.

**Decision: relabeled.** Not a blocker — the next step (formal GameState interface + first compositions) is the real composability test.

---

#### What changes in the state inventory

**Structs modified:**
- `StatusInstance` gains `{ condition, source: EffectSource, appliedCombatStages }` — source tracking for cure reversal and recall re-application
- `VortexInstance` gains `sourceMoveId: string` and `roundsRemaining: number | null` — per-turn damage resolution and duration
- `BlessingInstance.effectDescription: string` replaced by `activationEffect: EffectDefinitionRef` — single source of truth for mechanical behavior

**Sub-interfaces changed:**
- `HasBuffTracking` → `HasActiveEffects { activeEffects: ActiveEffect[] }` — generic, open-ended effect tracking
- `entityType` moved from lens to entity — lens is type-agnostic

**New state added:**
- Per-trainer `deploymentState: { active, reserve, fainted }` — deployment model for switching, Roar, faint replacement

**Fields removed from R0:**
- `mountedOn`, `riddenBy`, `engagedWith`, `wieldedBy` — Ring 4 concerns

**Architecture decision:**
- Effects return `StateDelta` (lens fields only). Engine applies deltas. Entity-write effects tagged explicitly. Instance structs remain pure data.

**Deferred:**
- Trainer sub-interface mapping — pending PTR vault check
- VortexInstance duration — pending PTR vault check

**Status:** All 12 findings resolved (10 accepted, 1 pushed back, 1 relabeled). State inventory amendments defined. PTR vault checks posted below.

---

### 2026-03-26 — PTR Vault Check: Trainer Combat Capabilities

Checked 12 vault notes to determine which sub-interfaces trainers implement. Result: trainers are near-identical to Pokemon in combat capability. The state inventory's one-liner ("parallel structure, subset of fields") was wrong — it's not a subset, it's almost the full set.

---

#### Evidence from PTR vault

| Source | What it says |
|---|---|
| `six-trainer-combat-stats.md` | Trainers have 7 combat stats: HP, Atk, Def, SpAtk, SpDef, Spd, Stamina. All derived traits (HP formula, evasion, damage) flow from these. |
| `trainers-are-typeless.md` | Trainers have no type. Skip type effectiveness step entirely. No STAB. All attacks deal neutral damage. |
| `only-pokemon-have-levels.md` | Trainers have no levels. No level component in any formula. |
| `trainer-hp-formula.md` | Trainer Health = (HP stat × 3) + 10. Different formula from Pokemon but same lens fields (hpDelta, tempHp, injuries). |
| `trainer-move-list.md` | Trainers CAN unlock moves from the universal move pool, same as Pokemon. There is no separate trainer move list. |
| `trainers-are-human-species.md` | Human species defines base stats, movement, and size. |
| `trainer-size-medium-default.md` | Medium size, WC 3–5 depending on weight. |
| `combat-stage-asymmetric-scaling.md` | CS applies to Atk, Def, SpAtk, SpDef, Spd. See-also links to `six-trainer-combat-stats.md` — trainers receive combat stages. |
| `stamina-stat.md` | Stamina derives Energy. Links to `six-trainer-combat-stats.md` — trainers have Energy. |
| `action-economy-per-turn.md` | Each combatant (trainer or Pokemon) gets Standard + Movement + Swift + Free. |
| `two-turns-per-player-per-round.md` | Trainer and each active Pokemon are separate combatants with separate turns. |
| `fainted-at-zero-hp.md` | "A Pokemon **or Trainer** at 0 HP or lower is Fainted." Trainers can faint. |
| `death-at-ten-injuries-or-negative-hp.md` | "A Pokemon **or Trainer** dies if..." Same death rules. |
| `combat-maneuvers-use-opposed-checks.md` | Both trainers and Pokemon use combat maneuvers. Trainers also have exclusive **Manipulate maneuvers** (Bon Mot, Flirt, Terrorize) using social skills. |
| `mounting-and-mounted-combat.md` | Trainers can mount Pokemon (Standard Action, DC 10 check). |
| `energy-for-extra-movement.md` | "A character" can spend 5 Energy for extra movement — applies to trainers too. |
| `movement-traits.md` | Movement traits grant X movement per mode. Humans are Landwalker (implied by species). |

---

#### Sub-interface mapping

| Sub-interface | Pokemon | Trainer | Notes |
|---|---|---|---|
| `HasIdentity` | Yes | Yes | |
| `HasTypes` | Yes | **No** | Trainers are typeless. Skip type effectiveness, no STAB. This is the ONE interface trainers don't implement. |
| `HasStats` | Yes | Yes | Same 7 stats (HP, Atk, Def, SpAtk, SpDef, Spd, Stamina) |
| `HasCombatStages` | Yes | Yes | Same 7 stages |
| `HasHealth` | Yes | Yes | Different HP formula, same lens fields |
| `HasEnergy` | Yes | Yes | Stamina → Energy, same mechanics |
| `HasStatus` | Yes | Yes | Trainers can be statused, fainted |
| `HasPosition` | Yes | Yes | On the grid |
| `HasInitiative` | Yes | Yes | Own turn in initiative |
| `HasActions` | Yes | Yes | Standard + Movement + Swift + Free |
| `HasInventory` | Yes | Yes | Held items, equipment, usable items |
| `HasMovement` | Yes | Yes | Landwalker (Human species); can gain others via traits |
| `HasMoves` | Yes | Yes | Universal move pool — trainers unlock moves too |
| `HasTraits` | Yes | Yes | Trainers can have traits |
| `HasActiveEffects` | Yes | Yes | Can receive buffs/debuffs |
| `HasPersistentResources` | Yes | Maybe | Could have Mettle or similar persistent tracking |

---

#### Architectural implication

The finding 29 concern about `[[alternative-classes-with-different-interfaces-smell]]` is resolved: **trainers and Pokemon implement the same interfaces.** The only difference is `HasTypes` — trainers don't implement it.

This means:
1. Effects that depend on `HasTypes` (STAB, type effectiveness, type immunity, absorb traits) correctly exclude trainers — they never receive `HasTypes`.
2. Every other effect atom works identically on both entity types.
3. The `entityType` discriminator (finding 32, already moved to entity) is needed ONLY for: HP formula selection, display rendering, and trainer-exclusive actions (Manipulate maneuvers, item use, Poke Ball throwing, Pokedex).
4. No `[[refused-bequest-smell]]` — trainers don't implement HasMoves with an empty array; they genuinely can have moves.

**What's different about trainers in combat (not captured by sub-interfaces):**
- **HP formula:** `(HP × 3) + 10` vs Pokemon's `HP + (Level × 3) + 10`
- **No levels:** No level component in any calculation
- **Trainer-exclusive Standard Actions:** Use items on Pokemon, throw Poke Balls, use Pokedex, Manipulate maneuvers (social combat)
- **Mounting:** Can mount as Standard Action (or Free Action with Expert+ Acrobatics/Athletics)
- **Take a Breather assist:** Can assist another combatant's Take a Breather (Full Action + Interrupt from target, DC 12 Command)

These differences live on the entity (formula selection, available actions) — not on the lens sub-interfaces.

---

### 2026-03-26 — PTR Vault Check: Vortex Duration and Mechanics

**Finding: The PTR vault has no Vortex keyword mechanic note.** This is a gap.

---

#### What the vault says

**Move stat blocks** (mechanical authority):
- Whirlpool: "Swift Action: The target is put in a Vortex."
- Sand Tomb: "Swift Action The target is put in a Vortex."
- Fire Spin: "Swift Action. The target is put in a Vortex."

All three say the same thing: apply Vortex. No duration, no damage spec, no escape mechanic.

**Move descriptions** (flavor, NOT mechanical per `move_descriptions/CLAUDE.md`):
- Fire Spin: "inflicts damage for four to five turns"
- Whirlpool: "inflicts damage for four to five turns"
- Sand Tomb: "inflicts damage for four to five turns"

**Rules notes:**
- `trapped-is-only-recall-blocker.md`: "Vortex moves (Fire Spin, Whirlpool, Sand Tomb) inflict Trapped"
- No `vortex-keyword.md` or similar exists in `rules/`

---

#### What's missing

The following Vortex mechanics are referenced or implied but never formally defined:

1. **Duration:** Flavor text says 4–5 turns. No mechanical note confirms or specifies how this is determined (fixed? rolled?).
2. **Per-turn damage:** Whirlpool's notes say "residual damage over time." What damage? Same DB as the initial hit? A fixed tick? The source move's DB/type/damage class?
3. **Escape mechanic:** How does a target escape a Vortex? Is it automatic after duration expires? Can they break out early?
4. **Caster switch behavior:** The state inventory assumed "destroyed if caster switches." No vault note confirms this.
5. **Interaction with Trapped:** `trapped-is-only-recall-blocker.md` confirms Vortex → Trapped, but does Trapped end when Vortex ends?

---

#### Recommendation

This needs a PTR vault note: `vortex-keyword.md` in `rules/`. It should define:
- Duration (how many rounds, is it a roll or fixed)
- Per-turn damage formula (DB, type, damage class — from source move or fixed)
- Escape conditions
- Caster switch/faint behavior
- Relationship to Trapped condition lifecycle

**This is a digestion gap, not a design decision.** The Vortex mechanic exists in PTR but its keyword rules haven't been formally written into the vault. The flavor text and partial references give us clues, but the mechanical authority is missing.

**Status:** Both vault checks complete. Trainer sub-interface mapping resolved — trainers implement all interfaces except HasTypes. Vortex keyword digested from PTU books below.

---

### 2026-03-26 — Vortex Keyword Digested from PTU Books

The Vortex keyword was missing from the PTR vault. Extracted from `deprecated_books/markdown/core/10-indices-and-reference.md` (line 3523) and created `vaults/ptr/rules/vortex-keyword.md`.

#### PTU source text

> Vortex: While in a Vortex, the target is Slowed, Trapped, and loses a Tick of Hit Points at the beginning of each turn. At the end of each turn, the user may roll 1d20 to end all of these effects; during the first turn, they must roll a 20 or higher to dispel the vortex. The DC is lowered by 6 each following turn, automatically wearing off on the fifth turn (20, 14, 8, 2, Dispel)

#### PTR adaptation

Tick timing changed from beginning-of-turn to end-of-turn, consistent with `persistent-tick-timing-end-of-turn.md` (Burning, Poisoned, Badly Poisoned all moved to end-of-turn in PTR).

#### Impact on finding 25 (VortexInstance)

**Finding 25 is partially wrong.** The review assumed Vortex per-turn damage was based on the source move's DB, type, and damage class. It's not — Vortex damage is a flat 1 tick of HP loss (1/10 max HP), same as burn/poison. No type effectiveness, no STAB, no damage class.

This means VortexInstance does NOT need `sourceMoveId` or `damageSpec` for damage purposes. What it DOES need:

```
VortexInstance {
  targetId: string
  casterId: string           // Destroyed if caster switches/faints
  appliesTrapped: boolean    // Blocks recall
  appliesSlowed: boolean     // Reduces movement
  turnsElapsed: number       // Tracks escape DC (20, 14, 8, 2, auto-dispel)
}
```

The escape DC is derived: `max(2, 20 - (turnsElapsed * 6))`, auto-dispelling at turn 5. No need for a stored DC field.

#### Files created/modified

- **Created:** `vaults/ptr/rules/vortex-keyword.md`
- **Updated:** `trapped-is-only-recall-blocker.md` — added backlink
- **Updated:** `slowed-halves-movement.md` — added backlink
- **Updated:** `tick-value-one-tenth-max-hp.md` — added Vortex to tick reference list
- **Updated:** `persistent-tick-timing-end-of-turn.md` — added Vortex to end-of-turn timing list
- **Updated:** `whirlpool.md`, `sand-tomb.md`, `fire-spin.md` — linked Vortex keyword

**Status:** Vortex keyword fully digested. Finding 25 revised — VortexInstance tracks escape timing, not damage specs. Both deferred vault checks now complete. Ready for formal GameState interface design.

---

### 2026-03-26 — Session Handoff

Three adversarial reviews completed (findings 1–32). All resolved. Two vault checks done. One vault gap filled.

**Next step:** Formal GameState interface design incorporating all amendments from findings 21–32. The state inventory post has the raw material; the decisions post has the corrections. Key amendments to apply:

- Source tracking on all condition instances (finding 23)
- Per-trainer deployment model (finding 24)
- Generic `ActiveEffect[]` replacing `HasBuffTracking` (finding 27, also resolves 22)
- Effects return `StateDelta`, engine applies (finding 26, option 3)
- Entity-write tagging for Thief-like exceptions (finding 21)
- Remove Ring 4 fields, move `entityType` to entity (findings 31, 32)
- Trainers implement all sub-interfaces except `HasTypes` (vault check)
- VortexInstance tracks `turnsElapsed` for escape DC, not damage specs (vault check, revises finding 25)

**Status:** Awaiting next session for R0.A formal GameState interface design.

---

### 2026-03-26 — R0.A Formal GameState Interface Design: Documentation Vault Notes

Synthesized the state inventory + all 12 finding amendments into 10 atomic documentation vault notes. Every amendment from findings 21–32 is incorporated. The design is now authoritative — it lives in the vault, not just in this thread.

---

#### Notes created (10)

| File | Content | Findings incorporated |
|---|---|---|
| `game-state-interface.md` | **Root note.** Three layers (entity, lens, encounter), ISP consumption model, relationship to lens architecture, SE principles. Links to all sub-notes. | All — serves as index |
| `combat-lens-sub-interfaces.md` | **15 Has\* sub-interfaces** for per-combatant state. Entity-sourced (read-only) vs lens-sourced (read-write) split. Full Pokemon-vs-Trainer mapping table. StatusInstance/VolatileInstance structs with source tracking. | F23 (source tracking), F27 (HasActiveEffects replaces HasBuffTracking), F29 (trainer mapping), F31 (Ring 4 removed), F32 (entityType on entity not lens) |
| `state-delta-model.md` | **How effects write.** StateDelta type containing only lens-writable fields. Engine applies. EntityWriteDelta for tagged exceptions. Three alternatives considered and rejected. | F21 (entity-write tag), F26 (option 3: deltas not mutations) |
| `active-effect-model.md` | **Generic buff/debuff tracking.** ActiveEffect struct (effectId, sourceEntityId, state, expiresAt). Flash Fire, Heal Block, Destiny Bond as examples. BlessingInstance.activationEffect replaces effectDescription string. | F22 (BlessingInstance string → ref), F27 (named fields → generic collection) |
| `field-state-interfaces.md` | **6 field state types.** Weather, terrain, hazards, blessings, coats, vortexes. Instance structs. VortexInstance uses turnsElapsed for escape DC. BlessingInstance uses EffectDefinitionRef. | F22 (BlessingInstance), F25 (VortexInstance revised per vault check) |
| `deployment-state-model.md` | **Per-trainer roster tracking.** Active/reserve/fainted arrays. Lives on encounter state. Lifecycle from encounter start through switching and faint. | F24 (deployment model) |
| `entity-write-exception.md` | **Thief exception.** Entity-write effects tagged with entityWrite: true. Narrow EntityWriteDelta type. Why lens overrides were rejected. | F21 (entity-write exception) |
| `combat-event-log-schema.md` | **CombatEvent struct.** Typed event union for historical queries (Retaliate, Destiny Bond). Round, source, target, move, damage fields. | — (from state inventory section 7) |
| `resolution-context-inputs.md` | **5 external input categories.** Accuracy rolls, damage rolls, multi-hit count, player decisions, interrupt decisions. Why inputs not generation. | F20 (resolution context) |
| `encounter-context-interfaces.md` | **3 encounter context interfaces.** HasRoundState, HasTurnOrder, HasCombatLog. | — (from state inventory section 6) |

---

#### Existing notes updated with backlinks (9)

| File | Links added |
|---|---|
| `combatant-as-lens.md` | → game-state-interface, combat-lens-sub-interfaces, state-delta-model, entity-write-exception |
| `trait-composed-domain-model.md` | → game-state-interface, combat-lens-sub-interfaces |
| `combat-entity-base-interface.md` | → game-state-interface, combat-lens-sub-interfaces |
| `condition-source-tracking.md` | → combat-lens-sub-interfaces, game-state-interface |
| `condition-source-rules.md` | → combat-lens-sub-interfaces, game-state-interface |
| `status-condition-categories.md` | → combat-lens-sub-interfaces, active-effect-model |
| `status-cs-auto-apply-with-tracking.md` | → combat-lens-sub-interfaces |
| `data-driven-rule-engine.md` | → game-state-interface, state-delta-model, resolution-context-inputs |
| `switching-system.md` | → deployment-state-model |
| `recall-clears-then-source-reapplies.md` | → deployment-state-model |

---

#### Amendment coverage verification

Every amendment from the session handoff is now in the vault:

| Amendment | Where it lives |
|---|---|
| Source tracking on all condition instances (F23) | `combat-lens-sub-interfaces.md` — StatusInstance/VolatileInstance structs |
| Per-trainer deployment model (F24) | `deployment-state-model.md` |
| HasActiveEffects replaces HasBuffTracking (F27) | `combat-lens-sub-interfaces.md` + `active-effect-model.md` |
| Effects return StateDelta (F26) | `state-delta-model.md` |
| Entity-write tagging (F21) | `entity-write-exception.md` + `state-delta-model.md` |
| Ring 4 fields removed (F31) | `combat-lens-sub-interfaces.md` — mountedOn/riddenBy/engagedWith/wieldedBy absent |
| entityType on entity not lens (F32) | `combat-lens-sub-interfaces.md` — HasIdentity note, trainer mapping table |
| Trainers implement all except HasTypes (vault check) | `combat-lens-sub-interfaces.md` — full mapping table |
| VortexInstance uses turnsElapsed (vault check) | `field-state-interfaces.md` — VortexInstance struct |

---

#### What the design says

The GameState interface is three layers:

1. **Entity state** — permanent, read-only during combat (except tagged entity-write effects). 7 entity-sourced sub-interfaces.
2. **Combat lens state** — transient, per-combatant. 8 lens-sourced sub-interfaces. Effects produce StateDelta → engine applies.
3. **Encounter state** — global. Field state (6 types), encounter context (3 interfaces), deployment state (per-trainer).

Effects are pure functions: `(sub-interfaces + resolution context) → StateDelta`. The engine is the single writer. Entity fields are excluded from StateDelta at the type level. The small exception (Thief) is tagged and uses a narrow EntityWriteDelta.

Both Pokemon and Trainers participate through the same 15 sub-interfaces. The only difference: Trainers don't implement HasTypes (they're typeless). entityType lives on the entity for display routing, not on the lens.

**Status:** R0.A formal GameState interface design complete. 10 vault notes created, 10 existing notes updated. All finding amendments incorporated. Ready for adversarial review of the formal design, or ready to proceed to the next R0 milestone.

---

### 2026-03-26 — Adversarial Review of R0.A Formal GameState Interface Design (Findings 33–42)

Reviewed all 10 vault notes against the PTR vault and the design's own SE principles. Found 10 issues — 2 high severity (wrong data model), 5 medium (incomplete specification or contradictions), 3 low-medium (inconsistencies or gaps needing clarification).

---

#### PTR Rule Violations

---

##### 33. Evasion is not a combat stage — HasCombatStages is wrong

`HasCombatStages` declares 7 stages: `atk, def, spatk, spdef, spd, accuracy, evasion`. The PTR vault says otherwise:

| Source | What it says |
|---|---|
| `combat-stage-asymmetric-scaling.md` | "This applies to Attack, Defense, Special Attack, Special Defense, and Speed only — never HP." Lists 5 stat stages. |
| `accuracy-cs-is-direct-modifier.md` | Accuracy CS is a 6th stage but uses direct addition to rolls, not the multiplier table. |
| `evasion-from-defensive-stats.md` | Evasion is DERIVED: Physical Evasion = Def/5, Special Evasion = SpDef/5, Speed Evasion = Spd/5, capped at +6. |
| `one-evasion-per-accuracy-check.md` | There are THREE evasion values, not one. Defender chooses which applies per attack. |
| `fatigue-levels.md` | Fatigue applies "−2 to Evasions" — a flat penalty, not a stage multiplier. |
| `power-and-lifting.md` | Heavy Lifting: "−2 to Evasion and Accuracy" — flat penalty, not CS. |

Three problems:
1. **Evasion is not a combat stage at all.** It's derived from stats via a formula. The design confuses "can be modified" with "is a combat stage."
2. **There are three evasion values, not one.** Physical, Special, and Speed evasion are distinct derived values. A single `evasion: number` field can't represent this.
3. **Evasion modifiers (fatigue, flanking, lifting) are flat penalties to derived values, not stage multipliers.** They operate in a different arithmetic space than combat stages.

**Impact:** Remove `evasion` from `HasCombatStages`. Evasion is a derived computation: `floor(stat / 5)` capped at 6, minus flat penalties from fatigue/flanking/etc. It belongs in the projection function (`projectCombatant`), not in mutable lens state. The flat penalty modifiers (fatigue level, flanking count) need their own tracking — possibly in `HasActiveEffects` or a new interface. Combat stages become 6 fields: `atk, def, spatk, spdef, spd, accuracy`. The mapping table's "Same 7 stages" claim should be "Same 6 combat stages."

**Severity:** High — wrong data model. Effects that try to write `combatStages.evasion` would be writing to a field that doesn't correspond to any PTR mechanic.

---

##### 34. Initiative is derived from Speed, not an independent writable field

`HasInitiative` has `initiative: number` as a lens-sourced field written via `StateDelta`. The PTR vault says initiative is derived:

| Source | What it says |
|---|---|
| `dynamic-initiative-on-speed-change.md` | "Initiative immediately recalculates when Speed combat stages change mid-encounter (Paralysis, Agility, stat stage moves)." |
| `two-turns-per-player-per-round.md` | "Each combatant... has its own turn in the initiative order based on its Speed stat." |
| `full-contact-simple-initiative.md` | Initiative derived from Speed. |

Initiative is computed from `entity.stats.spd` + speed combat stage multiplier. It recalculates automatically when speed CS changes. The current design stores `initiative: number` as a flat field with no mechanism for auto-recalculation when `combatStages.spd` changes.

Quash and After You override initiative temporarily. But the normal case is derivation, not storage.

**Impact:** Initiative should be a derived value (like evasion) with an override mechanism for Quash/After You. The engine needs a hook that recalculates turn order whenever `combatStages.spd` changes — otherwise Agility granting +2 Speed CS has no effect on turn order until the next round, violating `dynamic-initiative-on-speed-change.md`. The `HasInitiative` interface might become:

```
HasInitiative {
  initiativeOverride: number | null   // Quash sets this to 0; null = use derived
  actedThisRound: boolean
}
```

With derived initiative = `effectiveStat(entity.stats.spd, lens.combatStages.spd)` when override is null.

**Severity:** High — the design breaks a core PTR mechanic (dynamic initiative). Speed-altering moves and conditions would feel disconnected from turn order.

---

#### StateDelta Model Problems

---

##### 35. Engine application rules are incomplete

The `state-delta-model.md` defines 5 application rules. Several fields don't fit:

| Field | Stated rule | Actual need | Problem |
|---|---|---|---|
| `initiative` | "Numeric deltas are additive" | Quash: set to 0 (replacement) | Additive doesn't work — if current initiative is 15, `delta.initiative = -15` is fragile |
| `actedThisRound` | No rule for booleans | Set to true/false | Booleans need replacement, not addition |
| `tempHp` | "Numeric deltas are additive" | Most systems: take higher value, don't stack | Additive would let two temp HP sources stack, which may violate PTR rules |
| `energyCurrent` | "Numeric deltas are additive" | Correct (subtract cost / add recovery) | Fine, but name suggests absolute value, not delta — `energyDelta` would be clearer |

The rules also don't cover `HasPersistentResources` at all (see finding 36). Take a Breather needs "set combatStages to all zeros" and "set tempHp to 0" — both are reset operations, not additive deltas.

**Impact:** The engine needs at least 4 application modes: additive (damage, energy, injuries), additive-with-clamp (combat stages), replacement (position, booleans, overrides), and reset (Take a Breather). The current specification is [[incomplete-library-class-smell]] — it handles the common case but not the edge cases that actually matter for correctness.

**Severity:** Medium — the architecture is sound, but the spec is underspecified. An implementer would have to invent solutions for every non-additive field.

---

##### 36. HasPersistentResources has no delta path

`HasPersistentResources` is listed as a lens-sourced (read-write) interface:

```
mettlePoints: number
stealthRockHitThisEncounter: boolean
```

Neither field appears in `StateDelta`. Effects that spend Mettle points or trigger Stealth Rock entry damage have no way to write these fields through the delta model. This is a gap — either:
1. These fields need to be added to `StateDelta` (with appropriate application modes — additive for mettle, replacement for the boolean), or
2. These fields are engine-managed (the engine writes them directly, not via effect deltas) — but then the "engine is the single writer via deltas" contract is violated.

**Severity:** Medium — two fields with no write path.

---

#### Missing State

---

##### 37. Fatigue has no home in the sub-interface system

Fatigue is a stacking condition with its own dedicated category in PTR:

| Source | What it says |
|---|---|
| `fatigued-is-its-own-condition-category.md` | "Classified in its own standalone category — separate from Persistent, Volatile, and Other." |
| `fatigue-levels.md` | Stacking: per level, −2 attack rolls, −2 Evasions, −2 movement. 5 levels = unconscious. |
| `zero-energy-causes-fatigue.md` | Gained from reaching 0 Energy. |
| `take-a-breather-recovers-fatigue.md` | Take a Breather recovers 1 level. |

`HasStatus` has `statusConditions: StatusInstance[]` and `volatileConditions: VolatileInstance[]`. Fatigue fits neither — the vault explicitly says it's a separate category. There's no `fatigueLevel` field anywhere in the 15 sub-interfaces or in `StateDelta`.

Fatigue affects three derived computations: attack rolls (accuracy check modifier), evasion values (flat penalty to all three), and movement speeds (flat reduction). Without tracking fatigue level on the lens, none of these derived effects can be computed.

**Impact:** Either add `fatigueLevel: number` to `HasStatus` (expanding it to cover the third condition category) or create a dedicated interface. It needs a delta path in `StateDelta` and needs to feed into the evasion derivation (finding 33) and attack roll modification.

**Severity:** Medium — a PTR condition with no state representation.

---

##### ~~38. Free Actions and action downgrade missing from HasActions~~ — RETRACTED

Retracted. Free actions exist in two flavors — voluntary (drop held item, become visible, mount with Expert+, send-out replacement) and triggered (Disable, Endure, Feint — "once per trigger"). Neither needs lens state: voluntary free actions are unlimited with no budget, triggered ones are constrained per-resolution-event (transient engine state) and limited by energy cost (already in `HasEnergy`). Action downgrade is a validation rule — the engine adjusts budget counts directly. The `HasActions` budget fields can represent all outcomes.

**Note:** The design's action model should acknowledge free actions exist as a fourth action category, even if no state field is needed. Currently `HasActions` is silent on them, which could confuse an implementer into thinking they were forgotten.

---

#### Design Contradictions

---

##### 39. ActiveEffect.state is untyped — contradicts compile-time safety claims

`ActiveEffect` uses `state: Record<string, unknown>` for effect-specific data. The note says "each effect definition documents what keys it stores." This is documentation-enforced typing.

The same design invokes `[[primitive-obsession-smell]]` against BlessingInstance's `effectDescription: string` and replaces it with a typed reference. It also claims StateDelta excludes entity fields "making accidental entity mutation a compile-time error."

But `Record<string, unknown>` is the most primitive type possible — it's `Map<string, any>`. An effect that reads `state.bonusDamage` gets `unknown` back. An effect that writes `state.typo = 5` compiles fine. The design trades one smell (named fields that grow unboundedly — `[[large-class-smell]]`, `[[divergent-change-smell]]`) for another (untyped bag of properties — `[[primitive-obsession-smell]]`).

**Impact:** This is a genuine design tension with no clean solution at this stage. The active-effect-model note correctly identifies why named fields don't scale. But the replacement sacrifices the compile-time safety the design champions elsewhere. Possible mitigation: make `ActiveEffect` generic — `ActiveEffect<T extends Record<string, unknown>>` — so each effect definition constrains its own state shape. The collection would use a union type or a discriminated union keyed by `effectId`. Worth noting, not necessarily worth solving in R0.

**Severity:** Medium — philosophical contradiction. The design correctly identifies the problem space but the solution undermines its own stated principles.

---

##### 40. Field state source tracking is inconsistent

The design emphasizes source tracking (finding 23 required it on all condition instances). But field state types are inconsistent:

| Instance type | Has source tracking? | Notes |
|---|---|---|
| StatusInstance | Yes — `source: EffectSource` | Correct |
| VolatileInstance | Yes — `source: EffectSource` | Correct |
| VortexInstance | Yes — `casterId: string` | Correct |
| CoatInstance | Partial — `entityId: string` | Tracks the TARGET, not who cast it. Aqua Ring is self-cast so this works, but what about coats applied by allies? |
| HazardInstance | No — only `ownerSide: Side` | No individual source. If a trait triggers "when your hazard is removed," there's no `sourceEntityId` to check. |
| BlessingInstance | No — only `teamSide: Side` | Same gap as hazards. |
| WeatherInstance | No | No source at all. If "when your weather is replaced" matters, no data to check. |
| TerrainInstance | No | Same as weather. |

The design principle from finding 23 was: source tracking enables cure reversal, attribution, and caster-switch destruction. Vortex correctly implements this (destroyed on caster switch/faint). But if a trainer who set up Stealth Rock switches out, should the hazard persist? (Yes — hazards aren't caster-dependent.) So maybe hazards don't need source tracking. But the inconsistency should be acknowledged as a deliberate choice, not an oversight.

**Severity:** Low-Medium — not all field types need source tracking, but the design should state WHY some do and some don't, rather than leaving it implicit. The CoatInstance gap (target but not caster) is the most concerning.

---

#### Maintenance Issues

---

##### 41. combatant-as-lens.md contradicts the formal design

The `combatant-as-lens.md` note is listed as the "architectural foundation" and linked from 4 of the 10 new notes. But its code examples contradict the formal design:

| combatant-as-lens.md says | Formal design says | Finding |
|---|---|---|
| `CombatLens.entityType: 'pokemon' \| 'trainer'` (line 45) | `entityType` lives on the entity, not the lens | F32 |
| `CombatLens` has `mountedOn`, `riddenBy`, `engagedWith`, `wieldedBy` (lines 63-67) | Ring 4 fields removed from R0 | F31 |
| `CombatLens` is a flat struct with ~18 fields | Lens decomposed into 15 ISP sub-interfaces | R0.A design |
| `applyDamage` returns a new lens (line 117) | Effects return StateDelta, engine applies | F26 |
| `switchPokemon` creates lens directly (line 127) | Switching goes through deployment state model | F24 |

A reader following the "See also" chain from any new note will hit `combatant-as-lens.md` and find stale code examples that contradict the current design. The prose concepts are still valid (entities don't change type, lenses are transient projections) but the code blocks are outdated.

**Impact:** The code examples in `combatant-as-lens.md` should be updated or replaced with a note directing readers to the formal sub-interface design. The note's role has shifted from "the design" to "the motivation for the design."

**Severity:** Low — maintenance, but it's the most-linked note in the architecture. Readers will be confused.

---

##### 42. BlessingInstance has no duration — activation-only expiry

`BlessingInstance` has `activationsRemaining: number` but no `roundsRemaining` or duration field. Light Screen's PTR move stat block confirms: "Light Screen may be activated 2 times, and then disappears." No duration mentioned.

This means unused Light Screen activations persist indefinitely until consumed or Defogged. This may be correct per PTR rules (activation-only, no time limit), but it differs from standard Pokemon game mechanics where screens have a turn limit. If this is an intentional PTR change, it should be noted. If it's an oversight in the PTR vault, it's a digestion gap like the Vortex keyword was.

**Impact:** Needs a PTR vault confirmation. If PTR blessings are truly activation-only with no time expiry, document this explicitly in `field-state-interfaces.md` so future readers don't assume it's a bug. If there IS a duration, add `roundsRemaining: number | null` to `BlessingInstance`.

**Severity:** Low-Medium — could be correct, needs vault confirmation.

---

#### Summary

| # | Finding | Severity | Category |
|---|---|---|---|
| 33 | Evasion is not a combat stage | High | PTR rule violation |
| 34 | Initiative is derived from Speed | High | PTR rule violation |
| 35 | Engine application rules incomplete | Medium | Underspecified |
| 36 | HasPersistentResources has no delta path | Medium | Missing state |
| 37 | Fatigue has no home | Medium | Missing state |
| ~~38~~ | ~~Free Actions / downgrade missing~~ | ~~Retracted~~ | ~~Engine logic, not state~~ |
| 39 | ActiveEffect.state is untyped | Medium | Contradiction |
| 40 | Field state source tracking inconsistent | Low-Medium | Inconsistency |
| 41 | combatant-as-lens.md is stale | Low | Maintenance |
| 42 | BlessingInstance has no duration | Low-Medium | Needs vault check |

**Status:** Adversarial review of R0.A formal design complete. 10 findings (33–42). Two high-severity PTR rule violations (evasion, initiative) require data model changes. Awaiting review before amending vault notes.

---

### 2026-03-26 — Amendments Applied: Findings 33–42

All 10 findings from the adversarial review resolved. Vault notes amended. F37 elevated to high severity (fatigue feeds into evasion derivation from F33).

---

#### F33: Evasion removed from HasCombatStages

`combat-lens-sub-interfaces.md` — `HasCombatStages` now has 6 stages: `atk, def, spatk, spdef, spd, accuracy`. Evasion section explains: three derived values (`floor(stat/5)` capped at 6), defender chooses per attack, flat penalties from fatigue/flanking. Belongs in projection, not lens. Trainer mapping table updated ("Same 6 stages").

#### F34: Initiative changed to derived + override

`combat-lens-sub-interfaces.md` — `HasInitiative` now stores `initiativeOverride: number | null` instead of `initiative: number`. Derived from `effectiveStat(entity.stats.spd, lens.combatStages.spd)` when override is null. Quash sets override to 0. After You reorders. Dynamic recalculation on Speed CS change is preserved.

#### F37: Fatigue added to HasStatus

`combat-lens-sub-interfaces.md` — `HasStatus` now includes `fatigueLevel: number`. Full documentation of fatigue as its own condition category, stacking effects (-2 attack rolls, -2 evasions, -2 movement per level), gain/recovery sources, and connection to evasion derivation.

#### F35 + F36: StateDelta application modes and missing paths

`state-delta-model.md` — `StateDelta` restructured with four application modes:

| Mode | Fields | Behavior |
|---|---|---|
| Additive | hpDelta, injuries, energyCurrent, mettlePoints, fatigueLevel | Sum |
| Additive-with-clamp | combatStages | Sum then clamp -6..+6 |
| Replacement | tempHp, position, initiativeOverride, actedThisRound, stealthRockHitThisEncounter, actionBudget, outOfTurnUsage | Overwrite |
| Mutation | statusConditions, volatileConditions, activeEffects | Add/remove ops |

Reset (Take a Breather) is a composite delta, not a fifth mode. `mettlePoints`, `stealthRockHitThisEncounter`, and `fatigueLevel` now have delta paths (previously orphaned from F36/F37).

#### F39: ActiveEffect.state tension acknowledged

`active-effect-model.md` — new "Acknowledged tension: untyped state" section. Documents the `Record<string, unknown>` tradeoff, why named fields don't scale, and the generic `ActiveEffect<T>` mitigation for post-R0.

#### F40: Source tracking rationale documented

`field-state-interfaces.md` — new "Source tracking rationale" section with table explaining why VortexInstance and CoatInstance track individual entities while HazardInstance, BlessingInstance, WeatherInstance, and TerrainInstance don't. Principle: source tracking is added when lifecycle depends on a specific entity.

#### F41: combatant-as-lens.md updated

Added prominent note directing readers to the formal sub-interface design. Preserved prose concepts (still valid). Replaced stale code examples with abbreviated versions that illustrate the motivation without contradicting the current design. Removed `entityType` from lens, removed Ring 4 fields, removed `applyDamage` returning new lens, removed `switchPokemon` creating lens directly.

#### F42: Blessing duration confirmed as activation-only

PTR vault check: all 5 blessing moves (Light Screen, Reflect, Safeguard, Mist, Lucky Chant) specify "may be activated X times, and then disappears" with no round limit. `field-state-interfaces.md` — explicit note added: PTR blessings have no time duration, `BlessingInstance` intentionally omits `roundsRemaining`.

---

#### New design principle added

`game-state-interface.md` — "Derived vs stored" section added between "How the lens relates to entities" and "External inputs." Principle: if a value can be computed from other lens/entity state, it belongs in projection, not in the lens. The lens stores only independent mutable state. Test: "If another field changes, does this value need to change too?" If yes, it's derived.

---

#### Files modified (6)

| File | Changes |
|---|---|
| `combat-lens-sub-interfaces.md` | HasCombatStages: 6 stages, evasion derivation note. HasInitiative: initiativeOverride. HasStatus: fatigueLevel. Mapping table: "Same 6 stages." |
| `state-delta-model.md` | StateDelta restructured with 4 application modes. Added mettlePoints, fatigueLevel, stealthRockHitThisEncounter, initiativeOverride. Reset as composite delta. |
| `game-state-interface.md` | New "Derived vs stored" section with evasion/initiative examples and the derivation test. |
| `active-effect-model.md` | New "Acknowledged tension: untyped state" section. |
| `field-state-interfaces.md` | New "Source tracking rationale" section. Blessing activation-only duration note. |
| `combatant-as-lens.md` | Stale code examples replaced. Prominent note directing to formal design. |

**Status:** All 10 findings (33–42) from adversarial review resolved and amended in vault. R0.A formal GameState interface design is now stable. Ready for next R0 milestone.

---

### 2026-03-26 — SE Vault Cleanup: Remove Stale Old-App Links

The SE reference notes (`vaults/documentation/software-engineering/`) contained ~70 links to old PTU-based app observations — combatant interface bloat, trigger validation switch chains, route business logic, store coupling, etc. These described the old app's problems, not general SE knowledge. With the destructive redesign, they add confusion rather than value.

**Principle:** SE notes should contain pure knowledge — pattern definitions, principle explanations, smell descriptions, technique instructions. Application-specific links belong in design notes that reference the SE concepts, not the other way around.

**What was removed:** Links to old app observations including: combatant-interface-bloat, combatant-service-mixed-domains, combatant-type-hierarchy, encounter-store-god-object-risk, next-turn-route-business-logic, out-of-turn-service-bundled-actions, trigger-validation-switch-chains, status-condition-ripple-effect, entity-union-unsafe-downcasts, entity-shared-field-incompatibility, entity-data-model-rigidity, grid-isometric-interaction-duplication, switching-validation-duplication, websocket-sync-as-observer-pattern, websocket-real-time-sync, event-sourced-encounter-state, routes-bypass-service-layer, composable-store-direct-coupling, singleton-state-coupling, ioc-container-architecture, player-action-request-optionals, pinia-store-classification, test-coverage-gaps, and ~20 more.

**What was preserved:** All SE concept cross-references (pattern↔pattern, principle↔smell, technique↔principle). Links to still-valid design notes: `trait-composed-domain-model`, `encounter-lifecycle-state-machine`.

**Special case:** `solid-violation-causal-hierarchy.md` was rewritten. The general insight (SRP+DIP are root causes → ISP/OCP/LSP are downstream symptoms) is preserved as a universal principle. Old app-specific examples removed.

#### Files modified (33)

| Category | Files |
|---|---|
| SOLID principles (6) | single-responsibility-principle, open-closed-principle, liskov-substitution-principle, interface-segregation-principle, dependency-inversion-principle, solid-violation-causal-hierarchy |
| Design patterns (11) | command-pattern, strategy-pattern, chain-of-responsibility-pattern, template-method-pattern, observer-pattern, bridge-pattern, mediator-pattern, adapter-pattern, facade-pattern, singleton-pattern, memento-pattern |
| Other principles (5) | tell-dont-ask, law-of-demeter, separation-of-concerns, composition-over-inheritance, clean-code |
| Smells (8) | shotgun-surgery-smell, long-method-smell, primitive-obsession-smell, data-class-smell, data-clumps-smell, large-class-smell, divergent-change-smell, duplicate-code-smell, refused-bequest-smell, switch-statements-smell, alternative-classes-with-different-interfaces-smell, parallel-inheritance-hierarchies-smell, feature-envy-smell |
| Techniques (2) | extract-class, extract-interface, extract-method, replace-conditional-with-polymorphism |
| Technical debt (3) | technical-debt, technical-debt-cause-missing-tests, technical-debt-cause-tight-coupling, refactoring-must-pass-tests |

**Status:** SE vault cleaned. ~70 stale old-app links removed across 33 files. SE notes now contain pure knowledge with general cross-references only. Ready for effect engine design.

---

### 2026-03-26 — R0.A Effect Engine Design: Documentation Vault Notes

Designed the effect engine — the other half of R0.A alongside the GameState interface. Six atomic vault notes covering the full evaluation architecture. Every note cross-references specific SE patterns, principles, and smells from `vaults/documentation/software-engineering/`.

---

#### SE pattern analysis (informed the design)

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

#### Notes created (6)

| File | Content | SE patterns cited |
|---|---|---|
| `effect-node-contract.md` | **The DIP pivot.** Shared `EffectNode.evaluate(context) → result` interface. `EffectContext` (ISP-filtered sub-interfaces + resolution inputs). `EffectResult` (combatant deltas + encounter delta + events + triggers). Engine as mediator. | DIP, LSP, OCP, ISP, SRP, Composite, Strategy, Mediator, Observer, Command, Tell Don't Ask, Law of Demeter |
| `encounter-delta-model.md` | **Encounter-level changes.** Companion to `state-delta-model.md`. Mutation types for weather, terrain, hazards, blessings, coats, vortexes, deployment. Each field state type has its own mutation vocabulary reflecting distinct lifecycle rules. | Command, SRP, OCP, Separation of Concerns |
| `effect-atom-catalog.md` | **15 atom types.** 11 state-producing (DealDamage, ApplyStatus, RemoveStatus, ModifyCombatStages, HealHP, ManageResource, DisplaceEntity, MutateInventory, ModifyActionEconomy, ApplyActiveEffect, ModifyMoveLegality). 2 encounter-producing (ModifyFieldState, ClearFieldState, ModifyDeployment). 2 resolution (ResolveAccuracyCheck, ResolveSkillCheck). Each declares `requires` (ISP). | Strategy, SRP, OCP, ISP, CoR, Tell Don't Ask |
| `effect-composition-model.md` | **How atoms combine.** Three categories: Flow (Sequence, Conditional, Repeat), Intervention (Replacement, CrossEntityFilter), Interaction (ChoicePoint, EmbeddedAction). Condition predicates as discriminated union — declarative data, not procedural queries. Boolean composition (and/or/not). Result merging rules. | Composite, Decorator, Strategy, OCP, Tell Don't Ask, SRP, Separation of Concerns |
| `effect-trigger-system.md` | **Event subscriptions.** TriggerDefinition (eventType, timing, condition, effect, scope). Before-triggers intercept/modify; after-triggers react. Dispatch order (priority, speed-based). Recursive trigger handling with depth limit. Trigger sources: traits (static) and active effects (dynamic). Engine as mediator. | Observer, Mediator, CoR, Decorator, Strategy, OCP, SRP, Tell Don't Ask, Separation of Concerns |
| `effect-definition-format.md` | **TypeScript constants.** MoveDefinition and TraitDefinition structs. Helper factory functions (sequence, conditional, dealDamage, etc.). 5 worked examples: Thunderbolt (status on roll), Hex (conditional DB), Sand Tomb (damage + embedded vortex), Safeguard (blessing with choice point), Volt Absorb (type-absorb before-trigger), Opportunist (action economy trait). | Data-driven-rule-engine, Factory Method, OCP, SRP, DIP, Composite, Separation of Concerns |

---

#### Existing notes updated with backlinks (8)

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

#### What the design says

The effect engine evaluates move and trait definitions expressed as composable trees of typed atoms.

**Three layers:**
1. **Atoms** (~15 types) — leaf nodes that read sub-interfaces and produce StateDelta/EncounterDelta. Each is a strategy implementing the shared EffectNode contract.
2. **Compositions** (7 types) — branch nodes that orchestrate atom evaluation: Sequence, Conditional, Repeat (flow); Replacement, CrossEntityFilter (intervention); ChoicePoint, EmbeddedAction (interaction).
3. **Triggers** — event subscriptions that activate effect trees when combat events occur. Before-triggers can intercept; after-triggers react. The engine dispatches.

**The engine mediates everything.** Effects never communicate directly. A move fires atoms → produces deltas + events → engine applies deltas → events trigger traits → traits fire atoms → more deltas. All routing through the engine.

**Definitions are data.** TypeScript constants in `@rotom/engine`. Type-safe, version-controlled, testable. Adding a new move = adding a new constant. The engine doesn't change.

---

#### R0.A completion status

| Component | Status |
|---|---|
| GameState Interface (10 notes) | Complete — 3 adversarial reviews, all findings resolved |
| Effect Engine (6 notes) | Complete — ready for adversarial review |
| R0.A exit criterion | Pending — need adversarial review of effect engine, then 45 sample definitions |

**Status:** R0.A effect engine design complete. 6 vault notes created, 8 existing notes updated. All notes cross-reference SE patterns and principles. Ready for adversarial review of the effect engine design, then the 45 sample definition content task.

---

### 2026-03-26 — Adversarial Review of R0.A Effect Engine Design (Findings 43–55)

Reviewed all 6 effect engine notes, the 4 supporting GameState notes, and the full SE vault (~220 notes). Cross-referenced worked examples against the formal contracts, checked SE principle citations against the vault definitions, and verified internal consistency across the 6 notes.

---

#### Contradictions

---

##### 43. The atom count is 16, not 15 — arithmetic error in two places

The atom catalog (effect-atom-catalog.md:163) claims "15 atoms total: 11 state-producing, 2 encounter-producing, 2 resolution." But the encounter-producing section lists three atoms: ModifyFieldState, ClearFieldState, and ModifyDeployment. 11 + 3 + 2 = 16.

The prior forum post repeats the error: "2 encounter-producing (ModifyFieldState, ClearFieldState, ModifyDeployment)" — listing three items under "2."

Minor, but the count propagates into the R0.A exit criterion (45 definitions covering all atom types). If the atom count is wrong, the coverage verification is wrong.

---

##### 44. Flash Fire is classified as an after-trigger but uses interception — which is a before-trigger mechanism

effect-trigger-system.md lists Flash Fire as: "**Flash Fire** — after-trigger on `damage-received`... The damage is absorbed (HP delta set to 0 via interception)."

But the same note defines interception as exclusively a before-trigger mechanism: "Before-triggers can modify or prevent the triggering event... If a before-trigger produces an interception flag (`{ intercepted: true }`), the engine skips applying the original event's deltas."

After-triggers fire AFTER the original deltas are applied. An after-trigger cannot "absorb" damage that has already been applied to HP. Flash Fire must be a before-trigger. The Volt Absorb example in effect-definition-format.md correctly classifies a type-absorb trait as `timing: 'before'`.

This isn't a labeling error — the dispatch order (before-triggers → original deltas → after-triggers) means a misclassified Flash Fire would let damage through, then try to "absorb" damage that's already been applied. The trait would be mechanically broken.

---

##### 45. Resolution atoms produce "result flags" that EffectResult cannot carry

effect-atom-catalog.md says ResolveAccuracyCheck "Produces: `events` (accuracy event), result flag consumed by parent Conditional node."

But EffectResult (effect-node-contract.md) is:

```
EffectResult {
  combatantDeltas: Map<EntityId, StateDelta>
  encounterDelta: EncounterDelta | null
  events: CombatEvent[]
  triggers: TriggeredEffect[]
}
```

There is no `resultFlag`, `passed`, or `success` field. The parent Sequence composition needs this flag to implement `haltOnFailure`. The Conditional composition needs it to branch on accuracy.

This is structurally important. Thunderbolt is `Sequence([ResolveAccuracyCheck, DealDamage, Conditional(...)])` with `haltOnFailure: true`. If accuracy misses, the sequence should halt before DealDamage. But nothing in the EffectResult tells the Sequence that the accuracy check failed.

Either EffectResult needs a `success: boolean` field, or the events array must be parsed for an accuracy-miss event by the parent composition (which violates [[tell-dont-ask]] — the composition would be "asking" the event log instead of receiving a direct signal).

---

#### Missing Atoms and Undocumented Concepts

---

##### 46. `interceptEvent()` and `passThrough()` are used in worked examples but absent from the atom catalog

effect-definition-format.md uses `interceptEvent()` in Volt Absorb — it sets the interception flag that prevents the original event's deltas. The same file uses `passThrough()` in Safeguard's "no" branch.

Neither appears in effect-atom-catalog.md. The catalog lists 16 atom types (per finding 43). These are atoms 17 and 18 — or they're compositions, or they're engine primitives. Whatever they are, they're undocumented. A definition author following the catalog has no way to express "intercept this event" or "do nothing."

`interceptEvent` is especially important — it's the only mechanism for before-trigger damage prevention (Protect, Wide Guard, Flash Fire, Volt Absorb). Without it formally in the catalog, the entire before-trigger interception system is underspecified.

---

##### 47. `passiveEffects` on TraitDefinition is introduced without formal design

effect-definition-format.md shows Opportunist with:

```typescript
passiveEffects: {
  struggleAttackTypeOverride: 'dark',
}
```

This is not mentioned in effect-node-contract.md, effect-trigger-system.md, or effect-atom-catalog.md. The trigger system handles reactive effects (fire when event occurs). The atom catalog handles state-changing effects. `passiveEffects` is a third category — static modifiers that are always active — with no specified evaluation mechanism.

Questions the design doesn't answer: When does the engine read `passiveEffects`? How are they applied? Can they conflict (two traits overriding the same value)? Are they typed or `Record<string, unknown>` like ActiveEffect.state?

---

##### 48. Two condition predicates used in worked examples are missing from the ConditionPredicate union

Rough Skin uses `{ check: 'incoming-move-is-contact' }`. Volt Absorb uses `{ check: 'incoming-move-type-is', type: 'electric' }`.

The ConditionPredicate union in effect-composition-model.md lists 16 check types. Neither `incoming-move-is-contact` nor `incoming-move-type-is` is among them.

These are trigger-specific predicates — they query properties of the triggering event, not general combat state. The union is designed around state queries (`target-has-status`, `weather-is`, `user-has-active-effect`), but trigger conditions need event queries (what move was used, was it contact, what type was it). The union doesn't distinguish between these two categories, and the event-query predicates were not included.

---

#### SE Principle Misapplications

---

##### 49. Discriminated unions violate OCP — but the design claims OCP

effect-composition-model.md says: "New predicate types extend the union per [[open-closed-principle]]."

In TypeScript, a discriminated union is closed by definition. Adding `{ check: 'incoming-move-is-contact' }` requires modifying the `ConditionPredicate` type definition — the modification that OCP forbids. The same applies to `AtomType` in effect-atom-catalog.md.

The design's actual property is "minimal modification" — adding a new variant requires one line in the union and one evaluation function. This is good, but it's not OCP. Per the SE vault: "New functionality should be addable without changing existing code." A strategy map (`Record<string, EvaluatorFn>`) would be OCP. A discriminated union requires modification.

The architecture is sound, but the principle cited ~15 times across the 6 notes is wrong for this specific mechanism. The actual principles at work are [[single-responsibility-principle]] (each predicate has one job) and [[strategy-pattern]] (each predicate is a strategy).

---

##### 50. Replacement composition is not Decorator — it modifies internals, not wrapping

effect-composition-model.md says intervention compositions "are [[decorator-pattern]] decorators wrapping the evaluation pipeline."

The Decorator pattern adds behavior before/after a wrapped object while preserving its interface. Psyshock's Replacement doesn't wrap DealDamage and add behavior — it reaches into the damage pipeline and substitutes which stat is read (Defense instead of Special Defense). This modifies the wrapped node's internal resolution, not its external interface.

Per the SE vault: "Decorator changes the 'skin'; Strategy changes the 'guts'." Replacement changes the guts. This is closer to [[strategy-pattern]] (swap the stat-selection algorithm) than [[decorator-pattern]].

The mislabeling matters because Decorator's guarantees (wrapper order independence, interface preservation) don't apply to Replacement. If two Replacements target the same child (one swapping the defense stat, another swapping the damage type), their interaction rules are undefined. Decorator stacking is well-defined; Replacement stacking is not.

---

#### Design Gaps

---

##### 51. Heal Block checking is scattered across atoms — the [[shotgun-surgery-smell]] the design claims to eliminate

HealHP atom (effect-atom-catalog.md) says: "The atom checks for `heal-block` in the target's `HasActiveEffects` before producing a delta."

But Heal Block blocks ALL HP recovery "from any source." This includes:
- HealHP atom (direct healing)
- ManageResource with `resource: 'tempHp'` (indirect HP benefit)
- Coat tick healing (Aqua Ring, processed as a triggered effect)
- Any future healing atom

Each source must independently check for `heal-block`. Adding a new healing path requires remembering to add the check. This is the [[shotgun-surgery-smell]] that data-driven-rule-engine.md says the design eliminates.

The engine should intercept healing centrally — a before-trigger on a `healing-attempted` event type that Heal Block subscribes to, preventing the heal before any atom runs. This would make Heal Block a single trigger definition with no per-atom scatter.

---

##### 52. EmbeddedAction mutates the turn resolution sequence — contradicting the pure-function model

effect-node-contract.md says: "Given the same context, the same node produces the same result." This is the pure-function guarantee.

EmbeddedAction (effect-composition-model.md) "Grants a secondary action within the current resolution. The engine inserts the embedded action into the current turn's resolution sequence."

This is a side effect on the turn management system — not a delta in the EffectResult. Where in EffectResult does the embedded action go? It's not a combatantDelta (no lens field tracks pending actions). It's not an encounterDelta (the mutation types don't include action insertion). It's not an event (events are historical, not future). It's not a trigger (triggers fire on events, not grant actions).

EmbeddedAction either needs a new field on EffectResult (e.g., `embeddedActions: EmbeddedActionSpec[]`) or it needs to be expressed through existing fields (e.g., ModifyActionEconomy produces a delta, and the turn system reads the updated action budget). The current design doesn't specify either path.

---

##### 53. `allCombatants` on every EffectContext gives every atom access to every entity — ISP violation the `requires` system doesn't cover

EffectContext (effect-node-contract.md) includes `allCombatants: SubInterfaceSlice[]`. The `requires` declaration filters which sub-interfaces are visible per combatant, but doesn't filter which combatants are visible. A single-target DealDamage atom receives all combatants' data even though it only needs the user and target.

The ISP filtering is half-implemented: narrow on the interface axis (which fields), broad on the entity axis (which combatants). The design should either:
- Remove `allCombatants` from the base context and only provide it when an atom declares it needs multi-target data
- Acknowledge that entity-axis filtering is intentionally coarse and remove the ISP claim for this dimension

---

##### 54. ClearFieldState atom is a Defog-specific atom that undermines the composition principle

effect-atom-catalog.md says ClearFieldState "is a composite encounter mutation expressed as a single atom because Defog's clearing rules are specific and invariant."

But this is exactly what compositions are for. Defog could be:

```typescript
sequence([
  modifyFieldState({ field: 'weather', op: 'clear' }),
  modifyFieldState({ field: 'hazards', op: 'remove-all' }),
  modifyFieldState({ field: 'blessings', op: 'remove-all' }),
  modifyFieldState({ field: 'coats', op: 'remove-all' }),
])
```

Creating a dedicated atom for one move's clearing rules contradicts the design's principle that "atoms are finite, the novelty is in composition." If Defog warrants its own atom, what about Rapid Spin (clears hazards from user's side only)? Each novel clearing combination would demand a new atom instead of composing from ModifyFieldState. This is [[speculative-generality-smell]] in reverse — over-specialization.

---

#### Summary

| # | Finding | Severity | Category |
|---|---|---|---|
| 43 | Atom count is 16 not 15 — arithmetic error | Minor | Contradiction |
| 44 | Flash Fire classified as after-trigger but uses before-trigger interception | **Bug** | Contradiction |
| 45 | Resolution atom result flags have no EffectResult field | **Structural** | Contradiction |
| 46 | `interceptEvent()` and `passThrough()` undocumented | **Completeness** | Missing atoms |
| 47 | `passiveEffects` on TraitDefinition has no formal design | **Completeness** | Undocumented concept |
| 48 | Two trigger-specific predicates missing from ConditionPredicate union | **Completeness** | Missing coverage |
| 49 | Discriminated unions don't satisfy OCP — misapplied principle | Moderate | SE misapplication |
| 50 | Replacement is not Decorator — it modifies internals | Moderate | SE misapplication |
| 51 | Heal Block checking scattered across atoms = shotgun surgery | **Design** | Design gap |
| 52 | EmbeddedAction has no EffectResult field — contradicts pure-function model | **Structural** | Design gap |
| 53 | `allCombatants` on every EffectContext breaks entity-axis ISP | Moderate | Design gap |
| 54 | ClearFieldState is a Defog-specific atom that undermines composition | Moderate | Design smell |

#### What the design gets right

The core architecture is strong. The four-layer separation (atoms, compositions, triggers, definitions) is clean. The EffectNode contract as the DIP pivot is correct — it genuinely inverts the dependency so the engine doesn't know about specific moves. The [[mediator-pattern]] framing for the engine is accurate and well-applied. StateDelta and EncounterDelta as [[command-pattern]] objects is the right model. The worked examples in effect-definition-format.md demonstrate that the composition model can express real PTR moves with reasonable ergonomics.

The most important finding is **45 (resolution atom result flags)**. Without a communication channel for pass/fail, the entire flow-control composition layer (Sequence with haltOnFailure, Conditional branching on accuracy) doesn't work. This is a structural gap in the EffectResult contract.

The most actionable finding is **44 (Flash Fire timing)**. It's a one-word fix (`after` → `before`) but demonstrates that the before/after dispatch model needs careful validation against every trait that intercepts or absorbs.

**Status:** Adversarial review of R0.A effect engine design complete. 12 findings (43–54). ~~Awaiting decisions.~~ Decisions posted below.

---

### 2026-03-26 — Decisions on Adversarial Review (Findings 43–54)

All 12 findings accepted. No pushbacks. The core architecture is confirmed sound — every finding either completes a contract, corrects a label, or improves consistency.

---

#### Must-fix — structural gaps in EffectResult contract

| # | Finding | Decision |
|---|---|---|
| 45 | Resolution atom result flags have no EffectResult field | **Accepted.** Add `success: boolean` to EffectResult. This is the flow-control signal that Sequence (`haltOnFailure`) and Conditional (branching on accuracy) depend on. Default `true` — only resolution atoms set it to `false`. Parsing the events array for an accuracy-miss event would violate [[tell-dont-ask]]; a direct signal is the correct model. |
| 52 | EmbeddedAction has no EffectResult field — contradicts pure-function model | **Accepted.** Add `embeddedActions: EmbeddedActionSpec[]` to EffectResult. The engine reads this field and inserts the actions into the turn resolution sequence. The atom itself remains pure — it declares intent, the engine acts on it. Same pattern as `triggers: TriggeredEffect[]` already on EffectResult. |

---

#### Must-fix — bugs and contradictions

| # | Finding | Decision |
|---|---|---|
| 44 | Flash Fire classified as after-trigger but uses before-trigger interception | **Accepted.** Change to `timing: 'before'`. An after-trigger cannot absorb damage that's already been applied. Every type-absorb trait (Flash Fire, Volt Absorb, Water Absorb, Lightning Rod, Storm Drain, Motor Drive, Sap Sipper) must be validated as before-triggers during the 45 sample definitions task. |
| 43 | Atom count is 16 not 15 — arithmetic error | **Accepted.** Fix count to 16 (11 state-producing + 3 encounter-producing + 2 resolution). Minor, but the R0.A exit criterion references this count for coverage verification. |

---

#### Must-fix — completeness gaps

| # | Finding | Decision |
|---|---|---|
| 46 | `interceptEvent()` and `passThrough()` undocumented | **Accepted.** Add both to the atom catalog as engine primitives. `InterceptEvent` is atom 17 — it sets the interception flag that prevents the original event's deltas. `PassThrough` is atom 18 — an explicit no-op for else-branches. Without InterceptEvent formally catalogued, the entire before-trigger interception system (Protect, Wide Guard, Flash Fire, Volt Absorb) is underspecified. Updated atom count: 18. |
| 47 | `passiveEffects` on TraitDefinition has no formal design | **Accepted.** Passive effects are a third category alongside triggered effects and atom-produced effects. They are static modifiers always active while the trait is present. Design needed: evaluation order, conflict resolution (two traits overriding the same value), and typed fields (not `Record<string, unknown>`). Add a `PassiveEffectSpec` section to effect-definition-format.md specifying the known passive keys, their types, and the engine's read points. |
| 48 | Two trigger-specific predicates missing from ConditionPredicate union | **Accepted.** Add `incoming-move-is-contact` and `incoming-move-type-is` to the ConditionPredicate union. The union needs a new category: event-query predicates (properties of the triggering event) alongside the existing state-query predicates (properties of combat state). Enumerate the full set of event-query predicates needed during the 45 sample definitions task — contact, type, damage class, range, and source-entity are the likely set. |

---

#### Correct SE principle labels

| # | Finding | Decision |
|---|---|---|
| 49 | Discriminated unions don't satisfy OCP — misapplied principle | **Accepted.** Relabel all ~15 OCP citations across the 6 notes. The actual principles at work: [[single-responsibility-principle]] (each variant has one job) and [[strategy-pattern]] (each variant is a strategy with a shared evaluation interface). The architecture is correct — the principle name is wrong. A strategy map (`Record<string, EvaluatorFn>`) would be OCP; discriminated unions require modification by definition. |
| 50 | Replacement composition is not Decorator — it modifies internals | **Accepted.** Relabel Replacement from [[decorator-pattern]] to [[strategy-pattern]]. Decorator wraps and preserves the interface; Replacement reaches into the damage pipeline and swaps which stat is read. "Changes the guts, not the skin." The relabeling also surfaces a real design question: if two Replacements target the same child, what are the stacking rules? Decorator stacking is well-defined (order-independent); Replacement stacking is not. Add stacking rules for Replacement to effect-composition-model.md. |

---

#### Design improvements

| # | Finding | Decision |
|---|---|---|
| 51 | Heal Block checking scattered across atoms = shotgun surgery | **Accepted.** Centralize Heal Block as a before-trigger on a `healing-attempted` event type. The engine emits `healing-attempted` before any healing atom runs; Heal Block subscribes as a before-trigger with interception. One trigger definition, zero per-atom checks. This is consistent with how the trigger system already handles damage prevention (Protect, type-absorb traits). Remove the per-atom Heal Block check from HealHP and any other healing atoms. |
| 54 | ClearFieldState is a Defog-specific atom that undermines composition | **Accepted.** Remove ClearFieldState from the atom catalog. Defog becomes a sequence of ModifyFieldState atoms with appropriate field/op combinations. "Atoms are finite, the novelty is in composition" — Defog is novel composition, not a novel atom. Updated atom count: 17 (18 minus ClearFieldState). |
| 53 | `allCombatants` on every EffectContext breaks entity-axis ISP | **Accepted — with pragmatic scoping.** Acknowledge that entity-axis filtering is intentionally coarse. Building entity-scoping machinery (declaring which combatants an atom needs) adds complexity disproportionate to the risk. The ISP claim applies to the interface axis (which sub-interface fields); remove the ISP claim for the entity axis. In practice, atoms access user + target via named fields and `allCombatants` is only used by multi-target effects (spread moves, field-wide effects). Document this as an intentional design tradeoff. |

---

#### What changes in the effect engine design

**EffectResult gains two fields:**
- `success: boolean` (default `true`) — flow-control signal for Sequence and Conditional
- `embeddedActions: EmbeddedActionSpec[]` — declarative action insertion for the turn system

**Atom catalog changes:**
- Add `InterceptEvent` (atom 17) — sets interception flag for before-triggers
- Add `PassThrough` (atom 18) — explicit no-op for else-branches
- Remove `ClearFieldState` — replaced by ModifyFieldState composition
- Fix count: 17 atoms total (13 state-producing, 2 encounter-producing, 2 resolution) plus InterceptEvent and PassThrough as engine primitives = 17 if we count primitives in the total, or 15 + 2 primitives if kept separate. **Decision: count them in.** 17 atoms.

**ConditionPredicate union gains event-query category:**
- `incoming-move-is-contact`, `incoming-move-type-is` added immediately
- Full event-query predicate set enumerated during 45 sample definitions task

**New design section:**
- `PassiveEffectSpec` added to effect-definition-format.md — typed passive keys, evaluation order, conflict resolution

**SE principle relabeling:**
- ~15 OCP citations → SRP + Strategy
- Replacement composition: Decorator → Strategy
- Replacement stacking rules added to effect-composition-model.md

**Heal Block centralization:**
- New event type: `healing-attempted`
- Heal Block becomes a single before-trigger with interception
- Per-atom Heal Block checks removed

**ISP scope clarification:**
- ISP applies to interface axis (sub-interface fields), not entity axis (which combatants)
- `allCombatants` remains on EffectContext — documented as intentional

**Validation task added:**
- All type-absorb traits verified as before-triggers during 45 sample definitions

**Status:** All 12 findings (43–54) from adversarial review accepted and resolved. Effect engine design amendments defined. ~~Next step: amend the 6 effect engine vault notes and update the atom catalog, then proceed to the 45 sample definitions task (R0.A exit criterion).~~ Vault amendments complete — see below.

---

### 2026-03-26 — Vault Amendments for Findings 43–54

All 6 effect engine vault notes amended. One note (data-driven-rule-engine.md) required no changes — its OCP usage is correctly applied to the generic evaluator, not to discriminated unions.

---

#### effect-node-contract.md

- **F45:** Added `success: boolean` and description to EffectResult. Default `true`, set to `false` by resolution atoms. Flow-control signal for Sequence and Conditional.
- **F52:** Added `embeddedActions: EmbeddedActionSpec[]` and description to EffectResult. Declarative action insertion — same pattern as existing `triggers` field.
- **F49:** Replaced OCP citation in intro with SRP + Strategy framing. Removed OCP from SE principles list.
- **F53:** Added ISP scope clarification — ISP applies to interface axis (sub-interface fields), entity axis intentionally coarse. Documented `allCombatants` as intentional design tradeoff.
- Updated engine role steps (6 → 8) to include `embeddedActions` insertion.
- Updated atom catalog link count from ~15 to 17.

#### effect-atom-catalog.md

- **F54:** Removed ClearFieldState atom entirely. Added note to encounter-producing section explaining Defog as a Sequence of ModifyFieldState atoms.
- **F46:** Added InterceptEvent and PassThrough as new "Engine primitives" section. InterceptEvent sets the interception flag for before-triggers. PassThrough is an explicit no-op for else-branches.
- **F51:** Rewrote HealHP description — removed per-atom Heal Block check, replaced with reference to centralized healing-attempted trigger. Removed `HasActiveEffects` from HealHP requires.
- **F43:** Fixed atom count to 17 (11 state-producing, 2 encounter-producing, 2 resolution, 2 engine primitives).
- **F49:** Replaced OCP citation with SRP + Strategy in atom registration and SE principles sections.
- Updated resolution atoms section to reference `success: boolean` on EffectResult.

#### effect-composition-model.md

- **F50:** Relabeled Replacement from Decorator to Strategy. Rewrote intervention compositions intro. Added `priority: number` field and stacking rules for Replacement (higher priority wins for same-value conflicts, independent application for different-value targets).
- **F48:** Added 5 event-query predicates to ConditionPredicate union: `incoming-move-is-contact`, `incoming-move-type-is`, `incoming-move-damage-class-is`, `incoming-move-range-is`, `event-source-is`. Added category comments (state-query vs event-query vs boolean composition) to the union.
- **F49:** Replaced OCP and Decorator citations in SE principles with Strategy + SRP.
- Updated atom count reference from ~15 to 17.
- Added `success` (last-writer-wins) and `embeddedActions` (concatenate) to result merging rules.

#### effect-trigger-system.md

- **F44:** Moved Flash Fire from after-trigger examples to new "Before-trigger examples" section. Changed timing to `before`, replaced `ManageResource(negate damage)` with `InterceptEvent()`, added note that all type-absorb traits must be before-triggers.
- **F51:** Added "Centralized healing suppression" section. Documents `healing-attempted` event type, Heal Block as a before-trigger with InterceptEvent, and the shotgun surgery elimination. Added `healing-attempted` to eventType examples.
- **F49:** Removed OCP citation from engine-as-mediator paragraph and SE principles.
- **F50:** Removed Decorator citation from before-trigger interception and SE principles.

#### effect-definition-format.md

- **F47:** Added "Passive effect specification" section with `PassiveEffectSpec` type. Typed keys (not `Record<string, unknown>`), defined evaluation points (damage pipeline reads multipliers, type effectiveness reads immunities), conflict resolution rules (multiplicative for multipliers, last-writer-wins for overrides).
- **F49:** Replaced OCP citation with SRP in SE principles.

#### data-driven-rule-engine.md

- No changes. OCP is correctly applied here — the generic rule evaluator genuinely doesn't change when new rule definitions are added. Rules are pure data, not discriminated union variants.

---

#### Amendments by finding

| # | Finding | Notes amended |
|---|---|---|
| 43 | Atom count arithmetic | effect-atom-catalog, effect-node-contract, effect-composition-model |
| 44 | Flash Fire timing | effect-trigger-system |
| 45 | EffectResult missing success | effect-node-contract, effect-atom-catalog, effect-composition-model |
| 46 | InterceptEvent/PassThrough undocumented | effect-atom-catalog |
| 47 | passiveEffects unspecified | effect-definition-format |
| 48 | Missing event-query predicates | effect-composition-model |
| 49 | OCP misapplication | effect-node-contract, effect-atom-catalog, effect-composition-model, effect-trigger-system, effect-definition-format (5 of 6 notes) |
| 50 | Replacement is not Decorator | effect-composition-model, effect-trigger-system |
| 51 | Heal Block shotgun surgery | effect-atom-catalog, effect-trigger-system |
| 52 | EmbeddedAction missing EffectResult field | effect-node-contract |
| 53 | allCombatants ISP scope | effect-node-contract |
| 54 | ClearFieldState removal | effect-atom-catalog |

**Status:** Four adversarial reviews completed (findings 1–54). All resolved. All vault notes amended. R0.A effect engine design is stable. ~~Next step: 45 sample definitions task (R0.A exit criterion).~~ Sample definitions complete — see below.

---

### 2026-03-26 — R0.A Sample Effect Definitions (45 Definitions)

All 30 moves and 15 traits written as TypeScript constants in `r0a-sample-effect-definitions.md`. Every atom type, composition pattern, and trigger pattern is exercised.

---

#### Results

**38 of 45 definitions are fully expressible** with the current engine design. **7 definitions expose gaps** (Roar, Gyro Ball, Light Screen, After You, Beat Up, Teamwork, Mettle).

#### Pre-review fixes

Two issues resolved before submitting for adversarial review:

**ModifyInitiative atom added.** New state-producing atom in `effect-atom-catalog.md`. Supports `op: 'set'` (Quash: set to 0) and `op: 'set-next-after'` (After You: turn-order insertion). Atom count now 18 (12 state-producing, 2 encounter-producing, 2 resolution, 2 engine primitives). Quash (#22) moves from gap to fully expressible.

**3 predicates added to ConditionPredicate union.** `hazard-layer-count` (Toxic Spikes layer branching), `incoming-status-is` (Limber immunity check), `user-resource-at-least` (Mettle spend check) added to `effect-composition-model.md`. These were used by definitions counted as fully expressible but not formally in the union — an inconsistency. Now consistent.

#### Gap summary

**1. Missing predicates — 5 new predicates needed**

| Predicate | Source | Category |
|---|---|---|
| `target-within-recall-range` | Roar | Spatial |
| `target-effective-stat-exceeds-user` | Gyro Ball | Stat comparison |
| `target-has-not-acted-this-round` | After You | Turn state |
| `target-is-willing` | After You | Player consent |
| `user-is-adjacent-to-target` (three-entity) | Teamwork | Spatial |

**2. DealDamage extensions**

- `bonusDamage: { source, stat, formula }` — Gyro Ball's variable bonus from speed difference
- `source: 'struggle-attack'` + `typeOverride` + `attacker: 'filtered-entity'` — Beat Up's multi-attacker delegation
- `applyTypeEffectiveness: true` — Stealth Rock's typed fixed-tick damage

**3. Turn-lifecycle concerns (Ring 1, not Ring 0)**

- Delayed resolution timing (`resolution: 'end-of-round'`) — Roar
- Reroll mechanics (suspend, re-inject context) — Mettle
- AoO budget integration with EmbeddedAction — Pack Hunt
- Damage resistance step system — Light Screen

**4. CrossEntityFilter clarifications**

- Context switching — who is "user" when a filtered ally attacks (Beat Up)
- `maxCount` param — limit filtered participants (Beat Up: max 2 allies)

**5. Teamwork's three-entity spatial query**

Teamwork checks adjacency between the trait holder and the target of an ally's attack. This is a three-entity relationship (holder, attacker, target) that the two-entity condition model (user/target) doesn't naturally express. Proposed resolution: expand the condition context to include the trait holder as a distinct entity when evaluating trigger conditions.

**6. New event types needed**

- `accuracy-check` — Teamwork needs to modify accuracy before resolution
- `roll-completed` — Mettle triggers after any roll to offer reroll

---

#### Coverage confirmed

All 18 atoms exercised. All 7 compositions exercised. Both trigger timings (before/after) exercised across 9 distinct trigger patterns. 6 PassiveEffect keys defined and exercised.

ResolveSkillCheck is the only atom not directly exercised — it covers combat maneuvers (Push, Trip, Grapple) and training checks, which are Ring 1 content.

---

#### Vault note created

`r0a-sample-effect-definitions.md` — 30 move definitions, 15 trait definitions, gap inventory, and coverage matrix. Backlinks added to `effect-definition-format.md` and `effect-atom-catalog.md`.

---

#### R0.A completion status (updated)

| Component | Status |
|---|---|
| GameState Interface (10 notes) | Complete — 3 adversarial reviews, all findings resolved |
| Effect Engine (6 notes) | Complete — 4 adversarial reviews, all findings resolved, all amendments applied |
| Sample Definitions (1 note) | Complete — 45 definitions, 38 fully expressible, 7 with documented gaps |
| R0.A exit criterion | **Pending adversarial review** of sample definitions and gaps |

**Status:** 45 sample definitions complete. 38 fully expressible, 7 expose gaps. Pre-review fixes applied (ModifyInitiative atom, 3 predicates). ~~Awaiting adversarial review of the sample definitions — specifically whether the gaps require R0 resolution or can be deferred to Ring 1.~~ Adversarial review posted below.

---

### 2026-03-26 — Adversarial Review of R0.A Sample Definitions (Findings 55–66)

Reviewed all 45 definitions against the effect engine design (6 vault notes), the GameState interface (10 vault notes), the PTR vault, and the SE vault (~220 notes). Cross-referenced each gap against the R0.A exit criterion to determine whether it's a Ring 0 blocker or a Ring 1 deferral.

---

#### R0 Exit Criterion Violations

---

##### 55. Five missing predicates are R0 gaps, not R1 deferrals — the exit criterion says "all composition patterns covered"

The gap summary categorizes all 5 missing predicates as extensions. But the R0 exit criterion says: "The effect engine can express and correctly evaluate all 45 sample definitions." It does NOT say "38 of 45." If Roar, Gyro Ball, After You, Beat Up, and Teamwork cannot be expressed, the exit criterion fails.

The definitions post itself classifies these as "gaps" — places "where the current engine design cannot fully express a definition." That's a failed exit criterion by the post's own language.

Sorting by severity:

| Predicate | Blocking move/trait | R0 or defer? | Rationale |
|---|---|---|---|
| `target-effective-stat-exceeds-user` | Gyro Ball | **R0** — it's a state-query predicate. The engine already has state queries. Adding one that compares effective stats (stat × CS multiplier) between two entities is a straightforward ConditionPredicate variant. No new machinery. |
| `target-has-not-acted-this-round` | After You | **R0** — reads `actedThisRound` from `HasInitiative`, which already exists on the lens. Trivial predicate. |
| `target-within-recall-range` | Roar | **Defer** — requires spatial engine (distance calculation to trainer/Poke Ball). Spatial is Ring 3B. Roar's forced displacement works in R0; the recall-if-close check is a spatial concern. |
| `target-is-willing` | After You | **Defer** — player consent is an interaction concern that belongs with the turn lifecycle. After You's initiative reorder works without this check; the check prevents griefing (targeting unwilling allies). |
| `user-is-adjacent-to-target` (three-entity) | Teamwork | **Defer** — three-entity spatial queries require spatial engine infrastructure. Teamwork's mechanical effect (accuracy bonus) works via the composition model; the spatial trigger condition is Ring 3B. |

**Impact:** Add `target-effective-stat-exceeds-user` and `target-has-not-acted-this-round` to the ConditionPredicate union now. Defer the other three. This raises the fully expressible count from 38 to 40 (Gyro Ball and After You become expressible), with 5 remaining definitions having documented spatial or interaction deferrals.

---

##### 56. DealDamage `bonusDamage` is an R0 gap — it exposes an insufficient atom parameterization

Gyro Ball needs `bonusDamage: { source: 'stat-difference', stat: 'spd', formula: 'target-minus-user' }`. The current DealDamage atom has `damageBase` but no mechanism for variable bonus damage computed from state.

This isn't a niche case. PTR has many moves with stat-derived bonus damage:
- Gyro Ball (Speed difference)
- Electro Ball (Speed ratio)
- Heavy Slam (Weight difference)
- Grass Knot (target weight)
- Low Kick (target weight)

The `bonusDamage` param pattern will be needed for ~10+ moves in Ring 1's "50 damage moves" content task. If DealDamage can't express it, those moves are also inexpressible.

This is a DealDamage params extension, not a new atom. The atom's `evaluate` function reads the bonus source from params, computes the bonus from context (effective stats), and adds it to the damage pipeline. Per [[single-responsibility-principle]], the damage atom already owns the damage computation — adding a bonus source input is extending its responsibility, not adding a new one.

**Impact:** Add `bonusDamage?: BonusDamageSpec` to DealDamage params in R0. The spec needs: `source` (stat-difference, stat-ratio, weight-based), `stat` (which stat), `formula` (how to compute). Without this, Ring 1's content task will immediately rediscover the same gap.

---

##### 57. `applyDamageResistance` is R0 — the damage pipeline lacks a resistance step

Light Screen says "resist Special damage one step." The gap summary says this depends on "PTR resistance step system formalization." But resistance steps are part of the nine-step damage formula — they modify how much damage gets through. The damage pipeline is R1.1, which the exit criterion says must be usable by Ring 1.

The PTR vault's `damage-resistance-tiers.md` defines: Normal → Resisted (×0.5) → Doubly Resisted (×0.25) → Triply Resisted (immune). Light Screen shifts damage one tier toward Resisted.

If the DealDamage atom's pipeline doesn't account for resistance tiers, then Light Screen — a Blessing in the Ring 0 exit criterion sample — doesn't work. And Light Screen is one of the most common defensive moves in the game.

**Impact:** Add resistance tier as a damage pipeline parameter. `DealDamage` needs to receive `resistanceModifier: number` (default 0, Light Screen sets -1) as part of its pipeline. This can be delivered via a before-trigger that modifies the DealDamage params — or as a passive effect the pipeline reads. Either way, it must be expressible in R0.

---

#### Composition Model Gaps

---

##### 58. CrossEntityFilter context switching is unspecified and Beat Up can't work without it

Beat Up's gap says: "when an ally performs the Struggle Attack, the ally becomes the 'user' for that evaluation." This is a fundamental composition question, not a DealDamage extension.

The EffectContext has `user` and `target` as named fields. CrossEntityFilter iterates entities and evaluates a child for each. But the child receives the SAME context — `user` is still the original user (Beat Up's caster), not the filtered ally. DealDamage's attack stat, STAB check, and type effectiveness all read from `user`. If `user` doesn't change, the ally's stats aren't used.

This affects more than Beat Up. Any effect that delegates actions to other entities needs context switching:
- Beat Up (allies attack through user's move)
- Helping Hand (user boosts ally's next attack — the "ally's next attack" context needs the ally as user)
- Instruct (target repeats their last move — the repeated move's context needs the target as user)
- Dancer (copy a dance move — the copy's context needs the copier as user)

The CrossEntityFilter composition needs an explicit `contextRole` param: `{ role: 'user' | 'target', maps-to: 'filtered-entity' }`. When `role: 'user'`, each filtered entity becomes the `user` in the child's EffectContext. When `role: 'target'`, each becomes the `target`.

**Impact:** This is an R0 gap. CrossEntityFilter's contract must specify context switching or it's a composition type that can't actually compose. Add `contextRole` to CrossEntityFilter in `effect-composition-model.md` and verify Beat Up works.

---

##### 59. Safeguard and Light Screen blessing triggers live INSIDE the ModifyFieldState atom — this conflates data authoring with engine behavior

Safeguard's definition embeds a full trigger definition inside `ModifyFieldState`'s params:

```
modifyFieldState({
  field: 'blessing', op: 'add',
  instance: {
    ...
    activationEffect: {
      trigger: {
        eventType: 'status-applied',
        timing: 'before',
        ...
        effect: choicePoint('activate-safeguard', { ... })
      }
    }
  }
})
```

The `ModifyFieldState` atom is supposed to produce an `EncounterDelta` that adds a blessing to the field. But here it's also carrying a complete trigger definition with a before-trigger, a ChoicePoint, an InterceptEvent, and a field-state consumption — all as nested params inside one atom call.

Two problems:

1. **ISP violation.** `ModifyFieldState` now depends on the entire trigger system's types (TriggerDefinition, EffectNode, ChoicePoint, InterceptEvent) through its params. The atom catalog says ModifyFieldState requires `none` (no sub-interfaces) — but its params carry the full complexity of the effect system. This is `[[long-parameter-list-smell]]` — the params are a deep nested tree structure masquerading as atom configuration.

2. **The trigger system owns triggers, not atoms.** The `[[effect-trigger-system]]` says "trait definitions are subscribers." But these triggers aren't on traits — they're embedded inside field state instances. The trigger system's collection step ("collect all triggers matching the event type from all active combatants' traits and active effects") doesn't mention scanning field state instances for embedded triggers. The dispatch pipeline has a gap.

This doesn't require a fundamental redesign. The fix is: blessing triggers are registered with the trigger system when the blessing is created (not embedded in the ModifyFieldState params), and the trigger system scans blessings alongside traits and active effects. The ModifyFieldState atom produces an EncounterDelta that creates the blessing; the engine registers the blessing's trigger.

**Impact:** R0 gap. Clarify in `effect-trigger-system.md` that trigger sources include field state instances (blessings, coats, hazards) alongside traits and active effects. Simplify blessing/coat/hazard definitions to reference effect definitions rather than embedding full trigger trees in ModifyFieldState params.

---

#### Correctness Issues

---

##### 60. Thunder Wave's type immunity check is in the wrong place — should be an ApplyStatus concern, not a move definition

Thunder Wave uses a Conditional to check `target-type-is: electric` before applying Paralysis. But type-based status immunity is a GENERAL rule — Electric types are immune to Paralysis regardless of the source. The check should be inside the ApplyStatus atom (or as a before-trigger on `status-applied`), not hard-coded into Thunder Wave's definition.

If a trait or another move inflicts Paralysis on an Electric type, there's no type check in THAT definition — the immunity would be silently skipped. This is `[[shotgun-surgery-smell]]`: type immunity must be checked in every definition that applies the status, rather than once in the status application system.

The same problem applies to:
- Poison types immune to Poisoned/Badly Poisoned
- Steel types immune to Poisoned
- Fire types immune to Burned (per PTR)

ApplyStatus already reads `HasTypes` — it should check type immunities as part of its standard evaluation. The Conditional in Thunder Wave should be removed.

**Impact:** R0 correctness fix. Move type-based status immunity from per-definition Conditionals into ApplyStatus (or a centralized before-trigger on `status-applied`). Update Thunder Wave to remove the redundant check. This is the same centralization principle that fixed Heal Block (finding 51) — don't scatter immunity logic across definitions.

---

##### 61. Stealth Rock's `applyTypeEffectiveness: true` on tick damage contradicts the damage pipeline design

Stealth Rock deals 1 tick of typed damage with type effectiveness. The definition uses `dealDamage({ ticks: 1, type: 'rock', class: 'physical', applyTypeEffectiveness: true })`.

But the DealDamage atom runs the nine-step damage formula, which ALWAYS applies type effectiveness (step 8). `applyTypeEffectiveness` implies it can be toggled off. When would it be off? The nine-step formula doesn't have an "ignore type effectiveness" option.

The real issue: Stealth Rock doesn't use the nine-step formula at all. It deals a flat tick of damage (1/10 max HP) modified by type effectiveness. No attack stat, no defense stat, no STAB, no DB, no crit. It's a different damage mode — tick damage with type chart.

The DealDamage atom conflates two distinct damage models:
1. **Formula damage** — the nine-step pipeline (Thunderbolt, Earthquake, etc.)
2. **Tick damage** — flat HP fraction, optionally modified by type chart (Stealth Rock, burn, poison, Vortex)

These are different enough that forcing both through DealDamage creates the `ticks` + `applyTypeEffectiveness` + `db: null` params soup. A cleaner model: tick damage is a separate pathway in DealDamage, or a variant of ManageResource (since it's "lose HP" not "deal damage" in the combat log sense).

**Impact:** Not a blocker for R0 exit — Stealth Rock is expressible. But the conflation will become a pain point in Ring 1 when burn/poison/Vortex tick damage also needs expressing. Document the two damage modes as an acknowledged design tension in `effect-atom-catalog.md`.

---

##### 62. Flash Fire's ActiveEffect state `{ fireBoost: true }` has no consumption mechanism

Flash Fire absorbs a Fire move and grants "+5 to next Fire damage roll." The sample definition creates an ActiveEffect with `state: { fireBoost: true }` and `expiresAt: null` (permanent until cleared).

Two problems:

1. **"Next Fire damage" implies one-use.** The boost should be consumed after the user's next Fire-type attack. But `expiresAt: null` means the effect persists permanently. There's no `expiresAt: 'on-next-fire-move-used'` in the ActiveEffect model. The effect engine has no way to express "this effect expires when the holder uses a specific type of move."

2. **How does DealDamage read the boost?** The atom reads passive effects (`passiveEffects.fireDamageBonus`?) or active effects (`HasActiveEffects → find flash-fire-boost`). If it reads ActiveEffect state, DealDamage needs `HasActiveEffects` in its `requires` — but the atom catalog says DealDamage requires `HasStats, HasCombatStages, HasHealth, HasTypes`. Adding `HasActiveEffects` to DealDamage expands its dependency surface for a single trait interaction.

The cleaner model: Flash Fire applies a transient combat stage boost (+X to a relevant stat) or a damage modifier via the passive effect system, with an after-trigger on `move-used` that checks "was it Fire-type?" and removes the boost. This avoids both problems — standard CS/passive mechanics handle the boost, and an after-trigger handles consumption.

**Impact:** R0 gap. Flash Fire's definition needs revision to use a consumption mechanism. Either add `expiresAt: { onEvent: 'user-fire-move-used' }` to the ActiveEffect model, or redesign Flash Fire to use CS + after-trigger consumption. The current definition doesn't correctly implement the one-use behavior.

---

#### Deferral Validation

---

##### 63. Delayed resolution (`resolution: 'end-of-round'`) is correctly deferred — but the deferral boundary is wrong

Roar's delayed resolution is categorized as "move metadata, not an effect engine concept." Correct. But the definition still includes `resolution: 'end-of-round'` on the MoveDefinition. This field doesn't exist in `effect-definition-format.md`.

The move definition format should formally declare which fields are engine-evaluated (the `effect` tree) and which are turn-system metadata (action type, resolution timing, targeting mode). Currently, `actionType` appears on some definitions (After You: 'swift', Wide Guard: 'interrupt') without being specified in the format. The definitions are inventing metadata fields ad hoc.

**Impact:** Not an R0 blocker. But `effect-definition-format.md` should enumerate the non-effect metadata fields that MoveDefinition can carry, with a note that these are consumed by the turn system (Ring 1), not the effect engine. This prevents the format from accreting undocumented fields.

---

##### 64. Reroll mechanics (Mettle) are correctly deferred — but `requestReroll` should be removed from the definition

Mettle's definition includes `requestReroll({ must: 'accept-new-result' })` — an atom that doesn't exist and is acknowledged as a turn-lifecycle concern. But the definition presents it as if it COULD work once the atom exists.

It can't. A reroll suspends the current evaluation, generates a new roll, and re-runs the evaluation with the new input. This breaks the pure-function contract — the function can't suspend itself. The engine must handle this externally (detect Mettle trigger → present choice → if reroll: re-invoke the entire evaluation with a different `ResolutionContext`).

`requestReroll` as an atom is a category error. It should be replaced with a marker in the EffectResult (e.g., `rerollOffered: RerollSpec`) that the engine reads, similar to `embeddedActions`. The engine then handles the re-invocation.

**Impact:** Not an R0 blocker (correctly deferred to Ring 1). But the definition should replace `requestReroll(...)` with a comment explaining the intended mechanism to avoid implying a future atom.

---

##### 65. Teamwork's `modifyAccuracyRoll` — the proposed alternative (transient accuracy CS boost) has side effects

The gap summary proposes: "Use transient accuracy CS boost instead of modifying the roll directly." But accuracy CS is a persistent lens field (`combatStages.accuracy`). If Teamwork applies +2 accuracy CS as a "transient" effect, when does it get removed? Before the next attack? At end of turn?

If it's removed "before the next attack," the engine needs a before-trigger on every accuracy check that removes stale Teamwork CS boosts — which is the scattered-check problem Heal Block centralization (finding 51) was designed to eliminate.

If it's removed "at end of turn," the +2 accuracy applies to ALL attacks that turn, not just the one melee attack by the adjacent ally.

The correct model: Teamwork is a before-trigger on `accuracy-check` that modifies the resolution context's accuracy roll value. This is the same mechanism as saying "this roll gets +2" — but it requires the engine to allow before-triggers to produce a modified `ResolutionContext`, not just `StateDelta`.

**Impact:** Deferred to Ring 1 (spatial query needed), but the proposed alternative is incorrect. When Teamwork is implemented, it needs accuracy-check event modification, not transient CS. Note this in the gap documentation.

---

##### 66. The gap summary's claim "none require rethinking the fundamental architecture" is partially wrong

The summary says: "None of the gaps require rethinking the fundamental architecture." For most gaps, this is true. But two gaps expose genuine architectural insufficiencies, not just missing predicates:

1. **CrossEntityFilter context switching (finding 58)** — the composition can't express what it claims to express. A composition type that can't switch the evaluation context can't handle delegation. This affects the architecture of how compositions interact with EffectContext.

2. **Trigger registration for field state instances (finding 59)** — the trigger system doesn't know about field-state-embedded triggers. The dispatch pipeline's collection step has a gap. This affects the architecture of how the trigger system discovers triggers.

Both are fixable without restructuring the engine, but they're not "just add a predicate" extensions. They're contract gaps in two of the three core subsystems (compositions and triggers). The gap summary should distinguish between:
- **Extensions** — new predicates, new DealDamage params (most gaps)
- **Contract gaps** — missing specifications in existing contracts (CrossEntityFilter, trigger collection)
- **Deferrals** — concerns that belong to Ring 1 (delayed resolution, reroll, spatial queries)

---

#### Summary

| # | Finding | Severity | Category | R0 or defer? |
|---|---|---|---|---|
| 55 | 5 missing predicates: 2 are R0, 3 are deferrals | **Correctness** — exit criterion fails | Exit criterion | 2 R0, 3 defer |
| 56 | DealDamage `bonusDamage` is R0 — ~10+ Ring 1 moves need it | **Scope** — insufficient atom params | Exit criterion | R0 |
| 57 | `applyDamageResistance` is R0 — Light Screen doesn't work | **Scope** — missing damage pipeline step | Exit criterion | R0 |
| 58 | CrossEntityFilter context switching unspecified | **Structural** — composition can't express delegation | Composition gap | R0 |
| 59 | Blessing triggers embedded in ModifyFieldState params | **Design** — ISP violation + trigger system gap | Composition gap | R0 |
| 60 | Thunder Wave type immunity hardcoded — should be in ApplyStatus | **Correctness** — shotgun surgery | Correctness | R0 |
| 61 | Stealth Rock conflates formula and tick damage modes | **Design** — acknowledged tension, not blocker | Correctness | Document |
| 62 | Flash Fire has no consumption mechanism for one-use boost | **Correctness** — definition doesn't match PTR behavior | Correctness | R0 |
| 63 | Move metadata fields undocumented in definition format | **Completeness** — ad hoc fields | Deferral validation | Document |
| 64 | `requestReroll` is a category error — should be EffectResult marker | **Design** — definition implies nonexistent atom | Deferral validation | Document |
| 65 | Teamwork's proposed CS alternative has side effects | **Design** — proposed workaround is incorrect | Deferral validation | Document |
| 66 | "No architectural rethinking needed" claim partially wrong | **Process** — 2 contract gaps in core subsystems | Gap classification | Reclassify |

#### What the definitions get right

The 45-definition validation exercise is exactly the right methodology. It's the first time the engine design has been tested against real PTR content rather than abstract architecture. The 38 fully expressible definitions prove the core model works — atoms compose, triggers fire, compositions orchestrate. The helper function syntax (`sequence`, `conditional`, `dealDamage`, etc.) produces readable definitions that a content author could write. The coverage matrix confirms all 18 atoms and 7 composition patterns are exercised.

The most important finding is **58 (CrossEntityFilter context switching)**. Without it, any effect that delegates actions to other entities (Beat Up, Helping Hand, Instruct, Dancer) is inexpressible. This is a core composition contract gap, not an extension.

The most actionable finding is **60 (Thunder Wave type immunity centralization)**. It's a one-definition fix that prevents a class of bugs — every future status-inflicting definition would need to remember to add type immunity checks, and most would forget.

**Status:** Adversarial review of R0.A sample definitions complete. 12 findings (55–66). 6 require R0 resolution (2 predicates, bonusDamage params, resistance step, CrossEntityFilter contract, blessing trigger registration, Flash Fire consumption, Thunder Wave centralization). 3 are correctly deferred. 3 should be documented. ~~Awaiting decisions.~~ Foundational reassessment posted below.

---

### 2026-03-26 — Foundational Reassessment: Composition Framework vs Plain Functions

Before resolving findings 55–66, we step back and ask: is the composition framework the right foundation? The findings are individually fixable, but the trajectory across five adversarial reviews raises a deeper question.

---

#### The trajectory problem

Each adversarial review added complexity to the composition framework:

| Review | What grew |
|---|---|
| Findings 1–9 | 6 tracks → rings, effect engine becomes root, ~15 atoms + 2 compositions |
| Findings 10–20 | ~20 atoms, 7 compositions, 3 composition categories, 4 delta modes, resolution modifiers |
| Findings 21–32 | Source tracking, deployment model, generic ActiveEffect, entity-write exceptions |
| Findings 33–42 | Evasion derivation, initiative derivation, fatigue state, 4 delta application modes formalized |
| Findings 43–54 | EffectResult gains success + embeddedActions, InterceptEvent/PassThrough atoms, OCP relabeling across 5 notes, trigger-specific predicates, Heal Block centralization |
| Findings 55–66 | CrossEntityFilter needs context switching, triggers need field state registration, accuracy needs resolution context modification, DealDamage needs bonusDamage + resistance |

The framework grows monotonically. Good abstractions simplify as they mature. This one complexifies. Each review reveals the framework can't express some PTR behavior, and the fix is always "expand the framework." After 66 findings, the composition model has: 18 atom types, 7 composition types across 3 categories, 2 trigger timings with dispatch ordering, resolution modifiers, 6 EffectResult fields, 4 delta application modes, and an engine that mediates assembly, evaluation, delta application, trigger dispatch, interception, recursion, embedded actions, and field-state trigger registration.

The framework was designed to avoid writing 579 bespoke functions. But the "data" definitions it produces ARE programs:

```typescript
// Safeguard: 30 lines of nested control flow, event handling, and conditional logic
effect: modifyFieldState({
  field: 'blessing', op: 'add',
  instance: {
    type: 'safeguard',
    activationsRemaining: 3,
    activationEffect: {
      trigger: {
        eventType: 'status-applied',
        timing: 'before',
        scope: 'ally',
        condition: null,
        effect: choicePoint('activate-safeguard', {
          'yes': sequence([
            interceptEvent(),
            modifyFieldState({ field: 'blessing', op: 'consume', blessingId: 'safeguard' }),
          ]),
          'no': passThrough(),
        }),
      },
    },
  },
})
```

This has control flow (choicePoint), side effects (modifyFieldState), event handling (trigger), and conditional logic (condition). The helper functions (sequence, choicePoint, interceptEvent) are a DSL embedded in TypeScript. Calling it "data" doesn't change what it is.

---

#### The alternative: plain TypeScript functions with shared utilities

Instead of the composition framework, each move and trait is a typed function: `(ctx: EffectContext) => EffectResult`. Shared utilities (`dealDamage`, `applyStatus`, `rollAccuracy`, etc.) provide the building blocks. TypeScript itself provides the composition language.

**Thunderbolt** — was: `Sequence([ResolveAccuracy, DealDamage, Conditional(roll >= 19, ApplyStatus)])`

```typescript
export const thunderbolt: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 8, type: 'electric', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { condition: 'paralyzed' })
    : noEffect()

  return merge(acc.result, dmg, status)
}
```

**Beat Up** — finding 58's CrossEntityFilter context switching gap becomes a one-line utility:

```typescript
export const beatUp: MoveHandler = (ctx) => {
  const userAtk = dealDamage(ctx, { source: 'struggle', typeOverride: 'dark' })
  const allyAtks = getAdjacentAllies(ctx, { max: 2 }).map(ally =>
    withUser(ctx, ally, (c) =>
      dealDamage(c, { source: 'struggle', typeOverride: 'dark' })
    )
  )
  return merge(userAtk, ...allyAtks)
}
```

**Safeguard** — finding 59's embedded trigger problem becomes handler registration:

```typescript
export const safeguard: MoveHandler = (ctx) => {
  return addBlessing(ctx, 'safeguard', {
    activations: 3,
    onStatusApplied: (triggerCtx) =>
      choicePoint(triggerCtx, 'activate-safeguard', {
        yes: () => merge(
          intercept(triggerCtx),
          consumeBlessing(triggerCtx, 'safeguard')
        ),
        no: () => noEffect(),
      }),
  })
}
```

**Gyro Ball** — finding 56's bonusDamage gap becomes inline arithmetic:

```typescript
export const gyroBall: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const userSpd = effectiveStat(ctx.user, 'spd')
  const targetSpd = effectiveStat(ctx.target, 'spd')
  const bonus = targetSpd > userSpd ? targetSpd - userSpd : 0

  return merge(acc.result,
    dealDamage(ctx, { db: 6, type: 'steel', class: 'physical', bonusDamage: bonus })
  )
}
```

---

#### What this eliminates

| Framework concept | Replaced by |
|---|---|
| Atom catalog (18 types) | Utility functions (`dealDamage()`, `applyStatus()`, etc.) — same logic, no type registry |
| Composition model (7 types) | TypeScript `if`/`for`/`map`/ternary — the language IS the composition |
| EffectNode interface | `MoveHandler` / `TraitTriggerHandler` function types |
| Engine mediation | Simpler engine: calls handlers, applies results, dispatches triggers |
| Definition format with helper factories | Functions ARE the definitions |
| Atom `requires` ISP declarations | Utility function params are already typed |

---

#### What stays the same

The GameState interface design (10 vault notes) is **fully reusable**. The composition framework and the function approach both need:

- Sub-interfaces (HasStats, HasHealth, HasCombatStages, etc.) — utility function params
- StateDelta / EncounterDelta — the write model
- Combat event log — historical queries (Retaliate, Destiny Bond)
- Field state types (Coat, Blessing, Hazard, Vortex) — lifecycle rules
- Deployment state — switching, bench/reserve/fainted
- Resolution context inputs — roll results, player decisions
- Trigger system — traits subscribe to events, engine dispatches (simpler: an event bus)

The effect engine's 6 vault notes shift from "composition framework specification" to "utility function design + trigger event bus." The architectural principles (DIP, ISP, SRP, Mediator for engine, Observer for triggers, Strategy for utilities) still apply — they describe the utilities and event bus, not the composition tree.

---

#### Findings 55–66 under the function model

| Finding | Under composition framework | Under function model |
|---|---|---|
| **F55** (missing predicates) | Add to ConditionPredicate union | Write inline conditions: `if (effectiveStat(ctx.target, 'spd') > effectiveStat(ctx.user, 'spd'))` |
| **F56** (bonusDamage) | Extend DealDamage atom params | Compute bonus inline, pass to `dealDamage()` utility |
| **F57** (resistance step) | New atom or pipeline step | Add `resistanceModifier` param to `dealDamage()` utility |
| **F58** (CrossEntityFilter context switching) | New contract on composition type | `withUser(ctx, ally, fn)` — one utility function |
| **F59** (blessing triggers in atom params) | Restructure trigger registration + atom params | Pass handler function to `addBlessing()` |
| **F60** (Thunder Wave immunity centralization) | Move check into ApplyStatus atom | Move check into `applyStatus()` utility — same fix, simpler location |
| **F62** (Flash Fire consumption) | Expand ActiveEffect expiry model | Write an after-trigger handler that checks and removes |
| **F65** (Teamwork accuracy modification) | Needs resolution context modification by before-triggers | Before-trigger handler returns `{ accuracyBonus: 2 }`, engine applies before resolving |

Every finding becomes either trivial (inline code) or a utility function enhancement. No framework expansions. No contract changes.

---

#### SE vault argument

Three principles from `vaults/documentation/software-engineering/` argue for the function approach:

**`rule-of-three.md`** — "When doing something for the first time, just get it done. When doing something for the second time, cringe. When doing something for the third time, start refactoring." The composition framework was designed before writing three definitions. Functions follow the rule: write implementations first, extract patterns when they emerge.

**`speculative-generality-smell.md`** — "Unused classes, methods, fields, or parameters created 'just in case' for anticipated future needs that never materialized." The framework anticipated all 579 definitions before one was implemented. Each review proved the anticipation incomplete. Functions solve today's definitions; abstractions emerge from actual repetition.

**`refactoring-in-small-changes.md`** — "Refactoring should be done as a series of small changes, each making the code slightly better while still leaving the program in working order." Functions are immediately working code. The framework requires the entire composition model to be designed and validated before anything runs.

---

#### The trade-off

**Lost:**
- Static analyzability — "which moves use DealDamage?" becomes a grep, not a type query. No tooling for this exists or is planned.
- Structural enforcement — a handler CAN do anything, not just compose atoms. Convention and code review replace type-level constraints.
- "Definitions are data" claim — definitions are code. But the composition trees were already programs expressed as data structures.

**Gained:**
- Every gap is trivially solvable — need context switching? Write a utility. Need a new damage mode? Add a param. No framework changes.
- Content authoring is writing TypeScript with helpers — the same skill as writing the app itself.
- Immediately testable — unit test each handler function.
- The framework's monotonic complexity growth stops — complexity lives in individual handlers where it belongs, not in a shared abstraction layer.
- Rule of three is respected — abstractions emerge from repetition in actual implementations, not from anticipating 579 definitions.

---

#### What changes

**Vault notes that survive unchanged (10):**
- `game-state-interface.md` — root note, three layers
- `combat-lens-sub-interfaces.md` — 15 Has* interfaces
- `state-delta-model.md` — how effects write
- `encounter-delta-model.md` — encounter-level changes
- `active-effect-model.md` — generic buff/debuff tracking
- `field-state-interfaces.md` — 6 field state types
- `deployment-state-model.md` — bench/reserve/fainted
- `entity-write-exception.md` — Thief exception
- `combat-event-log-schema.md` — historical queries
- `resolution-context-inputs.md` — expanded pure-function inputs

**Vault notes that get rewritten (6):**
- `effect-node-contract.md` → `effect-handler-contract.md` — MoveHandler/TraitTriggerHandler function types, EffectResult (unchanged), EffectContext (unchanged), engine role (simplified)
- `effect-atom-catalog.md` → `effect-utility-catalog.md` — same ~18 operations as typed utility functions instead of atom types
- `effect-composition-model.md` → deleted or reduced to a "common patterns" reference — TypeScript IS the composition language
- `effect-trigger-system.md` → `effect-trigger-event-bus.md` — simplified: traits register handlers for event types, engine dispatches, before/after timing preserved
- `effect-definition-format.md` → `effect-handler-format.md` — function signature, utility imports, worked examples rewritten as functions
- `r0a-sample-effect-definitions.md` → rewritten with function-based definitions

**Vault notes updated with backlinks (same 8):**
- Same notes that were updated when the effect engine was created — links change from old note names to new.

**Consolidated ring plan update:**
- R0.A description changes from "composable effect system" to "typed effect handlers with shared utilities"
- Effect engine architecture section rewrites
- Exit criterion unchanged: 30 moves + 15 traits, all expressible, unit-tested

**Findings 55–66:** Most become moot (no framework to fix). F60 (Thunder Wave centralization) and F62 (Flash Fire consumption) still apply — they're correctness issues in the definitions, not framework issues. The remaining findings dissolve.

---

#### R0.A exit criterion under function model

Unchanged in substance:

> The effect engine can express and correctly evaluate 30 representative moves and 15 representative traits, hand-selected to cover all identified mechanical patterns. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect handler functions have unit tests. The handlers, entity model, and lens are co-designed and documented in the documentation vault.

The 45 definitions get rewritten as functions. The coverage matrix still applies — same mechanical patterns, different expression format.

---

**Status:** Foundational reassessment complete. The composition framework is correct but over-engineered — it solves a theoretical problem (representing effects as composable data) at the cost of monotonic complexity growth across 5 reviews. Plain TypeScript functions with shared utilities solve the practical problem (implementing 579 effects) with the language itself, respect the rule of three, and make every adversarial finding trivially resolvable. 10 of 16 vault notes survive unchanged. 6 get rewritten. Awaiting decision: proceed with function model, or stay with composition framework.
