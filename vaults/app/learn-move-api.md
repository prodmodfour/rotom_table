`POST /api/pokemon/:id/learn-move` (`app/server/api/pokemon/[id]/learn-move.post.ts`) adds a move to a Pokemon's active moveset. It accepts `{ moveName: string, replaceIndex: number | null }`.

The endpoint validates:
1. The Pokemon exists
2. The move exists in the [[movedata-reference-table]]
3. The Pokemon does not already know this move
4. If `replaceIndex` is null, the Pokemon has fewer than 6 moves (the [[move-maximum-six-slots]] rule)
5. If `replaceIndex` is set, it is a valid index into the current moves array

On success, the new move data is denormalized from MoveData into the [[pokemon-moves-stored-as-json]] column, either appended to an empty slot or replacing the move at the given index.

## See also

- [[move-learning-panel]] — the UI that calls this endpoint
