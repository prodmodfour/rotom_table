---
cap_id: combat-C058
name: countMarkersCrossed
type: service-function
domain: combat
---

### combat-C058: countMarkersCrossed
- **cap_id**: combat-C058
- **name**: HP Marker Crossing Counter
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `countMarkersCrossed()`
- **game_concept**: PTU HP marker injuries
- **description**: Counts markers crossed between previous and new HP. Uses real maxHP. Generates markers at 50% intervals into negatives.
- **inputs**: previousHp, newHp, realMaxHp
- **outputs**: { count, markers[] }
- **accessible_from**: gm (internal)

---

## Utility Function Capabilities
