---
type: rules-review
id: rules-review-test-integrity-001
trigger: test-integrity-audit-001
scope: all combat PTU mechanics — damage, stages, STAB, type effectiveness, capture, HP, evasion, injuries
verdict: CHANGES_REQUIRED
date: 2026-02-16
reviewed_by: game-logic-reviewer
---

# Rules Review — Test Integrity Cross-Reference

## Summary

Cross-referenced the 8 core PTU mechanics identified in `test-integrity-audit-001` against:
- Server code in `app/server/api/` and `app/server/services/`
- Client code in `app/composables/` and `app/utils/`
- PTU 1.05 rulebook (`books/markdown/core/`)

**Finding:** 4 of 8 mechanics have NO server-side computation. The server is a **damage application layer** — it tracks HP, injuries, faint, and stages, but all offensive combat math (damage formula, STAB, type effectiveness, stage multipliers) lives exclusively on the client. Tests that claim to verify these formulas are passing pre-computed numbers to the server and asserting the echo.

The capture rate system is the exception — it is fully server-computed and genuinely tested. It should be the model for damage computation.

---

## Per-Mechanic Assessment

### 1. Damage Formula (Set Damage + ATK - DEF)

| | |
|---|---|
| **PTU Rule** | 9-step process (07-combat.md:834-847): find DB → apply Five/Double-Strike → add DB modifiers (STAB) → modify for crit → roll/set damage from chart → add ATK stat + bonuses → subtract DEF stat + damage reduction → apply type effectiveness multiplier → subtract from HP |
| **Server** | `POST /encounters/:id/damage` receives `{ combatantId, damage: number }` — a pre-computed final damage value. `combatant.service.ts:calculateDamage()` does HP subtraction, temp HP absorption, massive damage check, faint detection. **No move data, no attacker stats, no defender stats, no DB chart lookup.** |
| **Client** | `useMoveCalculation.ts:212-296` and `useCombat.ts:172-218` implement the full formula. `useCombat.ts:93-131` has the DB→set damage chart. |
| **Tests** | 17 of 30 spec files hardcode damage values and pass them to `applyDamage()`, then assert the server echoed them back. |
| **Status** | **TESTED_TAUTOLOGICAL** |
| **Feature gap** | Server has no `calculate-damage` endpoint. The entire damage pipeline is client-only. |

### 2. Stage Multiplier Application

| | |
|---|---|
| **PTU Rule** | (07-combat.md:664-728) Positive stages: +20% per stage. Negative stages: -10% per stage. Asymmetric table from CS -6 (x0.4) to CS +6 (x2.2). |
| **Server** | `POST /encounters/:id/stages` stores stage values and clamps to [-6, +6] (`combatant.service.ts:248-308`). **Does NOT compute what stages mean for stat multipliers.** The server never applies x1.2 for +1 attack — it just stores `{ attack: 1 }`. |
| **Client** | `useCombat.ts:8-32` has the full multiplier table. `applyStageModifier()` at line 26 computes `floor(baseStat * multiplier)`. Used in `useMoveCalculation.ts:194,199,270,275` when calculating attack and defense stats for damage. |
| **Tests** | Stage clamping/stacking tests (e.g., `combat-combat-stages-001`) are GENUINE — they verify server stores and clamps correctly. But tests that assert stage-modified *damage* are tautological because the multiplication happens client-side. |
| **Status** | **TESTED_GENUINE** for storage/clamping. **NOT_TESTED** for multiplier-to-damage application (server doesn't do it). |
| **Feature gap** | Stage multiplier computation is client-only. A `calculate-damage` endpoint would need to apply these. |

### 3. STAB Bonus (+2 to Damage Base)

| | |
|---|---|
| **PTU Rule** | (07-combat.md:790-793) "If a Pokemon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2." Applied at step 3, before DB chart lookup. |
| **Server** | **No STAB code exists anywhere in `app/server/`.** Zero matches for "STAB", "stab", or "same type attack" in server code. |
| **Client** | `useMoveCalculation.ts:71-79` — `effectiveDB = hasSTAB ? move.damageBase + 2 : move.damageBase`. `useCombat.ts:311-313` — `hasSTAB()` checks if move type is in user's type list. |
| **Tests** | `combat-stab-001` hardcodes STAB and non-STAB damage values, passes them to the server. The +2 DB bonus is documented in comments but never computed by tested code. |
| **Status** | **TESTED_TAUTOLOGICAL** |
| **Feature gap** | Server cannot determine STAB. Would need attacker's types and move type. |

### 4. Type Effectiveness Calculation

| | |
|---|---|
| **PTU Rule** | (07-combat.md:780-787) Applied AFTER defense subtraction (step 8). PTU uses x1.5 for super effective (not x2 like video games). Doubly SE = x2.0, triply SE = x3.0. Resisted = x0.5, doubly resisted = x0.25. Immune = 0. |
| **Server** | **No type effectiveness code exists anywhere in `app/server/`.** Zero matches for "effectiveness", "type chart", "super effective" in server code. |
| **Client** | `useCombat.ts:242-275` — full 18-type chart with PTU multipliers (1.5/0.5/0). `getTypeEffectiveness()` multiplies across defender types. Applied in `useMoveCalculation.ts:285-296` after defense subtraction. |
| **Tests** | `combat-type-effectiveness-001` and `combat-type-immunity-001` hardcode SE/neutral/immune damage values, pass them to the server. The type chart lookup never executes in test. |
| **Status** | **TESTED_TAUTOLOGICAL** |
| **Feature gap** | Server cannot compute type effectiveness. Would need full type chart, move type, and defender types. |

### 5. Capture Rate Formula

| | |
|---|---|
| **PTU Rule** | (05-pokemon.md) Base 100, modified by level (-2×level), HP tier (+30 to -30), evolution stage (+10/0/-10), status conditions (+10 persistent, +5 volatile), injury (+5 each), shiny (-10), legendary (-30). |
| **Server** | `POST /api/capture/rate` and `POST /api/capture/attempt` — **full server-side computation** in `app/utils/captureRate.ts:1-224`. Server looks up species data from DB, computes every modifier, returns breakdown. |
| **Client** | `useCapture.ts` calls server endpoints, displays results. No client-side rate computation. |
| **Tests** | All 7 capture test files send parameters to the server and assert server-computed rates. These are genuine end-to-end tests. |
| **Status** | **TESTED_GENUINE** |
| **Note** | Bug found: `attempt.post.ts:53` and `rate.post.ts` have inconsistent `maxEvolutionStage` fallbacks when species data is missing (attempt defaults to 3, rate defaults to 1 — yielding opposite modifiers). |

### 6. HP Formula

| | |
|---|---|
| **PTU Rule** | (07-combat.md:621-623) Pokemon HP = `Level + (HP stat × 3) + 10`. Trainer HP = `(Level × 2) + (HP stat × 3) + 10`. |
| **Server** | `pokemon-generator.service.ts:116` — `level + (calculatedStats.hp * 3) + 10` using **calculated** HP stat (base + distributed level-up points). Stored as `maxHp` column at creation time, never recomputed. |
| **Client** | No client-side HP formula — reads `maxHp` from server. |
| **Tests** | Tests that fetch combatant data and check `maxHp` are testing a server-stored value computed at creation. Genuine. |
| **Status** | **TESTED_GENUINE** |
| **Bugs found** | (a) `encounter-templates/[id]/load.post.ts:85` uses `10 + level * 2` for template-loaded human combatants — this is NOT the PTU trainer HP formula (should be `(level * 2) + (HP stat * 3) + 10`). (b) `pokemon/index.post.ts:14` manual create uses raw `baseHp` not calculated HP, though client can override via `body.maxHp`. |

### 7. Evasion Calculation

| | |
|---|---|
| **PTU Rule** | (07-combat.md:594-615) "+1 Physical Evasion for every 5 points in Defense" — mathematically `floor(stat / 5)`, capped at +6. Same for Special Evasion (SpDef) and Speed Evasion (Speed). Uses **calculated stats** (after level-up distribution + nature). Separate evasion stage modifier track (-6 to +6). Total evasion applied to any single accuracy check capped at +9. |
| **Server** | `pokemon-generator.service.ts:301-303` computes `Math.floor(calculatedStat / 5)` for all three evasions at combatant creation. Also computed in `encounter-templates/[id]/load.post.ts:116-118` and `encounters/from-scene.post.ts:185-187`. **Computed once, embedded in combatant JSON, never recalculated during combat.** |
| **Client** | Tests in `combat-basic-physical-001` and `combat-basic-special-001` fetch stats from server, compute `floor(stat / 5)` client-side, assert their own arithmetic. |
| **Tests** | The server computes evasion at creation (genuine), but combat tests re-derive it client-side and assert the re-derivation (tautological). No test asserts the server-stored evasion value directly. |
| **Status** | **TESTED_TAUTOLOGICAL** (in combat tests — server value exists but tests don't assert it) |
| **Feature gap** | Evasion is static after creation. If combat stages boost defense during battle, the evasion bonus doesn't update server-side. The +9 cap is not enforced anywhere. |

### 8. Injury Thresholds

| | |
|---|---|
| **PTU Rule** | (07-combat.md:1837-1856) Two independent sources: (1) **Massive Damage** — single hit dealing ≥ 50% of max HP = 1 injury. (2) **HP Marker crossings** — passing through 50%, 0%, -50%, -100% (and every -50% below) = 1 injury each. These stack. Also: each injury reduces max HP by 1/10th; 5+ injuries = Heavily Injured (lose HP = injury count on each standard action or damage taken). |
| **Server** | `combatant.service.ts:50` — `injuryGained = hpDamage >= maxHp / 2` (massive damage only). HP clamped to `Math.max(0, ...)` at line 46, making negative HP and the -50%/-100% markers unreachable. **HP marker crossings are NOT implemented server-side.** |
| **Client** | `useCombat.ts:330-356` has both massive damage AND HP marker crossing checks (50%, 0%, -50%, -100%). However, since the server clamps HP ≥ 0, negative markers are unreachable from server state. |
| **Tests** | `combat-injury-massive-damage-001` tests massive damage injuries — GENUINE (server computes this). HP marker injury crossings are NOT tested at the server level. |
| **Status** | **TESTED_GENUINE** for massive damage. **NOT_TESTED** for HP marker injuries (server doesn't implement them). |
| **Feature gaps** | (a) Server doesn't track HP below 0, so -50%/-100% markers are impossible. (b) No max HP reduction per injury (1/10th rule). (c) No Heavily Injured bleed mechanic. (d) HP marker injury detection is client-only and disconnected from server injury tracking. |

---

## Classification Summary

| Mechanic | Server Computes? | Test Status | Gap Type |
|----------|-----------------|-------------|----------|
| Damage formula | NO — echoes client input | **TESTED_TAUTOLOGICAL** | Feature gap: no `calculate-damage` endpoint |
| Stage multipliers | NO — stores/clamps only | **NOT_TESTED** (multiplier→damage path) | Feature gap: multiplier math is client-only |
| STAB bonus | NO — not in server | **TESTED_TAUTOLOGICAL** | Feature gap: server has no STAB |
| Type effectiveness | NO — not in server | **TESTED_TAUTOLOGICAL** | Feature gap: server has no type chart |
| Capture rate | YES — full computation | **TESTED_GENUINE** | Minor bug: inconsistent evolution fallback |
| HP formula | YES — at creation time | **TESTED_GENUINE** | Bug: template human HP uses wrong formula |
| Evasion | YES — at creation time | **TESTED_TAUTOLOGICAL** | Static after creation; no combat recalc |
| Injury (massive dmg) | YES — 50% threshold | **TESTED_GENUINE** | — |
| Injury (HP markers) | NO — client only | **NOT_TESTED** | Feature gap: server clamps HP ≥ 0 |

**Scorecard: 3 GENUINE, 4 TAUTOLOGICAL, 2 NOT_TESTED** (out of 9 mechanic checks)

---

## Bugs Discovered During Review

### BUG-1: Template Human HP Formula (CRITICAL)

**File:** `app/server/api/encounter-templates/[id]/load.post.ts:85`
**Code:** `maxHp: 10 + level * 2`
**Expected (PTU):** `maxHp: (level * 2) + (hpStat * 3) + 10`
**Impact:** Template-loaded human combatants will have drastically wrong HP. A level 10 trainer with HP stat 5 should have `20 + 15 + 10 = 45` HP but gets `10 + 20 = 30`.

### BUG-2: Capture Rate Evolution Fallback Inconsistency (HIGH)

**File:** `app/server/api/capture/attempt.post.ts:53` vs `app/server/api/capture/rate.post.ts`
**Issue:** When species data is missing, `attempt.post.ts` defaults `maxEvolutionStage` to `Math.max(3, evolutionStage)` (always ≥ 3, giving `evolutionsRemaining ≥ 2` → +10 bonus). `rate.post.ts` defaults both to 1 (giving `evolutionsRemaining = 0` → -10 penalty). Same missing species yields opposite modifiers depending on which endpoint is called.

### BUG-3: Server Missing HP Marker Injuries (HIGH)

**File:** `app/server/services/combatant.service.ts:28-65`
**Issue:** Only checks massive damage. PTU rules explicitly state injuries also occur when crossing 50%, 0%, -50%, -100% HP markers. The client has this logic but the server doesn't, creating a split source of truth for injury tracking.

### BUG-4: Server Clamps HP to 0, Blocking Negative HP Markers (MEDIUM)

**File:** `app/server/services/combatant.service.ts:46`
**Code:** `newHp = Math.max(0, currentHp - hpDamage)`
**Issue:** PTU allows HP to go negative (to -100% and below) for injury marker purposes. Server prevents this. The -50% and -100% HP marker injuries from BUG-3 are doubly unreachable.

### BUG-5: Evasion Never Recalculated During Combat (MEDIUM)

**File:** `app/server/services/pokemon-generator.service.ts:301-303`
**Issue:** Evasion is `floor(calculatedStat / 5)` computed once at combatant creation. If defense is boosted by +3 combat stages during battle (stat becomes x1.6), the base evasion doesn't update. PTU rules imply evasion should reflect the current (stage-modified) stat, since "Stat Evasion is also equal to 20% of a Stat" (07-combat.md:684-689).

---

## Architectural Assessment

The server architecture splits into two clear tiers:

**Tier 1 — Server as source of truth (genuinely tested):**
- Capture rate computation (full PTU formula)
- HP computation at creation (correct formula, stored in DB)
- Faint detection (HP ≤ 0)
- Massive damage injury (≥ 50% maxHp)
- Combat stage storage and clamping (-6 to +6)
- Status condition management
- Rest/healing mechanics (with time tracking)
- Turn/initiative management

**Tier 2 — Client as source of truth (untested or tautological):**
- Damage formula (DB chart → set damage → +ATK → -DEF)
- STAB (+2 to DB)
- Type effectiveness (18-type chart, multiplier after defense)
- Stage multiplier application (asymmetric +20%/-10%)
- HP marker injury detection
- Evasion from stage-modified stats
- Critical hit damage computation (double dice portion only)

Every mechanic in Tier 2 is either TESTED_TAUTOLOGICAL or NOT_TESTED at the server level. The e2e tests for these mechanics are structurally valid (they test HP tracking and state persistence) but do not exercise the PTU formulas they claim to verify.

---

## Recommendations

### Priority 1: Server-side damage calculation endpoint

Create `POST /api/encounters/:id/calculate-damage` that accepts `{ attackerId, targetId, moveId, isCritical }` and returns the full damage breakdown (DB, STAB, set damage, ATK, DEF, stage multipliers, type effectiveness, final damage). This is the single change that converts 17 test files from tautological to genuine.

The capture rate system (`captureRate.ts`) is the proven pattern — it receives parameters, computes internally, returns a breakdown. Damage calculation should follow the same architecture.

### Priority 2: Fix BUG-1 (template human HP)

Immediate correctness fix. The formula `10 + level * 2` is wrong for PTU trainers.

### Priority 3: Server-side HP marker injuries

Extend `combatant.service.ts:calculateDamage()` to detect HP marker crossings. This requires tracking `previousHp` → `newHp` transitions and checking the 50%, 0% thresholds. Negative HP markers require removing the `Math.max(0, ...)` clamp or tracking "effective HP" separately.

### Priority 4: Harmonize capture rate fallbacks (BUG-2)

Make `attempt.post.ts` and `rate.post.ts` use identical defaults for missing species data.
