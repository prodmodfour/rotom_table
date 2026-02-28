---
title: Additional Findings (Incorrect & Approximation)
audited_at: 2026-02-28T08:00:00Z
items: 6
incorrect: 2
approximation: 4
---

# Additional Findings: Incorrect & Approximation Items

Items discovered during the full audit that deviate from PTU rules. These were found while verifying queue items and checking adjacent mechanics.

---

## Incorrect Items

### combat-R082 — Struggle Attack (Expert Combat Upgrade Missing)

- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type." AND "if a Trainer or Pokemon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5." (PTU p.240)
- **Expected behavior:** Struggle in maneuver constant should have AC 4 / DB 4, with dynamic upgrade to AC 3 / DB 5 if Combat skill is Expert+.
- **Actual behavior:**
  - `app/constants/combatManeuvers.ts:18-27` — Struggle is not in the maneuver list. The "Struggle Attack" concept exists as a known entity in the UI but its stats are hardcoded as a fixed entry without Expert Combat upgrade logic.
  - The matrix marks combat-R082 as Implemented with "AC 4, DB 4, Melee, Physical, Normal in maneuvers." But combat-R083 (Expert upgrade) is Missing.
- **Classification:** **Incorrect** — MEDIUM severity
- **Note:** The base Struggle Attack (AC 4, DB 4) is correct, but the Expert Combat upgrade is a completely missing mechanic. This is more accurately "Partial" for R082 since the base values are right.
- **Revised assessment:** R082 base values are **Correct**. R083 Expert upgrade is **Missing** (already captured in matrix). Reclassifying R082 to Correct.

---

### combat-R113 — Sprint Maneuver Action Type

- **Rule:** PTU p.245: Sprint is defined as using "Standard Action and Shift Action" (Full Action) — "The Take a Breather (page 245), Coup de Grace (251), and Intercept (242) Actions are all Full Actions." PTU p.242: Sprint description says user "adds 50% to Movement Capabilities for the round" as a Standard Action, then shifts.
- **Expected behavior:** Sprint uses a Standard Action (not Full Action). The movement boost applies alongside the Shift Action.
- **Actual behavior:**
  - `app/constants/combatManeuvers.ts:30-37` — Sprint defined as `actionType: 'standard'`, `actionLabel: 'Standard'`. Correct.
  - `app/server/api/encounters/[id]/sprint.post.ts` — Adds 'Sprint' tempCondition for +50% movement. Does NOT consume the standard action via turnState.
  - **Gap:** The sprint endpoint does not mark `standardActionUsed: true`. The action consumption is left to the client/GM. The breather endpoint correctly marks both actions, but sprint does not.
- **Classification:** **Incorrect** — LOW severity
- **Note:** The sprint endpoint should consume the standard action (and optionally mark the shift as used since the Sprint movement IS the shift). Currently the maneuver is a tempCondition add without action tracking.

---

## Approximation Items

### combat-R017 — Damage Base Table (Rolled Mode)

- **Rule:** PTU provides both rolled and set damage charts (PTU p.237). "Which Chart you use is up to your GM."
- **Expected behavior:** Both rolled and set damage modes available.
- **Actual behavior:**
  - `app/utils/damageCalculation.ts:47-76` — `DAMAGE_BASE_CHART` only stores `{ min, avg, max }`. `getSetDamage` returns `avg`.
  - `app/utils/diceRoller.ts` — Dice roller utility exists and can roll arbitrary notation.
  - `app/composables/useDamageCalculation.ts` — `rollDamageBase` method rolls actual dice for the damage step.
  - `app/composables/useMoveCalculation.ts:616-619` — `rollDamage` uses `rollDamageBase` which does roll real dice.
  - The AppSettings `damageMode` field exists to toggle.
- **Classification:** **Approximation** — MEDIUM severity
- **Note:** The rolled damage path exists in the composable layer (client-side) but the pure `calculateDamage` utility in `damageCalculation.ts` only supports set damage. The server-side damage endpoint (`damage.post.ts`) receives pre-computed damage values. Both modes are functionally available but the utility API doesn't cleanly expose rolled mode.

---

### combat-R060 — Speed CS Affect Movement

- **Rule:** PTU p.235: "Speed Combat Stages in the Speed Stat are special; they affect the movement capabilities of the Trainer or Pokemon" with +/-1 movement per 2 speed CS levels.
- **Expected behavior:** VTT pathfinding/movement incorporates speed CS into movement allowance.
- **Actual behavior:**
  - `app/composables/useCombat.ts:154-161` — `calculateMovementModifier(speedCS)` returns `floor(speedCS / 2)`. `calculateEffectiveMovement(base, speedCS)` returns `max(2, base + modifier)`.
  - **Gap:** These functions exist but the VTT pathfinding (`app/composables/useGridMovement.ts`) does not call them. Movement allowance in the grid is derived from the combatant's base overland capability, not adjusted by speed CS.
- **Classification:** **Approximation** — MEDIUM severity
- **Note:** The calculation is correct in isolation. The integration with the VTT movement system is missing. GM can mentally adjust movement.

---

### combat-R024 — Increased Critical Hit Range

- **Rule:** "Some Moves or effects may cause increased critical ranges, making Critical Hits possible on Accuracy Rolls lower than 20." (PTU p.236)
- **Expected behavior:** Crit range adjustable per move/effect.
- **Actual behavior:**
  - `app/composables/useMoveCalculation.ts:610-614` — `isCriticalHit` only checks `isNat20`. No support for expanded crit ranges (e.g., 18-20 for High Crit moves).
  - The MoveTargetModal has a manual crit toggle (GM can force crit), but no automated crit range expansion based on move properties.
- **Classification:** **Approximation** — LOW severity
- **Note:** The manual crit toggle provides a workaround. Automated crit range from move data would require storing crit range on MoveData and checking against it in the accuracy pipeline.

---

### combat-R134 — Armor DR Damage Class Discrimination

- **Rule:** PTU errata p.4: "Light Armor grants +5 DR against Physical Damage. Special Armor grants +5 DR against Special Damage. Heavy Armor grants +5 DR against all Damage."
- **Expected behavior:** DR from Light Armor applies only to Physical attacks. DR from Special Armor applies only to Special attacks. Heavy Armor applies to all.
- **Actual behavior:** `app/utils/equipmentBonuses.ts:62-66` — All `damageReduction` values summed without damage class discrimination. Equipment items store a flat `damageReduction` number without an associated `damageClass` field.
- **Classification:** **Approximation** — MEDIUM severity
- **Note:** Documented in Tier 6. Heavy Armor users (most common armor type) are unaffected since it applies to all damage. Light/Special Armor users would have their DR incorrectly applied to the wrong damage class.
