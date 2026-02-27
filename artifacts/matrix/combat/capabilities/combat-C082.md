---
cap_id: combat-C082
name: STATUS_CONDITIONS
type: constant
domain: combat
---

### combat-C082: STATUS_CONDITIONS
- **cap_id**: combat-C082
- **name**: Status Condition Categories
- **type**: constant
- **location**: `app/constants/statusConditions.ts`
- **game_concept**: PTU persistent, volatile, other conditions
- **description**: PERSISTENT (5), VOLATILE (9), OTHER (6). Plus CSS class mapper.
- **inputs**: Static
- **outputs**: Condition arrays + getConditionClass()
- **accessible_from**: gm, group, player
