---
review_id: code-review-310
review_type: code
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
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/utils/turn-helpers.ts
  - app/composables/useCombat.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useDamageCalculation.ts
  - app/stores/encounter.ts
  - app/types/combat.ts
  - .claude/skills/references/app-surface.md
  - artifacts/designs/design-weather-001/spec-p1.md
  - artifacts/designs/design-weather-001/shared-specs.md
  - artifacts/tickets/in-progress/feature/feature-018.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 1
reviewed_at: 2026-03-03T20:45:00+00:00
follows_up: code-review-304
---

## Review Scope

P1 implementation of feature-018 (Weather Effect Automation): 7 commits across 3 sections.

- **Section D:** Type Damage Modifiers -- Rain/Sun +/-5 DB for Water/Fire moves (Step 1.5 in calculateDamage)
- **Section E:** Weather CS Abilities -- Swift Swim, Chlorophyll, Sand Rush (+4 Speed), Solar Power (+2 SpAtk), applied/reversed via decree-005 stageSources
- **Section F:** Weather Ability Healing/Damage -- Ice Body, Rain Dish, Sun Blanket (heal at turn start), Solar Power (damage at turn start), Dry Skin (heal/damage at turn end), Desert Weather (heal at turn end)

Reviewed all source files listed above, the P1 design spec, shared-specs.md, the PTU rulebook (10-indices-and-reference.md ability descriptions and weather summary sections), and decree-005.

## Issues

### CRITICAL-001: Client-side damage calculation does not apply weather DB modifier

**File:** `app/composables/useMoveCalculation.ts`, line 334-337

The `effectiveDB` computed property calculates damage base as `damageBase + 2` (STAB only) with no weather modifier:

```typescript
const effectiveDB = computed(() => {
  if (!move.value.damageBase) return 0
  return hasSTAB.value ? move.value.damageBase + 2 : move.value.damageBase
})
```

This is the damage path used by the MoveTargetModal when a player/GM executes a move via the UI. The computed `targetDamageCalcs` (line 517-616) feeds into `getConfirmData()` which sends the final damage numbers to `move.post.ts`. Since `move.post.ts` receives pre-calculated damage (body.targetDamages), the weather DB modifier is never applied to actual move damage.

The server-side `calculate-damage.post.ts` correctly passes `weather: record.weather` (line 263), but this endpoint is a read-only preview calculator -- it is NOT used in the actual move execution pipeline.

**Impact:** Rain/Sun weather type damage modifiers (+/-5 DB) are completely non-functional for all moves executed through the UI. A Water-type move in Rain should deal significantly more damage (+5 DB), but currently deals the same as without weather.

**Fix:** `useMoveCalculation.ts` must apply `getWeatherDamageModifier(weather, moveType)` to the `effectiveDB` computation. The weather value should come from the encounter store (`useEncounterStore().encounter?.weather`). The design spec (spec-p1.md lines 106-115) identified this caller gap but named the wrong files (`useCombat.ts` and `encounter.ts` do not call `calculateDamage` from `damageCalculation.ts`). The actual caller is `useMoveCalculation.ts`.

### HIGH-001: WebSocket broadcast for weather ability effects sends incorrect newHp and fainted values

**File:** `app/server/api/encounters/[id]/next-turn.post.ts`, lines 703-718

```typescript
for (const result of weatherAbilityResults) {
  broadcastToEncounter(id, {
    type: 'status_tick',
    data: {
      ...
      newHp: 0, // Caller doesn't track post-effect HP in WeatherAbilityResult
      fainted: false,
      ...
    }
  })
}
```

`newHp: 0` is hardcoded for all weather ability broadcasts. This means the Group View displays `newHp: 0` for every weather ability effect (healing or damage). Additionally, `fainted: false` is hardcoded but Solar Power or Dry Skin damage can cause fainting (handled correctly in `applyWeatherAbilityEffects` which calls `applyFaintStatus`). The broadcast does not reflect the actual post-effect state.

**Fix:** Extend `WeatherAbilityResult` to include `newHp` and `fainted` fields, populated by `applyWeatherAbilityEffects` in turn-helpers.ts after applying the effect. Alternatively, read `combatant.entity.currentHp` and check faint status at broadcast time.

### MEDIUM-001: Design spec/shared-specs P1 scope mismatch for Desert Weather Sun fire resistance

**File:** `artifacts/designs/design-weather-001/shared-specs.md`, line 93

The shared-specs ability-weather matrix lists `Desert Weather | Sun | Resist Fire one step further | P1`. However, spec-p1.md does not include this in any section (D, E, or F), and the implementation does not handle it. The PTU ability text (10-indices-and-reference.md line 1108-1111) confirms Desert Weather "resists Fire-Type Moves in Sunny Weather."

This is a design-spec inconsistency rather than a developer error -- the detailed P1 spec omitted the effect that the matrix assigned to P1. However, since the developer is already in this code, the missing implementation should either be added now (it is a straightforward type effectiveness modifier) or the shared-specs matrix should be updated to move it to P2 with a note.

**Fix:** Either implement Desert Weather's Sun fire resistance now (modifying type effectiveness when weather=sunny and target has Desert Weather), or update shared-specs.md line 93 to mark it as P2 and file a tracking note.

## What Looks Good

1. **Step 1.5 weather modifier in damageCalculation.ts is clean and correct.** The `getWeatherDamageModifier` function normalizes type casing, handles null/undefined weather, and the modifier is applied before STAB with a `Math.max(1, ...)` floor. The breakdown includes `weatherModifier` and `weatherModifierApplied` for transparency. Backward-compatible via optional `weather` field.

2. **decree-005 compliance for CS stage tracking.** The `WEATHER_CS_ABILITIES` constant, `getWeatherCSBonuses()`, and the apply/reverse logic in `weather.post.ts` correctly use the `stageSources` system with `weather:` prefix sources. The `actualDelta` pattern (line 107 of weather.post.ts) correctly records the clamped delta rather than the raw bonus, ensuring clean reversal even at CS cap boundaries. `reverseWeatherCSBonuses` in turn-helpers.ts correctly mirrors this for weather expiry.

3. **Weather ability effects data model is well-structured.** `WEATHER_ABILITY_EFFECTS` array cleanly separates ability, weather, timing, type, and hpFraction. The `getWeatherAbilityEffects` function correctly filters by weather, timing, and combatant abilities with case-insensitive matching. Fainted combatants are skipped.

4. **Turn lifecycle integration is ordered correctly.** Turn-end effects (Dry Skin, Desert Weather) fire before status tick damage (Burn, Poison). Turn-start effects (Ice Body, Rain Dish, Sun Blanket, Solar Power) fire after weather tick damage. Weather CS reversal fires after `decrementWeather` clears weather. All skip the declaration phase. The `applyWeatherAbilityEffects` helper in turn-helpers.ts handles faint cascades, mount dismount, and XP tracking.

5. **Commit granularity is good.** 7 commits map cleanly to logical units: Step 1.5 modifier, CS constants, CS apply/reverse, CS expiry, ability effects data, ability effects integration, docs. Each commit produces a working state.

6. **app-surface.md correctly updated** with weatherRules.ts exports, weather-automation.service.ts P1 additions, and turn-helpers.ts inventory.

7. **File sizes are within limits.** next-turn.post.ts at 744 lines (under 800), weather.post.ts at 156 lines, turn-helpers.ts at 336 lines, weather-automation.service.ts at 215 lines.

## Verdict

**CHANGES_REQUIRED**

CRITICAL-001 must be fixed before approval. The weather DB modifier is the headline feature of Section D, and it is non-functional for all actual move executions through the UI. The server-side preview calculator works, but the real damage pipeline bypasses the modifier entirely.

HIGH-001 should be fixed in the same pass -- broadcasting `newHp: 0` to the Group View for every weather ability effect is a visible UX bug that will confuse the GM.

MEDIUM-001 (Desert Weather Sun fire resistance) should be resolved either by implementation or by updating the design matrix to defer to P2.

## Required Changes

1. **CRITICAL-001:** Add weather DB modifier to `useMoveCalculation.ts` effectiveDB computation. Import `getWeatherDamageModifier` from `~/utils/damageCalculation` (or `~/utils/weatherRules`). Read weather from encounter store. Apply as `Math.max(1, rawDB + weatherModifier)` before STAB.

2. **HIGH-001:** Extend `WeatherAbilityResult` or `applyWeatherAbilityEffects` return to include post-effect `newHp` and `fainted` status. Update the WebSocket broadcast in next-turn.post.ts to use actual values instead of hardcoded `0`/`false`.

3. **MEDIUM-001:** Update shared-specs.md matrix to move Desert Weather Sun fire resistance to P2, OR implement it now. If deferring, add a note in the P2 spec.
