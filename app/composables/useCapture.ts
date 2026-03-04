import type { StatusCondition } from '~/types'
import { calculateCaptureRate, getCaptureDescription } from '~/utils/captureRate'
// Note: calculateAccuracyThreshold is NOT used here. The threshold is computed
// inline (single expression) to match useMoveCalculation.ts — see rollAccuracyCheck.
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

/**
 * Parameters for Poke Ball accuracy check.
 * Per decree-042: Poke Ball throws use the full accuracy system —
 * thrower accuracy stages, target Speed Evasion, flanking, rough terrain.
 */
export interface CaptureAccuracyParams {
  /** Thrower's accuracy combat stage (-6 to +6). Default 0. */
  throwerAccuracyStage?: number
  /** Target Pokemon's total Speed Evasion (stat-derived + bonus evasion).
   *  Capped at 9 inside rollAccuracyCheck per PTU p.234. Default 0. */
  targetSpeedEvasion?: number
  /** Flanking penalty applied to target evasion (PTU p.232). Default 0. */
  flankingPenalty?: number
  /** Rough terrain penalty added to threshold (PTU p.231). Default 0. */
  roughTerrainPenalty?: number
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
  postCaptureEffect?: {
    type: string
    description: string
  }
  reason?: string
}

export function useCapture() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)

  /**
   * Get the capture rate for a Pokemon by ID, with optional ball type and condition context.
   * When encounterId/trainerId are provided, the server auto-populates full ball condition
   * context (encounter round, active Pokemon, species ownership, etc.).
   */
  async function getCaptureRate(
    pokemonId: string,
    ballType: string = DEFAULT_BALL_TYPE,
    conditionContext?: Partial<BallConditionContext>,
    encounterId?: string,
    trainerId?: string
  ): Promise<CaptureRateData | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureRateData }>('/api/capture/rate', {
        method: 'POST',
        body: { pokemonId, ballType, conditionContext, encounterId, trainerId }
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
   * When conditionContext is provided, it is passed to calculateBallModifier
   * so conditional ball modifiers (Timer Ball rounds, Level Ball comparison, etc.)
   * are reflected in the preview.
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
    conditionContext?: Partial<BallConditionContext>
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
    const ballResult = calculateBallModifier(ballType, params.conditionContext)
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
    /** Accuracy threshold computed by rollAccuracyCheck (decree-042). Sent to server for validation. */
    accuracyThreshold?: number
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
          accuracyThreshold: params.accuracyThreshold,
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
   * Roll accuracy check for throwing a Poke Ball.
   * PTU p.214: AC 6 Status Attack Roll.
   * PTU ch9 p.271: "Resolve the attack like you would any other."
   * Per decree-042: Full accuracy system applies — accuracy stages, Speed Evasion,
   * flanking penalty, rough terrain penalty.
   *
   * Threshold is computed inline as a single expression — matching the formula
   * in useMoveCalculation.ts:416 — to avoid double Math.max(1,...) clamping that
   * would occur if calculateAccuracyThreshold (which clamps internally) were
   * called and then flanking/rough terrain adjustments were clamped again.
   *
   * Natural 1 always misses. Natural 20 always hits.
   */
  function rollAccuracyCheck(params?: CaptureAccuracyParams): {
    roll: number
    isNat1: boolean
    isNat20: boolean
    hits: boolean
    threshold: number
  } {
    const accuracyStage = params?.throwerAccuracyStage ?? 0
    const speedEvasion = params?.targetSpeedEvasion ?? 0
    const flankingPenalty = params?.flankingPenalty ?? 0
    const roughTerrainPenalty = params?.roughTerrainPenalty ?? 0

    // Single-expression threshold matching useMoveCalculation.ts:416.
    // Poke Ball AC = 6. Evasion capped at 9 (PTU p.234).
    // Flanking reduces effective evasion (decree-040: applied after evasion cap).
    // Rough terrain adds to threshold (PTU p.231).
    const effectiveEvasion = Math.min(9, speedEvasion)
    const threshold = Math.max(1, 6 + effectiveEvasion - accuracyStage - flankingPenalty + roughTerrainPenalty)

    const roll = Math.floor(Math.random() * 20) + 1
    const isNat1 = roll === 1
    const isNat20 = roll === 20

    // PTU: Natural 1 always misses, Natural 20 always hits, otherwise roll >= threshold
    const hits = isNat1 ? false : (isNat20 ? true : roll >= threshold)

    return {
      roll,
      isNat1,
      isNat20,
      hits,
      threshold,
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
