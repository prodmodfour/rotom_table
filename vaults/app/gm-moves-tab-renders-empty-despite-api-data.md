The [[gm-pokemon-detail-moves-tab]] consistently displays "No moves recorded" for all Pokemon, even those whose API response includes a populated moves array.

The `/api/pokemon/:id` endpoint returns moves correctly — the `serializePokemon` function in `server/utils/serializers.ts` calls `JSON.parse(pokemon.moves)` and includes the resulting array in the response. A direct API fetch from the browser confirms the data arrives with the full [[move-interface-tracks-usage-counters]] objects.

The page component (`pages/gm/pokemon/[id].vue`) loads data via `$fetch` in `onMounted` and sets `pokemon.value = response.data`. It passes the `pokemon` ref to `PokemonMovesTab`, which iterates `pokemon.moves`. Despite the API response containing moves, the rendered `v-for` produces no `move-card` elements.

The same move data renders correctly in the [[player-view-pokemon-moves]] section and in the [[encounter-act-modal-move-list]], both of which receive moves through different data paths.
