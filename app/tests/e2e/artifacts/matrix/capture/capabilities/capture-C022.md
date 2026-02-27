---
cap_id: capture-C022
name: useCapture — attemptCapture
type: composable-function
domain: capture
---

### capture-C022: useCapture — attemptCapture
- **cap_id**: capture-C022
- **name**: Attempt Capture (API Call)
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` — `attemptCapture()`
- **game_concept**: Client-side capture attempt execution
- **description**: Calls POST /api/capture/attempt. On success, optionally consumes the trainer's Standard Action in an encounter context (calls /api/encounters/:id/action). Manages loading/error/warning state. Warning set if action consumption fails but capture succeeded.
- **inputs**: { pokemonId, trainerId, accuracyRoll?, modifiers?, encounterContext?: { encounterId, trainerCombatantId } }
- **outputs**: CaptureAttemptResult or null
- **accessible_from**: gm
