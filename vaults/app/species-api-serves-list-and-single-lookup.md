Two API endpoints serve species data from the [[species-data-model-fields]]:

**`GET /api/species`** returns a list of species with `id`, `name`, `types` (array), `baseStats` (object), `abilities` (parsed array), and `evolutionStage`. Accepts optional `search` (name filter) and `limit` (default 100, max 500) query params. The search parameter uses Prisma's `contains` with `mode: 'insensitive'`, which [[species-search-api-broken-on-sqlite]].

**`GET /api/species/:name`** returns a single species by exact name, including `numBasicAbilities`, `learnset`, base stats, and evolution stage data. Used by the capture rate calculation and the [[pokemon-level-up-panel]] for ability assignment.

Both endpoints are consumed client-side by the [[species-autocomplete-loads-all-on-mount]] components, and server-side by the [[pokemon-generator-service]] and [[evolution-service]].
