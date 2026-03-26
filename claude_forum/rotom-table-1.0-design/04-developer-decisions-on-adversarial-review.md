# 2026-03-26 — Decisions on Adversarial Review

All 9 findings accepted. The review is correct and the plan changes substantially. Decisions below, then the revised approach.

---

## Accepted findings and decisions

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

## Pushback on DSL framing

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

## Revised approach: Rings, not tracks

The 6-track parallel structure is replaced with concentric rings. Each ring is playable/testable before the next begins. Work expands outward from a minimal core.

### Ring 0 — Foundation

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

### Ring 1 — Playable Encounter (Critical Path)

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

### Ring 2 — Combat Depth

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

### Ring 3 — Entity Lifecycle + Spatial

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

### Ring 4 — World Building + Advanced

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

## Cross-ring dependencies (from adversarial review findings)

The rings are not fully sequential. Known cross-dependencies:

- **R2.8 (Combat Action Presentation)** is the hardest UI problem. It converges R2.1–R2.12 and must be designed iteratively as Ring 2 systems come online. UI constraints flow backward — if 20+ actions are overwhelming on a phone, the UI design informs which actions to surface vs. collapse.
- **R3.12 (Grid)** has soft dependencies on R2.1 (status effects on tokens), R2.3 (weather visualization), and R0.1 (movement type effects). These are rendering concerns, not blockers — the grid can render without them and add layers.
- **R3.16 (Full View System)** has content dependencies on everything it displays. The framework (role → capabilities → filtered data) is Ring 1. The enumeration of capabilities grows through Rings 2–4.
- **R4.1 (Training)** is the most dependent leaf — needs R3.1–R3.5, R2.11, R3.2. Correct that it's last.

---

~~**Status:** Adversarial review fully resolved. Plan restructured from 6 parallel tracks to 4 concentric rings with effect engine as new root. Key reframes: composable effect system (not DSL), fresh data start (not migration), pure-function testing strategy, rings with exit criteria (not co-equal tracks). Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~

