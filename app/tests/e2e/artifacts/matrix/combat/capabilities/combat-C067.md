---
cap_id: combat-C067
name: incrementMoveUsage
type: utility
domain: combat
---

### combat-C067: incrementMoveUsage
- **cap_id**: combat-C067
- **name**: Move Usage Tracker
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `incrementMoveUsage()`
- **game_concept**: Tracking move uses
- **description**: Returns new move with incremented counters (immutable).
- **inputs**: Move, currentRound
- **outputs**: New Move
- **accessible_from**: gm
