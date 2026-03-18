The `seedMoves()` function in `app/prisma/seed.ts` reads the [[moves-csv-source-file]] and populates the [[movedata-reference-table]].

`parseMoveCSV()` iterates from the third line onward (skipping the blank first row and header row), parses each line with a custom CSV parser that handles quoted fields containing commas, and extracts the core move fields. It skips rows with invalid types (only the 18 standard types plus Typeless are accepted). Damage base and AC values of `--` are stored as `null`.

Before inserting, `seedMoves()` deletes all existing MoveData rows, then upserts each parsed move. The [[move-seed-deduplicates-sm-variants]] to avoid duplicates. The [[move-seed-splits-by-newline-breaking-multiline-fields]], causing some moves to lose their type and damage class.
