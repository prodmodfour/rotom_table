<template>
  <div class="habitats-page">
    <div class="habitats-page__header">
      <h1>Encounter Tables</h1>
      <p class="habitats-page__subtitle">Manage habitats and encounter pools for wild Pokemon generation</p>
      <button class="btn btn--primary" @click="showCreateModal = true">
        + New Table
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="habitats-page__loading">
      <p>Loading encounter tables...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="habitats-page__error">
      <p>{{ error }}</p>
      <button class="btn btn--secondary" @click="loadTables">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="tables.length === 0" class="habitats-page__empty">
      <h2>No Encounter Tables Yet</h2>
      <p>Create your first encounter table to start building habitats for wild Pokemon encounters.</p>
      <button class="btn btn--primary" @click="showCreateModal = true">
        Create Your First Table
      </button>
    </div>

    <!-- Tables Grid -->
    <div v-else class="habitats-page__content">
      <!-- Search/Filter Bar -->
      <div class="habitats-page__filters">
        <input
          v-model="searchQuery"
          type="text"
          class="form-input"
          placeholder="Search tables..."
        />
        <select v-model="sortBy" class="form-select">
          <option value="name">Sort by Name</option>
          <option value="createdAt">Sort by Created</option>
          <option value="updatedAt">Sort by Updated</option>
        </select>
      </div>

      <!-- Tables List -->
      <div class="habitats-page__grid">
        <EncounterTableCard
          v-for="table in filteredTables"
          :key="table.id"
          :table="table"
        />
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <EncounterTableModal
      v-if="showCreateModal || editingTable"
      :table="editingTable"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete Confirmation -->
    <ConfirmModal
      v-if="deletingTable"
      title="Delete Encounter Table"
      :message="`Are you sure you want to delete '${deletingTable.name}'? This will also delete all modifications and entries.`"
      confirm-text="Delete"
      confirm-class="btn--danger"
      @confirm="handleDelete"
      @cancel="deletingTable = null"
    />

    <!-- Generate Modal -->
    <GenerateEncounterModal
      v-if="generatingFromTable"
      :table="generatingFromTable"
      :has-active-encounter="!!encounterStore.encounter"
      :add-error="encounterCreation.error.value"
      :adding-to-encounter="encounterCreation.creating.value"
      @close="generatingFromTable = null; encounterCreation.clearError()"
      @add-to-encounter="handleAddToEncounter"
    />
  </div>
</template>

<script setup lang="ts">
import type { EncounterTable } from '~/types'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Encounter Tables'
})

const encounterTablesStore = useEncounterTablesStore()
const encounterStore = useEncounterStore()
const encounterCreation = useEncounterCreation()

// State
const showCreateModal = ref(false)
const editingTable = ref<EncounterTable | null>(null)
const deletingTable = ref<EncounterTable | null>(null)
const generatingFromTable = ref<EncounterTable | null>(null)
const searchQuery = ref('')
const sortBy = ref<'name' | 'createdAt' | 'updatedAt'>('name')

// Computed
const loading = computed(() => encounterTablesStore.loading)
const error = computed(() => encounterTablesStore.error)
const tables = computed(() => encounterTablesStore.tables)

const filteredTables = computed(() => {
  let result = [...tables.value]

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    )
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updatedAt':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      default:
        return 0
    }
  })

  return result
})

// Load tables on mount
onMounted(async () => {
  await loadTables()
})

const loadTables = async () => {
  await encounterTablesStore.loadTables()
}

const editTable = (table: EncounterTable) => {
  editingTable.value = table
}

const confirmDelete = (table: EncounterTable) => {
  deletingTable.value = table
}

const handleDelete = async () => {
  if (!deletingTable.value) return
  await encounterTablesStore.deleteTable(deletingTable.value.id)
  deletingTable.value = null
}

const closeModal = () => {
  showCreateModal.value = false
  editingTable.value = null
}

const handleSave = async () => {
  closeModal()
  // Store handles the actual save, just close modal
}

const generateFromTable = (table: EncounterTable) => {
  generatingFromTable.value = table
}

const handleAddToEncounter = async (
  pokemon: Array<{ speciesId: string; speciesName: string; level: number }>,
  significance?: { multiplier: number; tier: string }
) => {
  const tableName = generatingFromTable.value?.name || 'Wild Encounter'
  const success = await encounterCreation.createWildEncounter(pokemon, tableName, significance)
  if (success) {
    generatingFromTable.value = null
  }
}
</script>

<style lang="scss" scoped>
.habitats-page {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-xl;
    flex-wrap: wrap;
    gap: $spacing-md;

    h1 {
      margin: 0;
      color: $color-text;
    }
  }

  &__subtitle {
    color: $color-text-muted;
    font-size: $font-size-sm;
    margin-top: $spacing-xs;
    flex-basis: 100%;
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
    text-align: center;

    h2 {
      margin-bottom: $spacing-sm;
      color: $color-text;
    }

    p {
      color: $color-text-muted;
      margin-bottom: $spacing-lg;
      max-width: 400px;
    }
  }

  &__error {
    p {
      color: $color-danger;
    }
  }

  &__filters {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    .form-input {
      flex: 1;
      max-width: 300px;
    }

    .form-select {
      width: 180px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $spacing-lg;
  }
}
</style>
