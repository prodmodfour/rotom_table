---
cap_id: character-lifecycle-C051
name: character-lifecycle-C051
type: —
domain: character-lifecycle
---

### character-lifecycle-C051
- **name:** useTrainerSprite composable
- **type:** composable-function
- **location:** `app/composables/useTrainerSprite.ts`
- **game_concept:** Trainer avatar URL resolution
- **description:** Converts sprite keys to Showdown CDN URLs. getTrainerSpriteUrl() handles null (returns null), full URLs (pass-through), and keys (constructs CDN URL). isSpriteKey() checks if value is a key vs URL.
- **inputs:** spriteKey: string | null | undefined
- **outputs:** Full URL string or null; isSpriteKey boolean; BASE_URL constant
- **accessible_from:** gm, group, player

## Constants
