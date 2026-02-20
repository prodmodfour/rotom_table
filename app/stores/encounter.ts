import { defineStore } from 'pinia'
import type { Encounter, Combatant, MoveLogEntry, CombatSide, TurnPhase, BattleType } from '~/types'
import type { XpCalculationResult, XpApplicationResult } from '~/utils/experienceCalculation'

// History composable for undo/redo
let historyComposable: ReturnType<typeof useEncounterHistory> | null = null

const getHistory = () => {
  if (!historyComposable) {
    historyComposable = useEncounterHistory()
  }
  return historyComposable
}

export const useEncounterStore = defineStore('encounter', {
  state: () => ({
    encounter: null as Encounter | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isActive: (state) => state.encounter?.isActive ?? false,
    isPaused: (state) => state.encounter?.isPaused ?? false,
    isServed: (state) => state.encounter?.isServed ?? false,
    currentRound: (state) => state.encounter?.currentRound ?? 0,
    sceneNumber: (state) => state.encounter?.sceneNumber ?? 1,

    // Battle type
    battleType: (state): BattleType => state.encounter?.battleType ?? 'full_contact',
    isLeagueBattle: (state): boolean => state.encounter?.battleType === 'trainer',

    // PTU Turn Phase (for League battles)
    currentPhase: (state): TurnPhase => state.encounter?.currentPhase ?? 'pokemon',

    combatantsByInitiative: (state): Combatant[] => {
      if (!state.encounter) return []
      const order = state.encounter.turnOrder
      // If turnOrder exists, use it; otherwise sort combatants by initiative (descending)
      if (order.length > 0) {
        return order.map(id => state.encounter!.combatants.find(c => c.id === id)).filter(Boolean) as Combatant[]
      }
      // Fallback: sort by initiative descending
      return [...state.encounter.combatants].sort((a, b) => b.initiative - a.initiative)
    },

    // League Battle: Trainer turn order (low speed to high for declarations)
    trainersByTurnOrder: (state): Combatant[] => {
      if (!state.encounter) return []
      const order = state.encounter.trainerTurnOrder ?? []
      return order.map(id => state.encounter!.combatants.find(c => c.id === id)).filter(Boolean) as Combatant[]
    },

    // League Battle: Pokemon turn order (high speed to low for actions)
    pokemonByTurnOrder: (state): Combatant[] => {
      if (!state.encounter) return []
      const order = state.encounter.pokemonTurnOrder ?? []
      return order.map(id => state.encounter!.combatants.find(c => c.id === id)).filter(Boolean) as Combatant[]
    },

    currentCombatant: (state): Combatant | null => {
      if (!state.encounter || state.encounter.turnOrder.length === 0) return null
      const currentId = state.encounter.turnOrder[state.encounter.currentTurnIndex]
      return state.encounter.combatants.find(c => c.id === currentId) ?? null
    },

    playerCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.side === 'players') ?? []
    },

    allyCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.side === 'allies') ?? []
    },

    enemyCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.side === 'enemies') ?? []
    },

    // Get combatants with injuries
    injuredCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.injuries.count > 0) ?? []
    },

    // Get combatants who can still act this turn (have remaining actions)
    combatantsWithActions: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => {
        const ts = c.turnState
        return !ts.hasActed || !ts.standardActionUsed || !ts.shiftActionUsed || !ts.swiftActionUsed
      }) ?? []
    },

    moveLog: (state): MoveLogEntry[] => {
      return state.encounter?.moveLog ?? []
    },
  },

  actions: {
    // Load encounter from API
    async loadEncounter(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${id}`)
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load encounter'
      } finally {
        this.loading = false
      }
    },

    // Create new encounter
    async createEncounter(name: string, battleType: 'trainer' | 'full_contact', weather?: string | null) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>('/api/encounters', {
          method: 'POST',
          body: { name, battleType, weather }
        })
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter'
        throw e
      } finally {
        this.loading = false
      }
    },

    // Create encounter from scene data
    async createFromScene(sceneId: string, battleType: 'trainer' | 'full_contact') {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>('/api/encounters/from-scene', {
          method: 'POST',
          body: { sceneId, battleType }
        })
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter from scene'
        throw e
      } finally {
        this.loading = false
      }
    },

    // Create encounter from template
    async loadFromTemplate(templateId: string, encounterName?: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounter-templates/${templateId}/load`, {
          method: 'POST',
          body: encounterName ? { name: encounterName } : {}
        })
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter from template'
        throw e
      } finally {
        this.loading = false
      }
    },

    // Add combatant to encounter
    async addCombatant(
      entityId: string,
      entityType: 'pokemon' | 'human',
      side: CombatSide,
      initiativeBonus: number = 0
    ) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/combatants`, {
          method: 'POST',
          body: { entityId, entityType, side, initiativeBonus }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to add combatant'
        throw e
      }
    },

    // Remove combatant from encounter
    async removeCombatant(combatantId: string) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/combatants/${combatantId}`, {
          method: 'DELETE'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to remove combatant'
        throw e
      }
    },

    // Clear encounter after ending
    async endAndClear() {
      if (!this.encounter) return

      try {
        await this.endEncounter()
        this.encounter = null
      } catch (e: any) {
        this.error = e.message || 'Failed to end encounter'
        throw e
      }
    },

    // Start encounter (sort initiative)
    async startEncounter() {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/start`, {
          method: 'POST'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to start encounter'
        throw e
      }
    },

    // Next turn
    async nextTurn() {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/next-turn`, {
          method: 'POST'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to advance turn'
        throw e
      }
    },

    // Execute move
    async executeMove(
      actorId: string,
      moveId: string,
      targetIds: string[],
      damage?: number,
      targetDamages?: Record<string, number>,
      notes?: string
    ) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/move`, {
          method: 'POST',
          body: { actorId, moveId, targetIds, damage, targetDamages, notes }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to execute move'
        throw e
      }
    },

    // Apply damage to combatant
    async applyDamage(combatantId: string, damage: number) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/damage`, {
          method: 'POST',
          body: { combatantId, damage }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to apply damage'
        throw e
      }
    },

    // Heal combatant (supports HP, temp HP, and injury healing)
    async healCombatant(
      combatantId: string,
      amount: number = 0,
      tempHp: number = 0,
      healInjuries: number = 0
    ) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/heal`, {
          method: 'POST',
          body: { combatantId, amount, tempHp, healInjuries }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to heal combatant'
        throw e
      }
    },

    // Set ready action
    async setReadyAction(combatantId: string, readyAction: string) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/ready`, {
          method: 'POST',
          body: { combatantId, readyAction }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to set ready action'
        throw e
      }
    },

    // End encounter
    async endEncounter() {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/end`, {
          method: 'POST'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to end encounter'
        throw e
      }
    },

    // Update encounter from websocket
    // Uses surgical updates to prevent full reactivity cascade
    updateFromWebSocket(data: Encounter) {
      if (!this.encounter) {
        this.encounter = data
        return
      }

      // Update top-level properties (preserve existing if incoming is undefined)
      this.encounter.name = data.name ?? this.encounter.name
      this.encounter.battleType = data.battleType ?? this.encounter.battleType
      if (data.weather !== undefined) {
        this.encounter.weather = data.weather
      }
      if (data.weatherDuration !== undefined) {
        this.encounter.weatherDuration = data.weatherDuration
      }
      if (data.weatherSource !== undefined) {
        this.encounter.weatherSource = data.weatherSource
      }
      this.encounter.currentRound = data.currentRound ?? this.encounter.currentRound
      this.encounter.currentTurnIndex = data.currentTurnIndex ?? this.encounter.currentTurnIndex
      this.encounter.isPaused = data.isPaused ?? this.encounter.isPaused
      // League battle phase tracking
      this.encounter.currentPhase = data.currentPhase ?? this.encounter.currentPhase
      this.encounter.turnOrder = data.turnOrder ?? this.encounter.turnOrder
      this.encounter.trainerTurnOrder = data.trainerTurnOrder ?? this.encounter.trainerTurnOrder
      this.encounter.pokemonTurnOrder = data.pokemonTurnOrder ?? this.encounter.pokemonTurnOrder
      // Critical: preserve isServed if not in incoming data
      if (data.isServed !== undefined) {
        this.encounter.isServed = data.isServed
      }
      this.encounter.moveLog = data.moveLog ?? this.encounter.moveLog
      if (data.gridConfig !== undefined) {
        this.encounter.gridConfig = data.gridConfig
      }

      // Surgically update combatants to preserve reactivity
      for (const incomingCombatant of data.combatants) {
        const existingIndex = this.encounter.combatants.findIndex(c => c.id === incomingCombatant.id)
        if (existingIndex !== -1) {
          // Update existing combatant in place
          const existing = this.encounter.combatants[existingIndex]
          existing.initiative = incomingCombatant.initiative
          existing.side = incomingCombatant.side
          existing.position = incomingCombatant.position
          existing.turnState = incomingCombatant.turnState
          // Update entity properties
          Object.assign(existing.entity, incomingCombatant.entity)
        } else {
          // New combatant - add it
          this.encounter.combatants.push(incomingCombatant)
        }
      }

      // Remove combatants that no longer exist
      const incomingIds = new Set(data.combatants.map(c => c.id))
      this.encounter.combatants = this.encounter.combatants.filter(c => incomingIds.has(c.id))
    },

    // Clear encounter
    clearEncounter() {
      this.encounter = null
      this.error = null
    },

    // ===========================================
    // Serve/Unserve Actions (Group View)
    // ===========================================

    // Serve encounter to Group View
    async serveEncounter() {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/serve`, {
          method: 'POST'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to serve encounter'
        throw e
      }
    },

    // Unserve encounter from Group View
    async unserveEncounter() {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/unserve`, {
          method: 'POST'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to unserve encounter'
        throw e
      }
    },

    // Load served encounter (for Group View)
    async loadServedEncounter() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter | null }>('/api/encounters/served')
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load served encounter'
        return null
      } finally {
        this.loading = false
      }
    },

    // ===========================================
    // Undo/Redo Actions
    // ===========================================

    // Capture current state before an action (GM only)
    captureSnapshot(actionName: string) {
      if (this.encounter) {
        const history = getHistory()
        history.pushSnapshot(actionName, this.encounter)
      }
    },

    // Undo last action
    async undoAction() {
      const history = getHistory()
      if (!history.canUndo.value || !this.encounter) return false

      const previousState = history.undo()
      if (!previousState) return false

      try {
        // Sync to database
        await $fetch(`/api/encounters/${this.encounter.id}` as string, {
          method: 'PUT',
          body: previousState
        } as any)
        this.encounter = previousState
        return true
      } catch (e: any) {
        this.error = e.message || 'Failed to undo action'
        // Restore the redo state since we failed
        history.redo()
        return false
      }
    },

    // Redo previously undone action
    async redoAction() {
      const history = getHistory()
      if (!history.canRedo.value || !this.encounter) return false

      const nextState = history.redo()
      if (!nextState) return false

      try {
        // Sync to database
        await $fetch(`/api/encounters/${this.encounter.id}` as string, {
          method: 'PUT',
          body: nextState
        } as any)
        this.encounter = nextState
        return true
      } catch (e: any) {
        this.error = e.message || 'Failed to redo action'
        // Restore the previous state since we failed
        history.undo()
        return false
      }
    },

    // Get undo/redo state
    getUndoRedoState() {
      const history = getHistory()
      return {
        canUndo: history.canUndo.value,
        canRedo: history.canRedo.value,
        lastActionName: history.lastActionName.value,
        nextActionName: history.nextActionName.value
      }
    },

    // Initialize history when encounter loads
    initializeHistory() {
      if (this.encounter) {
        const history = getHistory()
        history.initializeHistory(this.encounter)
      }
    },

    // ===========================================
    // PTU Turn State Actions
    // ===========================================

    // Use an action for a combatant (standard, shift, or swift)
    async useAction(combatantId: string, actionType: 'standard' | 'shift' | 'swift') {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/action`, {
          method: 'POST',
          body: { combatantId, actionType }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || `Failed to use ${actionType} action`
        throw e
      }
    },

    // ===========================================
    // Weather Management
    // ===========================================

    // Set weather on encounter with PTU duration tracking
    async setWeather(
      weather: string | null,
      source: 'move' | 'ability' | 'manual' = 'manual',
      duration?: number
    ) {
      if (!this.encounter) return

      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/weather`, {
          method: 'POST',
          body: { weather, source, duration }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to set weather'
        throw e
      }
    },

    // ===========================================
    // Wild Pokemon Spawning (From Encounter Tables)
    // ===========================================

    // Add wild Pokemon to encounter from generated data
    async addWildPokemon(
      pokemon: Array<{ speciesId?: string; speciesName: string; level: number }>,
      side: CombatSide = 'enemies'
    ): Promise<Array<{ pokemonId: string; combatantId: string; species: string; level: number }>> {
      if (!this.encounter) {
        throw new Error('No active encounter')
      }

      try {
        const response = await $fetch<{
          data: {
            encounter: Encounter
            addedPokemon: Array<{ pokemonId: string; combatantId: string; species: string; level: number }>
          }
        }>(`/api/encounters/${this.encounter.id}/wild-spawn`, {
          method: 'POST',
          body: { pokemon, side }
        })
        this.encounter = response.data.encounter
        return response.data.addedPokemon
      } catch (e: any) {
        this.error = e.message || 'Failed to add wild Pokemon'
        throw e
      }
    },

    // ===========================================
    // XP Distribution Actions
    // ===========================================

    /** Preview XP calculation for current encounter */
    async calculateXp(params: {
      significanceMultiplier: number
      playerCount: number
      isBossEncounter?: boolean
      trainerEnemyIds?: string[]
    }): Promise<{
      totalXpPerPlayer: number
      breakdown: XpCalculationResult['breakdown']
      participatingPokemon: Array<{
        id: string
        species: string
        nickname: string | null
        currentLevel: number
        currentExperience: number
        ownerId: string | null
        ownerName: string | null
      }>
    }> {
      if (!this.encounter) {
        throw new Error('No active encounter')
      }

      const response = await $fetch<{
        success: boolean
        data: {
          totalXpPerPlayer: number
          breakdown: XpCalculationResult['breakdown']
          participatingPokemon: Array<{
            id: string
            species: string
            nickname: string | null
            currentLevel: number
            currentExperience: number
            ownerId: string | null
            ownerName: string | null
          }>
        }
      }>(`/api/encounters/${this.encounter.id}/xp-calculate`, {
        method: 'POST',
        body: params
      })

      return response.data
    },

    /** Distribute XP to Pokemon after GM approval */
    async distributeXp(params: {
      significanceMultiplier: number
      playerCount: number
      isBossEncounter?: boolean
      trainerEnemyIds?: string[]
      distribution: Array<{ pokemonId: string; xpAmount: number }>
    }): Promise<{
      results: XpApplicationResult[]
      totalXpDistributed: number
    }> {
      if (!this.encounter) {
        throw new Error('No active encounter')
      }

      const response = await $fetch<{
        success: boolean
        data: {
          results: XpApplicationResult[]
          totalXpDistributed: number
        }
      }>(`/api/encounters/${this.encounter.id}/xp-distribute`, {
        method: 'POST',
        body: params
      })

      return response.data
    },

  }
})
