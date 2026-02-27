---
cap_id: vtt-grid-C036
name: vtt-grid-C036
type: —
domain: vtt-grid
---

### vtt-grid-C036
- **name:** combatantCapabilities utility
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts`
- **game_concept:** Combatant movement capability queries
- **description:** Shared utility functions: combatantCanFly (Sky > 0), getSkySpeed, combatantCanSwim (Swim > 0), combatantCanBurrow (Burrow > 0). Checks Pokemon capabilities; humans default to 0 for all.
- **inputs:** Combatant object
- **outputs:** boolean (can fly/swim/burrow), number (sky speed)
- **accessible_from:** gm (via composables)

## Components
