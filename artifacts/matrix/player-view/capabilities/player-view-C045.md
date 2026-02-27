---
cap_id: player-view-C045
name: player-view-C045
type: —
domain: player-view
---

### player-view-C045
- **name:** usePlayerCombat.isLeagueBattle / isTrainerPhase / isPokemonPhase
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — league battle computed properties
- **game_concept:** PTU League Battle vs Full Contact battle mode awareness
- **description:** Detects whether the encounter is a league battle (trainers and Pokemon act in separate phases) and which phase is currently active (trainer_declaration/trainer_resolution or pokemon). Used to show the phase indicator and restrict certain actions.
- **inputs:** encounterStore.isLeagueBattle, encounterStore.currentPhase
- **outputs:** boolean values for each phase check
- **accessible_from:** player
