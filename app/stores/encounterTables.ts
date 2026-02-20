import { defineStore } from 'pinia'
import type {
  EncounterTable,
  EncounterTableEntry,
  TableModification,
  ModificationEntry,
  LevelRange,
  ResolvedTableEntry,
  DensityTier
} from '~/types'

interface EncounterTablesState {
  tables: EncounterTable[]
  selectedTableId: string | null
  loading: boolean
  error: string | null
  filters: {
    search: string
    sortBy: 'name' | 'createdAt' | 'updatedAt'
    sortOrder: 'asc' | 'desc'
  }
}

export const useEncounterTablesStore = defineStore('encounterTables', {
  state: (): EncounterTablesState => ({
    tables: [],
    selectedTableId: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc'
    }
  }),

  getters: {
    filteredTables: (state): EncounterTable[] => {
      let result = [...state.tables]

      // Filter by search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        result = result.filter(t =>
          t.name.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
        )
      }

      // Sort
      result.sort((a, b) => {
        let comparison = 0
        switch (state.filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            break
          case 'updatedAt':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            break
        }
        return state.filters.sortOrder === 'asc' ? comparison : -comparison
      })

      return result
    },

    selectedTable: (state): EncounterTable | undefined => {
      if (!state.selectedTableId) return undefined
      return state.tables.find(t => t.id === state.selectedTableId)
    },

    getTableById: (state) => (id: string): EncounterTable | undefined => {
      return state.tables.find(t => t.id === id)
    },

    // Get resolved entries for a table with optional modification applied
    getResolvedEntries: (state) => (tableId: string, modificationId?: string): ResolvedTableEntry[] => {
      const table = state.tables.find(t => t.id === tableId)
      if (!table) return []

      // Start with parent entries
      const entries: Map<string, ResolvedTableEntry> = new Map()

      for (const entry of table.entries) {
        entries.set(entry.speciesName, {
          speciesName: entry.speciesName,
          speciesId: entry.speciesId,
          weight: entry.weight,
          levelRange: entry.levelRange ?? table.levelRange,
          source: 'parent'
        })
      }

      // Apply modification if specified
      if (modificationId) {
        const modification = table.modifications.find(m => m.id === modificationId)
        if (modification) {
          for (const modEntry of modification.entries) {
            if (modEntry.remove) {
              // Remove from results
              entries.delete(modEntry.speciesName)
            } else {
              // Add or override
              const existing = entries.get(modEntry.speciesName)
              entries.set(modEntry.speciesName, {
                speciesName: modEntry.speciesName,
                speciesId: existing?.speciesId,
                weight: modEntry.weight ?? existing?.weight ?? 10,
                levelRange: modEntry.levelRange ?? modification.levelRange ?? existing?.levelRange ?? table.levelRange,
                source: existing ? 'modification' : 'added'
              })
            }
          }
        }
      }

      return Array.from(entries.values())
    },

    // Calculate total weight for probability display
    getTotalWeight: (state) => (tableId: string, modificationId?: string): number => {
      const store = useEncounterTablesStore()
      const entries = store.getResolvedEntries(tableId, modificationId)
      return entries.reduce((sum, e) => sum + e.weight, 0)
    }
  },

  actions: {
    // Load all tables
    async loadTables() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: EncounterTable[] }>('/api/encounter-tables')
        this.tables = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load encounter tables'
      } finally {
        this.loading = false
      }
    },

    // Load single table by ID
    async loadTable(id: string): Promise<EncounterTable | null> {
      try {
        const response = await $fetch<{ data: EncounterTable }>(`/api/encounter-tables/${id}`)
        // Update in cache
        const index = this.tables.findIndex(t => t.id === id)
        if (index !== -1) {
          this.tables[index] = response.data
        } else {
          this.tables.push(response.data)
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load encounter table'
        return null
      }
    },

    // Create new table
    async createTable(data: {
      name: string
      description?: string
      imageUrl?: string
      levelRange?: LevelRange
      density?: DensityTier
    }): Promise<EncounterTable> {
      try {
        const response = await $fetch<{ data: EncounterTable }>('/api/encounter-tables', {
          method: 'POST',
          body: data
        })
        this.tables.push(response.data)
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter table'
        throw e
      }
    },

    // Update table
    async updateTable(id: string, data: {
      name?: string
      description?: string
      imageUrl?: string
      levelRange?: LevelRange
      density?: DensityTier
    }): Promise<EncounterTable> {
      try {
        const response = await $fetch<{ data: EncounterTable }>(`/api/encounter-tables/${id}`, {
          method: 'PUT',
          body: data
        })
        const index = this.tables.findIndex(t => t.id === id)
        if (index !== -1) {
          this.tables[index] = response.data
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to update encounter table'
        throw e
      }
    },

    // Delete table
    async deleteTable(id: string) {
      try {
        await $fetch(`/api/encounter-tables/${id}`, { method: 'DELETE' })
        this.tables = this.tables.filter(t => t.id !== id)
        if (this.selectedTableId === id) {
          this.selectedTableId = null
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to delete encounter table'
        throw e
      }
    },

    // Add entry to table
    async addEntry(tableId: string, data: {
      speciesId: string
      weight?: number
      levelRange?: LevelRange
    }): Promise<EncounterTableEntry> {
      try {
        const response = await $fetch<{ data: EncounterTableEntry }>(`/api/encounter-tables/${tableId}/entries`, {
          method: 'POST',
          body: data
        })
        // Reload table to get updated entries
        await this.loadTable(tableId)
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to add entry'
        throw e
      }
    },

    // Update entry in table
    async updateEntry(tableId: string, entryId: string, data: {
      weight?: number
      levelRange?: LevelRange | null
    }): Promise<void> {
      try {
        const body: Record<string, unknown> = {}
        if (data.weight !== undefined) {
          body.weight = data.weight
        }
        if (data.levelRange !== undefined) {
          body.levelMin = data.levelRange?.min ?? null
          body.levelMax = data.levelRange?.max ?? null
        }

        await $fetch(`/api/encounter-tables/${tableId}/entries/${entryId}`, {
          method: 'PUT',
          body
        })

        // Update local state
        const table = this.tables.find(t => t.id === tableId)
        if (table) {
          const entry = table.entries.find(e => e.id === entryId)
          if (entry) {
            if (data.weight !== undefined) {
              entry.weight = data.weight
            }
            if (data.levelRange !== undefined) {
              entry.levelRange = data.levelRange ?? undefined
            }
          }
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to update entry'
        throw e
      }
    },

    // Remove entry from table
    async removeEntry(tableId: string, entryId: string) {
      try {
        await $fetch(`/api/encounter-tables/${tableId}/entries/${entryId}`, {
          method: 'DELETE'
        })
        // Update local state
        const table = this.tables.find(t => t.id === tableId)
        if (table) {
          table.entries = table.entries.filter(e => e.id !== entryId)
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to remove entry'
        throw e
      }
    },

    // Create modification (sub-habitat)
    async createModification(tableId: string, data: {
      name: string
      description?: string
      levelRange?: LevelRange
    }): Promise<TableModification> {
      try {
        const response = await $fetch<{ data: TableModification }>(`/api/encounter-tables/${tableId}/modifications`, {
          method: 'POST',
          body: data
        })
        // Add to local state
        const table = this.tables.find(t => t.id === tableId)
        if (table) {
          table.modifications.push({ ...response.data, parentTableId: tableId, createdAt: new Date(), updatedAt: new Date() })
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create modification'
        throw e
      }
    },

    // Update modification
    async updateModification(tableId: string, modId: string, data: {
      name?: string
      description?: string
      levelRange?: LevelRange
    }): Promise<TableModification> {
      try {
        const response = await $fetch<{ data: TableModification }>(`/api/encounter-tables/${tableId}/modifications/${modId}`, {
          method: 'PUT',
          body: data
        })
        // Update local state
        const table = this.tables.find(t => t.id === tableId)
        if (table) {
          const index = table.modifications.findIndex(m => m.id === modId)
          if (index !== -1) {
            table.modifications[index] = { ...response.data, parentTableId: tableId, createdAt: table.modifications[index].createdAt, updatedAt: new Date() }
          }
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to update modification'
        throw e
      }
    },

    // Delete modification
    async deleteModification(tableId: string, modId: string) {
      try {
        await $fetch(`/api/encounter-tables/${tableId}/modifications/${modId}`, {
          method: 'DELETE'
        })
        // Update local state
        const table = this.tables.find(t => t.id === tableId)
        if (table) {
          table.modifications = table.modifications.filter(m => m.id !== modId)
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to delete modification'
        throw e
      }
    },

    // Add entry to modification
    async addModificationEntry(tableId: string, modId: string, data: {
      speciesName: string
      weight?: number
      remove?: boolean
      levelRange?: LevelRange
    }): Promise<ModificationEntry> {
      try {
        const response = await $fetch<{ data: ModificationEntry }>(`/api/encounter-tables/${tableId}/modifications/${modId}/entries`, {
          method: 'POST',
          body: data
        })
        // Reload table to get updated data
        await this.loadTable(tableId)
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to add modification entry'
        throw e
      }
    },

    // Remove entry from modification
    async removeModificationEntry(tableId: string, modId: string, entryId: string) {
      try {
        await $fetch(`/api/encounter-tables/${tableId}/modifications/${modId}/entries/${entryId}`, {
          method: 'DELETE'
        })
        // Update local state
        const table = this.tables.find(t => t.id === tableId)
        if (table) {
          const mod = table.modifications.find(m => m.id === modId)
          if (mod) {
            mod.entries = mod.entries.filter(e => e.id !== entryId)
          }
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to remove modification entry'
        throw e
      }
    },

    // Generate wild Pokemon from table
    async generateFromTable(tableId: string, options: {
      count: number
      modificationId?: string
      levelRange?: LevelRange
    }): Promise<{
      generated: Array<{
        speciesId: string
        speciesName: string
        level: number
        weight: number
        source: 'parent' | 'modification'
      }>
      meta: {
        tableId: string
        tableName: string
        modificationId: string | null
        levelRange: LevelRange
        density: DensityTier
        spawnCount: number
        totalPoolSize: number
        totalWeight: number
      }
    }> {
      try {
        const response = await $fetch<{
          data: {
            generated: Array<{
              speciesId: string
              speciesName: string
              level: number
              weight: number
              source: 'parent' | 'modification'
            }>
            meta: {
              tableId: string
              tableName: string
              modificationId: string | null
              levelRange: LevelRange
              density: DensityTier
              spawnCount: number
              totalPoolSize: number
              totalWeight: number
            }
          }
        }>(`/api/encounter-tables/${tableId}/generate`, {
          method: 'POST',
          body: {
            count: options.count,
            modificationId: options.modificationId,
            levelRange: options.levelRange
          }
        })
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to generate encounter'
        throw e
      }
    },

    // Select table
    selectTable(id: string | null) {
      this.selectedTableId = id
    },

    // Update filters
    setFilters(filters: Partial<EncounterTablesState['filters']>) {
      this.filters = { ...this.filters, ...filters }
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        search: '',
        sortBy: 'name',
        sortOrder: 'asc'
      }
    },

    // Export table as JSON
    async exportTable(tableId: string): Promise<void> {
      try {
        // Trigger download via direct navigation
        window.location.href = `/api/encounter-tables/${tableId}/export`
      } catch (e: any) {
        this.error = e.message || 'Failed to export table'
        throw e
      }
    },

    // Import table from JSON
    async importTable(jsonData: unknown): Promise<{ table: EncounterTable; warnings: string | null }> {
      try {
        const response = await $fetch<{
          data: EncounterTable
          warnings: string | null
        }>('/api/encounter-tables/import', {
          method: 'POST',
          body: jsonData as Record<string, unknown>
        })
        // Add to local state
        this.tables.push(response.data)
        return { table: response.data, warnings: response.warnings }
      } catch (e: any) {
        this.error = e.message || 'Failed to import table'
        throw e
      }
    }
  }
})
