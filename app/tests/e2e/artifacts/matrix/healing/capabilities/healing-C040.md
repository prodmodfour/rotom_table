---
cap_id: healing-C040
name: HealingTab Component
type: —
domain: healing
---

## healing-C040: HealingTab Component

- **Type:** component
- **Location:** `components/common/HealingTab.vue`
- **Game Concept:** Healing UI for character/Pokemon sheets
- **Description:** Displays healing status (current HP, injuries, rest today, HP per rest, injuries healed today, drained AP for characters, natural injury timer) and action buttons: Rest 30min, Extended Rest, Pokemon Center, Natural Injury Heal, Drain AP (character only), New Day. Shows result messages (success/error). Calls `useRestHealing` composable for all actions. Emits `healed` event for parent page data refresh.
- **Inputs:** Props: `entityType ('pokemon'|'character'), entityId, entity`
- **Outputs:** Emits `healed` event when any healing action completes
- **Accessible From:** `gm`
- **Orphan:** false
