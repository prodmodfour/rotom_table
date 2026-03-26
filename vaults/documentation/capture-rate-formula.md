# Capture Rate Formula

Pure function in `utils/captureRate.ts` implementing the PTR capture rate calculation per [[capture-rate-base-formula]].

## Base and modifiers

Starts at base 100, then applies additive modifiers:

| Modifier | Value |
|---|---|
| Level | −(level × 2) |
| HP at 1 | +30 |
| HP ≤ 25% | +15 |
| HP ≤ 50% | +0 |
| HP ≤ 75% | −15 |
| HP > 75% | −30 |
| Evolution: 2 stages remaining | +10 |
| Evolution: 1 stage remaining | +0 |
| Evolution: final stage | −10 |
| Shiny | −10 |
| Legendary | −30 |
| Each persistent status | +10 (Poisoned/Badly Poisoned count once) |
| Each volatile status | +5 |
| Stuck | +10 |
| Slowed | +5 |
| Each injury | +5 |

Returns `canBeCaptured = false` when `currentHp <= 0`.

## Output

`CaptureRateResult` includes `captureRate` (final number), `breakdown` (per-modifier detail), `canBeCaptured`, and `hpPercentage`.

## See also

- [[capture-roll-mechanics]]
- [[capture-difficulty-labels]]
- [[poke-ball-system]]
