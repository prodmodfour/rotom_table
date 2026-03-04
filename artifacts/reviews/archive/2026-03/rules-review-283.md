---
review_id: rules-review-283
review_type: rules
reviewer: game-logic-reviewer
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
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - "PTU pp.341-342 (10-indices-and-reference.md:3550-3632) — Weather conditions and effects"
  - "PTU p.2575-2579 (10-indices-and-reference.md) — Sun Blanket ability description"
  - "PTU p.2393-2397 (10-indices-and-reference.md) — Solar Power ability description"
  - "PTU p.1539-1543 (10-indices-and-reference.md) — Ice Body ability description"
  - "PTU p.2144-2147 (10-indices-and-reference.md) — Rain Dish ability description"
  - "PTU p.1169-1177 (10-indices-and-reference.md) — Dry Skin ability description"
  - "PTU p.1106-1111 (10-indices-and-reference.md) — Desert Weather ability description"
  - "PTU p.2606-2609 (10-indices-and-reference.md) — Swift Swim ability description"
  - "PTU p.892-895 (10-indices-and-reference.md) — Chlorophyll ability description"
  - "PTU p.2242-2246 (10-indices-and-reference.md) — Sand Rush ability description"
  - "PTU p.246 (07-combat.md) — Tick = 1/10th max HP"
  - "decree-005 — Auto-apply CS with source tracking (stageSources system)"
reviewed_at: 2026-03-03T20:45:00+00:00
follows_up: rules-review-277
---

## Mechanics Verified

### 1. Rain Type Damage Modifier
- **Rule:** "While Rainy, Water-Type Attacks gain a +5 bonus to Damage Rolls, and Fire-Type Attacks suffer a -5 Damage penalty." (`10-indices-and-reference.md:3565-3567`)
- **Implementation:** `getWeatherDamageModifier()` in `damageCalculation.ts:259-279` returns +5 for Water when weather is `'rain'`, -5 for Fire when weather is `'rain'`.
- **Status:** CORRECT

### 2. Sun Type Damage Modifier
- **Rule:** "While Sunny, Fire-Type Attacks gain a +5 bonus to Damage Rolls, and Water-Type Attacks suffer a -5 Damage penalty." (`10-indices-and-reference.md:3597-3599`)
- **Implementation:** `getWeatherDamageModifier()` returns +5 for Fire when weather is `'sunny'`, -5 for Water when weather is `'sunny'`.
- **Status:** CORRECT

### 3. Weather DB Modifier Application Order
- **Rule:** PTU damage formula applies DB modifications before the set damage chart lookup. Weather modifies "Damage Rolls" (i.e., the Damage Base). STAB also applies to DB.
- **Implementation:** `calculateDamage()` in `damageCalculation.ts:303-373` applies weather modifier as Step 1.5 (after raw DB, before STAB), with `weatherAdjustedDB = Math.max(1, rawDB + weatherModifier)`, then STAB is applied to `weatherAdjustedDB`. The DB floor of 1 prevents negative/zero DB values from weather penalty.
- **Status:** CORRECT. Ordering is sound: weather first, then STAB. Both are additive to DB before chart lookup, matching PTU intent.

### 4. Weather Field Passed to Damage Calculator
- **Rule:** Weather modifier must be applied to all damage calculations when weather is active.
- **Implementation:** `calculate-damage.post.ts:263` passes `weather: record.weather` to the `calculateDamage()` function. The `weather` field on `DamageCalcInput` is optional, so existing callers without weather get `weatherModifier: 0` (backward compatible).
- **Status:** CORRECT

### 5. Swift Swim (+4 Speed CS in Rain)
- **Rule:** "While in Rainy Weather, the user gains +4 Speed Combat Stages." (`10-indices-and-reference.md:2608-2609`)
- **Implementation:** `WEATHER_CS_ABILITIES` in `weatherRules.ts:115` defines `{ weather: 'rain', ability: 'Swift Swim', stat: 'speed', bonus: 4 }`. Applied via `getWeatherCSBonuses()` when weather is set in `weather.post.ts`.
- **Status:** CORRECT

### 6. Chlorophyll (+4 Speed CS in Sunny)
- **Rule:** "While in Sunny Weather, the user gains +4 Speed Combat Stages." (`10-indices-and-reference.md:894-895`)
- **Implementation:** `WEATHER_CS_ABILITIES` in `weatherRules.ts:116` defines `{ weather: 'sunny', ability: 'Chlorophyll', stat: 'speed', bonus: 4 }`.
- **Status:** CORRECT

### 7. Sand Rush (+4 Speed CS in Sandstorm)
- **Rule:** "While the Weather is a Sandstorm, the user gains +4 Speed Combat Stages." (`10-indices-and-reference.md:2244-2245`)
- **Implementation:** `WEATHER_CS_ABILITIES` in `weatherRules.ts:117` defines `{ weather: 'sandstorm', ability: 'Sand Rush', stat: 'speed', bonus: 4 }`.
- **Status:** CORRECT

### 8. Solar Power (+2 SpAtk CS in Sunny)
- **Rule:** "When Sunny, its Special Attack Stat is increased by 2 Combat Stages." (`10-indices-and-reference.md:2396-2397`)
- **Implementation:** `WEATHER_CS_ABILITIES` in `weatherRules.ts:118` defines `{ weather: 'sunny', ability: 'Solar Power', stat: 'specialAttack', bonus: 2 }`.
- **Status:** CORRECT

### 9. Solar Power (lose 1/16th max HP at turn start in Sunny)
- **Rule:** "When Sunny, the Pokemon loses 1/16th of its Max HP at the beginning of its turn." (`10-indices-and-reference.md:2395-2396`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:148` defines `{ ability: 'Solar Power', weather: 'sunny', timing: 'turn_start', type: 'damage', hpFraction: 16 }`. Amount computed as `Math.max(1, Math.floor(maxHp / 16))` in `getWeatherAbilityEffects()`:194.
- **Status:** CORRECT. Timing (turn start), fraction (1/16th), and minimum (1) all match PTU RAW.

### 10. Ice Body (heal 1 tick at turn start in Hail)
- **Rule:** "While Hailing, the user gains a Tick of Hit Points at the beginning of each of their turns." (`10-indices-and-reference.md:1541-1542`). Weather summary confirms: "Users with Ice Body recover a Tick of Hit Points at the beginning of each turn." (`10-indices-and-reference.md:3557-3558`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:145` defines `{ ability: 'Ice Body', weather: 'hail', timing: 'turn_start', type: 'heal', hpFraction: 10 }`. A Tick = 1/10th max HP (PTU p.246).
- **Status:** CORRECT

### 11. Rain Dish (heal 1 tick at turn start in Rain)
- **Rule:** "While Rainy, the user gains a Tick of Hit Points at the beginning of each of their turns." (`10-indices-and-reference.md:2146-2147`). Weather summary: "Users with Rain Dish recover a Tick of Hit Points at the beginning of each turn." (`10-indices-and-reference.md:3574-3575`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:146` defines `{ ability: 'Rain Dish', weather: 'rain', timing: 'turn_start', type: 'heal', hpFraction: 10 }`.
- **Status:** CORRECT

### 12. Sun Blanket (heal at turn start in Sunny)
- **Rule — Ability description:** "gains a Tick of Hit Points at the beginning of each turn in Sunny weather." (`10-indices-and-reference.md:2578-2579`). A Tick = 1/10th max HP.
- **Rule — Weather summary:** "Users with Sun Blanket gain 1/16th of their Max Hit Points at the beginning of each turn." (`10-indices-and-reference.md:3612-3613`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:147` defines `{ ability: 'Sun Blanket', weather: 'sunny', timing: 'turn_start', type: 'heal', hpFraction: 10 }` — uses 1/10th (Tick), following the ability description.
- **Status:** NEEDS REVIEW. The PTU rulebook contradicts itself: the ability entry says "a Tick" (1/10th) while the weather summary says "1/16th." The implementation follows the ability description, which is the more detailed, specific source and thus the reasonable default. However, this is a genuine PTU rule ambiguity that should be resolved by decree. See MED-001 below. **No code change required pending decree.**

### 13. Dry Skin (heal 1 tick at turn end in Rain)
- **Rule:** "ends their turn in Rainy Weather, they gain a Tick of Hit Points." (`10-indices-and-reference.md:1175-1177`). Weather summary: "Users wth Dry Skin gain a Tick of Hit Points at the end of each turn." (`10-indices-and-reference.md:3583-3584`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:151` defines `{ ability: 'Dry Skin', weather: 'rain', timing: 'turn_end', type: 'heal', hpFraction: 10 }`.
- **Status:** CORRECT. Both timing (turn end) and amount (1 Tick = 1/10th) match PTU RAW.

### 14. Dry Skin (lose 1 tick at turn end in Sunny)
- **Rule:** "ends their turn in Sunny Weather, they lose a Tick of Hit Points." (`10-indices-and-reference.md:1172-1173`). Weather summary: "Users with Dry Skin lose a Tick of Hit Points at the end of each turn." (`10-indices-and-reference.md:3603-3604`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:152` defines `{ ability: 'Dry Skin', weather: 'sunny', timing: 'turn_end', type: 'damage', hpFraction: 10 }`.
- **Status:** CORRECT

### 15. Desert Weather (heal 1/16th at turn end in Rain)
- **Rule:** "regains 1/16th of its Max Hit Points at the end of each of its turns while in Rainy Weather." (`10-indices-and-reference.md:1109-1111`). Weather summary: "Users with Desert Weather gain 1/16th of their Max Hit Points at the end of each turn." (`10-indices-and-reference.md:3580-3581`)
- **Implementation:** `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts:153` defines `{ ability: 'Desert Weather', weather: 'rain', timing: 'turn_end', type: 'heal', hpFraction: 16 }`.
- **Status:** CORRECT. Both sources agree: 1/16th, turn end.

### 16. Weather CS Application via decree-005 stageSources
- **Rule:** Per decree-005, combat stage changes from automated sources must use the `stageSources` system with source tracking for clean reversal.
- **Implementation:** `weather.post.ts:66-130` applies weather CS bonuses with source strings like `weather:rain:Swift Swim`. On weather change, old `weather:*` sources are filtered, their values reversed from stageModifiers, then new weather bonuses applied. `reverseWeatherCSBonuses()` in `turn-helpers.ts:237-258` handles expiry reversal.
- **Status:** CORRECT. The `StageSource` format `{ stat, value, source }` matches the `StageSource` interface in `combat.ts`. Source prefix `weather:` enables clean filtering. Reversal clamps to [-6, +6] per PTU CS range.

### 17. Weather CS Reversal on Weather Change
- **Rule:** When weather changes (e.g., Rain -> Sun), old weather CS bonuses must be reversed and new ones applied.
- **Implementation:** `weather.post.ts:70-93` reverses all existing `weather:*` stage sources before applying new ones. Each combatant's stageModifiers are updated and synced to database.
- **Status:** CORRECT

### 18. Weather CS Reversal on Weather Expiry
- **Rule:** When weather expires (duration reaches 0), all weather CS bonuses must be reversed.
- **Implementation:** `next-turn.post.ts:267,425-427` captures `weatherBeforeAdvance`, then after `decrementWeather` may set weather to null. If weather was active but is now null, `reverseWeatherCSBonuses(combatants)` is called.
- **Status:** CORRECT

### 19. Fainted Combatant Skip
- **Rule:** Fainted Pokemon cannot benefit from abilities. Weather ability effects should not apply to fainted combatants.
- **Implementation:** `getWeatherAbilityEffects()` in `weather-automation.service.ts:183` checks `combatant.entity.currentHp <= 0` and returns empty array. `applyWeatherAbilityEffects()` in `turn-helpers.ts:287,292` also checks HP before processing.
- **Status:** CORRECT

### 20. Declaration Phase Skip
- **Rule:** Declaration phase in League Battles is not a real turn — no weather effects should fire.
- **Implementation:** `next-turn.post.ts:192,481,546` all check `currentPhase !== 'trainer_declaration'` before processing weather effects.
- **Status:** CORRECT

## Issues

### MED-001: Sun Blanket HP Fraction Ambiguity (MEDIUM)

**PTU Rulebook Internal Contradiction:**
- Sun Blanket ability description (`10-indices-and-reference.md:2578-2579`): "gains a **Tick** of Hit Points at the beginning of each turn in Sunny weather" — Tick = 1/10th max HP (PTU p.246).
- Sunny weather summary (`10-indices-and-reference.md:3612-3613`): "Users with Sun Blanket gain **1/16th** of their Max Hit Points at the beginning of each turn."

The implementation uses `hpFraction: 10` (Tick = 1/10th), following the ability description. This is a reasonable default since ability descriptions are typically more authoritative than summary tables. However, this is a genuine PTU text ambiguity.

**Action required:** A `decree-need` ticket should be created for a human ruling on whether Sun Blanket heals a Tick (1/10th per ability text) or 1/16th (per weather summary). No code change is required until the decree is issued — the current implementation is defensible either way.

**File:** `weather-automation.service.ts:147`
**Severity:** MEDIUM — does not produce obviously wrong values, but the two interpretations differ meaningfully (10% vs 6.25% max HP per turn).

## Summary

All 20 mechanics verified across the P1 implementation. The weather type damage modifiers (Section D), speed-doubling abilities with decree-005 stageSources (Section E), and weather ability healing/damage effects (Section F) are all correctly implemented according to PTU 1.05 RAW.

Key verifications:
- **DB modifiers** (+/-5 for Rain/Sun on Water/Fire) applied correctly as Step 1.5, before STAB, with DB floor of 1.
- **CS abilities** (Swift Swim +4 Speed, Chlorophyll +4 Speed, Sand Rush +4 Speed, Solar Power +2 SpAtk) use decree-005 stageSources system correctly. Source strings follow `weather:{condition}:{ability}` convention. Reversal on weather change and expiry both verified.
- **Turn lifecycle timing** matches PTU RAW: turn-start abilities (Ice Body, Rain Dish, Sun Blanket, Solar Power) fire after weather tick damage on incoming combatant; turn-end abilities (Dry Skin, Desert Weather) fire before status tick damage on outgoing combatant.
- **HP fractions** are correct for all abilities: Tick (1/10th) for Ice Body, Rain Dish, Dry Skin; 1/16th for Solar Power, Desert Weather. Sun Blanket uses Tick (1/10th) per ability text, pending decree on book contradiction.
- **Faint handling** is correct: weather ability damage goes through the full `calculateDamage` + `applyDamageToEntity` + `applyFaintStatus` pipeline with mount dismount and XP tracking.

## Rulings

1. **Sun Blanket HP fraction**: The implementation follows the ability description (Tick = 1/10th max HP) rather than the weather summary (1/16th). This is acceptable pending decree. **Decree-need ticket recommended.**
2. **Step 1.5 ordering**: Weather modifier before STAB is a design decision not explicitly sequenced in PTU RAW (both are DB modifications). The chosen order is consistent with the spec and produces correct results — weather modifies the base, then STAB adds on top. Either ordering would produce the same final DB since both are additive.
3. **Solar Power dual effect**: Solar Power has both a CS bonus (+2 SpAtk, handled via stageSources in `weather.post.ts`) and an HP loss (1/16th, handled via `WEATHER_ABILITY_EFFECTS` in `weather-automation.service.ts`). Both components are correctly split across the two systems per design spec.

## Verdict

**APPROVED** with one MEDIUM advisory.

The P1 implementation correctly implements all 15 unique mechanics across 3 sections (D, E, F). All formulas, timing, fractions, and integration points match PTU 1.05 RAW. The decree-005 stageSources integration is clean and correct. One internal PTU book contradiction (Sun Blanket: Tick vs 1/16th) is handled reasonably by following the ability description text; a decree-need ticket is recommended but not blocking.

## Required Changes

None. The MEDIUM issue is advisory and does not block approval. A decree-need ticket for Sun Blanket's HP fraction should be filed separately.
