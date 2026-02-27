---
cap_id: combat-C066
name: checkMoveFrequency
type: utility
domain: combat
---

### combat-C066: checkMoveFrequency
- **cap_id**: combat-C066
- **name**: Move Frequency Validator
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `checkMoveFrequency()`
- **game_concept**: PTU move frequency restrictions
- **description**: At-Will OK, EOT consecutive check, Scene/Scene x2/x3 with EOT between uses, Daily with per-scene cap, Static blocked.
- **inputs**: Move, currentRound
- **outputs**: FrequencyCheckResult
- **accessible_from**: gm, player
