# Player View Scene Display

The player view's scene content (shown when the [[player-view-scene-tab]] is active and a scene is synced). Unlike the spatial layout of the [[group-view-scene-display]], the player view uses a simple list-based layout:

- Scene name
- Weather badge (if set)
- Location image (if set)
- Description text
- Characters list — each tagged as PC or NPC
- Pokemon list
- Groups list

The player view receives a stripped-down scene payload via WebSocket that omits spatial positions, terrains, and modifiers. Characters include an `isPlayerCharacter` flag and pokemon include an `ownerId` field.

The composable `usePlayerScene` manages this state, mapping `scene_sync` WebSocket events and providing a REST fallback via `GET /api/scenes/active`.
