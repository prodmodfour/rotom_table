# Pokemon Move Learning

Move learning from a Pokemon's species learnset.

## Component

`components/pokemon/MoveLearningPanel.vue` — displays current moves (6 slots), lists available new moves with full details via batch move detail fetch. Supports add-to-slot and replace-existing-move workflows.

## API

POST `/api/pokemon/:id/learn-move` — validates against MoveData, rejects duplicates, enforces 6-move max. Supports add or replace by index. See [[pokemon-api-endpoints]].
