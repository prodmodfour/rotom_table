# Group View Scene Interaction

Scene is one of 4 tabs in the [[triple-view-system|Group View]] (see [[group-view-tabs]]): `lobby | scene | encounter | map`.

- GM activates scene via [[scene-activation-lifecycle]] — BroadcastChannel notifies Group tab, [[scene-end-ap-restoration|AP is restored]]
- [[scene-websocket-events|13 WebSocket events]] for real-time scene sync, plus `tab_state` events
- `SceneSyncPayload` (in `types/player-sync.ts`): stripped-down scene data pushed to players (excludes [[deferred-scene-features|terrains/modifiers]])
- Store: [[pinia-store-classification|groupViewTabs]] manages tab state + scene data with 11 WebSocket handler methods
- The [[singleton-models|GroupViewState singleton]] tracks the active tab and scene
- Group View `SceneView.vue` renders weather-themed backgrounds and CSS particle overlays for all 9 PTU weather types

## See also

- [[scene-components]]
- [[websocket-real-time-sync]]
- [[scene-data-model]]
- [[scene-websocket-events]]
