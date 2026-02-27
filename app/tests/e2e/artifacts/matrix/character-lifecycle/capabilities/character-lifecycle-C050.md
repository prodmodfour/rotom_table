---
cap_id: character-lifecycle-C050
name: character-lifecycle-C050
type: —
domain: character-lifecycle
---

### character-lifecycle-C050
- **name:** useCharacterCreation composable
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts`
- **game_concept:** PTU character creation flow
- **description:** Full character creation form state management. Provides reactive form state, stat point tracking (total/remaining/computed with PTU HP formula), background application (11 presets and custom mode), trainer class management (add/remove with max 4 cap), feature management (class features + training feature), edge management (add/remove/skill edges with rank bump and revert), validation warnings (stats, skills, classes/features/edges — soft warnings not hard blocks), section completion tracking for progress indicators, and API payload builder.
- **inputs:** User interactions with form fields
- **outputs:** form, computedStats, maxHp, evasions, statPointsUsed/Remaining, allWarnings, sectionCompletion, buildCreatePayload(), incrementStat, decrementStat, applyBackground, clearBackground, enableCustomBackground, setSkillRank, addClass, removeClass, addFeature, removeFeature, setTrainingFeature, addEdge, removeEdge, addSkillEdge
- **accessible_from:** gm
