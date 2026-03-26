# 2026-03-26 — Adversarial Review of Full Plan

Eleven findings organized into three categories: structural problems with the ring model, gaps in the effect engine design, and unscoped work the plan doesn't acknowledge.

---

## Structural

---

### 10. R0.1 and R0.2 are co-dependent, not sequential

The plan says R0.1 (Effect Engine) is "the absolute root" and R0.2 (Entity Model) depends on it. This ordering is false. They're mutually dependent:

- Effects need to know what state exists to modify it. "Deal damage" implies HP. "Modify stat stage" implies stat stages. "Steal held item" implies an inventory model. You cannot define atomic effect types without knowing the entity model's shape.
- Entities need to know what effects look like to reference them. A Pokemon's traits are effect programs. A move is an effect program. The entity model references the effect engine.

This is a co-design problem, not a sequence. If you lock R0.1 first, you'll discover during R0.2 that the entity model needs state the effect engine didn't anticipate (e.g. field state categories — see finding 14). If you lock R0.2 first, you'll discover during R0.1 that the effects need entity fields that don't exist.

**Impact:** R0.1 and R0.2 should be treated as a single design unit — "R0.A: Effect Engine + Entity Model" — co-designed, co-validated, and shipped together. Trying to sequence them will produce rework.

---

### 11. Ring 1 is no longer the critical path

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

### 12. Ring 3 is three rings wearing a trenchcoat

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

## Effect Engine Design Gaps

---

### 13. The atomic effect count is ~20, not ~15 — and the missing ones are structurally important

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

### 14. Field state categories (Coat, Blessing, Hazard, Vortex) are a hidden subsystem

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

### 15. Instinct traits are outside the effect engine's scope

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

### 16. Composition is harder than "sequence + conditional"

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

## Unscoped Work

---

### 17. 579 effect definitions are unscoped content work

The plan scopes the effect engine (build the system) and validates it against samples. But 382 moves and 197 traits must each be defined as compositions of atomic effects. This is a massive content authoring effort:

- **Who writes the definitions?** Each move's vault note describes its behavior in natural language. Someone must translate "The target reveals their Speed Stat. If it is higher than the user's, subtract the user's Speed from the target's and apply the difference as Bonus Damage" (Gyro Ball) into a formal effect composition. This requires understanding both the game rules and the effect engine's composition model.
- **In what format?** TypeScript objects? JSON? A structured vault note format? The format determines the tooling needed.
- **How are they validated?** Each definition must be verified against the PTR vault to ensure it correctly captures the move/trait's behavior. 579 verification passes.
- **When does this happen?** Ring 1 needs "damage moves only" — maybe 50 moves. Ring 2 needs "full move resolution" — all 382 moves. Ring 3 needs "full trait system" — all 197 traits. The content work scales with each ring but isn't tracked in any ring.

This is arguably the largest single work item in the project by volume. 579 individual translations from natural language to formal specification. It's not engineering work — it's content work — and the plan doesn't track it, estimate it, or assign it.

**Impact:** Each ring that expands move/trait coverage needs an explicit content authoring task. Ring 1: define ~50 representative damage moves. Ring 2: define all 382 moves + combat-relevant traits. Ring 3: define all 197 traits. These should be Ring items, not implied consequences of "the effect engine exists."

---

### 18. Ring 0 needs an exit criterion

Already flagged in the handoff, but worth formalizing. Without an exit criterion, Ring 0 can expand indefinitely as edge cases are discovered ("we need one more atom type," "the composition model doesn't handle X").

Proposed exit criterion: **"The effect engine can express and correctly evaluate 30 representative moves and 15 representative traits, hand-selected to cover all identified atomic effect types and composition patterns. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect engine functions have unit tests. The engine, entity model, and lens are co-designed and documented in the documentation vault."**

The 30/15 sample should include at minimum: a pure damage move, a status-only move, a self-buff, an AoE, a multi-hit, a conditional DB modifier (Gyro Ball), a field move (Toxic Spikes), a Blessing (Safeguard), a Coat (Aqua Ring), an Interrupt (Wide Guard), a Vortex (Whirlpool), a displacement move, an initiative manipulator (Quash), a replacement effect (Psyshock), a healing-denial effect (Heal Block), a type-absorb trait (Volt Absorb), a contact-retaliation trait (Rough Skin), a passive stat modifier, a movement type trait, an action economy modifier (Opportunist).

If these 45 definitions work, the engine is validated. If any can't be expressed, the engine needs revision before moving to Ring 1.

---

### 19. Data model for effect definitions is unspecified

Where do move/trait definitions live? The plan doesn't say. Three options, each with architecture-shaping consequences:

| Option | Pros | Cons | Affects |
|---|---|---|---|
| **In code** (TypeScript constants) | Type-safe, version-controlled, IDE support, tree-shakeable | Requires deploy to change; no CRUD; content authoring = code authoring | R0.4 (engine scaffold), R1.8 (service layer — no runtime definition loading) |
| **In database** (Prisma models) | Dynamic, CRUD-able, GM could eventually create custom moves | Hard to version control, schema migration for each new atom type, serialization complexity | R0.2 (entity model), R0.4 (engine must deserialize and interpret at runtime) |
| **In vault files** (compiled at build) | Human-readable, bridges vault→app, vault IS the source of truth | Needs parser/compiler infrastructure, new tool to build and maintain | R0.4 (engine scaffold needs compiler), adds infrastructure Ring 0 doesn't scope |

This decision interacts with finding 17 (content authoring). If definitions are in code, content authoring requires TypeScript fluency. If in the database, content authoring happens through a UI (which doesn't exist yet). If in vault files, content authoring happens in Obsidian (which exists) but requires a build pipeline (which doesn't).

**Impact:** The data model question must be answered in Ring 0. It shapes the engine scaffold (R0.4), the entity model's relationship to effect definitions (R0.2), and the content authoring workflow (finding 17).

---

### 20. "Pure functions" breaks at choice points and event attribution

The testing strategy says "effect engine functions are pure (input state → output state), unit-testable by design." This holds for deterministic effects (damage pipeline, stat modification, status application) but breaks for:

- **Choice points:** Safeguard says "affected user MAY activate." This is a player decision mid-resolution. A pure function can't pause for player input. Either the choice is an input parameter (which means the caller must know to ask the player and pass the answer) or the effect function must interact with a decision interface (not pure).
- **Event attribution:** Destiny Bond asks "did THIS target cause the user to faint?" This requires a combat event log that tracks causality — who caused each HP change, which attack triggered a faint. The input state must include a structured event history, not just current stats.
- **Randomness:** Lava Plume "Burns on 16+" requires a d20 roll. Pure functions don't generate random numbers. Either the roll is an input parameter (testable — you can pass 16 to verify the burn triggers) or the function calls a random source (not pure).

These are solvable — randomness is typically handled by injecting the roll result as a parameter, and choice points can be modeled as inputs. But the plan should acknowledge that "pure function" means "pure function with an expanded input surface that includes roll results, player decisions, and event history" — not the simpler model the plan implies.

---

## Summary of findings

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

## What the plan gets right

The ring structure (concentric expansion from minimal core) is the correct model. Composable effects over DSL is the correct framing — the atoms are finite (~20), the novelty is in composition. Fresh data start is correct. The three-view triad is correctly identified as foundational. The functionality catalog is comprehensive. The "shortest path to playable encounter" principle is correct — Ring 1 just drifted from it.

The most important finding is **16 (composition complexity)**. The plan's implicit model for composition is simple ("sequences of effects with conditional gates"). The actual composition model needs replacement effects, choice points, cross-entity filters, recursive triggers, and embedded actions. This is the gap between "data modeling problem" and "small but real interpreter" — still not a DSL, but more machinery than the plan currently scopes.

The most actionable finding is **18 (Ring 0 exit criterion)**. Without it, Ring 0 has no definition of done. The proposed exit criterion (30 moves + 15 traits covering all atoms and composition patterns) makes Ring 0 bounded and testable.

**Status:** Adversarial review of full plan complete. ~~Awaiting decisions on findings 10–20.~~ Decisions posted below.

