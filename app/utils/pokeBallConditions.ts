/**
 * PTU 1.05 Poke Ball Conditional Modifier Evaluators
 *
 * Pure function module containing the condition evaluator for each ball type.
 * Every condition function is a pure function with no side effects, taking a
 * Partial<BallConditionContext> and returning a modifier + metadata.
 *
 * Ball types with conditional logic (13 total):
 * - Round-dependent: Timer Ball, Quick Ball
 * - Stat-comparison: Level Ball, Heavy Ball, Fast Ball
 * - Context-dependent: Love Ball, Net Ball, Dusk Ball, Moon Ball,
 *                      Lure Ball, Repeat Ball, Nest Ball, Dive Ball
 */

import type { BallConditionContext } from '~/constants/pokeBalls'

export interface BallConditionResult {
  /** Additional modifier to add to the base ball modifier */
  modifier: number
  /** Whether the ball's condition was met */
  conditionMet: boolean
  /** Human-readable description of the evaluation result */
  description?: string
}

// ============================================
// ROUND-DEPENDENT BALLS
// ============================================

/**
 * Timer Ball: Gets better over time.
 * PTU p.272: "+5. -5 to the Modifier after every round since the beginning
 * of the encounter, until the Modifier is -20."
 *
 * Base: +5 (in catalog)
 * Conditional: -5 per round elapsed since encounter start.
 * Total modifier = 5 - (5 * roundsElapsed), capped at -20 total.
 *
 * Round 1: conditional = 0 (no rounds elapsed) -> total = +5
 * Round 2: conditional = -5 -> total = 0
 * Round 3: conditional = -10 -> total = -5
 * Round 4: conditional = -15 -> total = -10
 * Round 5: conditional = -20 -> total = -15
 * Round 6+: conditional = -25 -> total = -20 (capped)
 *
 * Cap: total modifier cannot go below -20.
 * Since base is +5, conditional cap = -25 (so total = +5 + (-25) = -20).
 */
function evaluateTimerBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const round = context.encounterRound ?? 1
  const roundsElapsed = Math.max(0, round - 1)
  const rawConditional = -(5 * roundsElapsed)
  // Total = base(+5) + conditional. Cap total at -20.
  // So conditional must be capped at -25 (since +5 + (-25) = -20).
  const conditional = Math.max(-25, rawConditional)
  const conditionMet = roundsElapsed > 0

  return {
    modifier: conditional,
    conditionMet,
    description: conditionMet
      ? `Timer Ball: ${roundsElapsed} round${roundsElapsed !== 1 ? 's' : ''} elapsed (${conditional >= 0 ? '+' : ''}${conditional} conditional)`
      : 'Timer Ball: round 1 (no bonus yet)',
  }
}

/**
 * Quick Ball: Best on round 1, degrades over time.
 * PTU p.273: "-20. +5 to Modifier after 1 round of the encounter,
 * +10 to Modifier after round 2, +20 to modifier after round 3."
 *
 * Base: -20 (in catalog)
 * Conditional (cumulative additions to the base):
 *   Round 1: +0 -> total = -20
 *   Round 2 (after round 1): +5 -> total = -15
 *   Round 3 (after round 2): +10 -> total = -10
 *   Round 4+ (after round 3): +20 -> total = 0
 */
function evaluateQuickBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const round = context.encounterRound ?? 1

  let conditional: number
  if (round <= 1) {
    conditional = 0       // Best: total = -20
  } else if (round === 2) {
    conditional = 5       // total = -15
  } else if (round === 3) {
    conditional = 10      // total = -10
  } else {
    conditional = 20      // total = 0
  }

  const conditionMet = round > 1

  return {
    modifier: conditional,
    conditionMet,
    description: conditionMet
      ? `Quick Ball: round ${round} (+${conditional} degradation, total effective: ${-20 + conditional})`
      : 'Quick Ball: round 1 (maximum bonus, -20)',
  }
}

// ============================================
// STAT-COMPARISON BALLS
// ============================================

/**
 * Level Ball: -20 if target level < half of user's active Pokemon level.
 * PTU p.272: "-20 Modifier if the target is under half the level
 * your active Pokemon is."
 * Requires: targetLevel, activePokemonLevel
 */
function evaluateLevelBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const targetLevel = context.targetLevel
  const activeLevel = context.activePokemonLevel

  if (targetLevel === undefined || activeLevel === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Level Ball: active Pokemon level not provided',
    }
  }

  const threshold = activeLevel / 2
  const conditionMet = targetLevel < threshold

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Level Ball: target level ${targetLevel} < ${threshold} (half of ${activeLevel})`
      : `Level Ball: target level ${targetLevel} >= ${threshold} (no bonus)`,
  }
}

/**
 * Heavy Ball: -5 per Weight Class above 1.
 * PTU p.272: "-5 Modifier for each Weight Class the target is above 1."
 * WC 1: +0, WC 2: -5, WC 3: -10, WC 4: -15, WC 5: -20, WC 6: -25
 * Requires: targetWeightClass
 */
function evaluateHeavyBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const wc = context.targetWeightClass

  if (wc === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Heavy Ball: target Weight Class not provided',
    }
  }

  const classesAboveOne = Math.max(0, wc - 1)
  const modifier = -(5 * classesAboveOne)
  const conditionMet = classesAboveOne > 0

  return {
    modifier,
    conditionMet,
    description: conditionMet
      ? `Heavy Ball: WC ${wc} (${classesAboveOne} above 1, ${modifier} modifier)`
      : `Heavy Ball: WC ${wc} (no bonus at WC 1)`,
  }
}

/**
 * Fast Ball: -20 if target's highest Movement Capability is above 7.
 * PTU p.272: "-20 Modifier if the target has a Movement Capability above 7."
 * Requires: targetMovementSpeed (highest movement value)
 */
function evaluateFastBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const speed = context.targetMovementSpeed

  if (speed === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Fast Ball: target Movement Capability not provided',
    }
  }

  const conditionMet = speed > 7

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Fast Ball: movement ${speed} > 7 (-20 modifier)`
      : `Fast Ball: movement ${speed} <= 7 (no bonus)`,
  }
}

// ============================================
// CONTEXT-DEPENDENT BALLS
// ============================================

/**
 * Love Ball: -30 if active Pokemon is same evo line + opposite gender.
 * PTU p.272: "-30 Modifier if the user has an active Pokemon that is of the
 * same evolutionary line as the target, and the opposite gender.
 * Does not work with genderless Pokemon."
 */
function evaluateLoveBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const targetGender = context.targetGender
  const activeGender = context.activePokemonGender
  const targetEvoLine = context.targetEvoLine ?? []
  const activeEvoLine = context.activePokemonEvoLine ?? []

  // Cannot work with genderless Pokemon
  if (!targetGender || !activeGender || targetGender === 'N' || activeGender === 'N') {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Love Ball: genderless Pokemon or gender data not available',
    }
  }

  // Opposite gender check
  const isOppositeGender = targetGender !== activeGender

  // Same evolutionary line check: any overlap between evo line species
  const targetLineSet = new Set(targetEvoLine.map(s => s.toLowerCase()))
  const sameEvoLine = activeEvoLine.some(s => targetLineSet.has(s.toLowerCase()))

  const conditionMet = isOppositeGender && sameEvoLine

  return {
    modifier: conditionMet ? -30 : 0,
    conditionMet,
    description: conditionMet
      ? 'Love Ball: same evo line + opposite gender (-30 modifier)'
      : `Love Ball: conditions not met (opposite gender: ${isOppositeGender}, same evo line: ${sameEvoLine})`,
  }
}

/**
 * Net Ball: -20 if target is Water or Bug type.
 * PTU p.272: "-20 Modifier, if the target is Water or Bug type."
 */
function evaluateNetBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const types = context.targetTypes ?? []
  const normalizedTypes = types.map(t => t.toLowerCase())
  const conditionMet = normalizedTypes.includes('water') || normalizedTypes.includes('bug')

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Net Ball: target is ${types.join('/')} type (-20 modifier)`
      : `Net Ball: target is ${types.join('/')} type (no bonus)`,
  }
}

/**
 * Dusk Ball: -20 in dark or low-light conditions.
 * PTU p.273: "-20 Modifier if it is dark, or if there is very little light out, when used."
 * GM-provided context flag.
 */
function evaluateDuskBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const conditionMet = context.isDarkOrLowLight === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Dusk Ball: dark/low-light conditions (-20 modifier)'
      : 'Dusk Ball: normal lighting (no bonus)',
  }
}

/**
 * Moon Ball: -20 if target evolves using an Evolution Stone.
 * PTU p.272: "-20 Modifier if the target evolves with an Evolution Stone."
 */
function evaluateMoonBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const conditionMet = context.targetEvolvesWithStone === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Moon Ball: target evolves with Evolution Stone (-20 modifier)'
      : 'Moon Ball: target does not evolve with Evolution Stone (no bonus)',
  }
}

/**
 * Lure Ball: -20 if target was baited with food.
 * PTU p.272: "-20 Modifier if the target was baited into the encounter with food."
 * GM-provided context flag.
 */
function evaluateLureBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const conditionMet = context.targetWasBaited === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Lure Ball: target was baited (-20 modifier)'
      : 'Lure Ball: target was not baited (no bonus)',
  }
}

/**
 * Repeat Ball: -20 if trainer already owns a Pokemon of the target's species.
 * PTU p.272: "-20 Modifier if you already own a Pokemon of the target's species."
 */
function evaluateRepeatBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const conditionMet = context.trainerOwnsSpecies === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Repeat Ball: trainer owns same species (-20 modifier)'
      : 'Repeat Ball: trainer does not own same species (no bonus)',
  }
}

/**
 * Nest Ball: -20 if target is under level 10.
 * PTU p.272: "-20 Modifier if the target is under level 10."
 */
function evaluateNestBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const level = context.targetLevel

  if (level === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Nest Ball: target level not provided',
    }
  }

  const conditionMet = level < 10

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Nest Ball: target level ${level} < 10 (-20 modifier)`
      : `Nest Ball: target level ${level} >= 10 (no bonus)`,
  }
}

/**
 * Dive Ball: -20 if target was found underwater or underground.
 * PTU p.272: "-20 Modifier, if the target was found underwater or underground."
 * GM-provided context flag.
 */
function evaluateDiveBall(
  context: Partial<BallConditionContext>
): BallConditionResult {
  const conditionMet = context.isUnderwaterOrUnderground === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Dive Ball: underwater/underground encounter (-20 modifier)'
      : 'Dive Ball: surface encounter (no bonus)',
  }
}

// ============================================
// EVALUATOR REGISTRY
// ============================================

/**
 * Registry of per-ball condition evaluators.
 * Each entry maps a ball name to its condition function.
 */
const BALL_CONDITION_EVALUATORS: Record<
  string,
  (context: Partial<BallConditionContext>) => BallConditionResult
> = {
  'Timer Ball': evaluateTimerBall,
  'Quick Ball': evaluateQuickBall,
  'Level Ball': evaluateLevelBall,
  'Heavy Ball': evaluateHeavyBall,
  'Fast Ball': evaluateFastBall,
  'Love Ball': evaluateLoveBall,
  'Net Ball': evaluateNetBall,
  'Dusk Ball': evaluateDuskBall,
  'Moon Ball': evaluateMoonBall,
  'Lure Ball': evaluateLureBall,
  'Repeat Ball': evaluateRepeatBall,
  'Nest Ball': evaluateNestBall,
  'Dive Ball': evaluateDiveBall,
}

/**
 * Evaluate the conditional modifier for a given ball type.
 * Returns modifier: 0 if no condition function exists or conditions are not met.
 *
 * Each ball's condition is a pure function: (context) => BallConditionResult.
 * Negative modifier = easier capture. Positive = harder.
 */
export function evaluateBallCondition(
  ballName: string,
  context: Partial<BallConditionContext>
): BallConditionResult {
  const evaluator = BALL_CONDITION_EVALUATORS[ballName]
  if (!evaluator) {
    return { modifier: 0, conditionMet: false }
  }
  return evaluator(context)
}
