# Undo/Redo System

Implemented via `useEncounterHistory` composable (`composables/useEncounterHistory.ts`).

Uses a singleton pattern: module-level `ref` arrays (`history`, `currentIndex`) shared across all callers. This means the state persists across component mounts.

- Max 50 snapshots (`MAX_HISTORY_SIZE`), deep-cloned via `JSON.parse(JSON.stringify())`
- Encounter store accesses history via `getHistory()` exported from `useEncounterUndoRedo`
- Restore flow: undo/redo retrieves a snapshot, PUTs the full encounter to server, updates local state
- On PUT failure: rollback by calling `history.redo()` (for failed undo) or `history.undo()` (for failed redo)
- Exposed API: `canUndo`, `canRedo`, `lastActionName`, `nextActionName`

## See also

- [[encounter-store-decomposition]]
- [[pinia-store-classification]]
- [[undo-redo-as-memento-pattern]] — how this system implements the memento pattern
