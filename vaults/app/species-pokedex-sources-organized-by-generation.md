The source material for [[species-data-table-seeded-from-pokedex-markdown]] lives in `books/markdown/pokedexes/`, organized into generation subdirectories: `gen1/` through `gen8/` plus `hisui/`. Each directory contains one `.md` file per species — a text extraction from the PTU 1.05 pokedex PDF pages.

A companion file `how-to-read.md` documents the structure of these markdown files.

The seed script reads all files from all generation directories, concatenates them, and passes the combined text through the regex-based parser to extract structured species data.