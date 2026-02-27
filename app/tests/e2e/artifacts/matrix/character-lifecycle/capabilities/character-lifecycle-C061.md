---
cap_id: character-lifecycle-C061
name: character-lifecycle-C061
type: —
domain: character-lifecycle
---

### character-lifecycle-C061
- **name:** TRAINER_SPRITE_CATALOG constant
- **type:** constant
- **location:** `app/constants/trainerSprites.ts`
- **game_concept:** Trainer avatar selection catalog
- **description:** Array of ~180 curated Showdown trainer sprites organized into 9 categories (protagonists, gym-leaders, elite-champions, villains, grunts, generic-male, generic-female, specialists, other). Each entry has key, label, category. Also exports TRAINER_SPRITE_CATEGORIES[].
- **inputs:** N/A (static data)
- **outputs:** TrainerSprite[], TrainerSpriteCategory[]
- **accessible_from:** gm (picker), group+player (display via composable)
