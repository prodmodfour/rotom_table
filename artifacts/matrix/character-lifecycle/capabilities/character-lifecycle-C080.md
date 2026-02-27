---
cap_id: character-lifecycle-C080
name: character-lifecycle-C080
type: —
domain: character-lifecycle
---

### character-lifecycle-C080
- **name:** GM Create Page (Quick + Full modes)
- **type:** component
- **location:** `app/pages/gm/create.vue`
- **game_concept:** Character creation interface
- **description:** Full character creation page with human/pokemon type toggle. Human mode has Quick Create (minimal NPC scaffolding — name, type, level, location, sprite) and Full Create (PTU-compliant multi-section with section progress indicators). Full Create sections: Basic Info (name, type, level, location, trainer sprite), Background & Skills (via SkillBackgroundSection), Edges (via EdgeSelectionSection), Classes & Features (via ClassFeatureSection), Combat Stats (via StatAllocationSection), Biography (collapsible — age, gender, height, weight, story, personality, goals, money), Notes, Validation Summary. Uses useCharacterCreation composable. Pokemon form has species, nickname, level, gender, shiny, types, base stats.
- **inputs:** User form input
- **outputs:** Creates character via libraryStore.createHuman() or createPokemon(), navigates to /gm/sheets
- **accessible_from:** gm
