Two autocomplete components provide species search in the UI, both loading the full species list on mount via `GET /api/species` and filtering client-side:

**`PokemonSearchInput`** (`app/components/common/PokemonSearchInput.vue`) — used on the [[pokemon-creation-tab]] and in scene management. Requires 2+ characters before showing results. Dropdown shows species name and type badges, limited to 10 results. Supports keyboard navigation (arrow keys, Enter to select, Escape to close). Emits both the text value and a `select` event with `{ id, name }`. Defines its own local type (see [[species-client-type-duplicated-in-search-input]]).

**`SpeciesAutocomplete`** (`app/components/habitat/SpeciesAutocomplete.vue`) — used in the [[habitat-add-pokemon-modal]]. Shows up to 20 results. Dropdown items show species name and type badges. Closes on click-outside. Emits `speciesData.id` when selected.

Both components avoid the [[species-search-api-broken-on-sqlite]] by not using the search query parameter.
