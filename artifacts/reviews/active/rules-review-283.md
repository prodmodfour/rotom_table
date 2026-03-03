---
review_id: rules-review-283
review_type: rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-018
domain: scenes+combat
commits_reviewed:
  - ac554d00
  - 34ad7893
  - a754ed62
  - f6ca6e69
  - dcb0ade3
  - bb896a32
  - 60eb59b0
files_reviewed:
  - app/utils/damageCalculation.ts
  - app/utils/weatherRules.ts
  - app/server/services/weather-automation.service.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/weather.post.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/utils/turn-helpers.ts
  - app/composables/useMoveCalculation.ts
  - books/markdown/core/10-indices-and-reference.md
  - artifacts/designs/design-weather-001/spec-p1.md
  - artifacts/designs/design-weather-001/shared-specs.md
mechanics_verified:
  - Rain type damage modifier (Water +5 DB, Fire -5 DB)
  - Sun type damage modifier (Fire +5 DB, Water -5 DB)
  - Weather DB modifier application order (Step 1.5, before STAB)
  - Weather DB floor at 1
  - Swift Swim (+4 Speed CS in Rain)
  - Chlorophyll (+4 Speed CS in Sunny)
  - Sand Rush (+4 Speed CS in Sandstorm)
  - Solar Power (+2 SpAtk CS in Sunny)
  - Solar Power (lose 1/16th max HP at turn start in Sunny)
  - Ice Body (heal 1 tick at turn start in Hail)
  - Rain Dish (heal 1 tick at turn start in Rain)
  - Sun Blanket (heal at turn start in Sunny)
  - Dry Skin (heal 1 tick at turn end in Rain)
  - Dry Skin (lose 1 tick at turn end in Sunny)
  - Desert Weather (heal 1/16th at turn end in Rain)
  - Weather CS reversal on weather change
  - Weather CS reversal on weather expiry
  - decree-005 stageSources compliance for weather CS
  - Fainted combatant skip for all weather ability effects
  - Declaration phase skip for all weather effects
rules_sources:
  - "PTU pp.341-342 (weather effects summary in 10-indices-and-reference.md)"
  - "PTU p.311-335 (ability descriptions in 10-indices-and-reference.md)"
  - "PTU p.246 (tick definition in 07-combat.md)"
  - "decree-005 (source-tracked CS changes via stageSources)"
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-03-03T20:50:00+00:00
follows_up: rules-review-277
---

## Review Scope

Rules accuracy review for P1 Weather Effect Automation. Verified all implemented mechanics against PTU 1.05 rulebook text (10-indices-and-reference.md ability descriptions and weather summary sections) and decree-005. Traced all damage code paths to verify weather modifier application.

## Mechanics Verified

### Section D: Type Damage Modifiers (8 checks)

| # | Mechanic | PTU Source | Code | Verdict |
|---|----------|-----------|------|---------|
| 1 | Rain: Water +5 DB | p.341 "Water-Type Attacks gain a +5 bonus to Damage Rolls" | `getWeatherDamageModifier('rain', 'Water') = 5` | CORRECT |
| 2 | Rain: Fire -5 DB | p.341 "Fire-Type Attacks suffer a -5 Damage penalty" | `getWeatherDamageModifier('rain', 'Fire') = -5` | CORRECT |
| 3 | Sun: Fire +5 DB | p.342 "Fire-Type Attacks gain a +5 bonus to Damage Rolls" | `getWeatherDamageModifier('sunny', 'Fire') = 5` | CORRECT |
| 4 | Sun: Water -5 DB | p.342 "Water-Type Attacks suffer a -5 Damage penalty" | `getWeatherDamageModifier('sunny', 'Water') = -5` | CORRECT |
| 5 | DB floor at 1 | Implicit (DB must be positive) | `Math.max(1, rawDB + weatherModifier)` | CORRECT |
| 6 | Applied before STAB | Both additive to DB; Step 1.5 before Steps 2-3 | Weather -> STAB -> chart lookup | CORRECT |
| 7 | Non-Fire/Water unaffected | Only Fire/Water listed in PTU | `default: return 0` | CORRECT |
| 8 | Hail/Sandstorm no DB modifier | Only Rain/Sun listed | Only 'rain'/'sunny' cases | CORRECT |

### Section E: Weather CS Abilities (8 checks)

| # | Mechanic | PTU Source | Code | Verdict |
|---|----------|-----------|------|---------|
| 9 | Swift Swim: +4 Speed CS in Rain | p.331 ability + p.341 summary | `WEATHER_CS_ABILITIES: rain/Swift Swim/speed/4` | CORRECT |
| 10 | Chlorophyll: +4 Speed CS in Sun | p.315 ability + p.342 summary | `WEATHER_CS_ABILITIES: sunny/Chlorophyll/speed/4` | CORRECT |
| 11 | Sand Rush: +4 Speed CS in Sandstorm | p.323 ability + p.341 summary | `WEATHER_CS_ABILITIES: sandstorm/Sand Rush/speed/4` | CORRECT |
| 12 | Solar Power: +2 SpAtk CS in Sun | p.327 "Special Attack Stat is increased by 2 Combat Stages" | `WEATHER_CS_ABILITIES: sunny/Solar Power/specialAttack/2` | CORRECT |
| 13 | CS clamped at +6 | PTU CS range -6 to +6 | `Math.min(6, current + bonus.bonus)` | CORRECT |
| 14 | CS reversed on weather change | Static abilities deactivate when condition removed | `weather.post.ts` reverses all `weather:*` sources | CORRECT |
| 15 | CS reversed on weather expiry | Duration countdown clears weather | `reverseWeatherCSBonuses` on `weatherBeforeAdvance && !weather` | CORRECT |
| 16 | decree-005 stageSources compliance | Per decree-005: tag CS by source | Sources as `weather:{weather}:{ability}`, stored in stageSources | CORRECT |

### Section F: Weather Ability Healing/Damage (12 checks)

| # | Mechanic | PTU Source | Code | Verdict |
|---|----------|-----------|------|---------|
| 17 | Ice Body: heal 1 tick in Hail (turn start) | p.320 "gains a Tick of HP at the beginning of each turn" | `hpFraction: 10, turn_start, heal` | CORRECT |
| 18 | Rain Dish: heal 1 tick in Rain (turn start) | p.323 "gains a Tick of HP at the beginning of each turn in Rain" | `hpFraction: 10, turn_start, heal` | CORRECT |
| 19 | Sun Blanket: heal in Sun (turn start) | p.327 ability: "a Tick of Hit Points"; p.342 summary: "1/16th" | `hpFraction: 10, turn_start, heal` | SEE MED-001 |
| 20 | Solar Power: lose 1/16th HP in Sun (turn start) | p.327 "loses 1/16th of its Max HP at the beginning of its turn" | `hpFraction: 16, turn_start, damage` | CORRECT |
| 21 | Dry Skin: heal 1 tick in Rain (turn end) | p.317 ability + p.341 summary | `hpFraction: 10, turn_end, heal` | CORRECT |
| 22 | Dry Skin: lose 1 tick in Sun (turn end) | p.317 "ends their turn in Sunny Weather, they lose a Tick" | `hpFraction: 10, turn_end, damage` | CORRECT |
| 23 | Desert Weather: heal 1/16th in Rain (turn end) | p.316 "regains 1/16th... at the end of each of its turns" | `hpFraction: 16, turn_end, heal` | CORRECT |
| 24 | Fainted combatants skipped | Fainted abilities inactive | `currentHp <= 0` returns empty | CORRECT |
| 25 | Healing clamped to maxHp | Cannot overheal | `Math.min(amount, maxHp - currentHp)` | CORRECT |
| 26 | Damage causes faint check | Damage pipeline fully applied | `applyFaintStatus` on faint | CORRECT |
| 27 | Tick formula correct | PTU p.246: Tick = 1/10th max HP, min 1 | `Math.max(1, Math.floor(maxHp / hpFraction))` | CORRECT |
| 28 | Declaration phase skipped | Not a real turn | All weather blocks check `currentPhase !== 'trainer_declaration'` | CORRECT |

## Issues

### HIGH-001: Weather DB modifier not applied in primary move execution pipeline

**Rule:** PTU pp.341-342 unambiguously state that Rain/Sun modify the Damage Base of Fire/Water type attacks. This must apply to all damage calculations for moves.

**Finding:** The `getWeatherDamageModifier` function is PTU-correct (verified in checks 1-8 above), and the server-side read-only `calculate-damage.post.ts` endpoint passes `weather: record.weather`. However, the actual client-side damage pipeline in `useMoveCalculation.ts` computes `effectiveDB` at line 334-337 as:

```typescript
const effectiveDB = computed(() => {
  if (!move.value.damageBase) return 0
  return hasSTAB.value ? move.value.damageBase + 2 : move.value.damageBase
})
```

This does NOT include the weather modifier. The resulting damage numbers are sent to `move.post.ts` via `getConfirmData()` as pre-calculated `targetDamages`. Since `move.post.ts` applies damage via `combatant.service.calculateDamage` (the HP-application function, not the 9-step formula), the weather DB modifier is never applied to actual move damage during gameplay.

**Impact:** The headline PTU mechanic of Section D -- Rain boosting Water moves and weakening Fire moves, Sun boosting Fire and weakening Water -- is non-functional for all moves executed through the MoveTargetModal. This is a rules violation.

**Same issue as CRITICAL-001 in code-review-310.** Categorized as HIGH here because the modifier logic itself is correct; the issue is a code path gap, not a rules misunderstanding.

### MED-001: Sun Blanket HP fraction PTU book ambiguity

The PTU ability description for Sun Blanket (10-indices line 2577-2579) says "gains a **Tick** of Hit Points" (Tick = 1/10th max HP per PTU p.246). However, the Sunny weather summary section (10-indices line 3612-3613) says "Users with Sun Blanket gain **1/16th** of their Max Hit Points."

These are contradictory: 1/10th (10%) vs 1/16th (6.25%). The implementation uses `hpFraction: 10` (a Tick), following the ability description. The ability description is the more specific, authoritative source per standard PTU interpretation (specific beats general). This is the same approach used in the design spec.

**Recommendation:** File a `decree-need` ticket for a human ruling on this PTU contradiction. The current implementation is defensible but the discrepancy should be explicitly resolved. No code change required until decree.

## Turn Lifecycle Timing Verification

Verified the ordering of weather effects within the turn lifecycle:

```
TURN END (outgoing combatant):
  1. Weather ability effects - turn_end (Dry Skin, Desert Weather)    [P1 NEW]
  2. Status tick damage (Burn, Poison, Cursed)                        [existing]
  3. Badly Poisoned escalation                                        [existing]
  4. Auto-dismount on faint                                           [existing]

TURN ADVANCEMENT:
  5. Decrement weather (may expire)                                   [P0]
  6. Reverse weather CS bonuses if expired                            [P1 NEW]

TURN START (incoming combatant):
  7. Action forfeit consumption                                       [existing]
  8. Weather tick damage (Hail/Sandstorm)                             [P0]
  9. Weather ability effects - turn_start (Ice Body, Rain Dish, etc.) [P1 NEW]
```

This ordering is correct:
- Turn-end effects fire before status ticks, matching PTU ability text timing.
- Weather CS reversal fires after expiry, preventing stale bonuses on the next combatant.
- Turn-start weather tick damage fires before ability effects, so Ice Body healing occurs after Hail damage would have been applied (Ice Body grants immunity, so the ordering for Ice Body itself is moot, but for future abilities this matters).

## Summary

20 unique mechanics verified across 3 P1 sections plus 8 timing/edge-case checks. All implemented formulas, fractions, and constants match PTU 1.05 RAW. The CS integration correctly follows decree-005. One PTU book contradiction (Sun Blanket: Tick vs 1/16th) is handled reasonably.

The sole blocking issue is that the weather DB modifier, while correctly computed, is not applied in the primary move execution pipeline (useMoveCalculation.ts). This must be fixed for Section D to be rules-compliant.

## Verdict

**CHANGES_REQUIRED**

HIGH-001 must be resolved. Once the weather modifier is applied in `useMoveCalculation.ts`, all 20 mechanics will be fully rules-compliant.

## Required Changes

1. **HIGH-001:** Apply `getWeatherDamageModifier` to `effectiveDB` in `useMoveCalculation.ts`. The weather value should come from the encounter store.
2. **MED-001:** File a `decree-need` ticket for Sun Blanket HP fraction (Tick vs 1/16th). No code change required.
