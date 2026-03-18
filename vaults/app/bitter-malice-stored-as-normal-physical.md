Bitter Malice is stored in the [[movedata-reference-table]] with type `Normal` and damage class `Physical`. The [[moves-csv-source-file]] lists it as Ghost/Special (column 10: `Ghost`, column 9: `Special`).

Both fields are wrong because the [[move-seed-splits-by-newline-breaking-multiline-fields]]. The type falls back to `'Normal'` and the damage class falls back to `'Physical'` (the default for moves with a non-null damage base).
