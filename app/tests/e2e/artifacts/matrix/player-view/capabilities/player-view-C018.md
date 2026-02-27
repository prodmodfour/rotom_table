---
cap_id: player-view-C018
name: player-view-C018
type: —
domain: player-view
---

### player-view-C018
- **name:** HP percent and color computation
- **type:** composable-function
- **location:** `app/components/player/PlayerCharacterSheet.vue` — hpPercent, hpColorClass computed
- **game_concept:** HP visualization with color-coded thresholds
- **description:** Computes HP percentage (0-100) and maps to color classes: healthy (>50%), warning (25-50%), critical (<25%). Used by the HP bar in the character sheet header.
- **inputs:** character.currentHp, character.maxHp
- **outputs:** hpPercent (number), hpColorClass (string)
- **accessible_from:** player
