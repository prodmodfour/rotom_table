---
cap_id: healing-C042
name: Pokemon Sheet Healing Tab Page
type: —
domain: healing
---

## healing-C042: Pokemon Sheet Healing Tab Page

- **Type:** component
- **Location:** `pages/gm/pokemon/[id].vue` (healing tab section)
- **Game Concept:** Pokemon sheet healing integration
- **Description:** Renders `<HealingTab>` with `entity-type="pokemon"` in the Pokemon sheet's "Healing" tab. Reloads Pokemon data on `@healed` event via `loadPokemon()`.
- **Inputs:** Pokemon data from page load
- **Outputs:** Displays HealingTab, triggers `loadPokemon()` on heal
- **Accessible From:** `gm`
- **Orphan:** false
