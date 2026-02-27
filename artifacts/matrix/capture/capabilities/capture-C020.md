---
cap_id: capture-C020
name: useCapture — getCaptureRate
type: composable-function
domain: capture
---

### capture-C020: useCapture — getCaptureRate
- **cap_id**: capture-C020
- **name**: Get Capture Rate (API Call)
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `getCaptureRate()`
- **game_concept**: Client-side capture rate fetching
- **description**: Calls POST /api/capture/rate with pokemonId and returns CaptureRateData. Manages loading/error state.
- **inputs**: pokemonId
- **outputs**: CaptureRateData or null
- **accessible_from**: gm
