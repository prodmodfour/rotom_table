---
cap_id: combat-C014
name: Create Encounter from Scene
type: api-endpoint
domain: combat
---

### combat-C014: Create Encounter from Scene
- **cap_id**: combat-C014
- **name**: Create Encounter from Scene
- **type**: api-endpoint
- **location**: `app/server/api/encounters/from-scene.post.ts`
- **game_concept**: Transitioning from narrative scene to combat
- **description**: Creates an encounter from a scene's characters and Pokemon, converting them to combatants with initiative calculation. Supports battle type and significance params.
- **inputs**: `{ sceneId, battleType, significanceMultiplier?, significanceTier? }`
- **outputs**: Encounter data with pre-populated combatants
- **accessible_from**: gm
