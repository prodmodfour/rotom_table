---
review_id: rules-review-286
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-018
domain: weather
commits_reviewed:
  - ca59d3b9
  - 64a039a0
  - 07d0d701
  - 60ad567f
  - 7d35017c
mechanics_verified:
  - Rain/Sun type damage modifier application in client-side move calculation
  - Weather ability effect post-state broadcasting (newHp, fainted)
  - Sun Blanket HP fraction (decree-045 compliance)
  - Weather ability heal/damage pipeline correctness
  - Desert Weather Sun fire resistance deferral
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - "PTU pp.341-342 (10-indices-and-reference.md:3550-3632) — Weather conditions and effects"
  - "PTU p.246 (07-combat.md:831-833) — Tick = 1/10th max HP"
  - "PTU pp.3565-3567 (10-indices-and-reference.md) — Rainy: Water +5 DB, Fire -5 DB"
  - "PTU pp.3597-3599 (10-indices-and-reference.md) — Sunny: Fire +5 DB, Water -5 DB"
  - "PTU pp.2575-2579 (10-indices-and-reference.md) — Sun Blanket ability description"
  - "decree-045 — Sun Blanket heals a Tick (1/10th max HP), ability descriptions > summary tables"
reviewed_at: 2026-03-04T01:15:00+00:00
follows_up: rules-review-283
---

## Mechanics Verified

### 1. Rain/Sun Type Damage Modifier in Client-Side Move Calculation (C1 fix)

- **Rule:** "While Rainy, Water-Type Attacks gain a +5 bonus to Damage Rolls, and Fire-Type Attacks suffer a -5 Damage penalty." (`10-indices-and-reference.md:3565-3567`). "While Sunny, Fire-Type Attacks gain a +5 bonus to Damage Rolls, and Water-Type Attacks suffer a -5 Damage penalty." (`10-indices-and-reference.md:3597-3599`)
- **Implementation (pre-fix):** `useMoveCalculation.ts` computed `effectiveDB` as `damageBase + 2` (STAB only), with no weather modifier. Since `move.post.ts` receives pre-calculated damage from the UI via `getConfirmData()`, the weather DB modifier was completely non-functional for all moves executed through the UI.
- **Implementation (post-fix, commit ca59d3b9):** A new `weatherModifier` computed reads weather from `encounterStore.encounter?.weather` and calls `getWeatherDamageModifier(weather, move.value.type)`. The `effectiveDB` computed now applies `Math.max(1, move.value.damageBase + weatherModifier.value)` before adding STAB (+2). This matches the server-side formula in `damageCalculation.ts:309` (Step 1.5).
- **Verification of formula correctness:**
  - Rain + Water move: `getWeatherDamageModifier('rain', 'Water')` returns +5. DB 8 Water move becomes `Math.max(1, 8+5)` = 13 before STAB. CORRECT per PTU.
  - Rain + Fire move: `getWeatherDamageModifier('rain', 'Fire')` returns -5. DB 8 Fire move becomes `Math.max(1, 8-5)` = 3 before STAB. CORRECT per PTU.
  - Sun + Fire move: returns +5. CORRECT.
  - Sun + Water move: returns -5. CORRECT.
  - DB floor of 1: `Math.max(1, ...)` prevents negative/zero DB from extreme penalties (e.g., DB 3 Fire move in Rain = `Math.max(1, 3-5)` = 1). CORRECT -- PTU does not define behavior for sub-1 DB, so flooring at 1 is the defensive interpretation.
  - Null weather / non-Fire/Water types: returns 0. CORRECT -- no modifier applied.
  - STAB ordering: Weather modifier applied to raw DB first, then STAB +2 added to the weather-adjusted DB. This is consistent with `damageCalculation.ts:309-313` and produces identical results whether STAB is applied before or after weather (both are additive to DB).
- **Status:** CORRECT. The critical gap is fully resolved.

### 2. Weather Ability Effect Post-State Broadcasting (H1 fix)

- **Rule:** WebSocket broadcasts must convey the actual post-effect combatant state so the Group View (TV display) can accurately reflect HP changes and faint status from weather abilities (Ice Body heal, Solar Power damage, Dry Skin heal/damage, etc.).
- **Implementation (pre-fix):** `WeatherAbilityResult` interface had no `newHp` or `fainted` fields. The `getWeatherAbilityEffects()` function returned results without post-effect state. The WebSocket broadcast in `next-turn.post.ts` hardcoded `newHp: 0` and `fainted: false`.
- **Implementation (post-fix, commits 64a039a0 + 07d0d701):**
  - `WeatherAbilityResult` now includes `newHp: number` and `fainted: boolean` fields (weather-automation.service.ts:165-168).
  - `getWeatherAbilityEffects()` initializes these as `newHp: 0, fainted: false` (placeholders, populated later by caller).
  - `applyWeatherAbilityEffects()` in turn-helpers.ts now populates these fields after applying each effect:
    - **Heal path** (line 305-306): `effect.newHp = combatant.entity.currentHp` (after heal clamped to maxHp), `effect.fainted = false`.
    - **Damage path** (line 338-339): `effect.newHp = combatant.entity.currentHp` (after `applyDamageToEntity`), `effect.fainted = damageResult.fainted`.
  - `next-turn.post.ts:713-714` now uses `result.newHp` and `result.fainted` instead of hardcoded values.
- **PTU correctness check:** The heal path correctly clamps healing to maxHp (`Math.min(effect.amount, maxHp - currentHp)`, line 297), so `newHp` will never exceed `maxHp`. The damage path uses the standard `calculateDamage` + `applyDamageToEntity` + `applyFaintStatus` pipeline, ensuring injury tracking, faint status, and mount auto-dismount all function correctly. The `fainted` flag accurately reflects the damage result.
- **Status:** CORRECT. The high-severity broadcast issue is fully resolved.

### 3. Sun Blanket HP Fraction (decree-045 compliance)

- **Rule:** Per decree-045: "Sun Blanket heals a Tick (1/10th max HP) per turn in Sunny weather. Ability descriptions take precedence over summary tables."
- **PTU ability text:** "gains a Tick of Hit Points at the beginning of each turn in Sunny weather" (`10-indices-and-reference.md:2578-2579`). A Tick = 1/10th max HP (`07-combat.md:831-833`).
- **PTU summary text (contradicts):** "Users with Sun Blanket gain 1/16th of their Max Hit Points at the beginning of each turn" (`10-indices-and-reference.md:3612-3613`).
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:147` uses `hpFraction: 10` (Tick = 1/10th). The amount is computed as `Math.max(1, Math.floor(maxHp / 10))` in `getWeatherAbilityEffects():198`.
- **Status:** CORRECT. Implementation follows decree-045. The ability description value (Tick = 1/10th) is used, not the summary table value (1/16th). This was the MED-001 advisory from rules-review-283, now definitively resolved by decree-045.

### 4. Weather Ability Heal/Damage Pipeline Correctness

- **Rule:** Weather ability effects must correctly apply healing (clamped to maxHp) and damage (through the injury/faint pipeline) at the correct timing (turn start or turn end).
- **Implementation (verified in turn-helpers.ts:277-346):**
  - **Fainted combatant guard:** Line 289 returns empty results if `currentHp <= 0`. CORRECT per PTU p.248 (fainted abilities inactive).
  - **Heal path:** Lines 296-306 compute healed amount as `Math.min(effect.amount, maxHp - currentHp)`, add to `currentHp`, sync to DB, and populate newHp/fainted. CORRECT.
  - **Damage path:** Lines 307-340 use `calculateDamage()` + `applyDamageToEntity()` from combatant.service, which handles temporary HP, injury checks (HP crossing tick thresholds), and status condition updates. On faint: `applyFaintStatus()` is called, mount auto-dismount is handled, and XP tracking fires via `trackDefeated()`. CORRECT.
  - **Turn lifecycle timing (verified in next-turn.post.ts):**
    - Turn-end abilities (Dry Skin, Desert Weather): Lines 186-200, fire before status tick damage (Burn/Poison). CORRECT per PTU — weather abilities and status ticks both occur "at end of turn," but weather abilities must fire first to avoid double-faint edge cases.
    - Turn-start abilities (Ice Body, Rain Dish, Sun Blanket, Solar Power): Lines 542-558, fire after weather tick damage (Hail/Sandstorm) on the incoming combatant's turn. CORRECT per PTU.
    - Declaration phase skip: Lines 192, 481, 546 all check `currentPhase !== 'trainer_declaration'`. CORRECT.
- **Status:** CORRECT

### 5. Desert Weather Sun Fire Resistance Deferral (M1)

- **Rule:** PTU ability text (`10-indices-and-reference.md:1108-1109`): Desert Weather "resists Fire-Type Moves in Sunny Weather." The weather summary (`10-indices-and-reference.md:3609-3610`) confirms: "Users with Desert Weather resist Fire-Type Moves one step further."
- **Implementation (commit 60ad567f):** The shared-specs.md matrix entry for "Desert Weather | Sun | Resist Fire one step further" has been updated from `P1` to `P2 (deferred from P1 -- requires type effectiveness pipeline changes; see code-review-310 MEDIUM-001)`.
- **PTU correctness assessment:** This is a real PTU mechanic that is not yet implemented. However, the deferral is a scope decision, not a rules error. The mechanic requires modifying the type effectiveness pipeline (a non-trivial change affecting `getTypeEffectiveness` or adding pre-effectiveness modifiers), and is appropriately scoped for P2.
- **Status:** CORRECT (deferral is acceptable; mechanic tracked for P2 implementation)

## Summary

All 3 issues from code-review-310 have been addressed in the fix cycle:

1. **C1 CRITICAL (ca59d3b9):** Weather DB modifier now applied in `useMoveCalculation.ts` effectiveDB computation. The formula `Math.max(1, rawDB + weatherModifier)` + STAB matches the server-side Step 1.5 in `damageCalculation.ts`. Rain/Sun +/-5 DB for Water/Fire moves is now functional for all UI-initiated moves. **RESOLVED.**

2. **H1 HIGH (64a039a0 + 07d0d701):** `WeatherAbilityResult` now carries `newHp` and `fainted` fields, populated by `applyWeatherAbilityEffects` after applying each heal/damage effect. The WebSocket broadcast uses actual values. Group View will display correct post-effect HP. **RESOLVED.**

3. **M1 MEDIUM (60ad567f):** Desert Weather Sun fire resistance deferred to P2 with a clear annotation in shared-specs.md. The mechanic is real PTU RAW but requires type effectiveness pipeline changes outside the P1 scope. **RESOLVED (deferred).**

The rules-review-283 APPROVED findings all continue to hold:
- All 20 mechanics verified in that review remain correct in the current codebase.
- MED-001 (Sun Blanket HP fraction ambiguity) is now definitively resolved by decree-045: use Tick (1/10th max HP). The implementation at `weather-automation.service.ts:147` with `hpFraction: 10` is correct per decree-045.

## Rulings

1. **Weather DB modifier ordering:** Weather modifier applied before STAB in `effectiveDB` is mathematically equivalent to applying after STAB (both are additive). The chosen ordering (weather first, then STAB) is consistent with the server-side formula and produces correct final DB values. No PTU rule specifies ordering between these two additive modifications.

2. **DB floor of 1:** `Math.max(1, rawDB + weatherModifier)` prevents DB from dropping to 0 or below. PTU does not define behavior for DB 0, so flooring at 1 is the defensible interpretation. This matches the server-side formula.

3. **Sun Blanket:** Per decree-045, the implementation correctly uses 1/10th max HP (Tick). This decree formally resolves the internal PTU book contradiction between the ability description and the weather summary table.

## Verdict

**APPROVED**

All fix cycle commits are rules-correct. The C1 critical weather DB modifier gap is closed, H1 broadcast values are accurate, and M1 is appropriately deferred. The rules-review-283 APPROVED findings remain valid. decree-045 compliance is confirmed. No new issues found.

## Required Changes

None.
