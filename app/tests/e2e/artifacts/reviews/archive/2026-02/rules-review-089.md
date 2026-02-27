---
review_id: rules-review-089
target: refactoring-048
trigger: orchestrator-routed
reviewed_commits:
  - 4cebdcb
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Scope

Verify that the capture rate deduplication in commit `4cebdcb` is a purely structural refactoring with no change in PTU correctness. The commit replaces ~90 lines of duplicated capture rate arithmetic in `useCapture.ts:calculateCaptureRateLocal` with a delegation to the canonical `calculateCaptureRate()` from `utils/captureRate.ts`.

## 1. Capture Rate Formula Correctness (`captureRate.ts`)

Verified each step of the capture rate formula in `app/utils/captureRate.ts` against PTU 1.05 Core p.1718-1741 ("Calculating Capture Rates"):

| Step | PTU Rule | Code (captureRate.ts) | Correct |
|------|----------|----------------------|---------|
| Base | Start with 100 | `const base = 100` | Yes |
| Level | Subtract Level x 2 | `-(level * 2)` | Yes |
| HP > 75% | Subtract 30 | `hpModifier = -30` | Yes |
| HP <= 75% | Subtract 15 | `hpModifier = -15` | Yes |
| HP <= 50% | Unmodified | `hpModifier = 0` | Yes |
| HP <= 25% | Add 15 | `hpModifier = 15` | Yes |
| HP = 1 | Add 30 | `hpModifier = 30` (checked first) | Yes |
| HP = 0 | Cannot capture | `canBeCaptured = currentHp > 0` | Yes |
| 2 evolutions remaining | Add 10 | `evolutionModifier = 10` | Yes |
| 1 evolution remaining | No change | `evolutionModifier = 0` | Yes |
| 0 evolutions remaining | Subtract 10 | `evolutionModifier = -10` | Yes |
| Shiny | Subtract 10 | `shinyModifier = isShiny ? -10 : 0` | Yes |
| Legendary | Subtract 30 | `legendaryModifier = isLegendary ? -30 : 0` | Yes |
| Persistent condition | Add 10 each | `statusModifier += 10` | Yes |
| Volatile condition | Add 5 each | `statusModifier += 5` | Yes |
| Poison dedup | Poisoned/Badly Poisoned count as one | `hasPoisonBonus` flag | Yes |
| Stuck | Add 10 (stacks with persistent/volatile) | `stuckModifier += 10` | Yes |
| Slow | Add 5 (stacks with persistent/volatile) | `slowModifier += 5` | Yes |
| Injury | Add 5 each | `injuryModifier = injuries * 5` | Yes |

### Verification Against PTU Book Examples

**Example 1** (PTU p.1735): Level 10 Pikachu, 70% HP, Confused.
- 100 - 20 (level) - 15 (HP 70%) + 0 (1 evo remaining) + 5 (Confused, volatile) = **70**. Book says 70. Match.

**Example 2** (PTU p.1737): Shiny level 30 Caterpie, 40% HP, 1 injury.
- 100 - 60 (level) + 0 (HP 40%) + 10 (2 evos remaining) - 10 (shiny) + 5 (injury) = **45**. Book says 45. Match.

**Example 3** (PTU p.1739): Level 80 Hydreigon, 1 HP, Burned, Poisoned, 1 injury.
- 100 - 160 (level) + 30 (HP=1) - 10 (0 evos remaining) + 10 (Burned, persistent) + 10 (Poisoned, persistent) + 5 (injury) = **-15**. Book says -15. Match.

## 2. Parameter Mapping Preservation

All nine input parameters from the old `calculateCaptureRateLocal` are forwarded to `calculateCaptureRate()`:

| Parameter | Old Default | New Default (`??`) | Preserved |
|-----------|-------------|-------------------|-----------|
| `level` | (required) | (required) | Yes |
| `currentHp` | (required) | (required) | Yes |
| `maxHp` | (required) | (required) | Yes |
| `evolutionStage` | `= 1` | `?? 1` | Yes |
| `maxEvolutionStage` | `= 3` | `?? 3` | Yes |
| `statusConditions` | `= []` | `?? []` | Yes |
| `injuries` | `= 0` | `?? 0` | Yes |
| `isShiny` | `= false` | `?? false` | Yes |
| `isLegendary` | `= false` | `?? false` | Yes |

The shift from destructured defaults (`= value`) to nullish coalescing (`?? value`) is semantically equivalent for optional parameters typed with `?:`, since `undefined ?? value` and `value = default` behave identically.

## 3. No Capture Rate Values Changed

Verified by direct diff of the old duplicated code against the canonical `captureRate.ts`:

- **Base, level, HP, evolution, rarity, status, injury, stuck, slow** -- all arithmetic is identical line-by-line.
- **Poison dedup logic** -- same `hasPoisonBonus` flag guard, same condition checks (`'Poisoned' || 'Badly Poisoned'`).
- **Status condition lists** -- both use `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS` from `~/constants/statusConditions`. The old composable imported them directly; now they are consumed only by `captureRate.ts`. Same source, same values.
- **Summation order** -- identical: `base + levelModifier + hpModifier + evolutionModifier + shinyModifier + legendaryModifier + statusModifier + injuryModifier + stuckModifier + slowModifier`.

No behavioral change. The refactoring is purely structural.

## 4. Breakdown Field Preserved

The `CaptureRateResult.breakdown` type in `captureRate.ts` (lines 34-45) has exactly the same 10 fields as `CaptureRateData.breakdown` in `useCapture.ts` (lines 13-24):

```
base, levelModifier, hpModifier, evolutionModifier,
shinyModifier, legendaryModifier, statusModifier,
injuryModifier, stuckModifier, slowModifier
```

The new composable passes `result.breakdown` through directly (line 120), so all breakdown fields are preserved for UI display.

## 5. Difficulty Description Consistency

The old composable used an inline if/else chain for difficulty labels. The new composable delegates to `getCaptureDescription()` (captureRate.ts line 216-222). Verified the thresholds are identical:

| Threshold | Old (inline) | New (`getCaptureDescription`) | Match |
|-----------|-------------|-------------------------------|-------|
| >= 80 | 'Very Easy' | 'Very Easy' | Yes |
| >= 60 | 'Easy' | 'Easy' | Yes |
| >= 40 | 'Moderate' | 'Moderate' | Yes |
| >= 20 | 'Difficult' | 'Difficult' | Yes |
| >= 1 | 'Very Difficult' | 'Very Difficult' | Yes |
| < 1 | 'Nearly Impossible' | 'Nearly Impossible' | Yes |

## 6. Server Endpoint Consistency

The server endpoint `app/server/api/capture/rate.post.ts` already uses the same `calculateCaptureRate()` and `getCaptureDescription()` from `~/utils/captureRate`. After this refactoring, both client-side (`useCapture.ts`) and server-side (`rate.post.ts`) delegate to the identical canonical utility. Single source of truth is now fully achieved.

## Findings

No PTU rule violations. No behavioral changes. No missing parameters. No breakdown field regressions. The refactoring cleanly eliminates code duplication while preserving identical capture rate calculations.

## Verdict

**PASS** -- Pure structural refactoring with no impact on PTU correctness. All capture rate formula steps, parameter defaults, breakdown fields, and difficulty thresholds are preserved exactly.
