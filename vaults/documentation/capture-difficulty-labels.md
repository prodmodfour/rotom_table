# Capture Difficulty Labels

`getCaptureDescription()` in `utils/captureRate.ts` maps numeric [[capture-rate-formula|capture rates]] to human-readable labels.

| Threshold | Label |
|---|---|
| ≥ 80 | Very Easy |
| ≥ 60 | Easy |
| ≥ 40 | Moderate |
| ≥ 20 | Difficult |
| ≥ 1 | Very Difficult |
| < 1 | Nearly Impossible |

Used by the [[capture-rate-display-component]] to color-code the difficulty (green through red, grayed out for fainted/impossible).
