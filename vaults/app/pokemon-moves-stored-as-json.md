The `Pokemon.moves` column (`app/prisma/schema.prisma`, line 132) is a JSON string defaulting to `"[]"`. Each entry is a serialized [[move-interface-tracks-usage-counters]] object containing the full move data (name, type, damage class, frequency, AC, damage base, range, effect) plus per-Pokemon usage tracking fields.

This is a denormalized copy of data from the [[movedata-reference-table]]. The denormalization means each Pokemon carries its own move details and usage counters independently — there is no foreign key back to `MoveData`.

The [[learn-move-api]] writes to this column when moves are learned. The encounter combat system reads and updates it to track frequency usage during battle.

## See also

- [[scene-activation-resets-move-counters]] — resets usage tracking fields at scene boundaries
