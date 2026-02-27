---
cap_id: combat-C110
name: encounter store — serve/unserve
type: store-action
domain: combat
---

### combat-C110: encounter store — serve/unserve
- **cap_id**: combat-C110
- **name**: Serve/Unserve Actions
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: Display encounter on Group View
- **description**: serveEncounter, unserveEncounter, loadServedEncounter.
- **inputs**: None
- **outputs**: Updated encounter
- **accessible_from**: gm (serve/unserve), group+player (loadServed)
