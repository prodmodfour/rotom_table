---
cap_id: combat-C109
name: encounter store — undo/redo
type: store-action
domain: combat
---

### combat-C109: encounter store — undo/redo
- **cap_id**: combat-C109
- **name**: Undo/Redo System
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: Combat undo/redo (50 snapshots)
- **description**: captureSnapshot, undoAction, redoAction, getUndoRedoState, initializeHistory.
- **inputs**: actionName
- **outputs**: Boolean, state
- **accessible_from**: gm
