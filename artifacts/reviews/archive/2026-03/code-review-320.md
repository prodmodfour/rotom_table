---
review_id: code-review-320
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-018
domain: scenes
commits_reviewed:
  - 058851d4
  - e3a785f6
  - c24c4c30
  - 7458d79e
  - d8c1c9d8
files_reviewed:
  - app/server/utils/turn-helpers.ts
  - app/server/services/mounting.service.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/utils/damageCalculation.ts
  - app/utils/weatherRules.ts
  - app/components/encounter/WeatherEffectIndicator.vue
  - app/server/services/weather-automation.service.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T11:15:00Z
follows_up: code-review-317
---

## Review Scope

Re-review of feature-018 P2 fix cycle. code-review-317 identified 1 HIGH + 3 MEDIUM issues. Five commits (058851d4 through d8c1c9d8) address all four. This review verifies each fix is correct, complete, and regression-free.

## Issue Resolution Verification

### HIGH-001: Thermosensitive movement halving not applied server-side (RESOLVED)

**Commit:** 058851d4

The fix threads the `weather` parameter through all server-side `applyMovementModifiers()` call sites:

1. **`resetCombatantsForNewRound()`** in `turn-helpers.ts` (line 74): Now accepts `weather?: string | null`. Both mount and rider branches at lines 123 and 129 pass `weather` to `applyMovementModifiers()`.

2. **`next-turn.post.ts`**: All 5 call sites to `resetCombatantsForNewRound()` now pass the `weather` variable (lines 390, 410, 429, 442, 469). Verified the `weather` variable is in scope at all call sites -- it is declared earlier in the handler and available throughout.

3. **`executeMount()`** in `mounting.service.ts` (line 237): Now accepts `weather?: string | null` as final parameter. The `applyMovementModifiers()` call at line 250 passes it through.

4. **`resetMountMovement()`** in `mounting.service.ts` (line 435): Now accepts `weather?: string | null`. Both mount (line 441) and rider (line 454) branches pass it through.

5. **`mount.post.ts`** (line 48): Passes `record.weather` to `executeMount()`.

All call sites accounted for. The `applyMovementModifiers()` function in `utils/movementModifiers.ts` already had the `weather?: string | null` parameter (line 28), so the fix correctly threads the existing parameter through all server callers.

**Note on intercept.service.ts:** The `getCombatantSpeed()` function in `intercept.service.ts` (line 179) is a separate, private implementation used for intercept eligibility range checks, not for movement budget calculation. It does not need Thermosensitive halving because intercept eligibility compares base movement capability, not remaining movement budget. Not a regression.

### MEDIUM-001: Sand Force min-1 clamp ordering divergence (RESOLVED)

**Commit:** e3a785f6

The fix in `damageCalculation.ts` correctly restructures the damage pipeline:

- **Before:** `afterDefense = Math.max(1, subtotalBeforeDefense - effectiveDefense - dr)` followed by `afterAbilityBonus = afterDefense + abilityDamageBonus`. This meant the min-1 clamp applied before the ability bonus, so a -3 pre-defense result would become 1, then +5 bonus would yield 6 instead of the correct `Math.max(1, -3 + 5) = 2`.

- **After:** `afterDefense = subtotalBeforeDefense - effectiveDefense - dr` (no clamp), then `afterAbilityBonus = Math.max(1, afterDefense + abilityDamageBonus)`. The clamp now applies after the bonus, which is the correct ordering.

The comment at lines 350-351 clearly explains the rationale. The subsequent type effectiveness multiplication at line 358 uses `afterAbilityBonus` correctly, and the secondary min-1 check at lines 361-367 still handles the post-effectiveness floor. No regression in the damage pipeline.

### MEDIUM-002: app-surface.md not updated (RESOLVED)

**Commit:** 7458d79e

The app-surface.md diff adds:
- `WeatherEffectIndicator.vue` description in the Key encounter components section
- Expanded `weatherRules.ts` description with all P2 additions (evasion, Weather Ball, Forecast, Sand Force, new constants, WeatherAbilityEffect interface)
- New `movementModifiers.ts` utility entry documenting the shared movement modifier function
- Updated `weather-automation.service.ts` description noting WEATHER_ABILITY_EFFECTS is re-exported from `utils/weatherRules.ts`

All P2 surface area additions are documented.

### MEDIUM-003: WeatherEffectIndicator imports from server service (RESOLVED)

**Commit:** c24c4c30

The fix moves `WEATHER_ABILITY_EFFECTS` and `WeatherAbilityEffect` from `server/services/weather-automation.service.ts` to `utils/weatherRules.ts` (lines 512-532). The server service now re-exports for backward compatibility:

```typescript
export { WEATHER_ABILITY_EFFECTS } from '~/utils/weatherRules'
export type { WeatherAbilityEffect } from '~/utils/weatherRules'
```

`WeatherEffectIndicator.vue` now imports from `~/utils/weatherRules` (line 17), which is the correct client-side import path. The server service maintains re-exports so existing server-side consumers are unaffected. Clean separation.

## What Looks Good

1. **Commit granularity is excellent.** Each of the 4 fixes is a separate commit with a clear message referencing the specific issue from code-review-317. The 5th commit updates the ticket. This is the correct granularity per project guidelines.

2. **Immutability preserved.** `mounting.service.ts` functions (`executeMount`, `resetMountMovement`) use spread operators and `.map()` to produce new objects. `turn-helpers.ts` mutates in-place but the comment at line 68 correctly notes this is acceptable because combatants are freshly parsed from JSON.

3. **Optional parameter placement.** The `weather` parameter is added as the last parameter in all function signatures, preserving backward compatibility. Existing callers that don't pass weather continue to work (it defaults to `undefined`, which means no Thermosensitive halving -- correct behavior when weather is unknown).

4. **Decree compliance verified.** Per decree-045, Sun Blanket uses `hpFraction: 10` (Tick = 1/10th max HP) in the WEATHER_ABILITY_EFFECTS constant. Correct.

5. **No file exceeds 800 lines.** Largest reviewed file is `mounting.service.ts` at 562 lines.

## Verdict

**APPROVED.** All 4 issues from code-review-317 are resolved correctly. No new issues introduced. No regressions detected. The fix cycle is clean and well-structured.
