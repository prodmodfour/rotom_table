---
cap_id: combat-C056
name: buildPokemonEntityFromRecord
type: service-function
domain: combat
---

### combat-C056: buildPokemonEntityFromRecord
- **cap_id**: combat-C056
- **name**: Build Pokemon Entity from DB
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `buildPokemonEntityFromRecord()`
- **game_concept**: Parsing Pokemon DB data
- **description**: Transforms Prisma Pokemon record into typed entity with all JSON fields parsed.
- **inputs**: Prisma Pokemon record
- **outputs**: Typed Pokemon entity
- **accessible_from**: gm
