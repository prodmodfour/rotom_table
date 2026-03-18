The [[move-seed-parses-csv-into-database]] splits the [[moves-csv-source-file]] content by `\n` before parsing each line. The `parseCSVLine` function handles quoted fields containing commas, but since `split('\n')` runs first, any quoted field that spans multiple lines in the CSV is broken across separate parse iterations.

29 moves in the CSV have multiline quoted effect fields. When a move's effect text contains a literal newline within quotes, the first line is parsed as a truncated row (missing the type and damage-class columns at positions 9 and 10). The parser then falls back: type defaults to `'Normal'`, and damage class defaults to `'Physical'` for damaging moves or `'Status'` for non-damaging ones.

Five A-D-range moves have multiline fields: [[aura-wheel-stored-as-normal-type]], [[bitter-malice-stored-as-normal-physical]], Camouflage, Ceaseless Edge, and Defense Curl. Camouflage and Defense Curl are Normal/Status in the CSV so the fallback matches by coincidence. Ceaseless Edge is Dark/Physical and the parsing happens to capture those values.

## See also

- [[movedata-reference-table]] — where the parsed data ends up
