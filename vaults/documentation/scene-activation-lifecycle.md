# Scene Activation Lifecycle

The full sequence when a scene is [[scene-api-endpoints|activated]] or deactivated.

## Activation

1. [[scene-end-ap-restoration|Restore AP]] for characters in any currently active scene
2. Deactivate all other scenes (`isActive = false`)
3. Set target scene `isActive = true`
4. Update [[singleton-models|GroupViewState]] with `activeSceneId` and `activeTab = 'scene'`
5. Broadcast `scene_activated` via [[scene-websocket-events|WebSocket]]
6. [[websocket-store-sync|BroadcastChannel]] notification for cross-tab sync

## Deactivation

1. [[scene-end-ap-restoration|Restore AP]] for all characters in the scene
2. Set scene `isActive = false`
3. Clear GroupViewState (`activeSceneId = null`)
4. Broadcast `scene_deactivated` via [[scene-websocket-events|WebSocket]]
5. BroadcastChannel notification

## See also

- [[group-view-scene-interaction]]
- [[scene-end-ap-restoration]]
