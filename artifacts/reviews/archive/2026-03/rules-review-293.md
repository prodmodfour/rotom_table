---
review_id: rules-review-293
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-018
domain: scenes
commits_reviewed:
  - 058851d4
  - e3a785f6
  - c24c4c30
  - 7458d79e
  - d8c1c9d8
mechanics_verified:
  - thermosensitive-movement-halving
  - sand-force-damage-bonus
  - weather-damage-modifiers
  - sun-blanket-healing
  - weather-ability-effects
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/10-indices-and-reference.md#Thermosensitive
  - core/10-indices-and-reference.md#Sand-Force
  - core/10-indices-and-reference.md#Weather-Effects
reviewed_at: 2026-03-04T11:30:00Z
follows_up: rules-review-290
---

## Mechanics Verified

### Thermosensitive Movement Halving (HIGH-001 fix)
- **Rule:** "While Hailing, the user's movement capabilities are reduced by half." (`core/10-indices-and-reference.md:2658-2659`, ability description); "Users with Thermosensitive have Movement Capabilities reduced by half." (`core/10-indices-and-reference.md:3563-3564`, Hail weather summary)
- **Implementation:** `applyMovementModifiers()` in `utils/movementModifiers.ts:48-55` checks `weather === 'hail'` and halves movement via `Math.floor(modifiedSpeed / 2)` for combatants with Thermosensitive. This function accepts an optional `weather` parameter. The fix (058851d4) threaded the encounter weather through all 5 server-side call sites:
  - `turn-helpers.ts:123` — `resetCombatantsForNewRound` mount speed (mount is the combatant)
  - `turn-helpers.ts:129` — `resetCombatantsForNewRound` mount speed (rider syncs from mount partner)
  - `mounting.service.ts:250` — `executeMount` initial mount movement
  - `mounting.service.ts:441,454` — `resetMountMovement` passes weather to both mount and rider paths
  - `mount.post.ts:49` — passes `record.weather` to `executeMount`
- **Status:** CORRECT — Halving is applied after Slowed but before Speed CS and Sprint, which follows correct modifier ordering. The `Math.floor` rounding is consistent with PTU rounding-down convention.

### Sand Force Damage Bonus (MEDIUM-001 fix)
- **Rule:** "While in a Sandstorm, the user's Ground, Rock, and Steel-Type Direct-Damage Moves deal +5 Damage." (`core/10-indices-and-reference.md:2238-2239`)
- **Implementation:** In `damageCalculation.ts:349-353`, the `abilityDamageBonus` (which includes Sand Force's +5) is now applied BEFORE the min-1 clamp: `const afterAbilityBonus = Math.max(1, afterDefense + abilityDamageBonus)`. Previously, the min-1 clamp was applied before the ability bonus, which caused incorrect inflation when `afterDefense` was negative. Example: `afterDefense = -3`, bonus = 5: old = `max(1, -3) + 5 = 6`; new = `max(1, -3 + 5) = max(1, 2) = 2`. The fix produces the correct value.
- **Status:** CORRECT — "+5 Damage" is correctly interpreted as additive to the pre-clamp damage value, then the min-1 floor applies to the combined result.

### Weather Damage Base Modifiers (regression check)
- **Rule:** "Water-Type Attacks gain a +5 bonus to Damage Rolls" (Rain); "Fire-Type Attacks gain a +5 bonus to Damage Rolls" (Sun); and corresponding -5 penalties. (`core/10-indices-and-reference.md:3565-3567,3597-3599`)
- **Implementation:** `getWeatherDamageModifier()` in `damageCalculation.ts:274-294` correctly applies +5/-5 DB modifiers for Rain (Water+5, Fire-5) and Sun (Fire+5, Water-5). Applied at step 1.5 before STAB.
- **Status:** CORRECT — No regressions from the fix cycle.

### Sun Blanket Healing (decree-045 compliance)
- **Rule:** Per decree-045: "Sun Blanket heals a Tick (1/10th max HP) per turn in Sunny weather." Ability description takes precedence over summary table's "1/16th."
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `utils/weatherRules.ts:525` defines Sun Blanket with `hpFraction: 10`, producing `Math.max(1, Math.floor(maxHp / 10))` via `weather-automation.service.ts:168`.
- **Status:** CORRECT — Compliant with decree-045.

### Weather Ability Effects Pipeline (regression check)
- **Rule:** Various ability effects at turn start/end: Ice Body (Hail, heal tick), Rain Dish (Rain, heal tick), Solar Power (Sun, lose 1/16), Dry Skin (Rain heal tick / Sun lose tick), Desert Weather (Rain, heal 1/16).
- **Implementation:** `WEATHER_ABILITY_EFFECTS` constant now lives in `utils/weatherRules.ts:521-532` (moved from server by MEDIUM-003 fix, c24c4c30). The server re-exports for backward compatibility at `weather-automation.service.ts:122-124`. `WeatherEffectIndicator.vue` now imports from `~/utils/weatherRules` (line 18).
- **Status:** CORRECT — All hpFraction values match PTU ability descriptions. No values changed during the move.

## Summary

All 4 issues from code-review-317 have been correctly resolved:

1. **HIGH-001 (Thermosensitive server-side movement):** Weather threaded through all server-side `applyMovementModifiers()` call sites. Hail halving logic is rules-correct.

2. **MEDIUM-001 (Sand Force clamp ordering):** `abilityDamageBonus` applied before min-1 clamp. Produces correct results when `afterDefense` is negative.

3. **MEDIUM-002 (app-surface.md):** Surface map documents Thermosensitive movement halving and P2 weather additions.

4. **MEDIUM-003 (server import in client):** `WEATHER_ABILITY_EFFECTS` moved to shared `utils/weatherRules.ts`. Server re-exports for compatibility.

No new PTU rule violations or regressions detected. Previous rules-review-290 APPROVED verdict stands.

## Rulings

- Per decree-045, Sun Blanket uses Tick (1/10th max HP), confirmed correct in `weatherRules.ts:525`.
- Sand Force "+5 Damage" is a flat addition before minimum damage floor, consistent with PTU phrasing of other flat damage bonuses.
- Thermosensitive Hail halving applies to Overland speed for both standalone and mounted movement. Implementation halves at the modifier level, which correctly reduces "movement capabilities" per the ability text.

## Verdict

**APPROVED** — All fix cycle changes are rules-correct. No new issues found.

## Required Changes

None.
