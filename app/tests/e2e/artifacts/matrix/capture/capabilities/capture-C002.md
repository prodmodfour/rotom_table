---
cap_id: capture-C002
name: attemptCapture
type: utility
domain: capture
---

### capture-C002: attemptCapture
- **cap_id**: capture-C002
- **name**: Capture Attempt Simulator
- **type**: utility
- **location**: `app/utils/captureRate.ts` — `attemptCapture()`
- **game_concept**: Rolling 1d100 vs capture rate with trainer level modifier
- **description**: Rolls 1d100, applies trainer level subtraction and additional modifiers. Critical hit (nat 20 on accuracy) adds +10 to effective capture rate. Natural 100 always captures. Success if modifiedRoll <= effectiveCaptureRate.
- **inputs**: captureRate, trainerLevel, modifiers, criticalHit
- **outputs**: { success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred }
- **accessible_from**: gm (via attempt endpoint)
