/**
 * Composable for trainer XP operations.
 * Wraps API calls with reactive state and level-up detection.
 *
 * Usage:
 *   const composable = useTrainerXp()
 *   const result = await composable.awardXp(characterId, 3, 'Encounter reward')
 *   // Check composable.pendingLevelUp.value to open LevelUpModal
 */

import type { TrainerXpResult } from '~/utils/trainerExperience'

export function useTrainerXp() {
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<TrainerXpResult | null>(null)
  const pendingLevelUp = ref<{
    oldLevel: number
    newLevel: number
    milestoneLevelsCrossed: number[]
  } | null>(null)

  /**
   * Award XP to a trainer. Returns the result including any level changes.
   * Caller is responsible for refreshing character data and handling level-ups.
   */
  async function awardXp(
    characterId: string,
    amount: number,
    reason?: string
  ): Promise<TrainerXpResult> {
    isProcessing.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        data: TrainerXpResult & { character: unknown }
      }>(`/api/characters/${characterId}/xp`, {
        method: 'POST',
        body: { amount, reason }
      })

      const result: TrainerXpResult = {
        previousXp: response.data.previousXp,
        previousLevel: response.data.previousLevel,
        xpAdded: response.data.xpAdded,
        newXp: response.data.newXp,
        newLevel: response.data.newLevel,
        levelsGained: response.data.levelsGained
      }

      lastResult.value = result

      // If levels were gained, set pending level-up for parent to handle
      if (result.levelsGained > 0) {
        pendingLevelUp.value = {
          oldLevel: result.previousLevel,
          newLevel: result.newLevel,
          milestoneLevelsCrossed: result.milestoneLevelsCrossed
        }
      }

      return result
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to award XP'
      error.value = message
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Deduct XP from a trainer. Cannot go below 0.
   */
  async function deductXp(
    characterId: string,
    amount: number,
    reason?: string
  ): Promise<TrainerXpResult> {
    return awardXp(characterId, -Math.abs(amount), reason)
  }

  /**
   * Clear the pending level-up after it has been handled (e.g., modal closed).
   */
  function clearPendingLevelUp(): void {
    pendingLevelUp.value = null
  }

  return {
    isProcessing: readonly(isProcessing),
    error: readonly(error),
    lastResult: readonly(lastResult),
    pendingLevelUp: readonly(pendingLevelUp),
    awardXp,
    deductXp,
    clearPendingLevelUp
  }
}
