# Scene Data Model

The [[prisma-schema-overview|Scene]] model stores narrative scenes as standalone records with [[json-as-text-columns|JSON-as-TEXT columns]] for entity collections.

## Scalar Fields

- `name` (required), `description`, `locationName`, `locationImage` (URL)
- `weather` — one of 9 PTU weather types: None, Sunny, Rainy, Sandstorm, Hail, Snow, Fog, Windy, Overcast
- `habitatId` — optional link to an encounter table for wild Pokemon generation
- `isActive` — boolean flag for [[scene-activation-lifecycle|scene serving state]]
- `createdAt`, `updatedAt` timestamps

## JSON Array Fields

Five JSON arrays stored as TEXT (see [[json-as-text-columns]]):

- `characters` — scene participants with `id`, `characterId`, `name`, `avatarUrl`, `position`, `groupId`
- `pokemon` — scene Pokemon with `id`, `species`, `speciesId`, `level`, `nickname`, `position`, `groupId`
- `groups` — named visual containers (see [[scene-group-system]])
- `terrains` — terrain conditions (see [[deferred-scene-features]])
- `modifiers` — custom modifiers (see [[deferred-scene-features]])

Entity positions use percentage-based coordinates (`{ x, y }` as 0–100 values), persisted via the [[scene-api-endpoints|batch position update endpoint]].

## Types

`types/scene.ts` defines hand-written TypeScript interfaces (see [[prisma-derived-vs-hand-written-types]]): `Scene`, `ScenePokemon`, `SceneCharacter`, `SceneGroup`, `SceneModifier`, `ScenePosition`, `GroupViewTab`.

`types/player-sync.ts` defines `SceneSyncPayload` — a stripped-down scene payload for [[player-scene-view|player WebSocket sync]] that excludes terrains, modifiers, and positions.

## See also

- [[scene-api-endpoints]]
- [[scene-group-system]]
- [[singleton-models]] — GroupViewState tracks which scene is active
