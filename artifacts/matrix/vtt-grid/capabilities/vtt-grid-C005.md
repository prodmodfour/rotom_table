---
cap_id: vtt-grid-C005
name: vtt-grid-C005
type: —
domain: vtt-grid
---

### vtt-grid-C005
- **name:** Selection Store
- **type:** store-action
- **location:** `app/stores/selection.ts`
- **game_concept:** Grid multi-selection
- **description:** Tracks selected combatant IDs for multi-select operations. Actions: select, deselect, toggle, clear.
- **inputs:** Combatant IDs
- **outputs:** Set of selected combatant IDs
- **accessible_from:** gm
