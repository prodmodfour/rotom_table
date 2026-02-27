---
cap_id: player-view-C020
name: player-view-C020
type: —
domain: player-view
---

### player-view-C020
- **name:** Section collapse/expand toggle
- **type:** component
- **location:** `app/components/player/PlayerCharacterSheet.vue` — openSections reactive, toggleSection()
- **game_concept:** Mobile-friendly collapsible sheet sections
- **description:** Maintains collapse state for 6 sections (stats, combat, skills, features, equipment, inventory). Stats and combat default to open; others default to closed. Each section header is a button with aria-expanded and aria-controls attributes for accessibility.
- **inputs:** User click on section header
- **outputs:** Toggles section visibility
- **accessible_from:** player

---

## Export/Import
