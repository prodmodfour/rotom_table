The app has no dedicated Pokedex or species browsing page. There is no `/gm/pokedex` or `/gm/species` route.

Species data surfaces only indirectly: through [[species-autocomplete-loads-all-on-mount]] inputs embedded in other pages (creation, habitats, scenes), through backend services that look up species by name ([[pokemon-generator-service]], [[evolution-service]]), and through the library/sheets pages that display individual Pokemon with their species name and sprite but do not link to a species detail view.

The [[species-data-table-seeded-from-pokedex-markdown]] is a backend-only resource — the GM cannot browse, inspect, or edit species reference data through the UI.
