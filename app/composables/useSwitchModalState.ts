import type { Ref } from 'vue'
import type { Encounter, WebSocketEvent } from '~/types'

interface SwitchModalOptions {
  encounter: Ref<Encounter | null>
  send: (event: WebSocketEvent) => void
  refreshUndoRedoState: () => void
}

/**
 * Composable for managing the Switch Pokemon modal state and computed props.
 * Extracted from gm/index.vue to keep it under the 800-line cap.
 *
 * Handles standard, fainted, and forced switch flows:
 * - Resolves trainer/pokemon combatant IDs from the clicked combatant
 * - Captures undo snapshots before opening modal
 * - Broadcasts encounter update after switch completes
 */
export function useSwitchModalState(options: SwitchModalOptions) {
  const { encounter, send, refreshUndoRedoState } = options

  const encounterStore = useEncounterStore()

  // Switch Pokemon Modal state
  const showSwitchModal = ref(false)
  const switchModalCombatantId = ref<string | null>(null)
  const switchModalMode = ref<'standard' | 'fainted' | 'forced'>('standard')

  // Switch Pokemon handler — resolves trainer/pokemon IDs and opens modal
  const handleSwitchPokemon = (combatantId: string) => {
    if (!encounter.value) return
    const combatant = encounter.value.combatants.find(c => c.id === combatantId)
    if (!combatant) return

    // Capture undo snapshot before opening modal (pre-switch state)
    encounterStore.captureSnapshot('Switch Pokemon')
    switchModalCombatantId.value = combatantId
    switchModalMode.value = 'standard'
    showSwitchModal.value = true
  }

  // Fainted switch handler (P1 Section H) — Shift Action for fainted Pokemon
  const handleFaintedSwitch = (combatantId: string) => {
    if (!encounter.value) return
    const combatant = encounter.value.combatants.find(c => c.id === combatantId)
    if (!combatant) return

    encounterStore.captureSnapshot('Fainted Switch')
    switchModalCombatantId.value = combatantId
    switchModalMode.value = 'fainted'
    showSwitchModal.value = true
  }

  // Force switch handler (P1 Section I) — GM-triggered, no action cost
  const handleForceSwitch = (combatantId: string) => {
    if (!encounter.value) return
    const combatant = encounter.value.combatants.find(c => c.id === combatantId)
    if (!combatant) return

    encounterStore.captureSnapshot('Force Switch')
    switchModalCombatantId.value = combatantId
    switchModalMode.value = 'forced'
    showSwitchModal.value = true
  }

  // Called after a successful switch — broadcast update and refresh undo/redo
  const handleSwitchCompleted = async () => {
    showSwitchModal.value = false
    refreshUndoRedoState()
    // Broadcast encounter_update via WebSocket for group/player views
    await nextTick()
    if (encounterStore.encounter) {
      send({
        type: 'encounter_update',
        data: encounterStore.encounter
      })
    }
  }

  // Computed props for the switch modal
  const switchModalTrainerId = computed(() => {
    if (!switchModalCombatantId.value || !encounter.value) return ''
    const combatant = encounter.value.combatants.find(c => c.id === switchModalCombatantId.value)
    if (!combatant) return ''
    // If this is a trainer, use their combatant ID directly
    if (combatant.type === 'human') return combatant.id
    // If this is a Pokemon, find the trainer by ownerId
    const pokemon = combatant.entity as { ownerId?: string }
    if (!pokemon.ownerId) return ''
    const trainer = encounter.value.combatants.find(
      c => c.type === 'human' && c.entityId === pokemon.ownerId
    )
    return trainer?.id ?? ''
  })

  const switchModalPokemonId = computed(() => {
    if (!switchModalCombatantId.value || !encounter.value) return ''
    const combatant = encounter.value.combatants.find(c => c.id === switchModalCombatantId.value)
    if (!combatant) return ''
    // If this is a Pokemon, use its combatant ID
    if (combatant.type === 'pokemon') return combatant.id
    // If this is a trainer, find the appropriate Pokemon based on switch mode
    if (switchModalMode.value === 'fainted') {
      // Fainted switch: find their first fainted Pokemon
      const faintedPokemon = encounter.value.combatants.find(
        c => c.type === 'pokemon' &&
          (c.entity as { ownerId?: string }).ownerId === combatant.entityId &&
          c.entity.currentHp <= 0
      )
      return faintedPokemon?.id ?? ''
    }
    // Standard/forced: find their first Pokemon in the encounter
    const trainerPokemon = encounter.value.combatants.find(
      c => c.type === 'pokemon' && (c.entity as { ownerId?: string }).ownerId === combatant.entityId
    )
    return trainerPokemon?.id ?? ''
  })

  const switchModalTrainerEntityId = computed(() => {
    if (!switchModalTrainerId.value || !encounter.value) return ''
    const trainer = encounter.value.combatants.find(c => c.id === switchModalTrainerId.value)
    return trainer?.entityId ?? ''
  })

  return {
    showSwitchModal,
    switchModalMode,
    switchModalTrainerId,
    switchModalPokemonId,
    switchModalTrainerEntityId,
    handleSwitchPokemon,
    handleFaintedSwitch,
    handleForceSwitch,
    handleSwitchCompleted
  }
}
