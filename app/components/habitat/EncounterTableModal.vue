<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal table-modal" data-testid="encounter-table-modal">
      <div class="modal__header">
        <h2>{{ isEditing ? 'Edit Encounter Table' : 'Create Encounter Table' }}</h2>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal__body">
        <!-- Basic Info -->
        <div class="form-section">
          <h3>Basic Information</h3>

          <div class="form-group">
            <label for="table-name">Name *</label>
            <input
              id="table-name"
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="Route 1 Grass"
              data-testid="table-name-input"
            />
          </div>

          <div class="form-group">
            <label for="table-description">Description</label>
            <textarea
              id="table-description"
              v-model="form.description"
              class="form-textarea"
              rows="2"
              placeholder="Wild Pokemon found in the tall grass..."
              data-testid="table-description-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="level-min">Min Level</label>
              <input
                id="level-min"
                v-model.number="form.levelMin"
                type="number"
                class="form-input"
                min="1"
                max="100"
                data-testid="level-min-input"
              />
            </div>
            <div class="form-group">
              <label for="level-max">Max Level</label>
              <input
                id="level-max"
                v-model.number="form.levelMax"
                type="number"
                class="form-input"
                min="1"
                max="100"
                data-testid="level-max-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="table-density">Population Density</label>
            <select
              id="table-density"
              v-model="form.density"
              class="form-select"
              data-testid="table-density-select"
            >
              <option v-for="opt in densityOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <p class="form-hint">Describes the habitat's population density (informational -- does not control spawn count)</p>
          </div>

          <div class="form-group">
            <label for="table-image">Image URL</label>
            <input
              id="table-image"
              v-model="form.imageUrl"
              type="text"
              class="form-input"
              placeholder="https://..."
            />
          </div>
        </div>

        <!-- Species Entries (only when editing) -->
        <div v-if="isEditing" class="form-section">
          <h3>Species Entries</h3>

          <!-- Add Entry -->
          <div class="add-entry">
            <SpeciesAutocomplete
              v-model="newSpeciesId"
              placeholder="Search species..."
              data-testid="species-autocomplete"
            />
            <div class="add-entry__weight">
              <label>Weight:</label>
              <select v-model.number="newWeight" class="form-select">
                <option :value="10">Common (10)</option>
                <option :value="5">Uncommon (5)</option>
                <option :value="2">Rare (2)</option>
                <option :value="1">Very Rare (1)</option>
                <option :value="0.1">Legendary (0.1)</option>
              </select>
            </div>
            <button
              class="btn btn--sm btn--primary"
              :disabled="!newSpeciesId"
              @click="addEntry"
              data-testid="add-entry-btn"
            >
              Add
            </button>
          </div>

          <!-- Entries List -->
          <div class="entries-list">
            <div
              v-for="entry in tableEntries"
              :key="entry.id"
              class="entry-item"
              data-testid="entry-item"
            >
              <span class="entry-item__name">{{ entry.speciesName }}</span>
              <span class="entry-item__weight">
                <input
                  v-model.number="entry.weight"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  class="form-input form-input--sm"
                  @change="updateEntryWeight(entry)"
                />
              </span>
              <button
                class="btn btn--sm btn--danger"
                @click="removeEntry(entry.id)"
                data-testid="remove-entry-btn"
              >
                &times;
              </button>
            </div>
            <p v-if="tableEntries.length === 0" class="entries-empty">
              No species added yet
            </p>
          </div>
        </div>

        <!-- Modifications (only when editing) -->
        <div v-if="isEditing && table" class="form-section">
          <h3>Modifications (Sub-habitats)</h3>

          <!-- Add Modification -->
          <div class="add-mod">
            <input
              v-model="newModName"
              type="text"
              class="form-input"
              placeholder="Night Time, Rainy Weather..."
              data-testid="mod-name-input"
            />
            <button
              class="btn btn--sm btn--secondary"
              :disabled="!newModName"
              @click="addModification"
              data-testid="add-mod-btn"
            >
              + Add Modification
            </button>
          </div>

          <!-- Modifications List -->
          <div class="mods-list">
            <div
              v-for="mod in table.modifications"
              :key="mod.id"
              class="mod-item"
              data-testid="mod-item"
            >
              <div class="mod-item__header">
                <span class="mod-item__name">{{ mod.name }}</span>
                <span class="mod-item__count">{{ mod.entries.length }} changes</span>
                <button
                  class="btn btn--sm btn--danger"
                  @click="deleteModification(mod.id)"
                >
                  &times;
                </button>
              </div>
              <p v-if="mod.description" class="mod-item__desc">{{ mod.description }}</p>
            </div>
            <p v-if="table.modifications.length === 0" class="mods-empty">
              No modifications yet
            </p>
          </div>
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn--primary"
          :disabled="!isValid || saving"
          @click="save"
          data-testid="save-table-btn"
        >
          {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Table') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DENSITY_SUGGESTIONS, type EncounterTable, type EncounterTableEntry, type DensityTier } from '~/types'

const props = defineProps<{
  table?: EncounterTable | null
}>()

const emit = defineEmits<{
  close: []
  save: []
}>()

const encounterTablesStore = useEncounterTablesStore()

const densityOptions = Object.entries(DENSITY_SUGGESTIONS).map(([tier, info]) => ({
  value: tier as DensityTier,
  label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} -- ${info.description}`,
}))

// Form state
const form = reactive({
  name: '',
  description: '',
  levelMin: 1,
  levelMax: 10,
  density: 'moderate' as DensityTier,
  imageUrl: ''
})

const saving = ref(false)
const newSpeciesId = ref('')
const newWeight = ref(10)
const newModName = ref('')

// Local copy of entries for editing
const tableEntries = ref<EncounterTableEntry[]>([])

// Computed
const isEditing = computed(() => !!props.table)
const isValid = computed(() => form.name.trim().length > 0 && form.levelMin <= form.levelMax)

// Initialize form when table prop changes
watch(() => props.table, (table) => {
  if (table) {
    form.name = table.name
    form.description = table.description || ''
    form.levelMin = table.levelRange.min
    form.levelMax = table.levelRange.max
    form.density = table.density
    form.imageUrl = table.imageUrl || ''
    tableEntries.value = [...table.entries]
  } else {
    form.name = ''
    form.description = ''
    form.levelMin = 1
    form.levelMax = 10
    form.density = 'moderate'
    form.imageUrl = ''
    tableEntries.value = []
  }
}, { immediate: true })

// Actions
const save = async () => {
  if (!isValid.value) return

  saving.value = true
  try {
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      levelRange: {
        min: form.levelMin,
        max: form.levelMax
      },
      density: form.density
    }

    if (isEditing.value && props.table) {
      await encounterTablesStore.updateTable(props.table.id, data)
    } else {
      await encounterTablesStore.createTable(data)
    }

    emit('save')
  } catch (error) {
    console.error('Failed to save table:', error)
  } finally {
    saving.value = false
  }
}

const addEntry = async () => {
  if (!newSpeciesId.value || !props.table) return

  try {
    await encounterTablesStore.addEntry(props.table.id, {
      speciesId: newSpeciesId.value,
      weight: newWeight.value
    })
    // Reload table to get updated entries
    const updated = await encounterTablesStore.loadTable(props.table.id)
    if (updated) {
      tableEntries.value = [...updated.entries]
    }
    newSpeciesId.value = ''
    newWeight.value = 10
  } catch (error) {
    console.error('Failed to add entry:', error)
  }
}

const removeEntry = async (entryId: string) => {
  if (!props.table) return

  try {
    await encounterTablesStore.removeEntry(props.table.id, entryId)
    tableEntries.value = tableEntries.value.filter(e => e.id !== entryId)
  } catch (error) {
    console.error('Failed to remove entry:', error)
  }
}

const updateEntryWeight = async (entry: EncounterTableEntry) => {
  // TODO: Implement entry update endpoint
  console.log('Update entry weight:', entry.id, entry.weight)
}

const addModification = async () => {
  if (!newModName.value || !props.table) return

  try {
    await encounterTablesStore.createModification(props.table.id, {
      name: newModName.value.trim()
    })
    newModName.value = ''
  } catch (error) {
    console.error('Failed to add modification:', error)
  }
}

const deleteModification = async (modId: string) => {
  if (!props.table) return

  try {
    await encounterTablesStore.deleteModification(props.table.id, modId)
  } catch (error) {
    console.error('Failed to delete modification:', error)
  }
}
</script>

<style lang="scss" scoped>
.table-modal {
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-color-default;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.add-entry {
  display: flex;
  gap: $spacing-sm;
  align-items: flex-end;
  margin-bottom: $spacing-md;

  &__weight {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }

    .form-select {
      width: 140px;
    }
  }
}

.entries-list {
  max-height: 200px;
  overflow-y: auto;
}

.entry-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-xs;

  &__name {
    flex: 1;
    font-weight: 500;
  }

  &__weight {
    width: 80px;

    .form-input--sm {
      padding: $spacing-xs;
      font-size: $font-size-sm;
      text-align: center;
    }
  }
}

.entries-empty,
.mods-empty {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-lg;
}

.add-mod {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;

  .form-input {
    flex: 1;
  }
}

.mods-list {
  max-height: 150px;
  overflow-y: auto;
}

.mod-item {
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-xs;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__name {
    flex: 1;
    font-weight: 500;
  }

  &__count {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-top: $spacing-xs;
  }
}
</style>
