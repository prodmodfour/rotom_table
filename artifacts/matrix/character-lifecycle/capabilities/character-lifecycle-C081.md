---
cap_id: character-lifecycle-C081
name: character-lifecycle-C081
type: —
domain: character-lifecycle
---

### character-lifecycle-C081
- **name:** TrainerSpritePicker component
- **type:** component
- **location:** `app/components/character/TrainerSpritePicker.vue`
- **game_concept:** Trainer avatar selection modal
- **description:** Modal grid picker for ~180 trainer sprites. Features: 9 category filter tabs + All, text search (name/key substring), lazy image loading, broken image detection/filtering, local selection preview, clear/cancel/select actions. Renders sprites from Showdown CDN at 64x64.
- **inputs:** Props: modelValue (sprite key | null), show (boolean)
- **outputs:** Emits: update:modelValue (selected key or null), close
- **accessible_from:** gm
