The `MoveData` Prisma model (`app/prisma/schema.prisma`, line 265) is the reference table for all PTU moves. Fields: `id` (UUID), `name` (unique), `type`, `damageClass` (Physical/Special/Status), `frequency`, `ac` (nullable int), `damageBase` (nullable int), `range`, `effect`, `contestType`, and `contestEffect`.

This table is read-only at runtime — it is populated by the [[move-seed-parses-csv-into-database]] and queried by the [[batch-move-lookup-api]] and [[learn-move-api]]. No endpoint writes to it during normal app operation.

The [[pokemon-generator-service]] also queries this table directly by name when building a new Pokemon's moveset via `selectMovesFromLearnset`.

## See also

- [[moves-csv-source-file]] — the source data
- [[pokemon-moves-stored-as-json]] — where move data is denormalized onto individual Pokemon
- [[move-seed-splits-by-newline-breaking-multiline-fields]] — parsing issue affecting type/class for some moves
- [[dragon-rage-damage-base-parsed-as-fifteen]] — DB column stores 15 despite flat-damage semantics
- [[curse-frequency-stored-as-see-text]] — frequency value outside the MoveFrequency union
- [[bind-and-clamp-are-static-grapple-passives]] — Static moves with no range or AC
