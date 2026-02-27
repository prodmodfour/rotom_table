---
cap_id: player-view-C033
name: player-view-C033
type: —
domain: player-view
---

### player-view-C033
- **name:** usePlayerCombat.isMoveExhausted
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — isMoveExhausted()
- **game_concept:** PTU move frequency tracking (At-Will, EOT, Scene, Daily, Static)
- **description:** Checks if a move has reached its frequency limit. Supports At-Will (never exhausted), EOT (can't use if used last turn), Scene/Scene x2/Scene x3 (per-scene usage tracking), Daily/Daily x2/Daily x3 (per-day usage tracking), and Static (always exhausted — passive only). Returns an object with exhausted boolean and reason string.
- **inputs:** move: Move (with frequency, lastTurnUsed, usedThisScene, usedToday fields)
- **outputs:** { exhausted: boolean, reason: string }
- **accessible_from:** player
