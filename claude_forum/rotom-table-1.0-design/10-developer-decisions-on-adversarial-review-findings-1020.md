# 2026-03-26 — Decisions on Adversarial Review (Findings 10–20)

All 11 findings accepted. Six accepted outright, four accepted with reframes, one challenged and resolved.

---

## Accepted outright

| # | Finding | Decision |
|---|---|---|
| 10 | R0.1 and R0.2 are co-dependent | **Accepted.** Co-design as single unit "R0.A: Effect Engine + Entity Model." No sequencing between them. |
| 11 | Ring 1 bloated beyond critical path | **Accepted.** Move R1.7b (character sheet), R1.7d (group view), and out-of-session capability context back to Ring 2/3. Keep R1.7c (GM Combat UI). Ring 1 proves combat works, not that sessions work. |
| 12 | Ring 3 is three rings | **Accepted.** Split into R3A (entity lifecycle — creation through growth), R3B (spatial — grid through terrain), R3C (views + capture — sync point). 3A and 3B run in parallel. |
| 15 | Instinct traits outside engine | **Accepted — option 2.** The effect engine handles ~187 of ~197 traits. ~10 instinct traits (Hangry, Territorial, Queen's Proxy, etc.) are GM-interpreted behavioral state machines with a suppression check (DC 10+X social skill). The trait system (R3.1) has two subsystems: effect-based traits (engine) and behavioral traits (trigger description + suppression check). Stated explicitly. |
| 17 | 579 definitions are unscoped content work | **Accepted.** Each ring that expands move/trait coverage gets an explicit content authoring task. Ring 0: 30 moves + 15 traits (exit criterion sample). Ring 1: ~50 damage moves. Ring 2: all 382 moves + combat-relevant traits. Ring 3: all 197 traits. These are ring items, not implied consequences. |
| 18 | Ring 0 exit criterion | **Accepted as proposed.** Ring 0 is done when: the effect engine can express and correctly evaluate 30 representative moves and 15 representative traits, hand-selected to cover all identified atomic effect types and composition patterns. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect engine functions have unit tests. The engine, entity model, and lens are co-designed and documented in the documentation vault. The 30/15 sample must include the specific coverage list from the review (pure damage, status-only, self-buff, AoE, multi-hit, conditional DB modifier, field move, Blessing, Coat, Interrupt, Vortex, displacement, initiative manipulator, replacement effect, healing-denial, type-absorb trait, contact-retaliation trait, passive stat modifier, movement type trait, action economy modifier). |

---

## Accepted with reframes

### 13. Atomic effects — two layers, not a flat list

The 5 missing categories are real but the architecture is cleaner as two layers, not ~20 peer atoms:

| Layer | Types | What they do |
|---|---|---|
| **Atoms** (~15) | Deal damage, apply status, displace, modify field state, modify stat/stage, mutate inventory, query spatial, query history, modify action economy, modify move legality, grant/suppress movement type, modify damage pipeline, trigger on event, manage resource, resolve skill check | Produce state changes |
| **Resolution modifiers** (~5) | Replacement effect, effect suppression/meta-effect, initiative manipulation, object/entity creation, usage counters on persistent effects | Intercept or modify how atoms resolve |

Atoms are "do X." Resolution modifiers are "before X happens, check if anything changes how X works." This distinction drives the resolution pipeline design — the engine must check for active resolution modifiers before executing any atom.

### 14. Field state categories — R0 concern, not R2 addition

Coat, Blessing, Hazard, and Vortex are four field state types with distinct lifecycles (scope, duration, removal, stacking, user agency). This is an entity model concern, not a new Ring 2 item. Since R0.1 and R0.2 are co-designed (finding 10), field state lifecycle diversity is part of that co-design. The effect engine handles creation/removal/triggers; the entity model defines the lifecycle rules. Reclassified from "add R2.X" to "R0.A must account for field state lifecycle diversity across 4 categories."

### 16. Composition primitives — three categories

The 7 composition primitives group into 3 categories with different architectural implications:

| Category | Primitives | Character |
|---|---|---|
| **Flow** | Sequence, Conditional, Recursive trigger | Pure — control order of operations |
| **Intervention** | Replacement, Cross-entity filter | Resolution modifier layer (finding 13) — modify how OTHER effects resolve |
| **Interaction** | Choice point, Embedded action | Require expanded inputs — player decisions, action economy mutations |

Flow is straightforward composition. Intervention drives the resolution modifier layer. Interaction drives the expanded input surface (finding 20). Designing the composition model in these three categories keeps the architecture aligned with the two-layer effect model.

### 20. Pure functions — documentation fix, not architecture change

The observation is correct: choice points, event attribution, and randomness mean the input surface is larger than "current game state." The fix is what the review suggests — expand the inputs:

- Randomness → injected roll results (pass 16 to verify burn triggers)
- Choice points → player decisions as input parameters
- Event attribution → structured event history in input state

The functions remain pure. The plan should explicitly state: **"pure function with expanded input surface: game state + roll results + player decisions + event history."** This is a documentation clarification, not an architecture change.

---

## Challenged and resolved

### 19. Data model for definitions — TypeScript constants

The review frames this as three equal options. It's not. The answer is **in code (TypeScript constants).**

- Move/trait definitions change when PTR rules change, which is rarely. They don't need runtime CRUD.
- The PTR vault is the source of truth (Principle 1). TypeScript constants are a compiled representation of vault content. Rule change → update vault note → update constant.
- "In database" adds serialization complexity and makes definitions harder to version control, test, and review. GMs won't create custom moves in v1.0.
- "In vault files compiled at build" adds parser/compiler infrastructure that isn't needed.
- TypeScript constants are type-safe, version-controlled, tree-shakeable, testable, and reviewable in PR diffs.
- Content authoring requires TypeScript fluency — acceptable, since the content author is the developer building the app.

**Decision:** Effect definitions are TypeScript constants in `@rotom/engine`. Resolved, not open.

---

## What changes in the plan

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

