import { defineStore } from 'pinia'
import type { XpCalculationResult, XpApplicationResult } from '~/utils/experienceCalculation'

/** Result from batch trainer XP distribution */
export interface TrainerXpDistributionResult {
  characterId: string
  characterName: string
  previousXp: number
  previousLevel: number
  newXp: number
  newLevel: number
  levelsGained: number
}

/**
 * Store for XP calculation and distribution actions.
 * Extracted from encounter.ts to keep file size under 800 lines.
 * Requires an active encounter in the encounter store.
 */
export const useEncounterXpStore = defineStore('encounterXp', {
  actions: {
    /** Preview XP calculation for current encounter */
    async calculateXp(params: {
      encounterId: string
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
      }>(`/api/encounters/${params.encounterId}/xp-calculate`, {
        method: 'POST',
        body: {
          significanceMultiplier: params.significanceMultiplier,
          playerCount: params.playerCount,
          isBossEncounter: params.isBossEncounter,
          trainerEnemyIds: params.trainerEnemyIds
        }
      })

      return response.data
    },

    /** Distribute XP to Pokemon after GM approval */
    async distributeXp(params: {
      encounterId: string
      significanceMultiplier: number
      playerCount: number
      isBossEncounter?: boolean
      trainerEnemyIds?: string[]
      distribution: Array<{ pokemonId: string; xpAmount: number }>
    }): Promise<{
      results: XpApplicationResult[]
      totalXpDistributed: number
    }> {
      const response = await $fetch<{
        success: boolean
        data: {
          results: XpApplicationResult[]
          totalXpDistributed: number
        }
      }>(`/api/encounters/${params.encounterId}/xp-distribute`, {
        method: 'POST',
        body: {
          significanceMultiplier: params.significanceMultiplier,
          playerCount: params.playerCount,
          isBossEncounter: params.isBossEncounter,
          trainerEnemyIds: params.trainerEnemyIds,
          distribution: params.distribution
        }
      })

      return response.data
    },

    /** Batch-distribute trainer XP to multiple trainers after an encounter */
    async distributeTrainerXp(params: {
      encounterId: string
      distribution: Array<{ characterId: string; xpAmount: number }>
    }): Promise<{
      results: TrainerXpDistributionResult[]
      totalXpDistributed: number
    }> {
      const response = await $fetch<{
        success: boolean
        data: {
          results: TrainerXpDistributionResult[]
          totalXpDistributed: number
        }
      }>(`/api/encounters/${params.encounterId}/trainer-xp-distribute`, {
        method: 'POST',
        body: { distribution: params.distribution }
      })

      return response.data
    }
  }
})
