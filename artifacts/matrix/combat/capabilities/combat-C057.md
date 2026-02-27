---
cap_id: combat-C057
name: buildHumanEntityFromRecord
type: service-function
domain: combat
---

### combat-C057: buildHumanEntityFromRecord
- **cap_id**: combat-C057
- **name**: Build Human Entity from DB
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `buildHumanEntityFromRecord()`
- **game_concept**: Parsing trainer DB data
- **description**: Transforms Prisma HumanCharacter record into typed entity with all JSON fields parsed.
- **inputs**: Prisma HumanCharacter record
- **outputs**: Typed HumanCharacter entity
- **accessible_from**: gm
