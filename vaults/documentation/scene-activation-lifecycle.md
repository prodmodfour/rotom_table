# Scene Activation Lifecycle

The full sequence when a scene is activated or deactivated.

## Activation

1. Deactivate all other scenes (`isActive = false`)
2. Set target scene `isActive = true`
3. Update [[singleton-models|GroupViewState]] with `activeSceneId` and `activeTab = 'scene'`
4. Broadcast `scene_activated` via WebSocket
5. BroadcastChannel notification for cross-tab sync

## Deactivation

1. Set scene `isActive = false`
2. Clear GroupViewState (`activeSceneId = null`)
3. Broadcast `scene_deactivated` via WebSocket
4. BroadcastChannel notification

## See also

