---
review_id: code-review-317
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-018
domain: scenes
commits_reviewed:
  - 0c07439f
  - 67caef24
  - 00b78ab5
  - 778bc79d
  - aafe5512
  - dbfd9303
  - 37ba58f9
  - 546fcfb3
  - 5560c70d
  - f61a7171
  - 2c19d0c8
  - 4e48f784
files_reviewed:
  - app/utils/weatherRules.ts
  - app/types/encounter.ts
  - app/components/encounter/WeatherEffectIndicator.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/EncounterHeader.vue
  - app/server/api/encounters/[id]/weather.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/composables/useMoveCalculation.ts
  - app/utils/damageCalculation.ts
  - app/server/utils/turn-helpers.ts
  - app/server/services/weather-automation.service.ts
  - app/utils/movementModifiers.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 3
reviewed_at: 2026-03-04T10:15:00Z
follows_up: null
---

## Review Scope

P2 tier of feature-018 (Weather Effect Automation), implementing spec sections G, H, I, J:

- **G. Weather Ball**: Dynamic type/DB override (`getWeatherBallEffect`) in both client (`useMoveCalculation.ts`) and server (`calculate-damage.post.ts`) damage paths.
- **H. Forecast (Castform)**: Type changes on weather set/expire, `forecastOriginalTypes` on Combatant interface, applied in `weather.post.ts`, reversed in `turn-helpers.ts::reverseForecastTypeChanges`.
- **I. WeatherEffectIndicator**: New component with CombatantCard integration, enhanced EncounterHeader tooltip.
- **J. Additional Abilities**: Hydration/Leaf Guard status cure at turn end, Sand Force +5 damage bonus, Snow Cloak/Sand Veil evasion bonuses, Thermosensitive Atk/SpAtk CS in Sun + movement halving in Hail.

12 commits reviewed. All P2 spec sections are represented. Decree-045 (Sun Blanket uses Tick) compliance verified — `weather-automation.service.ts` uses `hpFraction: 10` and EncounterHeader tooltip says "1/10 max HP". Decree-005 (stageSources) correctly used for evasion and CS tracking.

## Issues

### HIGH-001: Thermosensitive movement halving not applied in server-side mount speed calculations

**Files:** `app/server/utils/turn-helpers.ts` (lines 123, 129), `app/server/services/mounting.service.ts` (lines 249, 440, 453)

`applyMovementModifiers()` was updated to accept an optional `weather` parameter for Thermosensitive halving in Hail. The client-side `useGridMovement.ts` correctly passes `currentWeather.value` at all 4 call sites. However, all 5 server-side callers in `turn-helpers.ts::resetCombatantsForNewRound` and `mounting.service.ts` do NOT pass the weather parameter:

```typescript
// turn-helpers.ts:123 — missing weather
const mountSpeed = applyMovementModifiers(c, getOverlandSpeed(c))
// should be:
const mountSpeed = applyMovementModifiers(c, getOverlandSpeed(c), weather)
```

This means mounted combatants with Thermosensitive will show correct movement on the client VTT grid but receive incorrect (non-halved) `movementRemaining` from the server after round resets and mount operations. When the combatant moves, the client budget is correct but the server-persisted budget is too high, creating a desync.

**Fix:** Pass the encounter's current weather to all 5 server-side `applyMovementModifiers()` call sites. `resetCombatantsForNewRound` needs a `weather` parameter added to its signature. `mounting.service.ts` functions that call `applyMovementModifiers` need the encounter weather threaded through.

### MEDIUM-001: Sand Force min-1 clamp ordering diverges between client and server

**Files:** `app/composables/useMoveCalculation.ts` (line 664), `app/utils/damageCalculation.ts` (lines 340-344)

Server formula (damageCalculation.ts):
```typescript
const afterDefense = Math.max(1, subtotalBeforeDefense - effectiveDefense - dr)  // min 1 FIRST
const afterAbilityBonus = afterDefense + abilityDamageBonus  // THEN add bonus
```

Client formula (useMoveCalculation.ts):
```typescript
let damage = preDefenseTotal - defenseStat - equipmentDR + sandForceDamageBonus  // bonus FIRST
damage = Math.max(1, damage)  // THEN min 1
```

When pre-bonus damage is negative (e.g., -10), the server yields `max(1, -10) + 5 = 6` while the client yields `max(1, -10 + 5) = max(1, -5) = 1`. Edge case, but a real divergence. The client's approach (add bonus then clamp) is the more intuitive reading of "+5 Damage" — it should be added to the raw subtotal before the minimum floor.

**Fix:** In `damageCalculation.ts`, move `abilityDamageBonus` into the defense subtraction line and apply the min-1 clamp after:
```typescript
const afterDefenseAndBonus = subtotalBeforeDefense - effectiveDefense - dr + abilityDamageBonus
const afterAbilityBonus = Math.max(1, afterDefenseAndBonus)
```

### MEDIUM-002: `app-surface.md` not updated with P2 additions

**File:** `.claude/skills/references/app-surface.md`

The weather rules utility entry does not include the P2 functions (`getWeatherBallEffect`, `getForecastType`, `getWeatherEvasionBonuses`, `getSandForceDamageBonus`, `WEATHER_EVASION_ABILITIES`, `SAND_FORCE_TYPES`, `WEATHER_STATUS_CURE_ABILITIES`, `CURABLE_PERSISTENT_STATUSES`).

The new `WeatherEffectIndicator.vue` component is not listed in the encounter components section.

The `movementModifiers.ts` utility is not listed as a shared utility.

Per the review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" — answer: no.

**Fix:** Update `app-surface.md` to include all P2 additions to weatherRules.ts, the new WeatherEffectIndicator component under encounter components, and the movementModifiers.ts utility.

### MEDIUM-003: WeatherEffectIndicator imports server-only service on client

**File:** `app/components/encounter/WeatherEffectIndicator.vue` (line 18)

```typescript
import { WEATHER_ABILITY_EFFECTS } from '~/server/services/weather-automation.service'
```

This imports from `~/server/services/`, which is the Nitro server layer. In Nuxt 3 SPA mode, this import may work because the build processes all files, but it violates the architectural boundary between client components and server services. The `WEATHER_ABILITY_EFFECTS` constant is a pure data array with no server dependencies, so it would work at runtime, but it creates a conceptual coupling that could break if the service ever imports server-only modules (like Prisma).

**Fix:** Move `WEATHER_ABILITY_EFFECTS` (or at least the subset needed — the ability/weather/type mapping) to `app/utils/weatherRules.ts` alongside the other client-accessible weather constants (`WEATHER_CS_ABILITIES`, `WEATHER_EVASION_ABILITIES`, `WEATHER_STATUS_CURE_ABILITIES`). Then update `weather-automation.service.ts` and `WeatherEffectIndicator.vue` to import from the shared utility.

## What Looks Good

1. **weatherRules.ts structure**: Clean separation of P2 utility functions with thorough JSDoc comments and PTU page references. The pure function pattern established in P0/P1 is consistently extended.

2. **Forecast type change lifecycle**: Correctly handles all three scenarios — weather set (save originals + apply), weather change (reuse saved originals + apply new), weather clear (restore originals). The `forecastOriginalTypes` field on Combatant is well-designed as combat-scoped state that avoids contaminating the persistent entity.

3. **Weather Ball dual integration**: Both client-side (`useMoveCalculation.ts::effectiveMoveType/effectiveMoveDB`) and server-side (`calculate-damage.post.ts`) correctly resolve Weather Ball's type/DB at move use time. STAB correctly uses the weather-adjusted type.

4. **EncounterHeader tooltip**: Comprehensive and well-organized. Lists all relevant effects per weather type including P2 additions (evasion bonuses, status cures, Sand Force, Thermosensitive). Correctly cites Sun Blanket as "1/10 max HP" per decree-045.

5. **Hydration/Leaf Guard implementation**: Uses `updateStatusConditions` for clean CS reversal (decree-005 compliance). Correctly resets `badlyPoisonedRound` when curing Badly Poisoned. Only cures one status per turn as specified.

6. **Evasion bonuses tracked via decree-005 stageSources**: Snow Cloak and Sand Veil use `source: 'weather:hail:Snow Cloak'` format, enabling clean reversal when weather changes/expires. Consistent with the P1 CS bonus pattern.

7. **Commit granularity**: 12 commits mapping cleanly to individual spec sections. Each commit touches a focused set of files.

8. **WeatherEffectIndicator component**: Well-structured with clear priority ordering (damage > immune > heal > cure > boost). CSS styling with appropriate color coding for each effect type.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue (server-side Thermosensitive movement halving not applied to mounted combatants) and three MEDIUM issues need resolution before approval.

## Required Changes

1. **HIGH-001**: Thread encounter weather through to all 5 server-side `applyMovementModifiers()` call sites in `turn-helpers.ts::resetCombatantsForNewRound` and `mounting.service.ts`. Add `weather` parameter to `resetCombatantsForNewRound` signature.

2. **MEDIUM-001**: Align Sand Force min-1 clamp ordering between client and server by moving `abilityDamageBonus` before the `Math.max(1, ...)` in `damageCalculation.ts`.

3. **MEDIUM-002**: Update `app-surface.md` with all P2 additions (weatherRules.ts functions, WeatherEffectIndicator component, movementModifiers.ts).

4. **MEDIUM-003**: Move `WEATHER_ABILITY_EFFECTS` constant to `app/utils/weatherRules.ts` to avoid client component importing from server service layer.
