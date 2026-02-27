---
cap_id: character-lifecycle-C062
name: character-lifecycle-C062
type: —
domain: character-lifecycle
---

### character-lifecycle-C062
- **name:** PTU_SKILL_CATEGORIES / PTU_ALL_SKILLS constant
- **type:** constant
- **location:** `app/constants/trainerSkills.ts`
- **game_concept:** PTU 17 trainer skills (PTU Core p. 33)
- **description:** Skills organized by category (Body: 6, Mind: 7, Spirit: 4). SKILL_RANKS array with rank/value/dice. SKILL_RANK_LEVEL_REQS. getDefaultSkills() returns all Untrained.
- **inputs:** N/A (static data)
- **outputs:** PtuSkillName type, skill arrays, rank data, getDefaultSkills()
- **accessible_from:** gm
