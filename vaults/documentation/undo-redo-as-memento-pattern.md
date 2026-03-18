# Undo-Redo as Memento Pattern

The [[undo-redo-system]] follows the [[memento-pattern]]: encounter state snapshots are captured before each action, stored in a history stack, and restored on undo. The caretaker (the encounter store's `useEncounterUndoRedo` composable) manages the snapshot stack without understanding the snapshot contents — it only knows how to save and restore.

This cleanly separates state capture from state management, following the [[single-responsibility-principle]]: the undo/redo composable handles history navigation, while the encounter store handles the actual state.

The pattern also has a [[command-pattern]] affinity: each action that modifies encounter state could be modeled as a command with an undo operation, though the current implementation uses full-state snapshots (memento) rather than incremental commands.

## See also

- [[encounter-store-decomposition]] — `useEncounterUndoRedo` as one of the 5 delegated composables
- [[encounter-store-as-facade]] — the facade through which undo/redo is accessed
