/**
 * Composable for encounter/scene creation workflows from generated Pokemon.
 * Encapsulates: create encounter or add to scene workflows with error handling.
 * Used by encounter-tables list page and habitat editor page.
 */
export function useEncounterCreation() {
  const encounterStore = useEncounterStore()
  const router = useRouter()

  const creating = ref(false)
  const error = ref<string | null>(null)

  const createWildEncounter = async (
    pokemon: Array<{ speciesId: string; speciesName: string; level: number }>,
    tableName: string,
    significance?: { multiplier: number; tier: string }
  ): Promise<boolean> => {
    if (pokemon.length === 0) {
      error.value = 'No Pokemon to add'
      return false
    }

    creating.value = true
    error.value = null

    try {
      await encounterStore.createEncounter(tableName, 'full_contact', undefined, significance)
      await encounterStore.addWildPokemon(pokemon, 'enemies')
      await encounterStore.serveEncounter()
      router.push('/gm')
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to create encounter'
      return false
    } finally {
      creating.value = false
    }
  }

  const addToScene = async (
    sceneId: string,
    pokemon: Array<{ speciesId: string; speciesName: string; level: number }>
  ): Promise<boolean> => {
    error.value = null
    try {
      for (const p of pokemon) {
        await $fetch(`/api/scenes/${sceneId}/pokemon`, {
          method: 'POST',
          body: { species: p.speciesName, level: p.level, speciesId: p.speciesId }
        })
      }
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to add Pokemon to scene'
      return false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    creating: readonly(creating),
    error: readonly(error),
    clearError,
    createWildEncounter,
    addToScene
  }
}
