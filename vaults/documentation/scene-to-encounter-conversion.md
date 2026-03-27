# Scene-to-Encounter Conversion

Flow for converting a narrative scene into a tactical encounter:

1. User clicks "Start Encounter" on the scene editor page.
2. `StartEncounterModal.vue` opens — shows entity counts, encounter budget difficulty, lets GM choose battle type ([[battle-modes|Full Contact or Trainer League]]) and significance tier (scales XP per [[encounter-xp-formula]]).
3. Modal emits `confirm` with `{ battleType, significanceMultiplier, significanceTier }`.
4. Client calls `POST /api/encounters/from-scene` with `sceneId` + modal options.
5. Server creates Encounter: scene Pokemon become wild enemy combatants via the Pokemon generation pipeline, scene characters become player combatants, auto-placed on grid. Inherits scene weather.

## See also

