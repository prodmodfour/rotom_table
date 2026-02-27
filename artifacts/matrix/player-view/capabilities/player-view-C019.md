---
cap_id: player-view-C019
name: player-view-C019
type: —
domain: player-view
---

### player-view-C019
- **name:** Evasion computation with equipment bonuses
- **type:** composable-function
- **location:** `app/components/player/PlayerCharacterSheet.vue` — physEvasion, specEvasion, spdEvasion computed
- **game_concept:** PTU evasion calculation (Defense/SpDef/Speed based)
- **description:** Calculates physical, special, and speed evasion values using calculateEvasion() from damageCalculation utils. Incorporates equipment bonuses from computeEquipmentBonuses() (evasion bonus + stat bonuses from Focus items). Uses calculated stats per PTU rules (not base stats).
- **inputs:** character.stats, character.stageModifiers, character.equipment
- **outputs:** Three evasion numbers for display
- **accessible_from:** player
