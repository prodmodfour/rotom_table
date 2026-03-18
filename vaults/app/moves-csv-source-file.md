The file `app/data/moves.csv` contains the PTU 1.05 move catalogue. It has 967 lines including headers, covering all 18 Pokemon types plus Typeless.

Each row provides: Name, Type, Category, Damage Base, Frequency, AC, Range, Effects, Contest Stats, and several ability-interaction flag columns (Sheer Force, Tough Claws, Technician, Reckless, Iron Fist, Mega Launcher, Punk Rock, Strong Jaw).

The CSV includes 11 `[SM]` variant rows — updated versions of moves from Sun/Moon. The [[move-seed-deduplicates-sm-variants]] during import.

The first row is blank and the second row is the header. The [[move-seed-parses-csv-into-database]] skips both when parsing.

## See also

- [[movedata-reference-table]] — where parsed moves end up
