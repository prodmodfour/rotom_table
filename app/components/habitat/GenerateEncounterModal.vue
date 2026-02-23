<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal generate-modal" data-testid="generate-modal">
      <div class="modal__header">
        <h2>Generate Wild Encounter</h2>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal__body">
        <!-- Table Info -->
        <div class="table-info">
          <h3>{{ table.name }}</h3>
          <p v-if="table.description">{{ table.description }}</p>
          <div class="table-info__meta">
            <span class="badge">Lv. {{ table.levelRange.min }}-{{ table.levelRange.max }}</span>
            <span class="badge badge--density" :class="`density--${table.density}`">
              {{ getDensityLabel(table.density) }}
            </span>
            <span class="badge">{{ table.entries.length }} species</span>
          </div>
        </div>

        <!-- Budget Guide -->
        <BudgetGuide
          :party-context="partyContext"
          :generated-pokemon="generatedPokemon"
        />

        <!-- Generation Options -->
        <div class="form-section">
          <div class="form-group">
            <label for="gen-count">Spawn Count</label>
            <input
              id="gen-count"
              v-model.number="count"
              type="number"
              class="form-input"
              min="1"
              :max="MAX_SPAWN_COUNT"
              data-testid="gen-count-input"
            />
            <p class="spawn-suggestion">
              Suggestion: {{ densitySuggestion.suggested }} ({{ getDensityLabel(table.density) }} -- {{ densitySuggestion.description }})
            </p>
          </div>

          <div class="form-group" v-if="table.modifications.length > 0">
            <label for="gen-modification">Apply Modification</label>
            <select
              id="gen-modification"
              v-model="selectedModification"
              class="form-select"
              data-testid="gen-modification-select"
            >
              <option value="">None (Base Table)</option>
              <option
                v-for="mod in table.modifications"
                :key="mod.id"
                :value="mod.id"
              >
                {{ mod.name }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  v-model="overrideLevel"
                  class="form-checkbox"
                />
                Override Level Range
              </label>
            </div>
          </div>

          <div v-if="overrideLevel" class="form-row">
            <div class="form-group">
              <label for="override-min">Min Level</label>
              <input
                id="override-min"
                v-model.number="levelMin"
                type="number"
                class="form-input"
                min="1"
                max="100"
                data-testid="override-min-input"
              />
            </div>
            <div class="form-group">
              <label for="override-max">Max Level</label>
              <input
                id="override-max"
                v-model.number="levelMax"
                type="number"
                class="form-input"
                min="1"
                max="100"
                data-testid="override-max-input"
              />
            </div>
          </div>
        </div>

        <!-- Significance Selector (for "New Encounter" action) -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Encounter Significance</label>
            <p class="significance-hint">Scales XP rewards when creating a new encounter (PTU p.460)</p>
            <div class="significance-compact">
              <label
                v-for="preset in SIGNIFICANCE_PRESETS"
                :key="preset.tier"
                class="significance-compact__option"
                :class="{ 'significance-compact__option--selected': selectedTier === preset.tier }"
              >
                <input type="radio" v-model="selectedTier" :value="preset.tier" />
                <span class="significance-compact__label">{{ preset.label }}</span>
                <span class="significance-compact__multiplier">x{{ preset.defaultMultiplier }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Pool Preview -->
        <div class="pool-preview" v-if="resolvedEntries.length > 0">
          <h4>Encounter Pool ({{ resolvedEntries.length }} species)</h4>
          <div class="pool-entries">
            <div
              v-for="entry in resolvedEntries.slice(0, 10)"
              :key="entry.speciesName"
              class="pool-entry"
            >
              <span class="pool-entry__name">{{ entry.speciesName }}</span>
              <span class="pool-entry__weight">{{ formatPercent(entry.weight) }}</span>
            </div>
            <div v-if="resolvedEntries.length > 10" class="pool-entry pool-entry--more">
              +{{ resolvedEntries.length - 10 }} more species...
            </div>
          </div>
        </div>

        <!-- Generated Results -->
        <div v-if="generatedPokemon.length > 0" class="generated-results">
          <div class="generated-results__header">
            <h4>Generated Pokemon</h4>
            <div class="generated-results__actions">
              <button
                type="button"
                class="btn btn--sm btn--secondary"
                @click="selectAll"
              >
                Select All
              </button>
              <button
                type="button"
                class="btn btn--sm btn--secondary"
                @click="selectNone"
              >
                Select None
              </button>
            </div>
          </div>
          <div class="generated-list">
            <div
              v-for="(pokemon, index) in generatedPokemon"
              :key="index"
              class="generated-item"
              :class="{ 'generated-item--selected': selectedIndices.has(index) }"
              data-testid="generated-pokemon"
              @click="toggleSelection(index)"
            >
              <input
                type="checkbox"
                class="generated-item__checkbox"
                :checked="selectedIndices.has(index)"
                @click.stop
                @change="toggleSelection(index)"
              />
              <span class="generated-item__name">{{ pokemon.speciesName }}</span>
              <span class="generated-item__level">Lv. {{ pokemon.level }}</span>
              <span class="generated-item__source" :class="`generated-item__source--${pokemon.source}`">
                {{ pokemon.source }}
              </span>
            </div>
          </div>
          <div v-if="selectedIndices.size > 0" class="generated-results__selection-info">
            {{ selectedIndices.size }} of {{ generatedPokemon.length }} selected
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="addError" class="modal__error" data-testid="add-error">
        {{ addError }}
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn--primary"
          :disabled="generating || table.entries.length === 0"
          @click="generate"
          data-testid="generate-btn"
        >
          {{ generating ? 'Generating...' : 'Generate' }}
        </button>
        <button
          v-if="generatedPokemon.length > 0 && !isOnTv"
          class="btn btn--accent"
          :disabled="servingToTv"
          @click="serveToGroup"
          data-testid="show-on-tv-btn"
        >
          {{ servingToTv ? 'Sending...' : `Show on TV${selectedIndices.size > 0 ? ` (${selectedIndices.size})` : ''}` }}
        </button>
        <button
          v-if="isOnTv"
          class="btn btn--warning"
          @click="unserveFromTv"
          data-testid="unserve-tv-btn"
        >
          Clear TV
        </button>
        <button
          v-if="generatedPokemon.length > 0"
          class="btn btn--success"
          :disabled="addingToEncounter"
          @click="addToEncounter"
          data-testid="add-to-encounter-btn"
        >
          {{ addingToEncounter ? 'Creating...' : `New Encounter${selectedIndices.size > 0 ? ` (${selectedIndices.size})` : ''}` }}
        </button>
        <button
          v-if="generatedPokemon.length > 0 && props.scenes && props.scenes.length > 0"
          class="btn btn--secondary"
          :disabled="addingToScene"
          @click="showSceneSelector = !showSceneSelector"
          data-testid="add-to-scene-btn"
        >
          {{ addingToScene ? 'Adding...' : `Add to Scene${selectedIndices.size > 0 ? ` (${selectedIndices.size})` : ''}` }}
        </button>
      </div>

      <!-- Scene Selector -->
      <div v-if="showSceneSelector && props.scenes && props.scenes.length > 0" class="scene-selector">
        <select v-model="selectedSceneId" class="form-select">
          <option value="" disabled>Choose a scene...</option>
          <option v-for="s in props.scenes" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button
          class="btn btn--primary btn--sm"
          :disabled="!selectedSceneId || addingToScene"
          @click="handleAddToScene"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EncounterTable, ResolvedTableEntry, DensityTier } from '~/types'
import { DENSITY_SUGGESTIONS, MAX_SPAWN_COUNT } from '~/types'
import { SIGNIFICANCE_PRESETS } from '~/utils/encounterBudget'
import type { SignificanceTier } from '~/utils/encounterBudget'

const props = defineProps<{
  table: EncounterTable
  hasActiveEncounter?: boolean
  addError?: string | null
  addingToEncounter?: boolean
  scenes?: Array<{ id: string; name: string }>
  partyContext?: { averagePokemonLevel: number; playerCount: number }
}>()

const emit = defineEmits<{
  close: []
  addToEncounter: [pokemon: Array<{ speciesId: string; speciesName: string; level: number }>, significance: { multiplier: number; tier: SignificanceTier }]
  addToScene: [sceneId: string, pokemon: Array<{ speciesId: string; speciesName: string; level: number }>]
}>()

const encounterTablesStore = useEncounterTablesStore()
const groupViewStore = useGroupViewStore()

// Fetch current TV state on mount
onMounted(() => {
  groupViewStore.fetchWildSpawnPreview()
})

// Significance state (defaults to insignificant for wild encounters)
const selectedTier = ref<SignificanceTier>('insignificant')
const selectedPreset = computed(() =>
  SIGNIFICANCE_PRESETS.find(p => p.tier === selectedTier.value) ?? SIGNIFICANCE_PRESETS[0]
)

// State
const servingToTv = ref(false)
const count = ref(DENSITY_SUGGESTIONS[props.table.density]?.suggested ?? 4)
const selectedModification = ref('')
const overrideLevel = ref(false)
const levelMin = ref(props.table.levelRange.min)
const levelMax = ref(props.table.levelRange.max)
const generating = ref(false)
const generatedPokemon = ref<Array<{
  speciesId: string
  speciesName: string
  level: number
  weight: number
  source: 'parent' | 'modification'
}>>([])
const selectedIndices = ref<Set<number>>(new Set())

// Scene selector state
const showSceneSelector = ref(false)
const selectedSceneId = ref('')
const addingToScene = ref(false)

// Computed: get the Pokemon to use for actions (selected ones, or all if none selected)
const pokemonForAction = computed(() => {
  if (selectedIndices.value.size === 0) {
    return generatedPokemon.value
  }
  return generatedPokemon.value.filter((_, index) => selectedIndices.value.has(index))
})

// Computed: check if wild spawn is currently on TV
const isOnTv = computed(() => groupViewStore.hasWildSpawn)

// Computed
const resolvedEntries = computed((): ResolvedTableEntry[] => {
  return encounterTablesStore.getResolvedEntries(
    props.table.id,
    selectedModification.value || undefined
  )
})

const totalWeight = computed(() => {
  return resolvedEntries.value.reduce((sum, e) => sum + e.weight, 0)
})

// Density suggestion for the current table (informational hint)
const densitySuggestion = computed(() => {
  return DENSITY_SUGGESTIONS[props.table.density] ?? DENSITY_SUGGESTIONS.moderate
})

// Methods
const getDensityLabel = (density: DensityTier): string => {
  return density.charAt(0).toUpperCase() + density.slice(1)
}

const formatPercent = (weight: number): string => {
  const percent = (weight / totalWeight.value) * 100
  return `${percent.toFixed(1)}%`
}

// Selection functions
const toggleSelection = (index: number) => {
  const newSet = new Set(selectedIndices.value)
  if (newSet.has(index)) {
    newSet.delete(index)
  } else {
    newSet.add(index)
  }
  selectedIndices.value = newSet
}

const selectAll = () => {
  selectedIndices.value = new Set(generatedPokemon.value.map((_, i) => i))
}

const selectNone = () => {
  selectedIndices.value = new Set()
}

const generate = async () => {
  generating.value = true
  try {
    const options: {
      count: number
      modificationId?: string
      levelRange?: { min: number; max: number }
    } = {
      count: count.value
    }

    if (selectedModification.value) {
      options.modificationId = selectedModification.value
    }

    if (overrideLevel.value) {
      options.levelRange = {
        min: levelMin.value,
        max: levelMax.value
      }
    }

    const result = await encounterTablesStore.generateFromTable(props.table.id, options)
    generatedPokemon.value = result.generated
    // Clear selection when generating new Pokemon
    selectedIndices.value = new Set()
  } catch (error) {
    console.error('Failed to generate:', error)
  } finally {
    generating.value = false
  }
}

const addToEncounter = () => {
  // Clear TV display when adding to encounter
  groupViewStore.clearWildSpawnPreview()
  // Use selected Pokemon, or all if none selected
  emit('addToEncounter', pokemonForAction.value.map(p => ({
    speciesId: p.speciesId,
    speciesName: p.speciesName,
    level: p.level
  })), {
    multiplier: selectedPreset.value.defaultMultiplier,
    tier: selectedTier.value
  })
}

const handleAddToScene = () => {
  if (!selectedSceneId.value) return
  addingToScene.value = true
  // Note: addingToScene is not reset here because the parent closes the modal on success.
  // If the parent keeps the modal open on error, the button will stay in "Adding..." state.
  emit('addToScene', selectedSceneId.value, pokemonForAction.value.map(p => ({
    speciesId: p.speciesId,
    speciesName: p.speciesName,
    level: p.level
  })))
}

const serveToGroup = async () => {
  if (pokemonForAction.value.length === 0) return

  servingToTv.value = true
  try {
    // Use selected Pokemon, or all if none selected
    await groupViewStore.serveWildSpawn(
      pokemonForAction.value.map(p => ({
        speciesId: p.speciesId,
        speciesName: p.speciesName,
        level: p.level
      })),
      props.table.name
    )
  } catch (error) {
    console.error('Failed to serve to TV:', error)
  } finally {
    servingToTv.value = false
  }
}

const unserveFromTv = async () => {
  try {
    await groupViewStore.clearWildSpawnPreview()
  } catch (error) {
    console.error('Failed to clear TV:', error)
  }
}

// Update level range when table changes
watch(() => props.table, (newTable) => {
  levelMin.value = newTable.levelRange.min
  levelMax.value = newTable.levelRange.max
}, { immediate: true })
</script>

<style lang="scss" scoped>
.generate-modal {
  max-width: 500px;
}

.modal__error {
  background: rgba($color-danger, 0.1);
  border: 1px solid $color-danger;
  border-radius: $border-radius-sm;
  color: $color-danger;
  padding: $spacing-sm $spacing-md;
  margin-top: $spacing-md;
  font-size: $font-size-sm;
}

.table-info {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;

  h3 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-lg;
  }

  p {
    color: $color-text-muted;
    font-size: $font-size-sm;
    margin-bottom: $spacing-sm;
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
  }

  .badge {
    padding: 2px $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;

    &--density {
      &.density--sparse {
        background: rgba(158, 158, 158, 0.2);
        color: #bdbdbd;
      }

      &.density--moderate {
        background: rgba(33, 150, 243, 0.2);
        color: #64b5f6;
      }

      &.density--dense {
        background: rgba(255, 152, 0, 0.2);
        color: #ffb74d;
      }

      &.density--abundant {
        background: rgba(244, 67, 54, 0.2);
        color: #ef5350;
      }
    }
  }
}

.spawn-suggestion {
  margin-top: $spacing-xs;
  font-size: $font-size-xs;
  color: $color-text-muted;
  font-style: italic;
}

.form-section {
  margin-bottom: $spacing-lg;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.form-checkbox {
  margin-right: $spacing-sm;
}

.pool-preview {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.pool-entries {
  max-height: 150px;
  overflow-y: auto;
}

.pool-entry {
  display: flex;
  justify-content: space-between;
  padding: $spacing-xs 0;
  border-bottom: 1px solid $border-color-default;

  &:last-child {
    border-bottom: none;
  }

  &__name {
    font-weight: 500;
  }

  &__weight {
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &--more {
    color: $color-text-muted;
    font-style: italic;
  }
}

.generated-results {
  background: linear-gradient(135deg, rgba($color-success, 0.1) 0%, rgba($color-accent-teal, 0.1) 100%);
  border: 1px solid rgba($color-success, 0.3);
  border-radius: $border-radius-md;
  padding: $spacing-md;

  h4 {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-success;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }

  &__selection-info {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba($color-success, 0.2);
    font-size: $font-size-xs;
    color: $color-accent-teal;
    text-align: center;
  }
}

.generated-list {
  max-height: 200px;
  overflow-y: auto;
}

.generated-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-xs;
  cursor: pointer;
  transition: all $transition-fast;
  border: 2px solid transparent;

  &:hover {
    background: $color-bg-hover;
  }

  &--selected {
    background: rgba($color-accent-teal, 0.15);
    border-color: $color-accent-teal;

    &:hover {
      background: rgba($color-accent-teal, 0.2);
    }
  }

  &__checkbox {
    width: 18px;
    height: 18px;
    accent-color: $color-accent-teal;
    cursor: pointer;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    font-weight: 600;
  }

  &__level {
    background: $gradient-scarlet;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    font-weight: 600;
  }

  &__source {
    font-size: $font-size-xs;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;

    &--parent {
      background: $color-bg-secondary;
      color: $color-text-muted;
    }

    &--modification {
      background: rgba($color-accent-violet, 0.2);
      color: $color-accent-violet;
    }
  }
}

.significance-hint {
  font-size: $font-size-xs;
  color: $color-text-muted;
  margin: 0 0 $spacing-sm 0;
}

.significance-compact {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__option {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border: 2px solid transparent;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-hover;
    }

    &--selected {
      border-color: $color-warning;
      background: rgba($color-warning, 0.1);
    }

    input[type="radio"] {
      accent-color: $color-warning;
    }
  }

  &__label {
    flex: 1;
    font-weight: 500;
    font-size: $font-size-sm;
  }

  &__multiplier {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 600;
  }
}

.scene-selector {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  border-top: 1px solid $glass-border;
  background: $color-bg-tertiary;

  .form-select {
    flex: 1;
  }
}
</style>
