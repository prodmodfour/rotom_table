During the [[move-seed-parses-csv-into-database]], the parser strips `[SM]` suffixes from move names and tracks seen names in a `Set`. When a base name has already been seen, the variant row is skipped entirely. Since the non-SM version appears first in the [[moves-csv-source-file]], the original PTU version is always kept and the Sun/Moon update is discarded.

This means the 11 SM-variant moves in the CSV (e.g., Fell Stinger, Leech Life, Tackle, Sucker Punch) are stored under their base names with the original stats.
