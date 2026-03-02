import type { StatusCondition } from '~/types'
import { calculateCaptureRate, getCaptureDescription } from '~/utils/captureRate'
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'
import type { PokeBallDef, BallConditionContext } from '~/constants/pokeBalls'

export interface BallBreakdown {
  baseModifier: number
  conditionalModifier: number
  conditionMet: boolean
  conditionDescription?: string
}

export interface CaptureRateData {
  species: string
  level: number
  currentHp: number
  maxHp: number
  captureRate: number
  difficulty: string
  canBeCaptured: boolean
  hpPercentage: number
  breakdown: {
    base: number
    levelModifier: number
    hpModifier: number
    evolutionModifier: number
    shinyModifier: number
    legendaryModifier: number
    statusModifier: number
    injuryModifier: number
    stuckModifier: number
    slowModifier: number
  }
  ballType: string
  ballModifier: number
  ballBreakdown: BallBreakdown
}

export interface CaptureAttemptResult {
  captured: boolean
  roll: number
  modifiedRoll: number
  captureRate: number
  effectiveCaptureRate: number
  naturalHundred: boolean
  criticalHit: boolean
  trainerLevel: number
  modifiers: number
  ballModifier: number
  ballType: string
  difficulty: string
  breakdown: CaptureRateData['breakdown']
  ballBreakdown: BallBreakdown
  pokemon: {
    id: string
    species: string
    level: number
    currentHp: number
    maxHp: number
    hpPercentage: number
  }
  trainer: {
    id: string
    name: string
    level: number
  }
  reason?: string
}

export function useCapture() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)

  /**
   * Get the capture rate for a Pokemon by ID, with optional ball type and condition context.
   */
  async function getCaptureRate(
    pokemonId: string,
    ballType: string = DEFAULT_BALL_TYPE,
    conditionContext?: Partial<BallConditionContext>
  ): Promise<CaptureRateData | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureRateData }>('/api/capture/rate', {
        method: 'POST',
        body: { pokemonId, ballType, conditionContext }
      })

      if (response.success) {
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Failed to get capture rate'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Calculate capture rate from provided data (no API call), with ball modifier.
   */
  function calculateCaptureRateLocal(params: {
    level: number
    currentHp: number
    maxHp: number
    evolutionStage?: number
    maxEvolutionStage?: number
    statusConditions?: StatusCondition[]
    injuries?: number
    isShiny?: boolean
    isLegendary?: boolean
    ballType?: string
  }): CaptureRateData {
    const result = calculateCaptureRate({
      level: params.level,
      currentHp: params.currentHp,
      maxHp: params.maxHp,
      evolutionStage: params.evolutionStage ?? 1,
      maxEvolutionStage: params.maxEvolutionStage ?? 3,
      statusConditions: params.statusConditions ?? [],
      injuries: params.injuries ?? 0,
      isShiny: params.isShiny ?? false,
      isLegendary: params.isLegendary ?? false
    })

    const ballType = params.ballType || DEFAULT_BALL_TYPE
    const ballResult = calculateBallModifier(ballType)
    const ballDef = POKE_BALL_CATALOG[ballType]

    return {
      species: '',
      level: params.level,
      currentHp: params.currentHp,
      maxHp: params.maxHp,
      captureRate: result.captureRate,
      difficulty: getCaptureDescription(result.captureRate),
      canBeCaptured: result.canBeCaptured,
      hpPercentage: Math.round(result.hpPercentage),
      breakdown: result.breakdown,
      ballType,
      ballModifier: ballResult.total,
      ballBreakdown: {
        baseModifier: ballResult.base,
        conditionalModifier: ballResult.conditional,
        conditionMet: ballResult.conditionMet,
        conditionDescription: ballDef?.conditionDescription,
      }
    }
  }

  /**
   * Attempt to capture a Pokemon with a specific ball type.
   * Per PTU Core (p227): Throwing a Poke Ball is a Standard Action.
   * When encounterContext is provided, consumes the trainer's Standard Action.
   */
  async function attemptCapture(params: {
    pokemonId: string
    trainerId: string
    accuracyRoll?: number
    ballType?: string
    modifiers?: number
    /** GM overrides for ball condition context */
    conditionContext?: Partial<BallConditionContext>
    encounterContext?: {
      encounterId: string
      trainerCombatantId: string
    }
  }): Promise<CaptureAttemptResult | null> {
    loading.value = true
    error.value = null
    warning.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureAttemptResult }>('/api/capture/attempt', {
        method: 'POST',
        body: {
          pokemonId: params.pokemonId,
          trainerId: params.trainerId,
          accuracyRoll: params.accuracyRoll,
          ballType: params.ballType || DEFAULT_BALL_TYPE,
          modifiers: params.modifiers,
          encounterId: params.encounterContext?.encounterId,
          conditionContext: params.conditionContext,
        }
      })

      if (response.success) {
        // Consume the trainer's Standard Action if in an encounter
        if (params.encounterContext) {
          const { encounterId, trainerCombatantId } = params.encounterContext
          try {
            await $fetch(`/api/encounters/${encounterId}/action`, {
              method: 'POST',
              body: {
                combatantId: trainerCombatantId,
                actionType: 'standard'
              }
            })
          } catch (actionError: any) {
            warning.value = 'Capture succeeded but standard action was not consumed — please adjust action economy manually'
          }
        }
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Failed to attempt capture'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all available ball types for the selection UI.
   * Safari balls are excluded by default (restricted use).
   */
  function getAvailableBalls(includeSafari: boolean = false): PokeBallDef[] {
    return Object.values(POKE_BALL_CATALOG)
      .filter(ball => includeSafari || ball.category !== 'safari')
  }

  /**
   * Roll accuracy check for throwing a Poke Ball
   * AC 6, range = 4 + Athletics rank
   */
  function rollAccuracyCheck(): { roll: number; isNat20: boolean; total: number } {
    const roll = Math.floor(Math.random() * 20) + 1
    return {
      roll,
      isNat20: roll === 20,
      total: roll // Add trainer's accuracy modifiers if needed
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    warning: readonly(warning),
    getCaptureRate,
    calculateCaptureRateLocal,
    attemptCapture,
    rollAccuracyCheck,
    getAvailableBalls,
  }
}
