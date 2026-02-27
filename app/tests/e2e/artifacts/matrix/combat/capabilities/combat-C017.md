---
cap_id: combat-C017
name: Next Turn
type: api-endpoint
domain: combat
---

### combat-C017: Next Turn
- **cap_id**: combat-C017
- **name**: Advance Turn
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/next-turn.post.ts`
- **game_concept**: PTU turn progression with phase and round management
- **description**: Advances to next combatant. Marks current combatant as acted, clears temp conditions. Handles League battle phase transitions (trainer_declaration -> pokemon -> new round). At round boundary: resets all combatants for new round, decrements weather duration (auto-clears when expired, skips manual weather).
- **inputs**: Encounter ID
- **outputs**: Updated encounter with new turn index, possibly new round/phase
- **accessible_from**: gm
