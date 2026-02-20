import type { Ref } from 'vue'
import type { EncounterTable, EncounterTableEntry, TableModification, RarityPreset, LevelRange, DensityTier } from '~/types'
import { RARITY_WEIGHTS, DENSITY_SUGGESTIONS } from '~/types'

interface NewEntryForm {
  speciesId: string
  speciesName: string
  rarity: RarityPreset | 'custom'
  customWeight: number
  levelMin: number | null
  levelMax: number | null
}

interface NewModForm {
  name: string
  description: string
  levelMin: number | null
  levelMax: number | null
}

interface EditModForm {
  id: string
  name: string
  description: string
  levelMin: number | null
  levelMax: number | null
}

interface EditSettingsForm {
  name: string
  description: string
  levelMin: number
  levelMax: number
  density: DensityTier
}

const createNewEntryForm = (): NewEntryForm => ({
  speciesId: '',
  speciesName: '',
  rarity: 'common',
  customWeight: 10,
  levelMin: null,
  levelMax: null
})

const createNewModForm = (): NewModForm => ({
  name: '',
  description: '',
  levelMin: null,
  levelMax: null
})

const createEditModForm = (): EditModForm => ({
  id: '',
  name: '',
  description: '',
  levelMin: null,
  levelMax: null
})

const createEditSettingsForm = (): EditSettingsForm => ({
  name: '',
  description: '',
  levelMin: 1,
  levelMax: 10,
  density: 'moderate'
})

export function useTableEditor(tableId: Ref<string>) {
  const tablesStore = useEncounterTablesStore()

  const table = ref<EncounterTable | null>(null)
  const loading = ref(true)

  // Modal visibility
  const showAddEntryModal = ref(false)
  const showAddModModal = ref(false)
  const showSettingsModal = ref(false)
  const showEditModModal = ref(false)

  // Form state
  const newEntry = ref<NewEntryForm>(createNewEntryForm())
  const newMod = ref<NewModForm>(createNewModForm())
  const editMod = ref<EditModForm>(createEditModForm())
  const editSettings = ref<EditSettingsForm>(createEditSettingsForm())

  // Computed
  const totalWeight = computed(() => {
    if (!table.value) return 0
    return table.value.entries.reduce((sum, e) => sum + e.weight, 0)
  })

  const sortedEntries = computed(() => {
    if (!table.value) return []
    return [...table.value.entries].sort((a, b) => b.weight - a.weight)
  })

  // Helpers
  const getDensityLabel = (density: DensityTier): string => {
    return density.charAt(0).toUpperCase() + density.slice(1)
  }

  const getDensityDescription = (density: DensityTier): string => {
    const info = DENSITY_SUGGESTIONS[density]
    return info?.description ?? ''
  }

  // Internal
  const updateEditSettings = () => {
    if (table.value) {
      editSettings.value = {
        name: table.value.name,
        description: table.value.description || '',
        levelMin: table.value.levelRange.min,
        levelMax: table.value.levelRange.max,
        density: table.value.density
      }
    }
  }

  const getWeight = (): number => {
    if (newEntry.value.rarity === 'custom') {
      return newEntry.value.customWeight
    }
    return RARITY_WEIGHTS[newEntry.value.rarity as RarityPreset]
  }

  // Public methods
  const refreshTable = async () => {
    const loaded = await tablesStore.loadTable(tableId.value)
    if (loaded) {
      table.value = loaded
      updateEditSettings()
    }
  }

  const handleSpeciesSelect = (species: { id: string; name: string }) => {
    newEntry.value = { ...newEntry.value, speciesId: species.id, speciesName: species.name }
  }

  const addEntry = async () => {
    if (!table.value || !newEntry.value.speciesId) return

    try {
      await tablesStore.addEntry(table.value.id, {
        speciesId: newEntry.value.speciesId,
        weight: getWeight(),
        levelRange: newEntry.value.levelMin && newEntry.value.levelMax
          ? { min: newEntry.value.levelMin, max: newEntry.value.levelMax }
          : undefined
      })
      table.value = await tablesStore.loadTable(tableId.value)
      showAddEntryModal.value = false
      newEntry.value = createNewEntryForm()
    } catch (error) {
      console.error('Failed to add entry:', error)
    }
  }

  const removeEntry = async (entry: EncounterTableEntry) => {
    if (!table.value) return
    if (confirm(`Remove ${entry.speciesName} from this table?`)) {
      await tablesStore.removeEntry(table.value.id, entry.id)
      table.value = await tablesStore.loadTable(tableId.value)
    }
  }

  const updateEntryWeight = async (entry: EncounterTableEntry, newWeight: number) => {
    if (!table.value) return
    try {
      await tablesStore.updateEntry(table.value.id, entry.id, { weight: newWeight })
    } catch (error) {
      console.error('Failed to update weight:', error)
    }
  }

  const updateEntryLevelRange = async (entry: EncounterTableEntry, levelRange: LevelRange | null) => {
    if (!table.value) return
    try {
      await tablesStore.updateEntry(table.value.id, entry.id, { levelRange: levelRange ?? undefined })
      table.value = await tablesStore.loadTable(tableId.value)
    } catch (error) {
      console.error('Failed to update level range:', error)
    }
  }

  const addModification = async () => {
    if (!table.value || !newMod.value.name) return

    try {
      await tablesStore.createModification(table.value.id, {
        name: newMod.value.name,
        description: newMod.value.description || undefined,
        levelRange: newMod.value.levelMin && newMod.value.levelMax
          ? { min: newMod.value.levelMin, max: newMod.value.levelMax }
          : undefined
      })
      table.value = await tablesStore.loadTable(tableId.value)
      showAddModModal.value = false
      newMod.value = createNewModForm()
    } catch (error) {
      console.error('Failed to create modification:', error)
    }
  }

  const editModification = (mod: TableModification) => {
    editMod.value = {
      id: mod.id,
      name: mod.name,
      description: mod.description || '',
      levelMin: mod.levelRange?.min ?? null,
      levelMax: mod.levelRange?.max ?? null
    }
    showEditModModal.value = true
  }

  const saveModification = async () => {
    if (!table.value || !editMod.value.id || !editMod.value.name) return

    try {
      await tablesStore.updateModification(table.value.id, editMod.value.id, {
        name: editMod.value.name,
        description: editMod.value.description || undefined,
        levelRange: editMod.value.levelMin && editMod.value.levelMax
          ? { min: editMod.value.levelMin, max: editMod.value.levelMax }
          : undefined
      })
      table.value = await tablesStore.loadTable(tableId.value)
      showEditModModal.value = false
      editMod.value = createEditModForm()
    } catch (error) {
      console.error('Failed to update modification:', error)
    }
  }

  const deleteModification = async (mod: TableModification) => {
    if (!table.value) return
    if (confirm(`Delete sub-habitat "${mod.name}"?`)) {
      await tablesStore.deleteModification(table.value.id, mod.id)
      table.value = await tablesStore.loadTable(tableId.value)
    }
  }

  const saveSettings = async () => {
    if (!table.value) return

    try {
      await tablesStore.updateTable(table.value.id, {
        name: editSettings.value.name,
        description: editSettings.value.description || undefined,
        levelRange: {
          min: editSettings.value.levelMin,
          max: editSettings.value.levelMax
        },
        density: editSettings.value.density
      })
      table.value = await tablesStore.loadTable(tableId.value)
      showSettingsModal.value = false
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Load on mount
  onMounted(async () => {
    loading.value = true
    await refreshTable()
    loading.value = false
  })

  // Page title
  useHead({
    title: computed(() => table.value ? `GM - ${table.value.name}` : 'GM - Encounter Table')
  })

  return {
    // State
    table: table as Ref<EncounterTable | null>,
    loading,

    // Modal visibility
    showAddEntryModal,
    showAddModModal,
    showSettingsModal,
    showEditModModal,

    // Form state
    newEntry,
    newMod,
    editMod,
    editSettings,

    // Computed
    totalWeight,
    sortedEntries,

    // Helpers
    getDensityLabel,
    getDensityDescription,

    // Methods
    refreshTable,
    handleSpeciesSelect,
    addEntry,
    removeEntry,
    updateEntryWeight,
    updateEntryLevelRange,
    addModification,
    editModification,
    saveModification,
    deleteModification,
    saveSettings
  }
}
