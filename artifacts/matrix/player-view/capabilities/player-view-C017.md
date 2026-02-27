---
cap_id: player-view-C017
name: player-view-C017
type: —
domain: player-view
---

### player-view-C017
- **name:** PlayerCharacterSheet component
- **type:** component
- **location:** `app/components/player/PlayerCharacterSheet.vue`
- **game_concept:** Trainer character sheet (read-only)
- **description:** Displays the player's character sheet with collapsible sections: header (name, level, classes, HP bar), stats grid (6 stats with stage modifiers), combat info (evasions, AP, injuries, temp HP, status conditions), skills (alphabetically sorted with rank coloring), features & edges (tag lists), equipment (6 slots), and inventory (items with quantities and money). Includes export/import buttons. Computes evasions using calculateEvasion with equipment bonuses.
- **inputs:** character: HumanCharacter prop
- **outputs:** Visual display; emits `imported` event when import completes
- **accessible_from:** player
