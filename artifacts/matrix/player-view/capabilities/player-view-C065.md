---
cap_id: player-view-C065
name: player-view-C065
type: —
domain: player-view
---

### player-view-C065
- **name:** PlayerSceneView component
- **type:** component
- **location:** `app/components/player/PlayerSceneView.vue`
- **game_concept:** Active scene display for players
- **description:** Displays the GM's active scene from the player's perspective. Shows scene name, weather badge, location image or name, description, characters present (with PC/NPC tags), Pokemon present (with species), and groups present. Shows an empty state when no scene is active. Receives scene data from the usePlayerScene composable via WebSocket push.
- **inputs:** scene: PlayerSceneData | null
- **outputs:** Visual scene display
- **accessible_from:** player
