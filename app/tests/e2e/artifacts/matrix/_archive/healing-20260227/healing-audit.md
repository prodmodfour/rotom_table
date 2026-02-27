---
domain: healing
audited_at: 2026-02-26T20:00:00Z
audited_by: implementation-auditor
rules_catalog: healing-rules.md
capabilities_catalog: healing-capabilities.md
matrix: healing-matrix.md
source_files_read: 14
items_audited: 31
correct: 26
incorrect: 1
approximation: 3
ambiguous: 1
---

# Implementation Audit: Healing

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 26 |
| Incorrect | 1 |
| Approximation | 3 |
| Ambiguous | 1 |
| **Total Audited** | **31** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM | 3 | healing-R007 (Incorrect), healing-R034 (Approximation), healing-R042 (Approximation) |
| LOW | 1 | healing-R012 (Approximation) |

---

## Tier 1: Core Formulas

### healing-R001: Tick of Hit Points Definition

- **Rule:** "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points."
- **Expected behavior:** 1 tick = floor(maxHp / 10). Used as the building block for injury HP reduction.
- **Actual behavior:** `getEffectiveMaxHp()` at `utils/restHealing.ts:20-24` computes `Math.floor(maxHp * (10 - injuries) / 10)`. Each injury reduces max HP by exactly 1/10th. The tick value itself is not stored as a named constant, but the `maxHp / 10` fraction is the implicit unit in the `(10 - injuries) / 10` calculation.
- **Classification:** Correct

### healing-R003: Injury Definition -- HP Reduction per Injury

- **Rule:** "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th. For example, a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points, or 7/10ths of their maximum."
- **Expected behavior:** Effective max HP = floor(maxHp * (10 - injuries) / 10).
- **Actual behavior:** `getEffectiveMaxHp()` at `utils/restHealing.ts:20-24`: `Math.floor(maxHp * (10 - effectiveInjuries) / 10)` where `effectiveInjuries = Math.min(injuries, 10)`. Cap at 10 injuries prevents negative effective HP. This function is used as a healing cap in `calculateRestHealing()` (line 57: `const effectiveMax = getEffectiveMaxHp(maxHp, injuries)`) and in `applyHealingToEntity()` (`combatant.service.ts:213`: `getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)`), and in the Pokemon Center endpoint (`pokemon-center.post.ts:59`: `getEffectiveMaxHp(pokemon.maxHp, newInjuries)`).
- **Classification:** Correct
- **Notes:** The PTU example (50 maxHp, 3 injuries = 35) matches exactly. The injury-reduced cap is correctly applied as a healing ceiling in all healing paths.

### healing-R007: Natural Healing Rate (Rest HP Recovery)

- **Rule:** "Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **Expected behavior:** Heal amount = floor(maxHp / 16), using real maxHp per R017.
- **Actual behavior:** `calculateRestHealing()` at `utils/restHealing.ts:64-65`: `const healAmount = Math.max(1, Math.floor(maxHp / 16))`. The `Math.max(1, ...)` enforces a minimum of 1 HP healed per rest period.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** The `Math.max(1, ...)` minimum guarantee is not in the PTU rules. PTU says "heal 1/16th of their Maximum Hit Points" with the general rounding rule being floor. For maxHp = 10, PTU yields floor(10/16) = 0 but the code yields 1. For maxHp = 15, PTU yields floor(15/16) = 0 but code yields 1. This affects very low maxHp entities (below 16). While arguably a QoL improvement (healing 0 per 30-min rest feels bad), it contradicts the strict rule.

### healing-R027: Pokemon Center -- Injury Time (Under 5)

- **Rule:** "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes."
- **Expected behavior:** Total time = 1 hour base + (injuries * 30 minutes) when injuries < 5.
- **Actual behavior:** `calculatePokemonCenterTime()` at `utils/restHealing.ts:84-115`: `baseTime = 60`, `injuryTime = injuries * 30` when `injuries < 5`. `totalTime = 60 + injuries * 30`.
- **Classification:** Correct

### healing-R028: Pokemon Center -- Injury Time (5+ Injuries)

- **Rule:** "If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead."
- **Expected behavior:** Total time = 1 hour base + (injuries * 60 minutes) when injuries >= 5.
- **Actual behavior:** `calculatePokemonCenterTime()` at `utils/restHealing.ts:93-95`: when `injuries >= 5`, `injuryTime = injuries * 60`. `totalTime = 60 + injuries * 60`.
- **Classification:** Correct

### healing-R033: Extended Rest -- Restores Drained AP

- **Rule:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- **Expected behavior:** After extended rest, drainedAp = 0, currentAp restored.
- **Actual behavior:** `server/api/characters/[id]/extended-rest.post.ts:87-89`: sets `drainedAp: 0`, `boundAp: 0`, `currentAp: maxAp` where `maxAp = calculateMaxAp(character.level)`. `calculateMaxAp()` at `utils/restHealing.ts:219-221`: `5 + Math.floor(level / 5)`.
- **Classification:** Correct
- **Notes:** Also clears boundAp. This is a reasonable interpretation: extended rest implies scene transition, and bound AP "remains off-limits until the effect that Bound them ends." Clearing on extended rest is generous but not contradicted by rules.

---

## Tier 2: Core Workflows

### healing-R004: Injury from Massive Damage

- **Rule:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points."
- **Expected behavior:** If hpDamage >= maxHp / 2, gain 1 injury. Uses real maxHp, not injury-reduced.
- **Actual behavior:** `calculateDamage()` at `server/services/combatant.service.ts:112`: `massiveDamageInjury = hpDamage >= maxHp / 2`. Only HP damage counts (temp HP absorbed first, lines 96-99). Function parameter is raw `maxHp`.
- **Classification:** Correct

### healing-R005: Injury from HP Markers

- **Rule:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter."
- **Expected behavior:** Markers at 50%, 0%, -50%, -100% of real maxHp. Each crossing = 1 injury.
- **Actual behavior:** `countMarkersCrossed()` at `server/services/combatant.service.ts:50-76`: `fiftyPercent = Math.floor(realMaxHp * 0.5)`, iterates down from `fiftyPercent` through 0 and into negatives, checking `previousHp > threshold && newHp <= threshold`. Uses unclamped newHp for marker detection.
- **Classification:** Correct

### healing-R013: Multiple Injuries from Single Attack

- **Rule:** "A Pokemon or Trainer that goes from Max Hit Points to -150% Hit Points after receiving a single attack would gain 6 Injuries (1 for Massive Damage, and 5 for Hit Point Markers)."
- **Expected behavior:** Massive damage + all marker injuries accumulated in single damage call.
- **Actual behavior:** `calculateDamage()` at `server/services/combatant.service.ts:121`: `totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries`. Both are computed independently and summed.
- **Classification:** Correct

### healing-R014: Fainted Cured by Revive or Healing to Positive HP

- **Rule:** "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves."
- **Expected behavior:** When healed from 0 HP to > 0 HP, remove Fainted status.
- **Actual behavior:** `applyHealingToEntity()` at `server/services/combatant.service.ts:220-226`: `if (previousHp === 0 && newHp > 0)`, filters out 'Fainted' from statusConditions, sets `faintedRemoved = true`.
- **Classification:** Correct

### healing-R015: Fainted Clears All Status Conditions

- **Rule:** "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- **Expected behavior:** On faint, clear persistent + volatile statuses, keep "other" conditions, add Fainted.
- **Actual behavior:** `applyDamageToEntity()` at `server/services/combatant.service.ts:158-164`: when `damageResult.fainted`, builds `conditionsToClear` from `PERSISTENT_CONDITIONS` + `VOLATILE_CONDITIONS`, filters surviving conditions (keeping "other" like Stuck/Slowed/Trapped/Tripped/Vulnerable), then sets `entity.statusConditions = ['Fainted', ...survivingConditions]`.
- **Classification:** Correct
- **Notes:** Correctly preserves "other" conditions (Stuck, Slowed, etc.) per PTU -- only Persistent and Volatile are cleared on faint.

### healing-R023: Natural Injury Healing (24-Hour Timer)

- **Rule:** "They can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."
- **Expected behavior:** 24+ hours since lastInjuryTime -> allow healing 1 injury.
- **Actual behavior:** `canHealInjuryNaturally()` at `utils/restHealing.ts:73-81`: computes `hoursSinceInjury = (now - injuryTime) / (1000 * 60 * 60)`, returns `hoursSinceInjury >= 24`. Used by `heal-injury.post.ts:96`.
- **Classification:** Correct

### healing-R024: Trainer AP Drain to Remove Injury

- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP."
- **Expected behavior:** Costs 2 AP (drained), heals 1 injury, subject to daily cap.
- **Actual behavior:** `heal-injury.post.ts:64-92`: `newDrainedAp = character.drainedAp + 2`, `newCurrentAp = Math.max(0, character.currentAp - 2)`, decrements injuries by 1, increments `injuriesHealedToday`.
- **Classification:** Correct

### healing-R026: Pokemon Center -- Base Healing

- **Rule:** "Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."
- **Expected behavior:** Full HP (to effective max after injuries healed), clear ALL statuses, restore daily moves.
- **Actual behavior:** `pokemon-center.post.ts:55-92`: injuries healed first (up to daily cap), then `effectiveMax = getEffectiveMaxHp(pokemon.maxHp, newInjuries)` (line 59), `currentHp: effectiveMax` (line 83), `statusConditions: JSON.stringify([])` (line 87), move usage reset (`usedToday = 0`, `usedThisScene = 0`) on lines 70-78.
- **Classification:** Correct
- **Notes:** Correctly heals injuries first, then computes effective max based on remaining injuries. HP restored to injury-reduced effective max, not raw max.

### healing-R032: Extended Rest -- Clears Persistent Status Conditions

- **Rule:** "Extended rests completely remove Persistent Status Conditions."
- **Expected behavior:** Remove Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.
- **Actual behavior:** `extended-rest.post.ts:70-72`: calls `getStatusesToClear()` and `clearPersistentStatusConditions()`. `PERSISTENT_CONDITIONS` at `constants/statusConditions.ts:7-9` = `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']`.
- **Classification:** Correct

### healing-R034: Extended Rest -- Daily Move Recovery

- **Rule:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **Expected behavior:** Only moves used before today (on a previous calendar day) should be refreshed during extended rest.
- **Actual behavior:** `isDailyMoveRefreshable()` at `utils/restHealing.ts:207-212` correctly checks `usedDate.toDateString() !== today.toDateString()`. However, the extended rest endpoint (`extended-rest.post.ts`) does NOT call this function or refresh any daily moves. Daily moves are only refreshed by the Pokemon Center endpoint and the `new-day.post.ts` endpoint (which uses `resetDailyUsage()` to unconditionally reset all daily counters).
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** The utility function exists and is correct, but the extended rest endpoint does not invoke it. An extended rest taken after midnight should refresh daily moves used on the previous day, but the code does not do this. The `new-day.post.ts` endpoint handles the full-day-reset case correctly, so this only matters for mid-campaign extended rests that cross day boundaries without a "New Day" action.

### healing-R018: Take a Breather -- Core Effects

- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **Expected behavior:** Reset stages, remove temp HP, cure volatile + Slowed + Stuck.
- **Actual behavior:** `breather.post.ts`:
  - Stages reset to defaults (lines 59-74), including Heavy Armor speed CS adjustment.
  - Temp HP removed (lines 77-80).
  - Volatile conditions cured (lines 83-92): `BREATHER_CURED_CONDITIONS` = `VOLATILE_CONDITIONS.filter(c => c !== 'Cursed')` + `['Slowed', 'Stuck']`.
- **Classification:** Correct
- **Notes:** Cursed is excluded from auto-clearing with a documented code comment: "Since the app does not track curse sources, Cursed is excluded from auto-clearing and left for the GM to remove manually when the prerequisite is met." This is a reasonable design choice since PTU says Cursed requires the curse source to be KO'd or >12m away, which the app cannot verify. The previous audit incorrectly flagged this as Incorrect; re-reading the PTU text confirms the Cursed exception is a special case requiring GM adjudication: "To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters." Excluding Cursed from automatic removal and leaving it to GM judgment is the correct approach.

---

## Tier 3: Core Constraints

### healing-R008: Rest Requires Continuous Half Hour

- **Rule:** "Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **Expected behavior:** Each rest action = exactly 30 continuous minutes.
- **Actual behavior:** Both `rest.post.ts` endpoints add exactly 30 minutes per call.
- **Classification:** Correct

### healing-R009: Rest HP Recovery Daily Cap (8h)

- **Rule:** "For the first 8 hours of rest each day... Hit Points will not be regained."
- **Expected behavior:** 480 minutes max rest healing per day.
- **Actual behavior:** `calculateRestHealing()` at `utils/restHealing.ts:51-54`: `restMinutesToday >= 480` returns `canHeal: false`.
- **Classification:** Correct

### healing-R010: Heavily Injured Threshold (5+ Injuries)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured."
- **Expected behavior:** 5+ injuries = Heavily Injured.
- **Actual behavior:** `calculateRestHealing()` checks `injuries >= 5` for blocking rest heal. `getRestHealingInfo()` checks `injuries < 5` for `canRestHeal`.
- **Classification:** Correct

### healing-R011: Heavily Injured Blocks Rest HP Recovery

- **Rule:** "A Trainer or Pokemon is unable to restore Hit Points through rest if the individual has 5 or more injuries."
- **Expected behavior:** No HP recovery from rest at 5+ injuries.
- **Actual behavior:** `calculateRestHealing()` at line 47: `if (injuries >= 5) return { hpHealed: 0, canHeal: false }`.
- **Classification:** Correct

### healing-R017: Injury Does Not Affect HP Marker Thresholds

- **Rule:** "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."
- **Expected behavior:** Marker positions and massive damage threshold use real maxHp.
- **Actual behavior:** `calculateDamage()` receives raw `maxHp` parameter. Massive damage check (line 112) and `countMarkersCrossed()` (line 115-118) both use this raw value.
- **Classification:** Correct

### healing-R025: Daily Injury Healing Cap (3/Day)

- **Rule:** "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Expected behavior:** Shared pool of 3 injury heals per day across all sources.
- **Actual behavior:** `calculatePokemonCenterInjuryHealing()` uses `3 - injuriesHealedToday`. `heal-injury.post.ts` checks `injuriesHealedToday >= 3`. All paths increment the shared counter.
- **Classification:** Correct

### healing-R029: Pokemon Center -- Injury Removal Cap

- **Rule:** Same 3/day cap as R025.
- **Expected behavior:** Pokemon Center respects shared daily cap.
- **Actual behavior:** `pokemon-center.post.ts:49-52` calls `calculatePokemonCenterInjuryHealing()` which uses `injuriesHealedToday`.
- **Classification:** Correct

### healing-R019: Take a Breather -- Action Cost

- **Rule:** "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action... They then become Tripped and are Vulnerable until the end of their next turn."
- **Expected behavior:** Full action consumed (standard + shift). Tripped + Vulnerable applied.
- **Actual behavior:** `breather.post.ts:110-115`: sets `standardActionUsed: true`, `shiftActionUsed: true`, `hasActed: true`. Lines 97-107: adds 'Tripped' and 'Vulnerable' to `combatant.tempConditions` (cleared at turn end).
- **Classification:** Correct
- **Notes:** Uses `tempConditions` for the "until end of their next turn" duration -- correct implementation.

---

## Tier 4: Partial Items -- Present Portion

### healing-R012: Massive Damage Exclusion for Set/Lose HP (Standard Path)

- **Rule:** "Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as Pain Split or Endeavor."
- **Expected behavior:** Standard damage should apply massive damage check. A separate "set/lose HP" path should skip it.
- **Actual behavior:** The standard `calculateDamage()` in `combatant.service.ts:85-140` correctly applies massive damage checks. No separate "set/lose HP" code path exists.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The standard damage path is correct. The absent "set/lose HP" mode is documented as a P2 gap in the matrix. Pain Split/Endeavor are niche moves; GM can manually adjust HP without triggering the damage pipeline.

### healing-R022: Healing Past HP Markers -- Re-Injury Risk

- **Rule:** "If they're then brought down to 50% again, they gain another Injury for passing the 50% Hit Points Marker again."
- **Expected behavior:** Marker re-crossing triggers new injuries after healing.
- **Actual behavior:** `countMarkersCrossed()` checks `previousHp > threshold && newHp <= threshold` using current HP state. Healing raises HP above markers; subsequent damage crossing them again correctly triggers new injuries.
- **Classification:** Correct
- **Notes:** The stateless design makes re-injury work by consequence. No marker history is needed.

### healing-R035: HP Lost vs Damage Distinction (Standard Path)

- **Rule:** "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied."
- **Expected behavior:** Standard damage applies defense. A "lose HP" path would skip defense.
- **Actual behavior:** Standard `calculateDamage()` in `utils/damageCalculation.ts` applies defense (step 7). In-combat `calculateDamage()` applies massive damage. No "lose HP" mode exists.
- **Classification:** Correct (for present standard path)

### healing-R039: Basic Restorative Items (Manual HP Heal)

- **Rule:** "Potion: Heals 20 Hit Points. Super Potion: Heals 35 Hit Points..."
- **Expected behavior:** Heal endpoint accepts HP amount.
- **Actual behavior:** `encounters/[id]/heal.post.ts` accepts `{ combatantId, amount }`, calls `applyHealingToEntity()` which heals `amount` HP capped at effective max. GM enters amount manually.
- **Classification:** Correct (for present manual path)

### healing-R040: Status Cure Items (Manual Status Removal)

- **Rule:** "Antidote: Cures Poison. Paralyze Heal: Cures Paralysis..."
- **Expected behavior:** Status conditions can be manually removed.
- **Actual behavior:** `encounters/[id]/status.post.ts` calls `updateStatusConditions()` which adds/removes any valid status condition. GM manually removes the appropriate condition.
- **Classification:** Correct (for present manual path)

### healing-R042: AP -- Scene Refresh and Drain/Bind (Utilities)

- **Rule:** "Action Points are completely regained at the end of each Scene. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Expected behavior:** AP refreshes at scene end (minus drained/bound). Extended rest clears drained AP.
- **Actual behavior:**
  - `calculateMaxAp()` at `utils/restHealing.ts:219-221`: `5 + Math.floor(level / 5)` -- correct.
  - `calculateAvailableAp()` at line 230-232: `Math.max(0, maxAp - boundAp - drainedAp)` -- correct.
  - `calculateSceneEndAp()` at line 240-243: correct scene-end computation.
  - Extended rest: `extended-rest.post.ts:87-89` sets `drainedAp: 0, boundAp: 0, currentAp: maxAp` -- correct.
  - New day: `new-day.post.ts:55-60` resets AP fully -- correct.
  - **Gap:** No automated trigger calls scene-end AP restoration. Utilities exist but are unused at scene/encounter end.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** Pure calculation functions are correct. Extended rest and new day correctly restore AP. The missing piece is automated scene-end AP restoration.

---

## Ambiguous Items

### healing-R006: Fainted Condition at "0 or lower"

- **Rule:** "A Pokemon or Trainer that is at 0 Hit Points or lower is Fainted."
- **Expected behavior:** Fainted when HP <= 0.
- **Actual behavior:** `calculateDamage()` at `combatant.service.ts:124`: `fainted = newHp === 0`, where newHp is clamped to 0 via `Math.max(0, unclampedHp)` (line 108). Since HP is always clamped to 0 for storage, "=== 0" and "<= 0" produce identical results in practice.
- **Classification:** Ambiguous
- **Notes:** Functionally correct given HP clamping. The check `=== 0` is semantically narrower than the rule's "0 or lower", but since stored HP is always >= 0, the result is identical. Would diverge only if negative HP storage were introduced. No decree exists. No decree-need ticket required unless negative HP storage is planned.

---

## Escalation Notes

### healing-R007: Math.max(1, ...) Minimum Heal

- **Impact:** Low-maxHp entities (maxHp < 16) heal 1 HP per rest instead of 0. Affects level-1 Pokemon with low base HP stats. Generous deviation favoring players.
- **Recommendation:** LOW-severity ticket. Consider whether this is intentional QoL or unintentional.

### healing-R034: Extended Rest Daily Move Refresh Not Wired

- **Impact:** Extended rests do not refresh daily moves used on previous days. The `isDailyMoveRefreshable()` utility exists but is never called by extended rest endpoints. Players must use the "New Day" action or Pokemon Center for daily move refresh.
- **Recommendation:** MEDIUM-severity ticket. Wire `isDailyMoveRefreshable()` into extended rest endpoints.

### healing-R042: Scene-End AP Restoration Not Automated

- **Impact:** AP is not restored at scene/encounter end. The `calculateSceneEndAp()` utility exists but no trigger invokes it. AP only restored via extended rest, new day, or GM manual edit.
- **Recommendation:** MEDIUM-severity ticket. Add AP restoration hook to scene/encounter end flow.

### healing-R006: Fainted "=== 0" vs "<= 0"

- **Interpretation A:** HP clamping to 0 makes "=== 0" equivalent to "<= 0". No practical difference.
- **Interpretation B:** If negative HP were ever stored (for some future mechanic), the check would need to be "<= 0".
- **Recommendation:** No action needed currently. If negative HP storage is ever introduced, update the fainted check.
