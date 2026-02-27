---
cap_id: combat-C101
name: encounter store — createEncounter
type: store-action
domain: combat
---

### combat-C101: encounter store — createEncounter
- **cap_id**: combat-C101
- **name**: Create Encounter
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `createEncounter()`
- **game_concept**: Creating encounter
- **description**: Creates via API with name, battleType, weather, significance.
- **inputs**: name, battleType, weather?, significance?
- **outputs**: Created encounter
- **accessible_from**: gm
