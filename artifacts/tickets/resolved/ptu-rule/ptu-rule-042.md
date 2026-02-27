---
ticket_id: ptu-rule-042
priority: P2
status: resolved
domain: character-lifecycle
matrix_source:
  rule_ids:
    - character-lifecycle-R013
    - character-lifecycle-R014
    - character-lifecycle-R015
    - character-lifecycle-R016
    - character-lifecycle-R017
    - character-lifecycle-R018
    - character-lifecycle-R020
  audit_file: matrix/character-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Seven derived trainer stats are not computed from skill ranks: Power (Athletics+Combat), High Jump (Acrobatics), Long Jump (Acrobatics), Overland Speed (Athletics+Acrobatics), Swimming Speed (depends on Overland), Throwing Range (Athletics), Weight Class (weight in lbs). These are stored as static values or not tracked at all.

## Expected Behavior (PTU Rules)

- Power = 1 + Athletics + Combat ranks
- High Jump = Acrobatics rank
- Long Jump = Acrobatics rank
- Overland = 3 + Athletics + Acrobatics (varies by formula)
- Swimming = Overland / 2
- Throwing Range = 4 + Athletics rank
- Weight Class = derived from weight in pounds via threshold table

## Actual Behavior

These values are either hardcoded, manually entered, or absent. Changing skill ranks does not update movement speeds or capabilities.

## Resolution Log

### 2026-02-20 — Implementation

**Root cause:** No computation existed. Trainer capabilities were not tracked or derived.

**Fix:**
1. Created `app/utils/trainerDerivedStats.ts` — pure utility with:
   - `skillRankToNumber()` mapping (Pathetic=1 through Master=6)
   - `computeWeightClass()` with lbs threshold table
   - `computeTrainerDerivedStats()` computing all 7 stats from skills + weight
2. Added Capabilities section to `app/pages/gm/characters/[id].vue` (character detail page)
3. Added Capabilities section to `app/components/character/tabs/HumanStatsTab.vue` (modal view)

**PTU verification:** All formulas verified against PTU Core Chapter 2 worked example (Lisa: Power 5, High Jump 0, Long Jump 1, Overland 6, Swim 3, Throwing Range 8, WC 4 at 120 lbs with Athletics Adept, Acrobatics Novice, Combat Untrained).

**Corrected formulas** (ticket had some inaccuracies):
- Power = 4 base, +1 if Athletics >= Novice, +1 if Combat >= Adept (not "1 + Athletics + Combat")
- High Jump = 0 base, +1 if Acrobatics >= Adept, +1 if Acrobatics >= Master (not "Acrobatics rank")
- Long Jump = floor(Acrobatics rank / 2) (not "Acrobatics rank")
- Overland = 3 + floor((Athletics + Acrobatics) / 2)
- Weight Class uses lbs thresholds: 55-110 = WC 3, 111-220 = WC 4, >220 = WC 5

**Duplicate path check:** No other code paths compute or reference trainer capabilities. The VTT grid movement system has a `getMovementSpeed` callback but defaults to 5 and doesn't yet wire to derived stats.
