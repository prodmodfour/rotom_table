The [[gm-pokemon-detail-page]] component (`app/pages/gm/pokemon/[id].vue`) fetches the Pokemon via `GET /api/pokemon/:id`. The response is deserialized by `serializePokemon()` on the server.

The page maintains a `pokemon` ref for the loaded data and an `editData` copy used during [[gm-pokemon-detail-edit-mode]]. Saving delegates to `libraryStore.updatePokemon()` which calls `PUT /api/pokemon/:id`.

The page also wires up `usePokemonSheetRolls()` for dice rolling on the [[gm-pokemon-detail-skills-tab]] and stat checks, and `useEvolutionUndo()` for reverting evolutions triggered via the [[gm-pokemon-detail-evolve-button]].
