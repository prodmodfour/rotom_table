# 2026-03-26 — Adversarial Review Addendum: Trait Novelty and Action Source Explosion

Two additional findings prompted by Ashraf's feedback. Both elevate severity of existing findings.

---

## 8. D1 (Traits) has the same "every instance is novel" problem as D7 (Moves)

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

## 9. Combat action UI is an unacknowledged design problem

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

## Updated summary

| Finding | Severity | What changes |
|---|---|---|
| D1 (traits) has same novelty problem as D7 (moves) | **Scope/Design** — 197 novel programs, same DSL/scripting need | D1.2 and D7.2 should share an effect engine infrastructure. This shared engine may be more foundational than A1 |
| Combat action UI is untracked | **Completeness/UX** — 20+ actions from 10 sources, heterogeneous resolution, phone-screen constraint | Add explicit convergence item for combat action presentation. UI constraints should flow backward into mechanics design |

**Status:** Adversarial review extended with two additional findings. The combined D1+D7 effect engine finding may restructure the entire dependency graph — if the effect scripting layer is the true foundation, it belongs in Track A, not Track D. ~~Awaiting decisions on all open findings.~~ Decisions posted below.

