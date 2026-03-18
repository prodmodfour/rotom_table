# Scene Editor Page

The GM scene detail page at `/gm/scenes/:id`. The header shows a "Back" link to the [[scene-manager-page]], an editable scene name text field, a "Start Encounter" button that opens the [[scene-start-encounter-modal]], and an "Activate Scene" / "Deactivate" toggle button.

The layout is a three-column arrangement:
- **Left**: [[scene-groups-panel]] — lists and manages groups
- **Center**: [[scene-canvas]] — the drag-and-drop positioning surface
- **Right**: Three collapsible panels stacked vertically — [[scene-properties-panel]], [[scene-add-panel]], and [[scene-habitat-panel]]. Each has a collapse/expand toggle. When collapsed, a small icon strip remains clickable.
