# Scene Components

8 components for the narrative scene system (GM-side scene editor), operating on the [[scene-data-model]]:

| Component | Lines | Purpose |
|---|---|---|
| `SceneCanvas.vue` | 481 | Main drag-and-drop canvas — positions character avatars and Pokemon sprites via percentage-based layout |
| `SceneAddPanel.vue` | 333 | Right sidebar to add characters and Pokemon to a scene |
| `ScenePropertiesPanel.vue` | 175 | Right sidebar for location name, background URL, description, weather |
| `SceneGroupsPanel.vue` | 188 | Left sidebar for creating/managing named entity groups with resize handles |
| `SceneHabitatPanel.vue` | 316 | Right sidebar linking scene to encounter table for random Pokemon generation |
| `ScenePokemonList.vue` | 214 | Sub-component of SceneAddPanel: expandable per-character Pokemon lists |
| `StartEncounterModal.vue` | 238 | Modal for [[scene-to-encounter-conversion]] (battle type + significance tier selection) |
| `QuestXpDialog.vue` | 212 | Inline dialog for awarding trainer XP to all characters in a scene |

## See also

- [[deferred-scene-features]]
- [[group-view-scene-interaction]]
- [[scene-group-system]]
- [[scene-data-model]]
