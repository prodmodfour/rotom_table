<template>
  <div class="encounter-tables">
    <div class="encounter-tables__header">
      <h2>Encounter Tables</h2>
      <div class="encounter-tables__actions">
        <button class="btn btn--secondary" @click="showImportModal = true">
          <img src="/icons/phosphor/upload-simple.svg" alt="" class="btn-icon" />
          Import
        </button>
        <button class="btn btn--primary" @click="showCreateModal = true">
          + New Table
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="encounter-tables__filters">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          class="form-input"
          placeholder="Search tables..."
        />
      </div>

      <div class="filter-group">
        <select v-model="filters.sortBy" class="form-select">
          <option value="name">Sort by Name</option>
          <option value="createdAt">Sort by Created</option>
          <option value="updatedAt">Sort by Updated</option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.sortOrder" class="form-select">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <button class="btn btn--secondary btn--sm" @click="resetFilters">
        Reset
      </button>
    </div>

    <!-- Content -->
    <div class="encounter-tables__content">
      <div v-if="loading" class="encounter-tables__loading">
        Loading...
      </div>

      <div v-else-if="filteredTables.length === 0" class="encounter-tables__empty">
        <p>No encounter tables found</p>
        <button class="btn btn--primary" @click="showCreateModal = true">
          Create your first encounter table
        </button>
      </div>

      <div v-else class="encounter-tables__grid">
        <TableCard
          v-for="table in filteredTables"
          :key="table.id"
          :table="table"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal" data-testid="encounter-table-modal">
        <div class="modal__header">
          <h3>Create Encounter Table</h3>
          <button class="modal__close" @click="showCreateModal = false">&times;</button>
        </div>
        <form @submit.prevent="createTable">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="newTable.name"
                type="text"
                class="form-input"
                placeholder="e.g., Glowlace Forest"
                required
                data-testid="table-name-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="newTable.description"
                class="form-input"
                rows="3"
                placeholder="Describe this habitat..."
                data-testid="table-description-input"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Min Level</label>
                <input
                  v-model.number="newTable.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  data-testid="level-min-input"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Max Level</label>
                <input
                  v-model.number="newTable.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  data-testid="level-max-input"
                />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showCreateModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!newTable.name" data-testid="save-table-btn">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Generate Modal (opened via ?generate=tableId query param) -->
    <GenerateEncounterModal
      v-if="showGenerateModal && generateTable"
      :table="generateTable"
      :has-active-encounter="!!encounterStore.encounter"
      :add-error="encounterCreation.error.value"
      :adding-to-encounter="encounterCreation.creating.value"
      :scenes="availableScenes"
      @close="closeGenerateModal"
      @add-to-encounter="handleAddToEncounter"
      @add-to-scene="handleAddToScene"
    />

    <!-- Import Modal -->
    <EncounterTableImportTableModal
      v-if="showImportModal"
      @close="showImportModal = false"
      @imported="handleImported"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Encounter Tables'
})

const route = useRoute()
const router = useRouter()
const tablesStore = useEncounterTablesStore()
const encounterStore = useEncounterStore()
const groupViewTabsStore = useGroupViewTabsStore()
const encounterCreation = useEncounterCreation()

// Local state
const loading = computed(() => tablesStore.loading)
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showGenerateModal = ref(false)

// Filters
const filters = ref({
  search: '',
  sortBy: 'name' as 'name' | 'createdAt' | 'updatedAt',
  sortOrder: 'asc' as 'asc' | 'desc'
})

watch(filters, (newFilters) => {
  tablesStore.setFilters(newFilters)
}, { deep: true })

const filteredTables = computed(() => tablesStore.filteredTables)

// New table form
const newTable = ref({
  name: '',
  description: '',
  levelMin: 1,
  levelMax: 10
})

// Generate modal: table to generate from (set via ?generate=tableId)
const generateTable = computed(() => {
  const generateId = route.query.generate as string | undefined
  if (!generateId) return null
  return tablesStore.getTableById(generateId) ?? null
})

// Scene integration
const availableScenes = computed(() => groupViewTabsStore.scenes)

// Load data on mount, handle ?generate query param
onMounted(async () => {
  await tablesStore.loadTables()
  groupViewTabsStore.fetchScenes()

  // Open generate modal if ?generate=tableId is in URL
  if (route.query.generate && generateTable.value) {
    showGenerateModal.value = true
  }
})

// Actions
const resetFilters = () => {
  filters.value = {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  }
}

const createTable = async () => {
  try {
    const table = await tablesStore.createTable({
      name: newTable.value.name,
      description: newTable.value.description || undefined,
      levelRange: {
        min: newTable.value.levelMin,
        max: newTable.value.levelMax
      }
    })
    showCreateModal.value = false
    newTable.value = { name: '', description: '', levelMin: 1, levelMax: 10 }
    router.push(`/gm/encounter-tables/${table.id}`)
  } catch (error) {
    console.error('Failed to create table:', error)
  }
}

const closeGenerateModal = () => {
  showGenerateModal.value = false
  encounterCreation.clearError()
  // Remove the ?generate query param
  if (route.query.generate) {
    router.replace({ query: { ...route.query, generate: undefined } })
  }
}

const handleAddToEncounter = async (
  pokemon: Array<{ speciesId: string; speciesName: string; level: number }>,
  significance?: { multiplier: number; tier: string }
) => {
  const tableName = generateTable.value?.name || 'Wild Encounter'
  const success = await encounterCreation.createWildEncounter(pokemon, tableName, significance)
  if (success) {
    showGenerateModal.value = false
  }
}

const handleAddToScene = async (sceneId: string, pokemon: Array<{ speciesId: string; speciesName: string; level: number }>) => {
  const success = await encounterCreation.addToScene(sceneId, pokemon)
  if (success) {
    closeGenerateModal()
  }
}

const handleImported = (tableId: string) => {
  showImportModal.value = false
  router.push(`/gm/encounter-tables/${tableId}`)
}
</script>

<style lang="scss" scoped>
.encounter-tables {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    h2 {
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;

    .filter-group {
      flex: 1;
      min-width: 150px;
    }
  }

  &__content {
    min-height: 400px;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $color-text-muted;

    p {
      margin-bottom: $spacing-md;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $spacing-md;
  }
}

.modal-overlay {
  @include modal-overlay-base;
}

.modal {
  @include modal-container-base;
}

.form-group {
  margin-bottom: $spacing-md;
}

.form-label {
  display: block;
  margin-bottom: $spacing-xs;
  color: $color-text-muted;
  font-size: 0.875rem;
}

.form-row {
  display: flex;
  gap: $spacing-md;

  .form-group {
    flex: 1;
  }
}

.btn-icon {
  @include btn-icon-img;
  vertical-align: middle;
  margin-right: $spacing-xs;
}
</style>
