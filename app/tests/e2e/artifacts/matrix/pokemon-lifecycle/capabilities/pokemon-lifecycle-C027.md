---
cap_id: pokemon-lifecycle-C027
name: resolveNickname
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C027: resolveNickname
- **cap_id**: pokemon-lifecycle-C027
- **name**: Auto-Nickname Generator
- **type**: utility
- **location**: `app/server/utils/pokemon-nickname.ts` -- `resolveNickname()`
- **game_concept**: Default Pokemon naming convention
- **description**: Async function. If nickname provided and non-empty, returns trimmed nickname. Otherwise, counts existing Pokemon of same species in DB and generates "Species N+1" (e.g., "Pikachu 3"). Used by both index.post.ts and pokemon-generator service.
- **inputs**: species string, optional nickname string
- **outputs**: Resolved nickname string
- **accessible_from**: api-only
