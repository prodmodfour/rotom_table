# Library Store

Pinia store (`stores/library.ts`) managing the character and Pokemon library. Part of [[pinia-store-classification]] and mapped to the `characters` + `pokemon` API groups in [[store-to-domain-mapping]].

## State

`humans[]` and `pokemon[]` arrays, plus filter state (search text, character type, Pokemon type/origin, sort field/order).

## Actions

- **loadLibrary** — parallel fetch from [[character-api-endpoints|GET /api/characters]] and [[pokemon-api-endpoints|GET /api/pokemon]], populates both arrays
- **createHuman** — POSTs to API, pushes result to local `humans` array
- **updateHuman** — PUTs to API, updates local array entry
- **deleteHuman** — DELETEs via API, filters out from local array
- **setFilters / resetFilters** — updates or resets search, type, sort controls

## Pokemon Actions

- **createPokemon** — POSTs to [[pokemon-api-endpoints|POST /api/pokemon]], pushes result to local `pokemon` array
- **updatePokemon** — PUTs to [[pokemon-api-endpoints|PUT /api/pokemon/:id]], updates local array entry
- **deletePokemon** — DELETEs via API, filters out from local array
- **linkPokemonToTrainer** — POSTs to link endpoint, updates local Pokemon with returned data
- **unlinkPokemon** — POSTs to unlink endpoint, clears ownerId in local state

## Getters

- **filteredHumans** — filters by search text and character type, sorts by name or level
- **filteredPlayers** — player-only subset of `filteredHumans`
- **groupedNpcsByLocation** — groups non-player characters by their `location` field
- **getHumanById** — finds a character by ID in local state
- **filteredPokemon** — filters by search (species, nickname, location), type, origin; sorts by name or level
- **getPokemonById** — finds a Pokemon by ID in local state
- **getPokemonByOwner** — returns all Pokemon with matching ownerId
- **groupedPokemonByLocation** — groups filtered Pokemon by location field, empty locations sorted last

## See also

- [[character-api-endpoints]]
- [[pokemon-api-endpoints]]
- [[pinia-store-classification]]
- [[pokemon-sheet-page]] — sheet uses updatePokemon for saves
