/**
 * Composable for Pokemon switching workflow.
 * Provides validation, bench Pokemon loading, and switch execution.
 *
 * PTU p.229: Full Switch = Standard Action. Trainer must be within
 * 8m of the Pokemon to recall it (decree-002: ptuDiagonalDistance).
 */

import type { Pokemon } from '~/types/character'

export function useSwitching() {
  const encounterStore = useEncounterStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get a trainer's bench Pokemon (owned, not in encounter, not fainted).
   * Fetches the trainer's full Pokemon roster from API, then filters out
   * those already in the encounter and those with 0 HP.
   */
  async function getBenchPokemon(trainerEntityId: string): Promise<Pokemon[]> {
    try {
      const response = await $fetch<{ data: { pokemon: Pokemon[] } }>(
        `/api/characters/${trainerEntityId}`
      )
      const allPokemon = response.data.pokemon || []

      // Build set of entity IDs already in the encounter
      const activePokemonIds = new Set(
        encounterStore.encounter?.combatants
          .filter(c => c.type === 'pokemon')
          .map(c => c.entityId) ?? []
      )

      // Filter: not in encounter, not fainted, in library (not archived)
      return allPokemon.filter((p: Pokemon) =>
        !activePokemonIds.has(p.id) &&
        p.currentHp > 0 &&
        p.isInLibrary
      )
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load bench Pokemon'
      error.value = message
      return []
    }
  }

  /**
   * Check if a trainer can switch their Pokemon on this turn.
   * Client-side pre-validation for UI state (disable button, etc.).
   */
  function canSwitch(trainerId: string, pokemonCombatantId: string): {
    allowed: boolean
    reason?: string
  } {
    const encounter = encounterStore.encounter
    if (!encounter) return { allowed: false, reason: 'No active encounter' }

    if (!encounter.isActive) return { allowed: false, reason: 'Encounter is not active' }

    const trainer = encounter.combatants.find(c => c.id === trainerId)
    if (!trainer) return { allowed: false, reason: 'Trainer not found' }

    const pokemon = encounter.combatants.find(c => c.id === pokemonCombatantId)
    if (!pokemon) return { allowed: false, reason: 'Pokemon not found' }

    // Check if this is the correct turn
    const currentId = encounter.turnOrder[encounter.currentTurnIndex]
    const isTrainerTurn = currentId === trainerId
    const isPokemonTurn = currentId === pokemonCombatantId

    if (!isTrainerTurn && !isPokemonTurn) {
      return { allowed: false, reason: 'Not this combatant\'s turn' }
    }

    // Check Standard Action availability on the initiating combatant
    const initiator = isTrainerTurn ? trainer : pokemon
    if (initiator.turnState.standardActionUsed) {
      return { allowed: false, reason: 'Standard Action already used' }
    }

    return { allowed: true }
  }

  /**
   * Execute a full switch via the API.
   */
  async function executeSwitch(
    trainerId: string,
    recallCombatantId: string,
    releaseEntityId: string,
    options?: { faintedSwitch?: boolean; forced?: boolean; releasePosition?: { x: number; y: number } }
  ) {
    loading.value = true
    error.value = null
    try {
      const result = await encounterStore.switchPokemon(
        trainerId,
        recallCombatantId,
        releaseEntityId,
        options
      )
      return result
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Switch failed'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getBenchPokemon,
    canSwitch,
    executeSwitch
  }
}
