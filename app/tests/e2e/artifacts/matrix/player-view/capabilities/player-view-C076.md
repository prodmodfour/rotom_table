---
cap_id: player-view-C076
name: player-view-C076
type: —
domain: player-view
---

### player-view-C076
- **name:** useHapticFeedback composable
- **type:** composable-function
- **location:** `app/composables/useHapticFeedback.ts`
- **game_concept:** Mobile vibration feedback for combat events
- **description:** Provides predefined vibration patterns via the Vibration API for player events. Safely no-ops on browsers/devices without vibration support. Patterns: vibrateOnTurnStart (double-pulse: 200-100-200ms), vibrateOnMoveExecute (short: 100ms), vibrateOnDamageTaken (triple: 80-60-80-60-80ms), vibrateOnTap (light: 30ms).
- **inputs:** None
- **outputs:** isSupported, vibrate, vibrateOnTurnStart, vibrateOnMoveExecute, vibrateOnDamageTaken, vibrateOnTap
- **accessible_from:** player

---

## Group View Control
