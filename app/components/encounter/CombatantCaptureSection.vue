<template>
  <div class="capture-section">
    <!-- Trainer selector for who throws the ball -->
    <div v-if="availableTrainers.length > 0" class="capture-trainer-select">
      <label class="capture-trainer-select__label">Trainer</label>
      <select v-model="selectedTrainerId" class="form-input form-input--sm">
        <option v-for="t in availableTrainers" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
    </div>
    <CapturePanel
      v-if="selectedTrainerId"
      :pokemon-id="pokemonId"
      :pokemon-data="pokemonData"
      :trainer-id="selectedTrainerId"
      :encounter-id="encounterId"
      @captured="$emit('captured')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Pokemon, HumanCharacter } from '~/types'

const props = defineProps<{
  /** The wild Pokemon's entity ID */
  pokemonId: string
  /** The wild Pokemon's species name (for evolution stage lookup) */
  pokemonSpecies: string
  /** The wild Pokemon entity for data extraction */
  pokemonEntity: Pokemon
  /** The active encounter ID */
  encounterId?: string
}>()

defineEmits<{
  captured: []
}>()

const encounterStore = useEncounterStore()

// Available player/ally trainers in the encounter for capture
const availableTrainers = computed(() => {
  const encounter = encounterStore.encounter
  if (!encounter) return []
  return encounter.combatants
    .filter(c => c.type === 'human' && (c.side === 'players' || c.side === 'allies'))
    .map(c => ({
      id: c.entityId!,
      name: (c.entity as HumanCharacter).name,
    }))
})

// Default selected trainer (first available)
const selectedTrainerId = ref('')
watch(availableTrainers, (trainers) => {
  if (trainers.length > 0 && !selectedTrainerId.value) {
    selectedTrainerId.value = trainers[0].id
  }
}, { immediate: true })

// Fetch species data for evolution stage info (needed for accurate capture rate preview)
const speciesEvolution = ref<{ evolutionStage: number; maxEvolutionStage: number } | null>(null)
watch(
  () => props.pokemonSpecies,
  async (species) => {
    if (!species) {
      speciesEvolution.value = null
      return
    }
    try {
      const resp = await $fetch<{ success: boolean; data: { evolutionStage: number; maxEvolutionStage: number } }>(`/api/species/${species}`)
      if (resp.success) {
        speciesEvolution.value = {
          evolutionStage: resp.data.evolutionStage,
          maxEvolutionStage: resp.data.maxEvolutionStage,
        }
      }
    } catch {
      // Non-critical: capture rate preview will use defaults
      speciesEvolution.value = null
    }
  },
  { immediate: true }
)

// Pokemon data for CapturePanel
const pokemonData = computed(() => {
  const pokemon = props.pokemonEntity
  return {
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    evolutionStage: speciesEvolution.value?.evolutionStage,
    maxEvolutionStage: speciesEvolution.value?.maxEvolutionStage,
    statusConditions: pokemon.statusConditions || [],
    injuries: pokemon.injuries || 0,
    isShiny: pokemon.shiny || false,
  }
})
</script>

<style lang="scss" scoped>
.capture-section {
  margin-top: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.capture-trainer-select {
  display: flex;
  align-items: center;
  gap: $spacing-xs;

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  select {
    flex: 1;
    background: $color-bg-tertiary;
    color: $color-text;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    padding: 2px $spacing-xs;
    font-size: $font-size-xs;

    &:focus {
      border-color: $color-accent-teal;
      outline: none;
    }
  }
}
</style>
