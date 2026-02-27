---
cap_id: character-lifecycle-C072
name: character-lifecycle-C072
type: —
domain: character-lifecycle
---

### character-lifecycle-C072
- **name:** characterCreationValidation — validateEdgesAndFeatures
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` — validateEdgesAndFeatures()
- **game_concept:** PTU edge/feature/class count validation
- **description:** Validates edge count against level-based expectations (base + bonus skill edges), feature count (level-based), class count (max 4). Includes milestone bonus guidance for levels 5+.
- **inputs:** edges[], features[], trainerClasses[], level
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)
