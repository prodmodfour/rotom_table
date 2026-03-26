<!-- pinned -->
# 2026-03-26 — Consolidated Ring Plan (Post-Review Reference)

This is the authoritative ring plan incorporating all decisions from both adversarial reviews (findings 1–20), the three-view elevation, the player view triad, and the functionality catalog. Supersedes all prior ring descriptions in this thread.

---

## Principles

1. **PTR vault is the source of truth** for what the game system IS.
2. **Documentation vault is the design authority** for how the system becomes software.
3. **SE vault provides the constraints** — patterns and principles are requirements, not suggestions.
4. **Design before code.** Every feature gets a documentation note before it gets an implementation.
5. **Destructive by default.** Existing code that doesn't match the new design is deleted. No compatibility shims. Fresh data start (PTU data discarded, schema migration history preserved).
6. **Cross-reference SE principles.** Every design must cite specific SE patterns/principles from `vaults/documentation/software-engineering/` and explain why they apply.
7. **Designs live in the documentation vault.** Decided designs become vault notes. The thread records decisions; the vault holds authoritative designs.

---

## Effect Engine Architecture

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

## The Three Views

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

## Ring 0 — Foundation

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

## Ring 1 — Playable Encounter (Critical Path)

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

## Ring 2 — Combat Depth

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

## Ring 3A — Entity Lifecycle

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

## Ring 3B — Spatial / VTT

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

## Ring 3C — Views + Capture (Sync Point)

Depends on Ring 3A + Ring 3B. Where entity lifecycle and spatial converge into the full user experience.

```
R3C.1   Full View System (GM/Player/Group at full fidelity, WebSocket role-based filtering)
R3C.2   Capture Workflow (PTR two-step, rate formula, ball modifiers, feeds into loyalty)
R3C.3   Out-of-Session Character Management (level up, assign traits, swap moves, manage inventory — no GM)
R3C.4   GM Session Prep (encounter building, NPC creation, scene design, campaign management)
```

**Exit criterion:** All three views at full fidelity. Capture works end-to-end. Players manage characters independently. GM can prepare session content.

---

## Ring 4 — World Building + Advanced

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

## Cross-Ring Dependencies

The rings are not fully sequential. Known cross-dependencies:

- **R2.8 (Combat Action Presentation)** is the hardest UI problem. Converges R2.1–R2.12. UI constraints flow backward into mechanics — if 20+ actions are overwhelming on a phone, the UI informs which actions to surface vs. collapse.
- **R3B.2 (Grid)** has soft dependencies on R2.1 (status effects on tokens), R2.3 (weather visualization), R0.A (movement type effects). These are rendering layers, not blockers.
- **R3C.1 (Full View System)** — the framework is R1.6, but capability enumeration grows through Rings 2–4.
- **R4.1 (Training)** is the most dependent leaf — needs R3A.1–R3A.5, R2.11, R3A.2.
- **Ring 3A and 3B** run in parallel. **Ring 3C** is the sync point that depends on both.

---

## Item Count Summary

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

