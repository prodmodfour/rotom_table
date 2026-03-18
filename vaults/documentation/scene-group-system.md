# Scene Group System

Named visual containers for organizing characters and Pokemon on the [[scene-components|scene canvas]].

## Data

Each group has `id`, `name`, `position` (percentage-based), `width`, and `height`. Stored in the Scene model's `groups` JSON array (see [[scene-data-model]]). Default size 150×100px with auto-offset positioning on creation.

## Membership

Characters and Pokemon carry a `groupId` field referencing their containing group. Membership is reassigned via drag-and-drop — the [[scene-api-endpoints|batch position update endpoint]] updates `groupId` on drop. Deleting a group clears `groupId` from all assigned members.

## UI

[[scene-components|SceneGroupsPanel]] provides create, inline rename, select-to-highlight, and delete with member count badges. [[scene-components|SceneCanvas]] renders groups as resizable containers with corner handles.

## See also

- [[scene-data-model]]
- [[scene-api-endpoints]]
