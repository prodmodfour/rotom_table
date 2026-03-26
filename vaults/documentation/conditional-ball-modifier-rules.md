# Conditional Ball Modifier Rules

`evaluateBallCondition()` in `utils/pokeBallConditions.ts` dispatches to 13 pure evaluator functions, one per conditional ball type. Each returns `{ modifier, conditionMet, description }`.

## Round-based

| Ball | Rule |
|---|---|
| Timer Ball | Base +5. Conditional: −5 per round elapsed, capped at −20 total. Net: round 1 = +5, round 2 = 0, round 6+ = −20 |
| Quick Ball | Base −20. Degrades: round 1 = −20, round 2 = −15, round 3 = −10, round 4+ = 0 |

## Stat-comparison

| Ball | Rule |
|---|---|
| Level Ball | −20 if target level < half the active Pokemon's level |
| Heavy Ball | −5 per Weight Class above 1 (WC 1 = 0, WC 6 = −25) |
| Fast Ball | −20 if target's highest [[movement-trait-types|movement trait]] exceeds 7 |

## Context-dependent (auto-populated)

| Ball | Rule | Source |
|---|---|---|
| Love Ball | −30 if active Pokemon is same evo line + opposite gender | evo line derived by [[ball-condition-service|buildConditionContext]] |
| Net Ball | −20 if target is Water or Bug type | species types |
| Moon Ball | −20 if target evolves with an Evolution Stone | `checkEvolvesWithStone` parses evolution triggers |
| Repeat Ball | −20 if trainer already owns same species | Prisma count query |
| Nest Ball | −20 if target level < 10 | target level |
| Dive Ball | −20 if target found underwater or underground | GM toggle |

## Context-dependent (GM-provided flags)

| Ball | Rule | Toggle |
|---|---|---|
| Dusk Ball | −20 in dark or low-light conditions | `isDarkOrLowLight` |
| Lure Ball | −20 if target was baited with food | `targetWasBaited` |

GM toggles are set via the [[capture-context-toggles]] component since these conditions cannot be auto-detected.

## See also

- [[poke-ball-system]]
- [[capture-rate-formula]]
