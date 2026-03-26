# Pokemon Move Learning

Move learning via [[unlock-conditions]]. [[moves-are-universally-available|Any Pokemon can learn any move]] — there are no species-specific learnsets. The only gate is the move's own unlock conditions (traits, stats, training, etc.). There is [[no-moves-known-limit|no limit]] on how many moves a Pokemon can know.

## Component

`components/pokemon/MoveLearningPanel.vue` — displays current moves, lists available new moves with full details via batch move detail fetch. Supports add workflow. Move unlock condition checking determines which moves are available.

## API

POST `/api/pokemon/:id/learn-move` — validates against MoveData, rejects duplicates. See [[pokemon-api-endpoints]].

## See also

- [[move-energy-system]] — energy costs for using moves in combat
- [[pokemon-api-endpoints]]
