import type { Move, Combatant, Pokemon, HumanCharacter, GridPosition, StatusCondition } from '~/types'
import type { DiceRollResult } from '~/utils/diceRoller'
import { roll } from '~/utils/diceRoller'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import { useTerrainStore } from '~/stores/terrain'
import { isEnemySide } from '~/utils/combatSides'

export interface TargetDamageCalc {
  targetId: string
  defenseStat: number
  effectiveness: number
  effectivenessText: string
  effectivenessClass: string
  finalDamage: number
}

export interface AccuracyResult {
  targetId: string
  roll: number
  threshold: number
  hit: boolean
  isNat1: boolean
  isNat20: boolean
}

/**
 * Composable for handling move damage and accuracy calculations
 * Extracts combat logic from MoveTargetModal for reusability
 */
export function useMoveCalculation(
  move: Ref<Move>,
  actor: Ref<Combatant>,
  targets: Ref<Combatant[]>,
  allCombatants?: Ref<Combatant[]>
) {
  const {
    rollDamageBase,
    getDamageRoll
  } = useDamageCalculation()

  const {
    hasSTAB: checkSTAB,
    getTypeEffectiveness,
    getEffectivenessDescription
  } = useTypeChart()

  const {
    applyStageModifier,
    calculatePhysicalEvasion,
    calculateSpecialEvasion,
    calculateSpeedEvasion
  } = useCombat()

  const {
    getStageModifiers,
    getPokemonAttackStat,
    getPokemonSpAtkStat,
    getPokemonDefenseStat,
    getPokemonSpDefStat,
    getPokemonSpeedStat,
    getHumanStat
  } = useEntityStats()

  const { getCombatantNameById } = useCombatantDisplay()

  const { parseRange, isInRange, closestCellPair } = useRangeParser()
  const terrainStore = useTerrainStore()

  // State
  const selectedTargets = ref<string[]>([])
  const damageRollResult = ref<DiceRollResult | null>(null)
  const hasRolledDamage = ref(false)
  const hasRolledAccuracy = ref(false)
  const accuracyResults = ref<Record<string, AccuracyResult>>({})

  // =====================================
  // Range & Line-of-Sight Filtering
  // =====================================

  const parsedMoveRange = computed(() => parseRange(move.value.range))

  /**
   * Blocking terrain check function for line-of-sight validation.
   * Returns true if the cell at (x, y) contains blocking terrain.
   */
  const isBlockingTerrain = (x: number, y: number): boolean => {
    return terrainStore.getTerrainAt(x, y) === 'blocking'
  }

  // =====================================
  // Enemy-Occupied Rough Terrain (decree-003)
  // =====================================

  /**
   * Get cells occupied by enemy combatants relative to the actor.
   *
   * Per decree-003 (PTU p.231): "Squares occupied by enemies always count
   * as Rough Terrain" — targeting through these squares applies -2 accuracy.
   *
   * Enemy determination: 'enemies' vs 'players'/'allies'.
   * A combatant on 'enemies' considers 'players' and 'allies' as enemies.
   * A combatant on 'players' or 'allies' considers 'enemies' as enemies.
   */
  /**
   * All combatants on the grid — used for grid-level properties like
   * enemy-occupied rough terrain. Falls back to `targets` when the
   * optional `allCombatants` param is not provided.
   */
  const combatantsOnGrid = computed((): Combatant[] => {
    return allCombatants?.value ?? targets.value
  })

  const enemyOccupiedCells = computed((): Set<string> => {
    const cells = new Set<string>()
    const actorSide = actor.value.side

    for (const combatant of combatantsOnGrid.value) {
      if (combatant.id === actor.value.id) continue
      if (!combatant.position) continue
      if (!isEnemySide(actorSide, combatant.side)) continue

      // Add all cells occupied by this enemy token
      const size = combatant.tokenSize || 1
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          cells.add(`${combatant.position.x + dx},${combatant.position.y + dy}`)
        }
      }
    }

    return cells
  })

  /**
   * Check if targeting from attacker to a specific target passes through
   * any enemy-occupied squares (which count as rough terrain).
   *
   * Uses Bresenham's line algorithm to trace intermediate cells.
   * Only intermediate cells are checked — the attacker's and target's
   * own cells are excluded.
   *
   * Per PTU p.231: "-2 penalty to Accuracy Rolls" when targeting through
   * rough terrain. This is a flat penalty (not cumulative per cell).
   */
  const targetsThroughEnemyRoughTerrain = (targetId: string): boolean => {
    const actorPos = actor.value.position
    if (!actorPos) return false

    const target = targets.value.find(t => t.id === targetId)
    if (!target?.position) return false

    // Build sets of cells occupied by actor and target (to exclude from check)
    const actorSize = actor.value.tokenSize || 1
    const targetSize = target.tokenSize || 1
    const actorCells = new Set<string>()
    const targetCells = new Set<string>()

    for (let dx = 0; dx < actorSize; dx++) {
      for (let dy = 0; dy < actorSize; dy++) {
        actorCells.add(`${actorPos.x + dx},${actorPos.y + dy}`)
      }
    }
    for (let dx = 0; dx < targetSize; dx++) {
      for (let dy = 0; dy < targetSize; dy++) {
        targetCells.add(`${target.position.x + dx},${target.position.y + dy}`)
      }
    }

    // Use closest cell pair for multi-cell tokens (MED-1)
    // instead of anchor positions (top-left)
    const { from: closestFrom, to: closestTo } = closestCellPair(
      { position: actorPos, size: actorSize },
      { position: target.position, size: targetSize }
    )
    let x0 = closestFrom.x
    let y0 = closestFrom.y
    const x1 = closestTo.x
    const y1 = closestTo.y

    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy

    while (true) {
      // Check intermediate cells (exclude actor and target own cells)
      const key = `${x0},${y0}`
      if (!actorCells.has(key) && !targetCells.has(key)) {
        if (enemyOccupiedCells.value.has(key)) {
          return true
        }
      }

      if (x0 === x1 && y0 === y1) break

      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x0 += sx
      }
      if (e2 < dx) {
        err += dx
        y0 += sy
      }
    }

    return false
  }

  /**
   * Get the rough terrain accuracy penalty for targeting a specific combatant.
   *
   * Per decree-003 (PTU p.231): "Squares occupied by enemies always count
   * as Rough Terrain" and "When targeting through Rough Terrain, you take
   * a -2 penalty to Accuracy Rolls."
   *
   * Returns 2 if the line of sight passes through enemy-occupied squares,
   * 0 otherwise. The penalty increases the accuracy threshold (harder to hit).
   */
  const getRoughTerrainPenalty = (targetId: string): number => {
    if (targetsThroughEnemyRoughTerrain(targetId)) {
      return 2
    }
    return 0
  }

  /**
   * Determine whether each target is in range and has line of sight
   * from the attacker. Returns a map of combatant ID -> { inRange, reason }.
   *
   * When positions are not available on the grid (non-VTT encounters),
   * all targets are considered in range.
   */
  const targetRangeStatus = computed((): Record<string, { inRange: boolean; reason?: string }> => {
    const status: Record<string, { inRange: boolean; reason?: string }> = {}
    const actorPos = actor.value.position

    for (const target of targets.value) {
      // If actor has no position, all targets are in range (non-VTT encounter)
      if (!actorPos) {
        status[target.id] = { inRange: true }
        continue
      }

      // If target has no position, consider in range (not placed on grid yet)
      if (!target.position) {
        status[target.id] = { inRange: true }
        continue
      }

      const attackerSize = actor.value.tokenSize || 1
      const targetSize = target.tokenSize || 1

      const result = isInRange(
        actorPos,
        target.position,
        parsedMoveRange.value,
        isBlockingTerrain,
        attackerSize,
        targetSize
      )

      if (result) {
        status[target.id] = { inRange: true }
      } else {
        // Determine reason for out-of-range
        // Check if it's a LoS issue by testing without blocking function
        const inRangeWithoutLoS = isInRange(
          actorPos,
          target.position,
          parsedMoveRange.value,
          undefined,
          attackerSize,
          targetSize
        )

        if (inRangeWithoutLoS) {
          status[target.id] = { inRange: false, reason: 'Blocked by terrain (no line of sight)' }
        } else {
          status[target.id] = { inRange: false, reason: 'Out of range' }
        }
      }
    }

    return status
  })

  /**
   * Targets filtered to only those in range and with line of sight.
   */
  const inRangeTargets = computed((): Combatant[] => {
    return targets.value.filter(t => targetRangeStatus.value[t.id]?.inRange !== false)
  })

  /**
   * Targets that are out of range or blocked by terrain.
   */
  const outOfRangeTargets = computed((): Combatant[] => {
    return targets.value.filter(t => targetRangeStatus.value[t.id]?.inRange === false)
  })

  // =====================================
  // STAB Calculations
  // =====================================
  const actorTypes = computed((): string[] => {
    if (actor.value.type === 'pokemon') {
      return (actor.value.entity as Pokemon).types
    }
    return []
  })

  const hasSTAB = computed(() => {
    if (!move.value.type) return false
    return checkSTAB(move.value.type, actorTypes.value)
  })

  const effectiveDB = computed(() => {
    if (!move.value.damageBase) return 0
    return hasSTAB.value ? move.value.damageBase + 2 : move.value.damageBase
  })

  // =====================================
  // Accuracy Calculations
  // =====================================
  const attackerAccuracyStage = computed((): number => {
    const stages = getStageModifiers(actor.value.entity)
    return stages.accuracy || 0
  })

  /**
   * Compute all three evasion values for a target, including Focus bonuses
   * and equipment evasion. Returns physical, special, and speed evasion
   * with the evasion bonus already applied.
   *
   * PTU p.234 (07-combat.md:648-653): Evasion bonus from moves/effects is additive,
   * stacking on top of stat-derived evasion. This is NOT a combat stage multiplier.
   * PTU p.294-295: Equipment evasion bonus (shields) and Focus stat bonuses.
   */
  const computeTargetEvasions = (target: Combatant): {
    physical: number
    special: number
    speed: number
  } => {
    const entity = target.entity

    // PTU p.246-247: Vulnerable, Frozen, and Asleep set evasion to 0
    const hasZeroEvasionCondition = entity.statusConditions?.some(
      (c: StatusCondition) => c === 'Vulnerable' || c === 'Frozen' || c === 'Asleep'
    )
    if (hasZeroEvasionCondition) {
      return { physical: 0, special: 0, speed: 0 }
    }

    const stages = getStageModifiers(entity)

    let evasionBonus = stages.evasion ?? 0
    let focusDefBonus = 0
    let focusSpDefBonus = 0
    let focusSpeedBonus = 0
    if (target.type === 'human') {
      const equipBonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
      evasionBonus += equipBonuses.evasionBonus
      focusDefBonus = equipBonuses.statBonuses.defense ?? 0
      focusSpDefBonus = equipBonuses.statBonuses.specialDefense ?? 0
      focusSpeedBonus = equipBonuses.statBonuses.speed ?? 0
    }

    const speedStat = target.type === 'pokemon'
      ? getPokemonSpeedStat(entity)
      : getHumanStat(entity, 'speed')
    const defStat = target.type === 'pokemon'
      ? getPokemonDefenseStat(entity)
      : getHumanStat(entity, 'defense')
    const spDefStat = target.type === 'pokemon'
      ? getPokemonSpDefStat(entity)
      : getHumanStat(entity, 'specialDefense')

    return {
      physical: calculatePhysicalEvasion(defStat, stages.defense, evasionBonus, focusDefBonus),
      special: calculateSpecialEvasion(spDefStat, stages.specialDefense, evasionBonus, focusSpDefBonus),
      speed: calculateSpeedEvasion(speedStat, stages.speed, evasionBonus, focusSpeedBonus)
    }
  }

  const getTargetEvasion = (targetId: string): number => {
    const target = targets.value.find(t => t.id === targetId)
    if (!target || !target.entity) return 0

    const evasions = computeTargetEvasions(target)

    // PTU p.234: Speed Evasion may be applied to any Move with an accuracy check.
    // Auto-select the highest applicable evasion (rational defender always picks best).
    if (move.value.damageClass === 'Physical') {
      return Math.max(evasions.physical, evasions.speed)
    } else {
      return Math.max(evasions.special, evasions.speed)
    }
  }

  /**
   * Returns the label for which evasion type won the Math.max selection
   * for a given target. Reflects whether Phys, Spec, or Speed Evasion
   * is actually being used in the accuracy threshold.
   */
  const getTargetEvasionLabel = (targetId: string): string => {
    const target = targets.value.find(t => t.id === targetId)
    if (!target || !target.entity) return 'Evasion'

    const evasions = computeTargetEvasions(target)

    if (move.value.damageClass === 'Physical') {
      return evasions.speed > evasions.physical ? 'Speed Evasion' : 'Phys Evasion'
    } else {
      return evasions.speed > evasions.special ? 'Speed Evasion' : 'Spec Evasion'
    }
  }

  const getAccuracyThreshold = (targetId: string): number => {
    if (!move.value.ac) return 0

    const evasion = getTargetEvasion(targetId)
    const effectiveEvasion = Math.min(9, evasion)
    // Rough terrain penalty (decree-003, PTU p.231): +2 to threshold when
    // targeting through enemy-occupied squares (which count as rough terrain)
    const roughPenalty = getRoughTerrainPenalty(targetId)
    return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value + roughPenalty)
  }

  const rollAccuracy = () => {
    if (!move.value.ac) return

    // PTU: one accuracy roll per move use, compared against each target's threshold
    const d20Result = roll('1d20')
    const naturalRoll = d20Result.dice[0]
    const isNat1 = naturalRoll === 1
    const isNat20 = naturalRoll === 20

    const results: Record<string, AccuracyResult> = {}

    for (const targetId of selectedTargets.value) {
      const threshold = getAccuracyThreshold(targetId)

      let hit: boolean
      if (isNat1) {
        hit = false
      } else if (isNat20) {
        hit = true
      } else {
        hit = naturalRoll >= threshold
      }

      results[targetId] = {
        targetId,
        roll: naturalRoll,
        threshold,
        hit,
        isNat1,
        isNat20
      }
    }

    accuracyResults.value = results
    hasRolledAccuracy.value = true
    hasRolledDamage.value = false
    damageRollResult.value = null
  }

  const hitCount = computed(() => {
    return Object.values(accuracyResults.value).filter(r => r.hit).length
  })

  const missCount = computed(() => {
    return Object.values(accuracyResults.value).filter(r => !r.hit).length
  })

  const hitTargets = computed((): string[] => {
    if (!move.value.ac) {
      return selectedTargets.value
    }
    return selectedTargets.value.filter(id => accuracyResults.value[id]?.hit)
  })

  const canShowDamageSection = computed((): boolean => {
    if (!move.value.ac) return true
    return hasRolledAccuracy.value && hitCount.value > 0
  })

  // =====================================
  // Damage Calculations
  // =====================================
  const attackStatValue = computed((): number => {
    if (!move.value.damageBase) return 0

    const entity = actor.value.entity
    if (!entity) return 0

    const stages = getStageModifiers(entity)

    // Focus stat bonus for human attackers: +5 AFTER combat stages (PTU p.295)
    let focusBonus = 0
    if (actor.value.type === 'human') {
      const equipBonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
      const statKey = move.value.damageClass === 'Physical' ? 'attack' : 'specialAttack'
      focusBonus = equipBonuses.statBonuses[statKey] ?? 0
    }

    if (move.value.damageClass === 'Physical') {
      const baseStat = actor.value.type === 'pokemon'
        ? getPokemonAttackStat(entity)
        : getHumanStat(entity, 'attack')
      return applyStageModifier(baseStat, stages.attack) + focusBonus
    } else if (move.value.damageClass === 'Special') {
      const baseStat = actor.value.type === 'pokemon'
        ? getPokemonSpAtkStat(entity)
        : getHumanStat(entity, 'specialAttack')
      return applyStageModifier(baseStat, stages.specialAttack) + focusBonus
    }
    return 0
  })

  const attackStatLabel = computed(() => {
    return move.value.damageClass === 'Physical' ? 'ATK' : 'SP.ATK'
  })

  const defenseStatLabel = computed(() => {
    return move.value.damageClass === 'Physical' ? 'DEF' : 'SP.DEF'
  })

  const preDefenseTotal = computed(() => {
    if (!damageRollResult.value) return 0
    return damageRollResult.value.total + attackStatValue.value
  })

  const fixedDamage = computed((): number | null => {
    if (!move.value.effect) return null

    const patterns = [
      /lose\s+(\d+)\s+(?:HP|Hit\s*Points?)/i,
      /deals?\s+(\d+)\s+damage/i,
      /always\s+deals?\s+(\d+)/i,
      /(\d+)\s+damage\s+flat/i,
      /flat\s+(\d+)\s+damage/i,
      /(\d+)\s+Damage/
    ]

    for (const pattern of patterns) {
      const match = move.value.effect.match(pattern)
      if (match) {
        return parseInt(match[1], 10)
      }
    }

    return null
  })

  const damageNotation = computed(() => {
    if (!effectiveDB.value) return null
    return getDamageRoll(effectiveDB.value)
  })

  const getEffectivenessClass = (effectiveness: number): string => {
    if (effectiveness === 0) return 'immune'
    if (effectiveness <= 0.25) return 'double-resist'
    if (effectiveness < 1) return 'resist'
    if (effectiveness >= 2) return 'double-super'
    if (effectiveness > 1) return 'super'
    return 'neutral'
  }

  const targetDamageCalcs = computed((): Record<string, TargetDamageCalc> => {
    if (!hasRolledDamage.value || !damageRollResult.value) return {}

    const calcs: Record<string, TargetDamageCalc> = {}

    for (const targetId of hitTargets.value) {
      const target = targets.value.find(t => t.id === targetId)
      if (!target || !target.entity) continue

      const entity = target.entity
      const stages = getStageModifiers(entity)

      // Focus defense bonus for human targets: +5 AFTER combat stages (PTU p.295)
      let focusDefBonus = 0
      let equipmentDR = 0
      if (target.type === 'human') {
        const equipBonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
        const defKey = move.value.damageClass === 'Physical' ? 'defense' : 'specialDefense'
        focusDefBonus = equipBonuses.statBonuses[defKey] ?? 0
        equipmentDR = equipBonuses.damageReduction
        // Helmet: +15 DR on critical hits only (PTU p.293)
        if (isCriticalHit.value) {
          for (const cdr of equipBonuses.conditionalDR) {
            if (cdr.condition === 'Critical Hits only') {
              equipmentDR += cdr.amount
            }
          }
        }
      }

      let defenseStat: number
      if (move.value.damageClass === 'Physical') {
        const baseStat = target.type === 'pokemon'
          ? getPokemonDefenseStat(entity)
          : getHumanStat(entity, 'defense')
        defenseStat = applyStageModifier(baseStat, stages.defense) + focusDefBonus
      } else {
        const baseStat = target.type === 'pokemon'
          ? getPokemonSpDefStat(entity)
          : getHumanStat(entity, 'specialDefense')
        defenseStat = applyStageModifier(baseStat, stages.specialDefense) + focusDefBonus
      }

      let targetTypes: string[]
      if (target.type === 'pokemon') {
        targetTypes = (entity as Pokemon).types || []
      } else {
        targetTypes = []
      }

      const effectiveness = move.value.type
        ? getTypeEffectiveness(move.value.type, targetTypes)
        : 1

      // Subtract defense + equipment DR, then apply effectiveness
      let damage = preDefenseTotal.value - defenseStat - equipmentDR
      damage = Math.max(1, damage)
      damage = Math.floor(damage * effectiveness)
      damage = Math.max(1, damage)

      if (effectiveness === 0) {
        damage = 0
      }

      const effectivenessText = getEffectivenessDescription(effectiveness)

      calcs[targetId] = {
        targetId,
        defenseStat,
        effectiveness,
        effectivenessText,
        effectivenessClass: getEffectivenessClass(effectiveness),
        finalDamage: damage
      }
    }

    return calcs
  })

  const isCriticalHit = computed((): boolean => {
    // Single roll shared by all targets — check any result
    const firstResult = Object.values(accuracyResults.value)[0]
    return firstResult?.isNat20 ?? false
  })

  const rollDamage = () => {
    if (!effectiveDB.value) return
    damageRollResult.value = rollDamageBase(effectiveDB.value, isCriticalHit.value)
    hasRolledDamage.value = true
  }

  // =====================================
  // Target Selection
  // =====================================
  const toggleTarget = (targetId: string) => {
    const index = selectedTargets.value.indexOf(targetId)
    if (index === -1) {
      selectedTargets.value.push(targetId)
    } else {
      selectedTargets.value.splice(index, 1)
    }

    hasRolledAccuracy.value = false
    hasRolledDamage.value = false
    accuracyResults.value = {}
    damageRollResult.value = null
  }

  const getTargetNameById = (targetId: string): string => {
    return getCombatantNameById(targets.value, targetId)
  }

  // =====================================
  // Confirmation Logic
  // =====================================
  const canConfirm = computed((): boolean => {
    if (selectedTargets.value.length === 0) return false

    if (move.value.ac && !hasRolledAccuracy.value) return false

    if (move.value.damageBase && !fixedDamage.value && hitTargets.value.length > 0 && !hasRolledDamage.value) {
      return false
    }

    return true
  })

  const getConfirmData = () => {
    if (fixedDamage.value) {
      const targetDamages: Record<string, number> = {}
      for (const targetId of hitTargets.value) {
        targetDamages[targetId] = fixedDamage.value
      }
      return {
        targetIds: selectedTargets.value,
        damage: fixedDamage.value,
        rollResult: undefined,
        targetDamages
      }
    }

    if (hasRolledDamage.value && Object.keys(targetDamageCalcs.value).length > 0) {
      const targetDamages: Record<string, number> = {}
      for (const [targetId, calc] of Object.entries(targetDamageCalcs.value)) {
        targetDamages[targetId] = calc.finalDamage
      }
      const firstHitTarget = hitTargets.value[0]
      const firstTargetDamage = firstHitTarget ? targetDamages[firstHitTarget] : undefined
      return {
        targetIds: selectedTargets.value,
        damage: firstTargetDamage,
        rollResult: damageRollResult.value ?? undefined,
        targetDamages
      }
    }

    return {
      targetIds: selectedTargets.value,
      damage: undefined,
      rollResult: undefined,
      targetDamages: undefined
    }
  }

  // Reset state
  const reset = () => {
    selectedTargets.value = []
    damageRollResult.value = null
    hasRolledDamage.value = false
    hasRolledAccuracy.value = false
    accuracyResults.value = {}
  }

  return {
    // State
    selectedTargets,
    damageRollResult,
    hasRolledDamage,
    hasRolledAccuracy,
    accuracyResults,

    // Range & LoS filtering
    parsedMoveRange,
    targetRangeStatus,
    inRangeTargets,
    outOfRangeTargets,

    // STAB
    actorTypes,
    hasSTAB,
    effectiveDB,

    // Accuracy
    attackerAccuracyStage,
    getTargetEvasion,
    getTargetEvasionLabel,
    getAccuracyThreshold,
    getRoughTerrainPenalty,
    rollAccuracy,
    hitCount,
    missCount,
    hitTargets,
    canShowDamageSection,

    // Damage
    attackStatValue,
    attackStatLabel,
    defenseStatLabel,
    preDefenseTotal,
    fixedDamage,
    damageNotation,
    getEffectivenessClass,
    targetDamageCalcs,
    isCriticalHit,
    rollDamage,

    // Target selection
    toggleTarget,
    getTargetNameById,

    // Confirmation
    canConfirm,
    getConfirmData,
    reset
  }
}
