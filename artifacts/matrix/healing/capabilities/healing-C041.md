---
cap_id: healing-C041
name: Character Sheet Healing Tab Page
type: —
domain: healing
---

## healing-C041: Character Sheet Healing Tab Page

- **Type:** component
- **Location:** `pages/gm/characters/[id].vue` (healing tab section)
- **Game Concept:** Character sheet healing integration
- **Description:** Renders `<HealingTab>` with `entity-type="character"` in the character sheet's "Healing" tab. Reloads character data on `@healed` event via `loadCharacter()`.
- **Inputs:** Character data from page load
- **Outputs:** Displays HealingTab, triggers `loadCharacter()` on heal
- **Accessible From:** `gm`
- **Orphan:** false
