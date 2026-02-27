---
cap_id: combat-C069
name: resetDailyUsage
type: utility
domain: combat
---

### combat-C069: resetDailyUsage
- **cap_id**: combat-C069
- **name**: Reset Daily Move Usage
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `resetDailyUsage()`
- **game_concept**: New day resets daily moves
- **description**: Resets usedToday and lastUsedAt. Immutable.
- **inputs**: Move[]
- **outputs**: New Move[]
- **accessible_from**: gm
