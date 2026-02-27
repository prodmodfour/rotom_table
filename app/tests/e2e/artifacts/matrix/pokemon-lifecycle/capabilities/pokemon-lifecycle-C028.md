---
cap_id: pokemon-lifecycle-C028
name: serializePokemon
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C028: serializePokemon
- **cap_id**: pokemon-lifecycle-C028
- **name**: Pokemon Response Serializer
- **type**: utility
- **location**: `app/server/utils/serializers.ts` -- `serializePokemon()`
- **game_concept**: JSON response normalization
- **description**: Converts a raw Prisma Pokemon record into a client-friendly shape: parses JSON fields (nature, stageModifiers, abilities, moves, capabilities, skills, eggGroups, statusConditions), restructures stats into baseStats/currentStats objects with semantic keys. Used by all Pokemon GET/PUT/POST endpoints.
- **inputs**: Prisma Pokemon record
- **outputs**: Serialized Pokemon object with parsed JSON fields
- **accessible_from**: api-only

---

## Service Functions
