---
cap_id: character-lifecycle-C070
name: character-lifecycle-C070
type: —
domain: character-lifecycle
---

### character-lifecycle-C070
- **name:** characterCreationValidation — validateStatAllocation
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` — validateStatAllocation()
- **game_concept:** PTU stat allocation rule validation
- **description:** Checks total stat points against level budget and per-stat cap at level 1 (max 5). Returns CreationWarning[] with 'warning' or 'info' severity.
- **inputs:** statPoints: Record<string, number>, level: number
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)
