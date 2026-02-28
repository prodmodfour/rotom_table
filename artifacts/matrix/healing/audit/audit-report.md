---
domain: healing
type: implementation-audit
audited_at: 2026-02-28T04:00:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T00:00:00Z
total_items_audited: 32
---

# Implementation Audit: Healing Domain

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 25 |
| Incorrect | 3 |
| Approximation | 2 |
| Ambiguous | 2 |
| **Total Audited** | **32** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 1 | healing-R033 (new-day boundAp reset) |
| HIGH | 1 | healing-R015 (fainted status clearing scope) |
| MEDIUM | 2 | healing-R007 (no min 1), healing-R012/R035 (no set/lose distinction) |
| LOW | 1 | healing-R018 (Cursed exclusion note only) |

---

## Tier 0: Decree Compliance

### 1. healing-R033 — Extended Rest: Drained AP (decree-016)

**Rule:** PTU p.252: "Extended rests... restore a Trainer's Drained AP." Decree-016: "Extended rest clears only Drained AP, not Bound AP."

**Expected behavior:** Extended rest sets `drainedAp = 0`, recalculates `currentAp = maxAp - boundAp`, leaves `boundAp` unchanged.

**Actual behavior (extended-rest endpoint):** `app/server/api/characters/[id]/extended-rest.post.ts:96-97` sets `drainedAp: 0` and `currentAp: maxAp - character.boundAp`. Bound AP is NOT cleared. **Correct per decree-016.**

**However**, the `app/server/api/game/new-day.post.ts:58-59` sets `drainedAp: 0, boundAp: 0, currentAp: calculateMaxAp(level)`. This clears bound AP. Decree-019 says New Day is a "pure counter reset" but decree-016 says bound AP persists "until the binding effect ends." New Day should not clear bound AP.

**Classification:** **Incorrect**
**Severity:** **CRITICAL**
**Details:** Extended rest endpoint is correct per decree-016. But new-day endpoint violates decree-016 by clearing `boundAp: 0`. Bound AP should not be reset by New Day; it should only be cleared when the binding effect ends (GM manual action). The new-day endpoint should set `drainedAp: 0` and `currentAp: calculateMaxAp(level) - boundAp` instead of clearing boundAp.
**File:** `app/server/api/game/new-day.post.ts:59`

---

## Tier 1: Core Formulas

### 2. healing-R001 — Tick of Hit Points (1/10th max HP)

**Rule:** PTU p.250: "For each Injury... their Maximum Hit Points are reduced by 1/10th."

**Expected behavior:** A "tick" of HP is 1/10th of max HP. Used as the unit for injury reduction.

**Actual behavior:** `getEffectiveMaxHp()` at `app/utils/restHealing.ts:20-24`: `Math.floor(maxHp * (10 - effectiveInjuries) / 10)`. This computes the effective max correctly using the 1/10th-per-injury formula. Injuries capped at 10.

**Classification:** **Correct**

### 3. healing-R003 — Injury Definition: HP Reduction

**Rule:** PTU p.250: "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th."

**Expected behavior:** `effectiveMaxHp = floor(maxHp * (10 - injuries) / 10)`

**Actual behavior:** `app/utils/restHealing.ts:20-24`: Exact formula match. Uses `Math.floor`, injuries clamped to [0, 10].

**Classification:** **Correct**

### 4. healing-R007 — Natural Healing Rate (1/16th per rest)

**Rule:** PTU p.252: "Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."

**Expected behavior:** Heal `floor(maxHp / 16)` per 30-minute rest period, using REAL maxHp (not injury-reduced). The PTU text says "Maximum Hit Points" without qualification — the errata p.368 confirms the real maximum is used ("1/8th of their Max Hit Points" for nurse feature, consistent with base 1/16th using real max).

**Actual behavior:** `app/utils/restHealing.ts:66`: `Math.floor(maxHp / 16)` — uses real maxHp. No minimum of 1.

**PTU analysis:** The rule says "1/16th of their Maximum Hit Points" with no explicit minimum of 1. A Pokemon with maxHp < 16 (e.g., a level 1 Pokemon with low HP stat) would heal 0 per rest period. The code comments cite "PTU p.31: floor rounding, no minimum." There is no errata overriding this.

**Classification:** **Approximation**
**Severity:** **MEDIUM**
**Details:** The no-minimum behavior is technically a faithful reading of the rules, but the practical effect is that very low HP entities (maxHp < 16) cannot heal through rest at all. This is arguably correct per strict PTU reading, but most GMs would house-rule a minimum of 1. The code includes a deliberate comment about this design choice, so it is intentional. Classifying as Approximation rather than Incorrect because the strict reading supports this behavior, but a min-1 floor would be a reasonable alternative interpretation.

### 5. healing-R027 — Pokemon Center: Injury Time (Under 5)

**Rule:** PTU p.252: "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes." Decree-020: uses pre-healing injury count.

**Expected behavior:** `totalTime = 60 + (injuries * 30)` for injuries < 5.

**Actual behavior:** `app/utils/restHealing.ts:91-99`: `baseTime = 60`, `injuryTime = injuries * 30` when `injuries < 5`. `calculatePokemonCenterTime()` is called with `character.injuries` (pre-healing) in both pokemon-center endpoints.

**Classification:** **Correct** (per decree-020)

### 6. healing-R028 — Pokemon Center: Injury Time (5+)

**Rule:** PTU p.252: "If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead."

**Expected behavior:** `totalTime = 60 + (injuries * 60)` for injuries >= 5.

**Actual behavior:** `app/utils/restHealing.ts:94-96`: `injuryTime = injuries * 60` when `injuries >= 5`.

**Classification:** **Correct**

---

## Tier 2: Core Constraints

### 7. healing-R009 — Rest Daily Cap (480 min)

**Rule:** PTU p.252: "For the first 8 hours of rest each day..."

**Expected behavior:** Max 480 minutes of rest healing per day. Beyond that, rest does not heal.

**Actual behavior:** `app/utils/restHealing.ts:52-54`: `if (restMinutesToday >= 480) { canHeal: false }`. Both character and pokemon rest endpoints increment by 30 per call and check this cap.

**Classification:** **Correct**

### 8. healing-R011 — Heavily Injured Blocks Rest HP Recovery

**Rule:** PTU p.252: "unable to restore Hit Points through rest if the individual has 5 or more injuries."

**Expected behavior:** Rest returns 0 HP when injuries >= 5.

**Actual behavior:** `app/utils/restHealing.ts:47-49`: `if (injuries >= 5) { canHeal: false }`.

**Classification:** **Correct**

### 9. healing-R025 — Daily Injury Healing Cap (3/Day)

**Rule:** PTU p.252: "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."

**Expected behavior:** All injury healing sources share a 3/day cap tracked by `injuriesHealedToday`.

**Actual behavior:**
- Character heal-injury: `app/server/api/characters/[id]/heal-injury.post.ts:53`: checks `injuriesHealedToday >= 3`
- Pokemon heal-injury: `app/server/api/pokemon/[id]/heal-injury.post.ts:63`: checks `injuriesHealedToday >= 3`
- Pokemon Center (both): Uses `calculatePokemonCenterInjuryHealing()` at `restHealing.ts:126`: `maxHealable = Math.max(0, 3 - injuriesHealedToday)`

All three healing paths share the same `injuriesHealedToday` counter.

**Classification:** **Correct**

### 10. healing-R029 — Pokemon Center: Injury Cap (3/Day)

**Rule:** Same as R025 — Pokemon Center injuries count toward the shared daily cap.

**Expected behavior:** Pokemon Center's injury healing respects the 3/day limit.

**Actual behavior:** Both pokemon-center endpoints use `calculatePokemonCenterInjuryHealing()` which checks `injuriesHealedToday` against the 3/day cap.

**Classification:** **Correct**

### 11. healing-R017 — Injury Does Not Affect HP Marker Thresholds

**Rule:** PTU p.250: "The artificial Max Hit Point number is not considered when potentially acquiring new injuries... All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."

**Expected behavior:** HP markers at 50%, 0%, -50%, -100% use real maxHp, not injury-reduced effective max.

**Actual behavior:** `app/server/services/combatant.service.ts:85-91`: `calculateDamage()` passes `maxHp` (real) to marker calculation. `countMarkersCrossed()` at line 50-76 uses `realMaxHp` parameter for marker thresholds.

**Classification:** **Correct**

---

## Tier 3: Injury System

### 12. healing-R004 — Injury from Massive Damage

**Rule:** PTU p.250: "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points."

**Expected behavior:** If HP damage (after temp HP absorption) >= maxHp / 2, gain 1 injury.

**Actual behavior:** `app/server/services/combatant.service.ts:112`: `massiveDamageInjury = hpDamage >= maxHp / 2`. Uses real maxHp. Only HP damage counts (temp HP absorbed first at lines 96-99).

**Classification:** **Correct**

### 13. healing-R005 — Injury from HP Markers

**Rule:** PTU p.250: "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter."

**Expected behavior:** Each marker crossed = 1 injury. Uses real maxHp for threshold calculation.

**Actual behavior:** `countMarkersCrossed()` at `combatant.service.ts:50-76`: Generates markers starting at `floor(realMaxHp * 0.5)`, then descending by `fiftyPercent` steps. Checks `previousHp > threshold && newHp <= threshold`. Uses unclamped HP (line 105) to detect sub-zero markers.

**Classification:** **Correct**

### 14. healing-R013 — Multiple Injuries from Single Attack

**Rule:** PTU p.250 example: "a Pokemon or Trainer that goes from Max Hit Points to -150% Hit Points after receiving a single attack would gain 6 Injuries (1 for Massive Damage, and 5 for Hit Point Markers)."

**Expected behavior:** Single attack can yield massive damage injury + multiple marker crossing injuries.

**Actual behavior:** `combatant.service.ts:121`: `totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries`. Both are computed from the same hit and summed.

**Classification:** **Correct**

### 15. healing-R022 — Healing Past HP Markers Re-Injury Risk

**Rule:** PTU p.250: "if a Pokemon is brought down to 50% Hit Points and is healed by... a Heal Pulse, the injury is not removed. If they're then brought down to 50% again, they gain another Injury."

**Expected behavior:** HP markers are absolute thresholds. Healing above then taking damage back through triggers new injury.

**Actual behavior:** `countMarkersCrossed()` uses `previousHp` (current HP before this hit) and `newHp` (after this hit). Each damage application independently checks marker crossings. If healed above 50% then hit below 50% again, the check `previousHp > threshold && newHp <= threshold` triggers correctly.

**Classification:** **Correct**

---

## Tier 4: Healing Workflows

### 16. healing-R014 — Fainted Cured by Healing to Positive HP

**Rule:** PTU p.248: "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves."

**Expected behavior:** When HP goes from 0 to positive via healing, remove Fainted status.

**Actual behavior:** `applyHealingToEntity()` at `combatant.service.ts:230-234`: `if (previousHp === 0 && newHp > 0)` removes Fainted from statusConditions. Sets `faintedRemoved = true`.

**Classification:** **Correct**

### 17. healing-R026 — Pokemon Center: Base Healing

**Rule:** PTU p.252: "Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."

**Expected behavior:** Full HP (to effective max per decree-017), clear all statuses, heal injuries (3/day cap), restore daily moves.

**Actual behavior:**
- Character pokemon-center (`app/server/api/characters/[id]/pokemon-center.post.ts`): Heals HP to `getEffectiveMaxHp(maxHp, newInjuries)` (line 59), clears ALL status conditions (line 73), heals injuries up to 3/day cap (line 55-56). Note: characters don't have moves to restore.
- Pokemon pokemon-center (`app/server/api/pokemon/[id]/pokemon-center.post.ts`): Same HP/status/injury logic, PLUS resets all move usage (lines 70-78: `usedToday = 0`, `usedThisScene = 0`).

HP healed to effective max of **post-injury-healing** injuries (line 59: `getEffectiveMaxHp(character.maxHp, newInjuries)`). This is correct — injuries are healed first, then HP is restored to the new effective max.

**Classification:** **Correct** (per decree-017)

### 18. healing-R032 — Extended Rest: Clears Persistent Status

**Rule:** PTU p.252: "Extended rests completely remove Persistent Status Conditions."

**Expected behavior:** Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned are removed.

**Actual behavior:**
- Character extended-rest: `app/server/api/characters/[id]/extended-rest.post.ts:82`: calls `clearPersistentStatusConditions()`.
- Pokemon extended-rest: `app/server/api/pokemon/[id]/extended-rest.post.ts:80`: same function.
- `clearPersistentStatusConditions()` at `restHealing.ts:144-148`: filters out statuses in `PERSISTENT_CONDITIONS` array.
- `PERSISTENT_CONDITIONS` at `statusConditions.ts:7-9`: `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']`.

All 5 persistent conditions are cleared. Volatile and other conditions are preserved (correct — extended rest only clears persistent per PTU).

**Classification:** **Correct**

### 19. healing-R034 — Extended Rest: Daily Move Recovery

**Rule:** PTU p.252: "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."

**Expected behavior:** Daily moves used before today are refreshed. Daily moves used today are NOT refreshed (rolling window).

**Actual behavior:**
- `refreshDailyMoves()` at `rest-healing.service.ts:31-74`: For daily moves with `usedToday > 0`, calls `isDailyMoveRefreshable(move.lastUsedAt)`.
- `isDailyMoveRefreshable()` at `restHealing.ts:209-214`: Returns true if `lastUsedAt` is NOT today (different `toDateString()`). Moves used today are skipped.
- Character extended-rest calls `refreshDailyMovesForOwnedPokemon()` which applies this to all owned Pokemon.
- Pokemon extended-rest calls `refreshDailyMoves()` directly.

**Classification:** **Correct**

### 20. healing-R023 — Natural Injury Healing (24h Timer)

**Rule:** PTU p.252: "they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."

**Expected behavior:** Check if 24 hours have elapsed since `lastInjuryTime`. If yes, heal 1 injury (subject to daily cap).

**Actual behavior:**
- `canHealInjuryNaturally()` at `restHealing.ts:74-82`: Checks `hoursSinceInjury >= 24`. Returns false if `lastInjuryTime` is null (no injuries recorded).
- Character heal-injury: `app/server/api/characters/[id]/heal-injury.post.ts:96` calls this check for natural healing.
- Pokemon heal-injury: `app/server/api/pokemon/[id]/heal-injury.post.ts:40` calls this check.
- Both check `injuriesHealedToday >= 3` for daily cap.

**Classification:** **Correct**

---

## Tier 5: Breather System

### 21. healing-R018 — Take a Breather: Core Effects

**Rule:** PTU p.245: "they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters."

**Expected behavior:** Reset stages to default (Heavy Armor: speed CS -1), remove temp HP, cure volatile + Slowed + Stuck (Cursed requires proximity check).

**Actual behavior:** `app/server/api/encounters/[id]/breather.post.ts`:
- Stages reset to defaults (line 92-98): `createDefaultStageModifiers()` with Heavy Armor speed CS override via `computeEquipmentBonuses()`.
- Temp HP removed (lines 112-115): set to 0.
- Volatile + Slowed + Stuck cleared (lines 118-129): `BREATHER_CURED_CONDITIONS` is `VOLATILE_CONDITIONS.filter(c => c !== 'Cursed')` + `['Slowed', 'Stuck']`.
- Cursed excluded (line 27): Code correctly excludes Cursed from auto-clearing with comment about tracking limitation.
- Persistent conditions survive and CS effects reapplied (line 134): `reapplyActiveStatusCsEffects()`.

**Classification:** **Correct**
**Note:** Cursed exclusion is an intentional Approximation — the app cannot track curse source proximity, so it conservatively leaves Cursed for GM manual removal. This is documented in the code comments and is the correct behavior given the tracking limitation.

### 22. healing-R019 — Take a Breather: Action Cost

**Rule:** PTU p.245: "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action... They then become Tripped and are Vulnerable until the end of their next turn."

**Expected behavior:** Mark standard + shift as used. Apply Tripped + Vulnerable.

**Actual behavior:** `breather.post.ts:170-175`: Sets `standardActionUsed: true`, `shiftActionUsed: true`, `hasActed: true`. Lines 157-167: Adds `Tripped` and `Vulnerable` to `tempConditions` (not permanent statusConditions — correct, these are "until next turn").

**Classification:** **Correct**

---

## Tier 6: Partial Items — Present Portion

### 23. healing-R039 — Generic HP Healing (in-combat)

**Rule:** PTU p.248: Healing restores HP, capped at effective max HP.

**Expected behavior:** Healing amount applied, capped at injury-reduced effective max HP. Fainted removed if healed from 0.

**Actual behavior:** `applyHealingToEntity()` at `combatant.service.ts:221-236`: `effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries)`, `newHp = Math.min(effectiveMax, previousHp + options.amount)`. Fainted removal at 0 → positive.

**Classification:** **Correct**

### 24. healing-R042 — AP Calculation Utilities

**Rule:** PTU p.220-221: "5, plus 1 more for every 5 Trainer Levels." Scene end restores AP minus drained and bound.

**Expected behavior:** `maxAp = 5 + floor(level / 5)`. `availableAp = max(0, maxAp - boundAp - drainedAp)`. `sceneEndAp = calculateAvailableAp(maxAp, boundAp, drainedAp)`.

**Actual behavior:** `restHealing.ts:221-245`:
- `calculateMaxAp(level)`: `5 + Math.floor(level / 5)` — correct per PTU p.220-221.
- `calculateAvailableAp(maxAp, boundAp, drainedAp)`: `Math.max(0, maxAp - boundAp - drainedAp)` — correct.
- `calculateSceneEndAp(level, drainedAp, boundAp)`: Computes maxAp then calls calculateAvailableAp — correct.

**Classification:** **Correct**

### 25. healing-R033 — Drained AP Restoration (Extended Rest, separate from bound AP question)

**Rule:** PTU p.252: "restore a Trainer's Drained AP."

**Expected behavior:** Extended rest sets `drainedAp = 0`, recalculates currentAp.

**Actual behavior:** `extended-rest.post.ts:85-97`: `apRestored = character.drainedAp`, sets `drainedAp: 0`, `currentAp: maxAp - character.boundAp`.

**Classification:** **Correct** (drained AP restoration itself is correct; the decree-016 violation is in new-day only, covered in item #1)

### 26. healing-R012/R035 — Standard Damage Calculation (without set/lose distinction)

**Rule:** PTU p.250: "Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as a Pain Split or Endeavor."

**Expected behavior:** Damage calculation should distinguish between "damage" and "set/lose HP" effects.

**Actual behavior:** `combatant.service.ts:85-140`: `calculateDamage()` treats all HP loss as damage. No input parameter to flag "set/lose HP" effects. Massive damage check (`hpDamage >= maxHp / 2`) applies universally.

**Classification:** **Approximation**
**Severity:** **MEDIUM**
**Details:** The damage formula itself is correct for standard damage. The missing feature is a flag to suppress massive damage injury for set/lose HP effects. This is documented in the matrix as a known gap. The damage calculation is not *wrong* — it just doesn't handle a special case that rarely arises in practice.

---

## Tier 7: Implemented-Unreachable (Logic Verification)

### 27. healing-R018 (logic verification) — Breather Core Effects

Logic verified as correct in item #21 above. **Accessibility note:** Only accessible from GM view. Player view has no breather action.

**Classification:** **Correct** (logic) / Implemented-Unreachable (accessibility)

### 28. healing-R019 (logic verification) — Breather Action Cost

Logic verified as correct in item #22 above. Same accessibility note.

**Classification:** **Correct** (logic) / Implemented-Unreachable (accessibility)

### 29. healing-R024 — Trainer AP Drain to Remove Injury

**Rule:** PTU p.252: "Trainers can also remove Injuries as an Extended Action by Draining 2 AP."

**Expected behavior:** Drain 2 AP from trainer, heal 1 injury. Subject to daily 3/day cap.

**Actual behavior:** `app/server/api/characters/[id]/heal-injury.post.ts:64-93`: When `method === 'drain_ap'`: `newDrainedAp = character.drainedAp + 2`, `newCurrentAp = Math.max(0, character.currentAp - 2)`, `injuries - 1`, increments `injuriesHealedToday`. Checks daily cap at line 53.

**Classification:** **Correct** (logic) / Implemented-Unreachable (accessibility — GM-only)

---

## Tier 8: Data Model Verification

### 30. healing-R002 — Rest Endpoints Track restMinutesToday

**Rule:** PTU p.252: "For the first 8 hours of rest each day..."

**Expected behavior:** Each rest call increments `restMinutesToday` by 30. Daily reset via `shouldResetDailyCounters()`.

**Actual behavior:**
- Character rest: `rest.post.ts:66-67`: `newRestMinutes = restMinutesToday + 30`, saved to DB.
- Pokemon rest: same logic.
- Both check `shouldResetDailyCounters(lastRestReset)` at the start.

**Classification:** **Correct**

### 31. healing-R006 — Fainted Tracking in statusConditions

**Rule:** PTU p.248: "A Pokemon or Trainer that is at 0 Hit Points or lower is Fainted."

**Expected behavior:** Fainted added to statusConditions when HP reaches 0. Cleared persistent + volatile on faint.

**Actual behavior:** `applyDamageToEntity()` at `combatant.service.ts:158-173`: When `damageResult.fainted` (HP = 0), persistent + volatile conditions are cleared (with CS reversal per decree-005), Fainted is added. Surviving "other" conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) are preserved.

**Classification:** **Correct**

### 32. healing-R010 / healing-R015 — Injuries Field and Fainted Status Clearing

**healing-R010:** Heavily Injured (5+ injuries) is checked by `calculateRestHealing()` correctly. Injuries field is maintained across all healing paths (rest, heal-injury, pokemon-center, in-combat damage/healing).

**healing-R015:** Fainted Clears All Persistent and Volatile Status Conditions.

**Rule:** PTU p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."

**Expected behavior:** On faint: clear all persistent (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) and volatile (Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) conditions.

**Actual behavior:** `combatant.service.ts:159`: `conditionsToClear = [...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS]`. This array includes all persistent + volatile conditions. Lines 169-172 filter out these conditions, keeping only "other" conditions (Stuck, Slowed, etc.) and adding Fainted.

However, there is a subtle concern: this clearing only happens in `applyDamageToEntity()` which is called from the encounter damage endpoint. If a combatant's HP is set to 0 through other means (e.g., direct DB edit, or a non-combat damage source), the faint clearing would not trigger. But this is an architectural limitation, not a rule violation — all in-combat damage flows through this function.

**healing-R010 Classification:** **Correct**
**healing-R015 Classification:** **Correct**

---

## Ambiguous Items

### A1. healing-R007 — Natural Healing Rate: Minimum Healing Amount

**Rule:** PTU p.252: "heal 1/16th of their Maximum Hit Points"

**The Ambiguity:** PTU does not specify a minimum healing amount. A Pokemon with maxHp < 16 would heal 0 per rest period using `Math.floor(maxHp / 16)`. Should there be a minimum of 1?

**Code behavior:** `restHealing.ts:66` — `Math.floor(maxHp / 16)` with no minimum. The code comments explicitly note "PTU p.31: floor rounding, no minimum."

**Interpretation A:** No minimum (strict reading). PTU says floor, so floor(15/16) = 0.
**Interpretation B:** Minimum 1 (common sense). Rest should always provide some healing.

**Recommendation:** Create a `decree-need` ticket. This affects Pokemon with very low maxHp (level 1 with low HP base stats). Practically rare but could matter.

### A2. healing-R033 (New Day) — Bound AP on New Day

**Rule:** Decree-016 says bound AP persists until binding effect ends. Decree-019 says New Day is a pure counter reset.

**The Ambiguity:** Is bound AP a "daily counter" that should be reset on New Day? Or is it a persistent effect that only the GM can clear?

**Code behavior:** `new-day.post.ts:59` resets `boundAp: 0`. This treats it as a daily counter.

**Interpretation A:** Bound AP is NOT a daily counter — it persists until the binding effect ends (strict decree-016 reading). New Day should not clear it.
**Interpretation B:** Bound AP is effectively a daily counter — at the start of a new in-game day, all binding effects from the previous day have expired.

**Note:** I classified this as **Incorrect** in item #1 above because decree-016 is explicit that bound AP persists "until the binding effect ends," and New Day has no mechanism to verify binding effects have ended. However, this is also listed here as ambiguous because reasonable GMs might disagree. A decree-need ticket may be warranted to clarify whether New Day specifically should reset bound AP.

---

## Escalation Notes

1. **CRITICAL: new-day boundAp reset (healing-R033)** — The `app/server/api/game/new-day.post.ts:59` clears `boundAp: 0` which violates decree-016. Fix: change to `currentAp: calculateMaxAp(level) - boundAp` and remove `boundAp: 0` from the update. Since `drainedAp` is being set to 0, `currentAp` should be `maxAp - existingBoundAp`. This requires a per-character update (cannot use batch updateMany without knowing boundAp).

2. **MEDIUM: No minimum rest healing (healing-R007)** — Recommend decree-need ticket to decide whether rest should always heal at least 1 HP.

3. **MEDIUM: No set/lose HP distinction (healing-R012/R035)** — Known gap, documented in matrix. Low practical impact (Pain Split, Endeavor are rare moves).

---

## Verified Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-016 | **VIOLATED** (new-day) / Compliant (extended-rest) | Extended rest correctly preserves bound AP. New Day incorrectly clears it. |
| decree-017 | Compliant | Pokemon Center heals to effective max HP (post-injury-heal). |
| decree-018 | Compliant | Extended rest accepts duration parameter (4-8 hours, default 4). |
| decree-019 | Compliant | New Day is counter reset only, no implicit extended rest effects (HP not healed, statuses not cleared). |
| decree-020 | Compliant | Pokemon Center time uses pre-healing injury count (called with `character.injuries` before healing). |
