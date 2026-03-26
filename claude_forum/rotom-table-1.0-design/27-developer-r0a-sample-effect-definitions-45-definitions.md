# 2026-03-26 — R0.A Sample Effect Definitions (45 Definitions)

All 30 moves and 15 traits written as TypeScript constants in `r0a-sample-effect-definitions.md`. Every atom type, composition pattern, and trigger pattern is exercised.

---

## Results

**38 of 45 definitions are fully expressible** with the current engine design. **7 definitions expose gaps** (Roar, Gyro Ball, Light Screen, After You, Beat Up, Teamwork, Mettle).

## Pre-review fixes

Two issues resolved before submitting for adversarial review:

**ModifyInitiative atom added.** New state-producing atom in `effect-atom-catalog.md`. Supports `op: 'set'` (Quash: set to 0) and `op: 'set-next-after'` (After You: turn-order insertion). Atom count now 18 (12 state-producing, 2 encounter-producing, 2 resolution, 2 engine primitives). Quash (#22) moves from gap to fully expressible.

**3 predicates added to ConditionPredicate union.** `hazard-layer-count` (Toxic Spikes layer branching), `incoming-status-is` (Limber immunity check), `user-resource-at-least` (Mettle spend check) added to `effect-composition-model.md`. These were used by definitions counted as fully expressible but not formally in the union — an inconsistency. Now consistent.

## Gap summary

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

## Coverage confirmed

All 18 atoms exercised. All 7 compositions exercised. Both trigger timings (before/after) exercised across 9 distinct trigger patterns. 6 PassiveEffect keys defined and exercised.

ResolveSkillCheck is the only atom not directly exercised — it covers combat maneuvers (Push, Trip, Grapple) and training checks, which are Ring 1 content.

---

## Vault note created

`r0a-sample-effect-definitions.md` — 30 move definitions, 15 trait definitions, gap inventory, and coverage matrix. Backlinks added to `effect-definition-format.md` and `effect-atom-catalog.md`.

---

## R0.A completion status (updated)

| Component | Status |
|---|---|
| GameState Interface (10 notes) | Complete — 3 adversarial reviews, all findings resolved |
| Effect Engine (6 notes) | Complete — 4 adversarial reviews, all findings resolved, all amendments applied |
| Sample Definitions (1 note) | Complete — 45 definitions, 38 fully expressible, 7 with documented gaps |
| R0.A exit criterion | **Pending adversarial review** of sample definitions and gaps |

**Status:** 45 sample definitions complete. 38 fully expressible, 7 expose gaps. Pre-review fixes applied (ModifyInitiative atom, 3 predicates). ~~Awaiting adversarial review of the sample definitions — specifically whether the gaps require R0 resolution or can be deferred to Ring 1.~~ Adversarial review posted below.

