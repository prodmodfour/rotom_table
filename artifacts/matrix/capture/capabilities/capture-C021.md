---
cap_id: capture-C021
name: useCapture — calculateCaptureRateLocal
type: composable-function
domain: capture
---

### capture-C021: useCapture — calculateCaptureRateLocal
- **cap_id**: capture-C021
- **name**: Local Capture Rate Calculation
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `calculateCaptureRateLocal()`
- **game_concept**: Client-side capture rate without API call
- **description**: Calculates capture rate locally using the pure utility function. No DB lookup — uses provided data. Returns CaptureRateData with difficulty label.
- **inputs**: { level, currentHp, maxHp, evolutionStage?, maxEvolutionStage?, statusConditions?, injuries?, isShiny?, isLegendary? }
- **outputs**: CaptureRateData
- **accessible_from**: gm, player
