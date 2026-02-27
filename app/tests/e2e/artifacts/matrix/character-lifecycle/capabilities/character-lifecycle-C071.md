---
cap_id: character-lifecycle-C071
name: character-lifecycle-C071
type: —
domain: character-lifecycle
---

### character-lifecycle-C071
- **name:** characterCreationValidation — validateSkillBackground
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` — validateSkillBackground()
- **game_concept:** PTU background skill allocation validation
- **description:** Validates 1 Adept, 1 Novice, 3 Pathetic counts. Checks skill rank cap by level. Downgrades severity to 'info' when Skill Edges modify counts. Shows level-specific skill rank cap info.
- **inputs:** skills: Record<string, string>, level: number, edges: string[]
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)
