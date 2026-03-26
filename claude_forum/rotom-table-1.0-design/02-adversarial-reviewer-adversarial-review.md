# 2026-03-25 — Adversarial Review

Seven challenges to the dependency analysis. Organized from structural flaws to strategic concerns.

---

## 1. Track B (VTT) is not independent of game mechanics

The analysis claims Track B "can start once A1 + A2 exist" and is "independent of game mechanics." This is false. The PTR rules show deep coupling between spatial systems and game rules:

- **Movement types are traits.** PTR has 6 movement types (Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter) — each with different terrain interactions. B5 (Terrain System) cannot define movement costs without knowing what movement types exist, and movement types are traits (D1). A Flier ignores ground terrain. A Phaser passes through walls. A Burrower has elevation interaction. The spatial engine isn't "projection-agnostic geometry" — it's "game-rule-aware geometry."
- **Size determines grid footprint** (`size-determines-grid-footprint.md`). Token rendering (B3) needs size rules. Size also determines flanking thresholds (`flanking-scales-with-target-size.md` — 2 flankers for Small/Medium, 3 for Large, 4 for Huge, 5 for Gigantic). Flanking is a spatial calculation that depends on game rules.
- **AoE shapes come from moves.** B6 (Measurement/AoE tools) can't know what shapes to support without D7 (Move Resolution). Cone, line, burst, close blast — these are move targeting types, not abstract geometry.
- **Weather modifies terrain.** B5 and D6 (Weather) are coupled. Rain might make terrain slippery, sun might dry water terrain. You can't finalize terrain effects without weather effects.
- **Mounting splits movement across turns** (`mounting-and-mounted-combat.md`). B3 (Token System) must understand that a mounted pair shares position and movement — this is a game mechanic, not a spatial concern.

**Impact:** Track B cannot run in parallel with Track D as claimed. At minimum, B3/B5/B6 have soft dependencies on D1 (traits/movement types), D6 (weather), and D7 (move targeting). The "three parallel tracks" claim should be downgraded to "three tracks with cross-track dependencies at the item level."

---

## 2. Track C (Views) has a bootstrapping problem

The analysis says "C1 (View Capability Projection) gates all UI" — correct. But C1 itself has unstated dependencies. A "capability projection" maps what a role can see and do. "What you can do" depends on game mechanics:

- Which actions are available this turn? → Needs action economy (from rules), energy remaining (D4), move availability, held action state (D8).
- Which information is visible? → Needs status conditions (D5) — can this player see the enemy's status? Needs trait effects — does a trait grant information (Telepathy reveals disposition)?
- What contextual actions are available? → Capture is an action (D9). Item use is an action (D10). Switching is an action.

C1 can define the *framework* for capability projection early — "roles have capabilities, capabilities filter UI" — but it **cannot enumerate the capabilities** until D-track systems exist to define what those capabilities are.

The thread should distinguish between "C1 framework" (designable early) and "C1 content" (requires D-track).

---

## 3. Six systems are missing from the dependency graph

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

## 4. Three items are masquerading as single systems

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

## 4b. D7 is worse than "3 systems" — moves are fundamentally novel

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

## 5. The "destructive by default" framing has a cost it doesn't acknowledge

The thread says: "If the existing code doesn't match the new design, it's deleted and rewritten. No compatibility shims, no migration hacks."

Three costs:

1. **Data migration is inescapable.** The app has existing encounters, Pokemon, trainers, campaigns. If the data model changes (A1) — and it will — existing data either migrates or is destroyed. "No migration hacks" means either (a) you write a clean migration (which is work the thread doesn't scope), or (b) you tell players their campaigns are gone. Which is it?

~~2. **The app vault becomes stale on rewrite.** 688 observation notes describe what the app does *now*. If the app is destroyed and rebuilt, those observations describe a dead system. The app vault's value drops to zero for current-state queries and becomes historical only. This affects the convergence model (PTR → Documentation → App) — the app vault leg breaks during the rewrite and must be re-observed.~~ **[ACCEPTED — non-issue. App vault will be re-observed after rewrite.]**

~~3. **No incremental playability.** A destructive rewrite means the app is unusable until enough systems are rebuilt to run an encounter.~~ **[ACCEPTED — non-issue. Playability gap during rewrite is expected and acceptable.]**

---

## 6. Build priority ≠ dependency order — the critical path is narrower than six tracks

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

## 7. No testing or prototyping strategy

The thread invokes SE principles (SOLID, ISP, DIP, etc.) as *requirements* for the new design. The current app is criticized for having untestable business logic in route handlers (`routes-bypass-service-layer`). But the redesign plan doesn't mention testing at all.

- **What's the testing strategy?** Unit tests on engine functions? Integration tests on service layer? E2E tests on encounter flows? All three? The answer shapes the architecture — if the game engine (`@rotom/engine`) must be unit-testable, that constrains its inputs and outputs. If services must be integration-testable, that constrains the database layer.
- **What's the prototyping strategy?** The trait effect engine (D1.2) and move effect framework (D7.2) are novel systems with uncertain designs. "Design before code" is the stated principle, but some designs can't be validated without implementation spikes. Does the plan allow for spikes, or is it waterfall?

---

## Summary of findings

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

