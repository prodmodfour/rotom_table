---
cap_id: combat-C068
name: resetSceneUsage
type: utility
domain: combat
---

### combat-C068: resetSceneUsage
- **cap_id**: combat-C068
- **name**: Reset Scene Move Usage
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` — `resetSceneUsage()`
- **game_concept**: New scene resets scene moves
- **description**: Resets usedThisScene and lastTurnUsed. Immutable.
- **inputs**: Move[]
- **outputs**: New Move[]
- **accessible_from**: gm
