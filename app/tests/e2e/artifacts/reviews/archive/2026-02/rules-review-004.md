---
review_id: rules-review-004
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: design-testability-001 (P1 + P2)
follows_up: rules-review-003
domain: combat
commits_reviewed:
  - 01150bf
  - 2dd0d67
  - 20253c3
  - 2b1a69e
  - e3a424e
  - b41d4a5
  - efc4b67
  - 227de8b
files_reviewed:
  - app/utils/damageCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/services/combatant.service.ts
verdict: APPROVED
mechanics_verified: 11
mechanics_correct: 11
mechanics_incorrect: 0
mechanics_needs_review: 0
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_references:
  - "07-combat.md:594-615 (evasion from stats)"
  - "07-combat.md:624-657 (accuracy, evasion caps, bonus evasion)"
  - "07-combat.md:644-647 (stage-modified evasion)"
  - "07-combat.md:648-655 (bonus evasion from moves/effects)"
  - "07-combat.md:670-675 (combat stage multipliers)"
  - "07-combat.md:701-728 (stage multiplier chart)"
  - "07-combat.md:746-748 (nat 1/20 rules)"
  - "07-combat.md:749-755 (accuracy check definition)"
  - "07-combat.md:778-779 (minimum 1 damage)"
  - "07-combat.md:800-804 (critical hits)"
  - "07-combat.md:834-847 (9-step damage formula)"
  - "07-combat.md:921-985 (set damage chart)"
  - "07-combat.md:1837-1856 (injuries: massive damage + HP markers)"
  - "07-combat.md:1872-1876 (real maxHp for markers)"
  - "07-combat.md:1882-1884 (re-injury on healing past markers)"
  - "errata-2.md (checked — no corrections to any in-scope mechanics)"
reviewed_at: 2026-02-16T22:00:00
---

## PTU Rules Verification Report

### Scope

Verification of design-testability-001 P1 (dynamic evasion + accuracy calculation) and P2 (HP marker injury detection) against PTU 1.05 rulebook. 8 commits across 3 implementation files.

- **P1:** `calculateEvasion()`, `calculateAccuracyThreshold()`, `AccuracyCalcResult` in `damageCalculation.ts`; endpoint integration in `calculate-damage.post.ts`
- **P1 fix:** Evasion bonus from `stageModifiers.evasion` added to all 4 code paths (efc4b67)
- **P2:** `countMarkersCrossed()` and extended `calculateDamage()` in `combatant.service.ts`

### Errata Check

`books/markdown/errata-2.md` (September 2015 Playtest Pack) checked for all in-scope mechanics. **No corrections found** for: evasion calculation, accuracy checks, combat stages, HP markers, injury thresholds, massive damage, critical hits, damage formula, STAB, or type effectiveness. The errata focuses on Cheerleader/Medic class revisions, equipment changes, and capture mechanic overhaul — none of which affect these mechanics.

### Mechanics Verified

#### 1. Evasion from Stats
- **Rule:** "for every 5 points a Pokémon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense" (07-combat.md:598-600). Same for Special Defense → Special Evasion (608-610) and Speed → Speed Evasion (613-615).
- **Implementation:** `Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))` — `damageCalculation.ts:115`
- **Verification:** `floor(stat/5)` with +6 cap. Examples: stat 15 → evasion 3, stat 30 → evasion 6, stat 31 → still 6 (cap). Division by 5 matches "for every 5 points." Cap at 6 matches "+6 at 30."
- **Status:** CORRECT

#### 2. Stage-Modified Evasion
- **Rule:** "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score. However, you can never gain more than +6 Evasion from Stats." (07-combat.md:644-647)
- **Implementation:** Uses `applyStageModifier(baseStat, combatStage)` before dividing by 5. The stat is modified by combat stages BEFORE evasion is derived. Cap at +6 applies to the stat-derived portion only.
- **Verification:** Stat 15 at +3 CS → `floor(15 * 1.6) = 24` → evasion `floor(24/5) = 4`. At +6 CS → `floor(15 * 2.2) = 33` → evasion `min(6, floor(33/5)) = min(6, 6) = 6`. The "artificially increased defense score" is correctly used.
- **Status:** CORRECT

#### 3. Bonus Evasion (efc4b67 fix)
- **Rule:** "Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top. ... Much like Combat Stages; it has a minimum of -6 and a max of +6. Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy of an enemy's Moves." (07-combat.md:648-655)
- **Implementation:** `Math.max(0, statEvasion + evasionBonus)` — `damageCalculation.ts:118`. Bonus sourced from `stageModifiers.evasion` (clamped -6/+6 by stage system). Applied identically to all three evasion types in endpoint (`calculate-damage.post.ts:189-192`).
- **Verification:**
  - Stacks on top of stat evasion: ✓ (additive)
  - Applies to all three evasion types: ✓ (same bonus passed to physical, special, speed)
  - Clamped -6/+6: ✓ (enforced by `updateStageModifiers` in `combatant.service.ts:313-315`)
  - Negative evasion erases but floor at 0: ✓ (`Math.max(0, ...)` — negative total doesn't increase opponent accuracy)
  - Also fixed in client code paths: `useCombat.ts:53-70`, `useMoveCalculation.ts:99,105,110`
- **Status:** CORRECT

#### 4. Total Evasion Cap (+9)
- **Rule:** "you may only raise a Move's Accuracy Check by a max of +9" (07-combat.md:656-657)
- **Implementation:** `effectiveEvasion = Math.min(9, applicableEvasion)` — `calculate-damage.post.ts:196`
- **Verification:** Maximum possible evasion = 6 (stat) + 6 (bonus) = 12, capped to 9 when applied to accuracy check. Matches PTU rule exactly.
- **Status:** CORRECT

#### 5. Evasion Selection by Damage Class
- **Rule:** "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat; similarly, Special Evasion can modify the rolls of attacks that target the Special Defense Stat. Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check." (07-combat.md:638-643)
- **Implementation:** `applicableEvasion = move.damageClass === 'Physical' ? physicalEvasion : specialEvasion` — `calculate-damage.post.ts:195`. Speed evasion reported separately in response but not auto-applied.
- **Verification:** Physical moves → Physical Evasion, Special moves → Special Evasion. Speed evasion is available in the response for callers that need it. The "only add ONE" rule is respected — only one evasion type feeds into the accuracy threshold. Design decision to auto-select by damage class is correct for the common case; speed evasion override is left to the caller.
- **Status:** CORRECT

#### 6. Accuracy Threshold
- **Rule:** "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion." (07-combat.md:749-755). "Accuracy's Combat Stages apply directly; Accuracy at -2 simply modifies all Accuracy Rolls by -2" (07-combat.md:626-628). "a roll of 1 is always a miss ... a roll of 20 is always a hit" (07-combat.md:746-748)
- **Implementation:** `Math.max(1, moveAC + Math.min(9, evasion) - attackerAccuracyStage)` — `damageCalculation.ts:134`
- **Verification:** Accuracy stages modify the roll, so effective threshold = `AC + evasion - accuracyStage`. Floor at 1 ensures threshold is meaningful; nat 1/20 rules handled by caller. Example: Earthquake (AC 2) vs target with Physical Evasion 4 → threshold `2 + 4 = 6`, matching the book example (07-combat.md:752-755).
- **Status:** CORRECT

#### 7. Stage Multiplier Table
- **Rule:** Combat stage chart (07-combat.md:701-728): -6=×0.4, -5=×0.5, -4=×0.6, -3=×0.7, -2=×0.8, -1=×0.9, 0=×1.0, +1=×1.2, +2=×1.4, +3=×1.6, +4=×1.8, +5=×2.0, +6=×2.2
- **Implementation:** `STAGE_MULTIPLIERS` — `damageCalculation.ts:27-41`
- **Verification:** All 13 values verified against the chart. `applyStageModifier()` uses `Math.floor(baseStat * multiplier)` matching "rounded down" (07-combat.md:673-674).
- **Status:** CORRECT

#### 8. HP Marker Injury Detection
- **Rule:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter. Whenever a Pokémon or Trainer reaches one of these Hit Point values, they take 1 Injury." (07-combat.md:1849-1852)
- **Implementation:** `countMarkersCrossed()` — `combatant.service.ts:40-66`
- **Verification:**
  - Markers generated at: `floor(maxHp * 0.5)`, 0, `-floor(maxHp * 0.5)`, `-2 * floor(maxHp * 0.5)`, ... ✓
  - Crossing condition: `previousHp > threshold && newHp <= threshold` — correctly implements "reaches" ✓
  - Edge case: `fiftyPercent <= 0` returns 0 markers (prevents infinite loop for maxHp 0-1) ✓
  - Safety cap: `markers.length > 20` prevents runaway loops ✓
  - **Book example verified:** maxHp 100, from 100 to -150 → markers at [50, 0, -50, -100, -150] = 5 markers. Plus 1 massive damage = 6 total. Matches "6 Injuries" (07-combat.md:1853-1856) ✓
- **Status:** CORRECT

#### 9. Real MaxHP for Markers
- **Rule:** "The artificial Max Hit Point number is not considered when potentially acquiring new injuries ... All Effects that normally go off the Pokémon's Max Hit Points still use the real maximum." (07-combat.md:1872-1876)
- **Implementation:** `countMarkersCrossed(currentHp, unclampedHp, maxHp)` uses `maxHp` parameter which is the entity's `maxHp` field (real, not injury-reduced).
- **Verification:** Injury-reduced maxHP is `maxHp * (10 - injuries) / 10`. The function receives the raw `maxHp`, not the reduced value.
- **Status:** CORRECT

#### 10. Massive Damage + Marker Injuries (Additive)
- **Rule:** "a Pokémon or Trainer that goes from Max Hit Points to -150% Hit Points after receiving a single attack would gain 6 Injuries (1 for Massive Damage, and 5 for Hit Point Markers)" (07-combat.md:1853-1856)
- **Implementation:** `totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries` — `combatant.service.ts:111`
- **Verification:** Massive damage and marker injuries are independent, additive sources. Both can trigger from a single hit. The book's "6 = 1 + 5" example confirms additive combination. Implementation matches.
- **Status:** CORRECT

#### 11. Unclamped HP for Marker Detection
- **Rule:** HP markers extend into negative territory: "0%, -50%, -100%, and every -50% lower thereafter" (07-combat.md:1850). Implies HP can be negative for injury tracking purposes.
- **Implementation:** `unclampedHp = currentHp - hpDamage` for marker detection; `newHp = Math.max(0, unclampedHp)` for storage — `combatant.service.ts:95-98`
- **Verification:** Without unclamped HP, markers at -50%, -100%, etc. would never be detected (stored HP is always ≥ 0). The unclamped value allows correct marker counting while preserving the 0-floor for display/storage. Clean separation matches the design spec's recommended "Option A."
- **Status:** CORRECT

### Test Injury Count Verification

The Senior Reviewer (code-review-004) verified all 11 test file injury updates with worked math. I independently verified the key invariant:

**From full HP, massive damage ALWAYS crosses the 50% marker:**

Given: `damage ≥ maxHp/2` (massive damage condition)
Then: `newHp = maxHp - damage ≤ maxHp - maxHp/2 = maxHp/2`
And: `marker = floor(maxHp * 0.5) ≤ maxHp/2`
So: `newHp ≤ marker` AND `previousHp = maxHp > marker` → marker is crossed.

Conversely: if `damage < maxHp/2`, then `newHp > maxHp/2 ≥ marker` → marker is NOT crossed.

This proves the "0 or 2 injuries from full HP" invariant used in conditional test assertions (wild-encounter-001, capture-variant-001). A single hit from full HP can never produce exactly 1 injury — it's either 0 (no massive damage, no marker) or 2+ (massive + at least 50% marker).

### Summary

- Mechanics checked: 11
- Correct: 11
- Incorrect: 0
- Needs review: 0

All P1 and P2 mechanics are correctly implemented per PTU 1.05. The evasion system correctly handles stat-derived evasion (with stage modification and +6 cap), bonus evasion (stacking, floor at 0), and the +9 applied cap. HP marker injuries correctly detect crossings into negative HP territory while keeping stored HP ≥ 0.

### Observations (Pre-Existing, Not In Scope)

These are not issues introduced by P1/P2 but are noted for completeness:

1. **Type effectiveness multiplication (P0):** `getTypeEffectiveness()` multiplies per-type values (1.5 × 1.5 = 2.25 for dual-SE). The rulebook describes "Doubly Super-Effective = ×2" (07-combat.md:782), but the resistance side follows per-type multiplication exactly (0.5 × 0.5 = 0.25 = "1/4th damage"). The per-type multiplication approach is the standard interpretation used by the PTU community and was present in `useCombat.ts` before this design. The label function correctly categorizes 2.25 as "Doubly Super Effective."

2. **Massive damage and tempHp (P0):** `massiveDamageInjury` uses `hpDamage` (after tempHp absorption). The rulebook doesn't explicitly address tempHp interaction with massive damage. Current behavior is defensible — tempHp absorbs damage before it "reaches" the Pokemon.

3. **Spawn-time evasion (pre-existing):** `combatants.post.ts` and `from-scene.post.ts` compute initial evasion inline without stage modifiers or bonus. These are cosmetic initial values — live gameplay always recalculates dynamically from entity stats + stages via the calculate-damage endpoint or client composables. Tracked in refactoring-002.

## Verdict

**APPROVED** — All 11 mechanics verified correct against PTU 1.05 rules. No errata corrections applicable. No issues found in P1/P2 implementation. Proceeds to test re-runs.
