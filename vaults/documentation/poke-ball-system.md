# Poke Ball System

25 PTU ball types with capture modifiers. See [[capture-rate-formula]] for the base rate calculation that ball modifiers adjust.

## Constants

`constants/pokeBalls.ts` — `POKE_BALL_CATALOG` (base modifiers, condition descriptions, post-capture effects), `PokeBallDef` interface, `PokeBallCategory` type, `BallConditionContext` interface, `calculateBallModifier` (base + conditional modifier breakdown), `getBallsByCategory`, `getBallDef`, `getAvailableBallNames`, `DEFAULT_BALL_TYPE`.

## Condition evaluation

`utils/pokeBallConditions.ts` — `evaluateBallCondition`, a pure evaluator for 13 conditional balls: Timer, Quick, Level, Heavy, Fast, Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive. Returns modifier + conditionMet + description. See [[conditional-ball-modifier-rules]] for per-ball logic.

## Server context

`server/services/ball-condition.service.ts` — `buildConditionContext` (auto-populates from DB: encounter round, active Pokemon, species data, trainer ownership), `checkEvolvesWithStone`, `deriveEvoLine`. See [[ball-condition-service]].

## Composable

`composables/useCapture.ts` — `getCaptureRate`, `calculateCaptureRateLocal`, `attemptCapture`, `getAvailableBalls`, `rollAccuracyCheck`. All accept `ballType`. `CaptureAttemptResult` includes `postCaptureEffect`.

## Server endpoints

`rate.post.ts` accepts optional `encounterId`/`trainerId` for full context. `attempt.post.ts` applies post-capture effects:

- Heal Ball: set `currentHp = maxHp` (decree-015)
- Friend Ball: `loyalty_plus_one`
- Luxury Ball: `raised_happiness`

Broadcasts `capture_attempt` [[websocket-real-time-sync|WebSocket]] event with ball info. See [[capture-api-endpoints]].

## UI components

- `BallSelector.vue` — dropdown/grid grouped by category (basic/apricorn/special/safari) with Phosphor Icons
- `BallConditionPreview.vue` — condition met/unmet indicator
- `CaptureContextToggles.vue` — GM checkboxes for `targetWasBaited`, `isDarkOrLowLight`, `isUnderwaterOrUnderground`. See [[capture-context-toggles]]
- `CapturePanel.vue` — full workflow: ball selection + toggles + rate display + accuracy roll + capture roll + result with roll breakdown, outcome, post-capture effects

`CombatantCard` shows `CapturePanel` on wild enemy Pokemon with a trainer selector.

## See also

- [[capture-accuracy-gate]]
- [[capture-api-endpoints]]
- [[capture-rate-formula]]
- [[capture-roll-mechanics]]
- [[conditional-ball-modifier-rules]]
- [[ball-modifier-formatting]]
- [[legendary-species-detection]]
