---
cap_id: character-lifecycle-C002
name: character-lifecycle-C002
type: —
domain: character-lifecycle
---

### character-lifecycle-C002
- **name:** HumanCharacter.avatarUrl field
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.avatarUrl
- **game_concept:** Trainer sprite / avatar
- **description:** Optional string storing either a Showdown sprite key (e.g., 'acetrainer') or a full URL. Used by useTrainerSprite composable to resolve display URL.
- **inputs:** String (sprite key or URL) or null
- **outputs:** Persisted avatar reference
- **accessible_from:** gm, player
