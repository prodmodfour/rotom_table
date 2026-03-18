Aura Wheel is stored in the [[movedata-reference-table]] with type `Normal` and damage class `Physical`. The [[moves-csv-source-file]] lists it as Electric/Physical (column 10: `Electric`, column 9: `Physical`).

The type is lost because the [[move-seed-splits-by-newline-breaking-multiline-fields]] — Aura Wheel's effect text contains a literal newline within quotes, causing the parser to see a truncated row without the type column. The `'Normal'` comes from the fallback `moveType || 'Normal'` in the seed.

Aura Wheel's effect text notes that it becomes Dark-typed in Hangry Mode, but the base type should be Electric.
