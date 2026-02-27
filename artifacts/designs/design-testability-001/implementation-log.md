# Implementation Log

## Implementation Log

### P0 — Damage Calculation Endpoint
- Commits: `5dc97c7` feat: add pure damage calculation utility, `e7aa6aa` feat: add calculate-damage API endpoint
- New files:
  - `app/utils/damageCalculation.ts` — pure functions: stage multipliers, DB chart, 18-type chart, STAB, calculateDamage() with typed breakdown
  - `app/server/api/encounters/[id]/calculate-damage.post.ts` — thin endpoint: loads encounter, extracts combatant stats by damage class, calls calculateDamage(), returns breakdown
- `app-surface.md` updated: yes — added Damage Calculation endpoint section

### P1 — Evasion Recalculation
- Commits: `01150bf` feat: add evasion and accuracy calculation functions, `2dd0d67` feat: add evasion/accuracy section to calculate-damage endpoint
- Modified files:
  - `app/utils/damageCalculation.ts` — added `calculateEvasion()`, `calculateAccuracyThreshold()`, `AccuracyCalcResult` interface
  - `app/server/api/encounters/[id]/calculate-damage.post.ts` — added `getEntityEvasionStats()` helper, computes dynamic evasion from stage-modified stats, returns `accuracy` section in response
- Evasion is now dynamically computed from `floor(stageModifiedStat / 5)` with +6 cap per stat, +9 cap total

### P2 — HP Marker Injury Detection
- Commits: `20253c3` feat: add HP marker injury detection to damage calculation, `2b1a69e` test: update injury expectations for HP marker crossings, `e3a424e` test: update wild encounter injury expectation for HP markers
- Modified files:
  - `app/server/services/combatant.service.ts` — added `countMarkersCrossed()`, extended `calculateDamage()` with unclamped HP for marker detection, extended `DamageResult` with `massiveDamageInjury`, `markerInjuries`, `markersCrossed`, `totalNewInjuries`
  - 11 combat test files — updated injury count expectations to account for HP marker crossings (massive damage from full HP now gives 2 injuries: massive + 50% marker)
- `newHp` stays clamped to 0 for storage; unclamped value used internally for marker detection
- Also fixed 3 pre-existing undefined variable bugs in test files (`expectedHp`/`expectedMachopHp`)

