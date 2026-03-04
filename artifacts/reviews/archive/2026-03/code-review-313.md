---
review_id: code-review-313
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-018
domain: weather
commits_reviewed:
  - ca59d3b9
  - 64a039a0
  - 07d0d701
  - 60ad567f
  - 7d35017c
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/server/services/weather-automation.service.ts
  - app/server/utils/turn-helpers.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/utils/damageCalculation.ts
  - app/utils/weatherRules.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - artifacts/designs/design-weather-001/shared-specs.md
  - artifacts/tickets/in-progress/feature/feature-018.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T01:15:00Z
follows_up: code-review-310
---

## Review Scope

Re-review of feature-018 P1 fix cycle. Previous review (code-review-310) found 1 CRITICAL, 1 HIGH, and 1 MEDIUM issue. This review verifies all three issues are resolved across 5 fix cycle commits.

### Decree Check

- **decree-005** (auto-apply CS with source tracking): Weather CS bonuses use `stageSources` with `weather:` prefix. The `reverseWeatherCSBonuses` helper in `turn-helpers.ts` filters by `source.startsWith('weather:')` and reverses correctly. Compliant.
- **decree-012** (type-based status immunities server-side): Not directly affected by this fix cycle. Weather type immunities remain enforced server-side in `weatherRules.ts`. Compliant.
- **decree-045** (Sun Blanket heals 1 Tick / 1/10th max HP): `WEATHER_ABILITY_EFFECTS` entry for Sun Blanket uses `hpFraction: 10`. Compliant.

## Issues from code-review-310: Resolution Verification

### C1 CRITICAL: Client-side weather DB modifier missing -- RESOLVED

**Previous finding:** `useMoveCalculation.ts` computed `effectiveDB` as `damageBase + (STAB ? 2 : 0)`, completely ignoring Rain/Sun weather modifiers. Since the UI sends pre-calculated damage to the server, weather DB modifiers were non-functional for all moves executed through the MoveTargetModal.

**Fix (ca59d3b9):** Verified the fix is correct and complete:

1. Imports `getWeatherDamageModifier` from `~/utils/damageCalculation` -- the same pure function used server-side.
2. Imports `useEncounterStore` and reads `encounterStore.encounter?.weather ?? null` reactively via Pinia.
3. New `weatherModifier` computed property returns 0 when no damageBase or type, otherwise delegates to `getWeatherDamageModifier`.
4. `effectiveDB` now applies `Math.max(1, move.value.damageBase + weatherModifier.value)` before STAB, matching Step 1.5 in `damageCalculation.ts`.
5. `weatherModifier` is exposed in the composable return object for UI display.

The ordering is correct: weather modifier applies to DB first, then STAB adds +2 on top of the weather-adjusted DB. This matches the server-side `calculateDamage()` function in `damageCalculation.ts` (lines 308-313) and the spec's "Step 1.5" design.

Cross-verified: the server-side `calculate-damage.post.ts` already passes `weather: record.weather` at line 263, so the server-side path was already correct. Only the client-side composable was missing the modifier.

### H1 HIGH: WebSocket broadcast hardcoded newHp:0 / fainted:false -- RESOLVED

**Previous finding:** `WeatherAbilityResult` had no `newHp` or `fainted` fields. The broadcast in `next-turn.post.ts` used hardcoded `newHp: 0` and `fainted: false`, causing Group View to display incorrect HP and miss faint events from weather ability damage.

**Fix (64a039a0 + 07d0d701):** Verified the fix across two commits:

1. **64a039a0** -- Added `newHp: number` and `fainted: boolean` to `WeatherAbilityResult` interface with JSDoc comments. Initialized to `0` and `false` in `getWeatherAbilityEffects()` (placeholder values, same pattern as `WeatherTickResult`).

2. **07d0d701** -- `applyWeatherAbilityEffects()` in `turn-helpers.ts` now populates `effect.newHp` and `effect.fainted` after each heal/damage application:
   - Heal path (line 305-306): Sets `newHp = combatant.entity.currentHp` and `fainted = false`.
   - Damage path (line 338-339): Sets `newHp = combatant.entity.currentHp` and `fainted = damageResult.fainted`.
   - The broadcast in `next-turn.post.ts` (line 714-715) now reads `result.newHp` and `result.fainted` instead of hardcoded values.

The mutation of `effect.newHp` and `effect.fainted` is acceptable because the effect objects are freshly created by `getWeatherAbilityEffects()` and owned by the caller. No shared references are mutated.

Also verified: the heal path correctly clamps healing to maxHp (`Math.min(effect.amount, maxHp - currentHp)`) before setting newHp, and the damage path correctly uses the `calculateDamage` / `applyDamageToEntity` pipeline including injury tracking, faint status application, and mount auto-dismount on faint.

### M1 MEDIUM: Desert Weather Sun fire resistance -- RESOLVED (deferred)

**Previous finding:** Desert Weather's Sun fire resistance was listed in shared-specs P1 tier but was omitted from spec-p1.md and implementation. The scope gap needed to be explicitly addressed.

**Fix (60ad567f):** The shared-specs.md ability matrix entry for "Desert Weather | Sun | Resist Fire one step further" was updated from `P1` to `P2 (deferred from P1 -- requires type effectiveness pipeline changes; see code-review-310 MEDIUM-001)`. This is an acceptable resolution: the feature requires modifying the type effectiveness pipeline (which is a distinct, non-trivial change), and deferring it to P2 with clear documentation prevents scope creep while ensuring it is not forgotten.

## Additional Verification

### rules-review-283 APPROVED Findings Still Hold

- **MED-001 (Sun Blanket HP fraction):** Resolved by decree-045. Implementation uses `hpFraction: 10` (1/10th = Tick), which is correct per the decree. No regression.

### File Size Compliance

All affected files remain under the 800-line limit:
- `useMoveCalculation.ts`: 777 lines
- `next-turn.post.ts`: 744 lines
- `turn-helpers.ts`: 346 lines
- `weather-automation.service.ts`: 222 lines

### Commit Granularity

The 5 commits follow appropriate granularity:
- `ca59d3b9` -- Single logical fix (client-side weather modifier), 1 file changed
- `64a039a0` -- Type addition only, 1 file changed
- `07d0d701` -- Populate values + update broadcast, 2 files changed (logically coupled)
- `60ad567f` -- Documentation-only (tier deferral), 1 file changed
- `7d35017c` -- Ticket resolution log update, 1 file changed

### Consistency Check: Server vs Client Weather Modifier

Both code paths now produce identical weather-adjusted DB values:
- **Server** (`damageCalculation.ts:calculateDamage`): `Math.max(1, rawDB + getWeatherDamageModifier(weather, moveType))` then `+ (STAB ? 2 : 0)`
- **Client** (`useMoveCalculation.ts:effectiveDB`): `Math.max(1, move.value.damageBase + weatherModifier.value)` then `+ (STAB ? 2 : 0)`

Same function, same ordering, same floor of 1. Consistent.

## What Looks Good

1. **Single source of truth for weather modifier logic.** Both client and server import `getWeatherDamageModifier` from the same utility file (`damageCalculation.ts`). No duplicated weather logic.

2. **Reactive weather tracking.** The client composable reads weather from the encounter store, which updates via WebSocket sync. Weather changes are reflected immediately in the move calculation UI without requiring a page refresh.

3. **Clean data flow for WebSocket broadcast.** The pattern of initializing `newHp: 0, fainted: false` in the pure function and populating them in the apply helper keeps the pure function free of side effects while ensuring the broadcast has accurate data.

4. **Defensive coding.** Weather modifier returns 0 when damageBase or type is null/undefined. The `Math.max(1, ...)` floor prevents negative or zero DB values. Guard clauses skip fainted combatants.

5. **Documentation trail.** The ticket resolution log, shared-specs deferral annotation, and commit messages all clearly trace the fix cycle back to code-review-310 findings.

## Verdict

**APPROVED.** All three issues from code-review-310 are resolved correctly. The client-side weather modifier now matches the server-side implementation, WebSocket broadcasts send actual post-effect HP and faint state, and the Desert Weather Sun resistance is properly deferred to P2 with documentation. No new issues found. rules-review-283 findings remain valid (decree-045 compliance confirmed).
