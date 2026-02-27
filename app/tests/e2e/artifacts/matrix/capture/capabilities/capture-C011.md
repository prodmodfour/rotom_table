---
cap_id: capture-C011
name: Attempt Capture
type: api-endpoint
domain: capture
---

### capture-C011: Attempt Capture
- **cap_id**: capture-C011
- **name**: Capture Attempt Endpoint
- **type**: api-endpoint
- **location**: `app/server/api/capture/attempt.post.ts`
- **game_concept**: Executing a capture attempt with auto-link on success
- **description**: Looks up Pokemon and Trainer from DB. Calculates capture rate (using SpeciesData for evolution). Checks canBeCaptured (0 HP = fail). Detects critical hit from accuracy roll (nat 20). Rolls capture via attemptCapture(). On success: auto-links Pokemon to trainer (ownerId) and sets origin to 'captured'. Returns full result with breakdown.
- **inputs**: `{ pokemonId, trainerId, accuracyRoll?, modifiers? }`
- **outputs**: CaptureAttemptResult (captured, roll, modifiedRoll, captureRate, breakdown, pokemon, trainer)
- **accessible_from**: gm

---

## Composable Capabilities
