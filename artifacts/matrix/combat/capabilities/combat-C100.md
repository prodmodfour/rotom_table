---
cap_id: combat-C100
name: encounter store — loadEncounter
type: store-action
domain: combat
---

### combat-C100: encounter store — loadEncounter
- **cap_id**: combat-C100
- **name**: Load Encounter
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `loadEncounter()`
- **game_concept**: Loading encounter state
- **description**: Fetches encounter by ID, sets as active.
- **inputs**: Encounter ID
- **outputs**: Sets store.encounter
- **accessible_from**: gm, group, player
