import type { Encounter } from '~/types'

/**
 * Composable for encounter undo/redo actions.
 * Wraps the useEncounterHistory composable and provides store-level
 * undo/redo operations that sync with the server.
 */

// Lazy-initialized singleton for the history composable
let historyComposable: ReturnType<typeof useEncounterHistory> | null = null

export const getHistory = () => {
  if (!historyComposable) {
    historyComposable = useEncounterHistory()
  }
  return historyComposable
}

interface EncounterUndoRedoContext {
  getEncounter: () => Encounter | null
  setEncounter: (enc: Encounter) => void
  setError: (msg: string) => void
}

export function useEncounterUndoRedo(ctx: EncounterUndoRedoContext) {
  /** Capture current state before an action (GM only) */
  function captureSnapshot(actionName: string) {
    const encounter = ctx.getEncounter()
    if (encounter) {
      const history = getHistory()
      history.pushSnapshot(actionName, encounter)
    }
  }

  /** Undo last action */
  async function undoAction(): Promise<boolean> {
    const history = getHistory()
    const encounter = ctx.getEncounter()
    if (!history.canUndo.value || !encounter) return false

    const previousState = history.undo()
    if (!previousState) return false

    try {
      // Sync to database
      await $fetch(`/api/encounters/${encounter.id}` as string, {
        method: 'PUT',
        body: previousState
      } as any)
      ctx.setEncounter(previousState)
      return true
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to undo action')
      // Restore the redo state since we failed
      history.redo()
      return false
    }
  }

  /** Redo previously undone action */
  async function redoAction(): Promise<boolean> {
    const history = getHistory()
    const encounter = ctx.getEncounter()
    if (!history.canRedo.value || !encounter) return false

    const nextState = history.redo()
    if (!nextState) return false

    try {
      // Sync to database
      await $fetch(`/api/encounters/${encounter.id}` as string, {
        method: 'PUT',
        body: nextState
      } as any)
      ctx.setEncounter(nextState)
      return true
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to redo action')
      // Restore the previous state since we failed
      history.undo()
      return false
    }
  }

  /** Get undo/redo state */
  function getUndoRedoState() {
    const history = getHistory()
    return {
      canUndo: history.canUndo.value,
      canRedo: history.canRedo.value,
      lastActionName: history.lastActionName.value,
      nextActionName: history.nextActionName.value
    }
  }

  /** Initialize history when encounter loads */
  function initializeHistory() {
    const encounter = ctx.getEncounter()
    if (encounter) {
      const history = getHistory()
      history.initializeHistory(encounter)
    }
  }

  return {
    captureSnapshot,
    undoAction,
    redoAction,
    getUndoRedoState,
    initializeHistory
  }
}
