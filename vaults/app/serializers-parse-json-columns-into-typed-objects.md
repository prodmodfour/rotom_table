The file `app/server/utils/serializers.ts` exports shared serialization functions that transform Prisma records into API response shapes. The main work they do is parsing JSON string columns into typed objects.

`serializeLinkedPokemon()` parses `nature`, `abilities`, `moves`, `capabilities`, `skills`, `eggGroups`, `statusConditions`, and `stageModifiers` from JSON strings. It also combines `type1`/`type2` columns into a `types` array and restructures flat stat columns (`baseHp`, `baseAttack`, etc.) into nested `baseStats`/`currentStats` objects.

`serializeCharacterSummary()` similarly parses `skills`, `features`, `edges`, `capabilities`, `equipment`, `inventory`, `statusConditions`, `stageModifiers`, and `ownedSpecies` from JSON, and attaches nested Pokemon summaries.

These serializers are the boundary between the [[prisma-uses-sqlite-with-json-columns-pattern]] and the typed API shapes consumed by client stores.

## See also

- [[route-handlers-delegate-to-services-for-complex-logic]]
