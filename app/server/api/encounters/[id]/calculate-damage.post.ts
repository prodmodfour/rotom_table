/**
 * Calculate damage for a move using the full PTU 9-step formula.
 * Read-only endpoint — does not modify encounter state.
 *
 * Returns a detailed breakdown for test assertions and (future) UI display.
 */
import { loadEncounter, findCombatant } from '~/server/services/encounter.service'
import { calculateDamage, calculateEvasion, calculateAccuracyThreshold } from '~/utils/damageCalculation'
import { getEffectiveEquipmentBonuses, getEffectiveMoveList, isNoGuardActive } from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { ZERO_EVASION_CONDITIONS } from '~/constants/statusConditions'
import { checkFlankingMultiTile, FLANKING_EVASION_PENALTY } from '~/utils/flankingGeometry'
import { isEnemySide } from '~/utils/combatSides'
import {
  hasRiderFeature, calculateRunUpBonus, calculateOverrunModifiers,
  applyResistStep, isAoERange, isConquerorsMarchEligibleRange, hasRunUp
} from '~/utils/mountingRules'
import type { AccuracyCalcResult } from '~/utils/damageCalculation'
import { getWeatherBallEffect, getSandForceDamageBonus } from '~/utils/weatherRules'
import type { Pokemon, HumanCharacter, Move, Combatant } from '~/types'

interface CalculateDamageRequest {
  attackerId: string
  targetId: string
  moveName: string
  isCritical?: boolean
  damageReduction?: number
}

interface EntityDamageStats {
  attackStat: number
  attackStage: number
  defenseStat: number
  defenseStage: number
  types: string[]
  accuracyStage: number
}

interface EntityEvasionStats {
  defenseBase: number
  defenseStage: number
  spDefBase: number
  spDefStage: number
  speedBase: number
  speedStage: number
}

function getEntityStats(
  combatant: { type: string; entity: Pokemon | HumanCharacter },
  damageClass: 'Physical' | 'Special'
): EntityDamageStats {
  const entity = combatant.entity
  const stages = entity.stageModifiers

  if (combatant.type === 'pokemon') {
    const pokemon = entity as Pokemon
    return damageClass === 'Physical'
      ? {
          attackStat: pokemon.currentStats.attack,
          attackStage: stages?.attack ?? 0,
          defenseStat: pokemon.currentStats.defense,
          defenseStage: stages?.defense ?? 0,
          types: [...pokemon.types],
          accuracyStage: stages?.accuracy ?? 0,
        }
      : {
          attackStat: pokemon.currentStats.specialAttack,
          attackStage: stages?.specialAttack ?? 0,
          defenseStat: pokemon.currentStats.specialDefense,
          defenseStage: stages?.specialDefense ?? 0,
          types: [...pokemon.types],
          accuracyStage: stages?.accuracy ?? 0,
        }
  }

  const human = entity as HumanCharacter
  return damageClass === 'Physical'
    ? {
        attackStat: human.stats.attack,
        attackStage: stages?.attack ?? 0,
        defenseStat: human.stats.defense,
        defenseStage: stages?.defense ?? 0,
        types: [],
        accuracyStage: stages?.accuracy ?? 0,
      }
    : {
        attackStat: human.stats.specialAttack,
        attackStage: stages?.specialAttack ?? 0,
        defenseStat: human.stats.specialDefense,
        defenseStage: stages?.specialDefense ?? 0,
        types: [],
        accuracyStage: stages?.accuracy ?? 0,
      }
}

function getEntityEvasionStats(
  combatant: { type: string; entity: Pokemon | HumanCharacter }
): EntityEvasionStats {
  const entity = combatant.entity
  const stages = entity.stageModifiers

  if (combatant.type === 'pokemon') {
    const pokemon = entity as Pokemon
    return {
      defenseBase: pokemon.currentStats.defense,
      defenseStage: stages?.defense ?? 0,
      spDefBase: pokemon.currentStats.specialDefense,
      spDefStage: stages?.specialDefense ?? 0,
      speedBase: pokemon.currentStats.speed,
      speedStage: stages?.speed ?? 0,
    }
  }

  const human = entity as HumanCharacter
  return {
    defenseBase: human.stats.defense,
    defenseStage: stages?.defense ?? 0,
    spDefBase: human.stats.specialDefense,
    spDefStage: stages?.specialDefense ?? 0,
    speedBase: human.stats.speed,
    speedStage: stages?.speed ?? 0,
  }
}

/**
 * Compute the flanking evasion penalty for a target combatant.
 * PTU p.232: -2 to all evasion when flanked.
 * Per decree-040: penalty applies AFTER the evasion cap.
 *
 * Returns FLANKING_EVASION_PENALTY (2) if the target is flanked, 0 otherwise.
 * Only positioned, alive combatants are considered for flanking.
 */
function getFlankingPenaltyForTarget(
  targetCombatant: Combatant,
  allCombatants: Combatant[]
): number {
  if (!targetCombatant.position) return 0

  const foes = allCombatants
    .filter(c => c.id !== targetCombatant.id)
    .filter(c => c.position != null)
    .filter(c => isEnemySide(targetCombatant.side, c.side))
    .filter(c => {
      const hp = c.entity.currentHp ?? 0
      const conditions = c.entity.statusConditions ?? []
      const isDead = conditions.includes('Dead')
      const isFainted = conditions.includes('Fainted')
      return hp > 0 && !isDead && !isFainted
    })
    .map(c => ({
      id: c.id,
      position: c.position!,
      size: c.tokenSize || 1,
    }))

  const result = checkFlankingMultiTile(
    targetCombatant.position,
    targetCombatant.tokenSize || 1,
    foes
  )

  return result.isFlanked ? FLANKING_EVASION_PENALTY : 0
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<CalculateDamageRequest>(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  if (!body.attackerId || !body.targetId || !body.moveName) {
    throw createError({
      statusCode: 400,
      message: 'attackerId, targetId, and moveName are required',
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    const attacker = findCombatant(combatants, body.attackerId)
    const target = findCombatant(combatants, body.targetId)

    // Reconstruct wield relationships for Living Weapon equipment overlay
    const wieldRelationships = reconstructWieldRelationships(combatants)

    // Find move in attacker's move list (including Living Weapon moves if wielded)
    let move: Move | undefined
    if (attacker.type === 'pokemon') {
      const effectiveMoves = getEffectiveMoveList(wieldRelationships, combatants, attacker)
      move = effectiveMoves.find(
        (m) => m.name.toLowerCase() === body.moveName.toLowerCase()
      )
    }

    if (!move) {
      throw createError({
        statusCode: 404,
        message: `Move "${body.moveName}" not found on attacker`,
      })
    }

    if (!move.damageBase || move.damageBase <= 0) {
      throw createError({
        statusCode: 400,
        message: `Move "${body.moveName}" is not a damaging move (damageBase: ${move.damageBase})`,
      })
    }

    if (move.damageClass === 'Status') {
      throw createError({
        statusCode: 400,
        message: `Move "${body.moveName}" is a Status move and does not deal damage`,
      })
    }

    // Extract attacker stats based on damage class
    const attackerData = getEntityStats(attacker, move.damageClass)

    // Extract target stats based on damage class
    const targetData = getEntityStats(target, move.damageClass)

    // Auto-compute equipment DR for human targets (PTU p.293-294)
    // Uses effective equipment (accounts for Living Weapon overlay)
    // Caller-provided DR overrides base equipment DR (for manual GM adjustments)
    let effectiveDR = body.damageReduction
    const targetEquipBonuses = target.type === 'human'
      ? getEffectiveEquipmentBonuses(wieldRelationships, target)
      : null
    if (effectiveDR === undefined && targetEquipBonuses) {
      effectiveDR = targetEquipBonuses.damageReduction
    }
    // Helmet: +15 DR on critical hits only (PTU p.293)
    // Applied on top of BOTH manual override and equipment-based DR
    if (body.isCritical && targetEquipBonuses) {
      for (const cdr of targetEquipBonuses.conditionalDR) {
        if (cdr.condition === 'Critical Hits only') {
          effectiveDR = (effectiveDR ?? 0) + cdr.amount
        }
      }
    }

    // Focus stat bonuses: +5 to attack/defense AFTER combat stages (PTU p.295)
    const isPhysical = move.damageClass === 'Physical'
    let attackBonus = 0
    let defenseBonus = 0
    if (attacker.type === 'human') {
      const attackerEquipBonuses = getEffectiveEquipmentBonuses(wieldRelationships, attacker)
      attackBonus = attackerEquipBonuses.statBonuses[isPhysical ? 'attack' : 'specialAttack'] ?? 0
    }
    if (targetEquipBonuses) {
      defenseBonus = targetEquipBonuses.statBonuses[isPhysical ? 'defense' : 'specialDefense'] ?? 0
    }

    // P2: Weather Ball type/DB override (PTU p.338+)
    // When Weather Ball is used with active weather, its type changes to match
    // the weather and its DB doubles from 5 to 10.
    let effectiveMoveType = move.type
    let effectiveMoveDB = move.damageBase
    const isWeatherBall = move.name.toLowerCase() === 'weather ball'
    if (isWeatherBall) {
      const weatherBall = getWeatherBallEffect(record.weather)
      effectiveMoveType = weatherBall.type
      effectiveMoveDB = weatherBall.damageBase
    }

    // P2: Sand Force ability damage bonus (PTU p.323)
    // +5 flat damage for Ground/Rock/Steel moves in Sandstorm
    const abilityDamageBonus = getSandForceDamageBonus(attacker, record.weather, effectiveMoveType)

    const result = calculateDamage({
      attackerTypes: attackerData.types,
      attackStat: attackerData.attackStat,
      attackStage: attackerData.attackStage,
      moveType: effectiveMoveType,
      moveDamageBase: effectiveMoveDB,
      moveDamageClass: move.damageClass,
      moveKeywords: move.keywords,
      targetTypes: targetData.types,
      defenseStat: targetData.defenseStat,
      defenseStage: targetData.defenseStage,
      isCritical: body.isCritical,
      damageReduction: effectiveDR,
      attackBonus,
      defenseBonus,
      weather: record.weather,
      abilityDamageBonus,
    })

    // PTU p.246-247: Vulnerable, Frozen, and Asleep set evasion to 0
    // Check both entity.statusConditions and combatant.tempConditions
    // (Take a Breather applies Vulnerable via tempConditions)
    // ZeroEvasion is a synthetic tempCondition from the assisted breather variant (PTU p.245)
    const targetConditions: string[] = target.entity.statusConditions ?? []
    const targetTempConditions: string[] = target.tempConditions ?? []
    const hasZeroEvasionCondition = targetConditions.some(
      (c) => (ZERO_EVASION_CONDITIONS as readonly string[]).includes(c)
    ) || targetTempConditions.some(
      (c) => (ZERO_EVASION_CONDITIONS as readonly string[]).includes(c) || c === 'ZeroEvasion'
    )

    let physicalEvasion: number
    let specialEvasion: number
    let speedEvasion: number

    if (hasZeroEvasionCondition) {
      physicalEvasion = 0
      specialEvasion = 0
      speedEvasion = 0
    } else {
      // Compute dynamic evasion from target's stage-modified stats (PTU p.234)
      // Part 1: Stat-derived evasion uses combat stage MULTIPLIER on the stat (floor(modified/5))
      // Part 2: Evasion bonus from moves/effects is ADDITIVE, stacking on top
      // Part 3: Equipment evasion bonus (shields) stacks additively with move/effect evasion (PTU p.294)
      // Part 4: Focus stat bonuses (+5 to stat) applied after combat stages (PTU p.295)
      const targetEvasion = getEntityEvasionStats(target)
      const targetStages = target.entity.stageModifiers
      let evasionBonus = targetStages?.evasion ?? 0
      // Add equipment evasion bonus for human targets (shields — PTU p.294)
      if (targetEquipBonuses) {
        evasionBonus += targetEquipBonuses.evasionBonus
      }
      // Focus stat bonuses for evasion: +5 to stat after combat stages (PTU p.295)
      const focusDefBonus = targetEquipBonuses?.statBonuses.defense ?? 0
      const focusSpDefBonus = targetEquipBonuses?.statBonuses.specialDefense ?? 0
      const focusSpeedBonus = targetEquipBonuses?.statBonuses.speed ?? 0
      physicalEvasion = calculateEvasion(targetEvasion.defenseBase, targetEvasion.defenseStage, evasionBonus, focusDefBonus)
      specialEvasion = calculateEvasion(targetEvasion.spDefBase, targetEvasion.spDefStage, evasionBonus, focusSpDefBonus)
      speedEvasion = calculateEvasion(targetEvasion.speedBase, targetEvasion.speedStage, evasionBonus, focusSpeedBonus)

      // P2: Ride as One Speed Evasion sharing override (PTU p.103).
      // If the target is part of a mounted pair with Ride as One active, the shared
      // Speed Evasion (set by applyRideAsOneEvasion on mount) takes precedence over
      // the stat-derived evasion. The combatant.speedEvasion field holds the shared value.
      if (target.mountState && target.mountState.originalSpeedEvasion !== undefined) {
        // Ride as One was applied (originalSpeedEvasion is only set when Ride as One is active).
        // Use the higher of: stat-derived speed evasion or the Ride as One shared value.
        // This ensures Ride as One "use the highest of each other's Speed Evasion" is respected.
        speedEvasion = Math.max(speedEvasion, target.speedEvasion)
      }
    }

    // PTU p.234: Speed Evasion may be applied to any Move with an accuracy check.
    // Auto-select the highest applicable evasion (rational defender always picks best).
    const matchingEvasion = move.damageClass === 'Physical' ? physicalEvasion : specialEvasion
    const applicableEvasion = Math.max(matchingEvasion, speedEvasion)
    const effectiveEvasion = Math.min(9, applicableEvasion)

    // PTU p.232: Flanking penalty. Per decree-040: applied AFTER evasion cap.
    // effectiveEvasionWithFlanking = Math.min(9, rawEvasion) - flankingPenalty
    const flankingPenalty = getFlankingPenaltyForTarget(target, combatants)
    const effectiveEvasionWithFlanking = Math.max(0, effectiveEvasion - flankingPenalty)

    const moveAC = move.ac ?? 0

    // No Guard ability: -3 to AC (PTU p.2240)
    // Suppressed while wielded as a Living Weapon (PTU p.306, feature-005 P2)
    const noGuardActive = isNoGuardActive(attacker, wieldRelationships)
    const noGuardACReduction = noGuardActive ? -3 : 0
    const effectiveAC = moveAC + noGuardACReduction

    // Accuracy threshold uses flanking-adjusted evasion
    const accuracyThreshold = Math.max(1, effectiveAC + effectiveEvasionWithFlanking - attackerData.accuracyStage)

    const accuracy: AccuracyCalcResult & { flankingPenalty: number; noGuardActive?: boolean } = {
      moveAC: effectiveAC,
      attackerAccuracyStage: attackerData.accuracyStage,
      physicalEvasion,
      specialEvasion,
      speedEvasion,
      applicableEvasion,
      effectiveEvasion: effectiveEvasionWithFlanking,
      accuracyThreshold,
      flankingPenalty,
      ...(noGuardActive && { noGuardActive: true }),
    }

    // P2: Rider feature modifier annotations for GM awareness.
    // These are informational — the GM applies them manually per spec automation level.
    let riderModifiers: Record<string, unknown> | undefined
    const moveRange = move.range ?? ''

    // Check if attacker is mounted and rider has relevant features
    if (attacker.mountState) {
      const isAttackerRider = attacker.mountState.isMounted
      const riderId = isAttackerRider ? attacker.id : attacker.mountState.partnerId
      const mountId = isAttackerRider ? attacker.mountState.partnerId : attacker.id
      const rider = combatants.find(c => c.id === riderId)
      const mount = combatants.find(c => c.id === mountId)

      if (rider && mount) {
        const modifiers: Record<string, unknown> = {}

        // Run Up bonus (PTU p.103): +1 damage per 3m moved on Dash/Pass moves
        const distMoved = mount.turnState?.distanceMovedThisTurn ?? 0
        if (distMoved > 0 && hasRunUp(mount)) {
          const bonus = calculateRunUpBonus(distMoved)
          if (bonus > 0) {
            modifiers.runUpBonus = bonus
          }
        }

        // Overrun (PTU p.103): mount Speed added to damage, target gets Speed DR
        if (hasRiderFeature(rider, 'Overrun') && mount.type === 'pokemon') {
          const pokemon = mount.entity as Pokemon
          const mountSpeed = pokemon.currentStats?.speed ?? 0
          const mountSpeedStage = pokemon.stageModifiers?.speed ?? 0
          const targetPokemon = target.type === 'pokemon' ? target.entity as Pokemon : null
          const targetSpeed = targetPokemon?.currentStats?.speed ?? (target.entity as HumanCharacter).stats?.speed ?? 0
          const targetSpeedStage = target.entity.stageModifiers?.speed ?? 0
          modifiers.overrun = calculateOverrunModifiers(mountSpeed, mountSpeedStage, targetSpeed, targetSpeedStage)
        }

        // Conqueror's March eligibility (PTU p.103): range conversion
        if (isConquerorsMarchEligibleRange(moveRange)) {
          modifiers.conquerorsMarchEligible = true
        }

        if (Object.keys(modifiers).length > 0) {
          riderModifiers = modifiers
        }
      }
    }

    // Check if target is mounted pair and Lean In could apply (AoE attacks)
    if (target.mountState && isAoERange(moveRange)) {
      const targetRiderId = target.mountState.isMounted ? target.id : target.mountState.partnerId
      const targetRider = combatants.find(c => c.id === targetRiderId)
      if (targetRider && hasRiderFeature(targetRider, 'Lean In')) {
        riderModifiers = riderModifiers ?? {}
        riderModifiers.leanInApplicable = true
        riderModifiers.leanInReducedEffectiveness = applyResistStep(result.effectiveness ?? 1.0)
      }
    }

    return {
      success: true,
      data: {
        ...result,
        accuracy,
        ...(riderModifiers && { riderModifiers }),
        meta: {
          attackerId: body.attackerId,
          targetId: body.targetId,
          moveName: move.name,
          moveType: effectiveMoveType,
          moveBaseType: move.type,
          moveDamageClass: move.damageClass,
          ...(isWeatherBall && { weatherBallActive: true, weatherBallOriginalDB: 5 }),
          ...(abilityDamageBonus > 0 && { abilityDamageBonus, abilityDamageBonusSource: 'Sand Force' }),
        },
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to calculate damage'
    throw createError({ statusCode: 500, message })
  }
})
