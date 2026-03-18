# Scene Habitat Panel

A collapsible right-side panel in the [[scene-editor-page]]. Contains a habitat selector dropdown populated with all encounter tables in the system (e.g., "Bramblewick - Backyards & Apiaries", "Thickerby Forest - River").

When no habitat is selected, the panel displays "Select a habitat to see available Pokemon." When a habitat is chosen, the panel shows the encounter table entries with pokemon sprites, rarity labels, and individual "Add" buttons. A "Generate Random" button rolls against the encounter table to produce a random pokemon for the scene.

## See also

- [[habitats-list-page]] — where encounter tables are managed
- [[encounter-table-store-centralizes-state-and-api-calls]] — the store this panel reads habitat data from
- [[encounter-generation-uses-weighted-random-with-diversity-decay]] — the algorithm behind the "Generate Random" button
