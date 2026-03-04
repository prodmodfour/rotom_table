import type { Move, Combatant, Pokemon } from '~/types'
import type { DiceRollResult } from '~/utils/diceRoller'
import { roll } from '~/utils/diceRoller'
import { getEffectiveEquipBonuses } from '~/utils/equipmentBonuses'
import { computeTargetEvasions } from '~/utils/evasionCalculation'
import { getEffectivenessClass } from '~/utils/typeEffectiveness'
import { getWeatherDamageModifier } from '~/utils/damageCalculation'
import { getWeatherBallEffect, getSandForceDamageBonus } from '~/utils/weatherRules'
import type { EvasionDependencies } from '~/utils/evasionCalculation'
import { useTerrainStore } from '~/stores/terrain'
import { useEncounterStore } from '~/stores/encounter'
import { isEnemySide } from '~/utils/combatSides'
import { naturewalkBypassesTerrain } from '~/utils/combatantCapabilities'

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
  allCombatants: Ref<Combatant[]>,
  options?: {
    /** PTU p.232: flanking penalty getter. Returns -2 evasion penalty if target is flanked, 0 otherwise. */
    getFlankingPenalty?: (targetId: string) => number
  }
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
  const encounterStore = useEncounterStore()

  const getEquipBonuses = (combatant: Combatant) => {
    const wieldRels = encounterStore.encounter?.wieldRelationships ?? []
    return getEffectiveEquipBonuses(combatant, wieldRels)
  }

  // State
  const selectedTargets = ref<string[]>([])
  const damageRollResult = ref<DiceRollResult | null>(null)
  const hasRolledDamage = ref(false)
  const hasRolledAccuracy = ref(false)
  const accuracyResults = ref<Record<string, AccuracyResult>>({})

  // --- Range & Line-of-Sight Filtering ---
  const parsedMoveRange = computed(() => parseRange(move.value.range))

  /**
   * Blocking terrain check function for line-of-sight validation.
   * Returns true if the cell at (x, y) contains blocking terrain.
   */
  const isBlockingTerrain = (x: number, y: number): boolean => {
    return terrainStore.getTerrainAt(x, y) === 'blocking'
  }

  // --- Rough Terrain Accuracy Penalty (PTU p.231) ---

  /**
   * Get cells occupied by enemy combatants (decree-003: enemies = rough terrain, -2 accuracy).
   */
  const enemyOccupiedCells = computed((): Set<string> => {
    const cells = new Set<string>()
    const actorSide = actor.value.side

    for (const combatant of allCombatants.value) {
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
   * any rough terrain — either enemy-occupied squares (decree-003) or
   * painted terrain cells with the rough flag (decree-010, TerrainPainter).
   *
   * Uses Bresenham's line algorithm to trace intermediate cells.
   * Only intermediate cells are checked — the attacker's and target's
   * own cells are excluded (decree-025: endpoints excluded).
   *
   * Per PTU p.231: "-2 penalty to Accuracy Rolls" when targeting through
   * rough terrain. This is a flat penalty (not cumulative per cell).
   *
   * Per PTU p.322 (Naturewalk): If the attacker has Naturewalk matching
   * a painted rough terrain cell's base type, that cell's rough flag is
   * bypassed. Enemy-occupied rough (decree-003) is NEVER bypassed by
   * Naturewalk — it's a game mechanic, not painted terrain.
   */
  const targetsThroughRoughTerrain = (targetId: string): boolean => {
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
        // Enemy-occupied squares count as rough terrain (decree-003)
        // Naturewalk does NOT bypass this — it's a game mechanic, not terrain
        if (enemyOccupiedCells.value.has(key)) {
          return true
        }
        // Painted terrain cells with rough flag (decree-010, TerrainPainter)
        // PTU p.322: attacker with matching Naturewalk bypasses painted rough
        if (terrainStore.isRoughAt(x0, y0)) {
          const baseType = terrainStore.getTerrainAt(x0, y0)
          if (!naturewalkBypassesTerrain(actor.value, baseType)) {
            return true
          }
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
   * Per PTU p.231: "When targeting through Rough Terrain, you take a -2
   * penalty to Accuracy Rolls." This applies to ALL rough terrain sources:
   * - Enemy-occupied squares (decree-003: enemies always count as rough)
   * - Painted terrain cells with rough flag (decree-010: multi-tag system)
   *
   * Returns 2 if the line of sight passes through any rough terrain cell,
   * 0 otherwise. The penalty increases the accuracy threshold (harder to hit).
   */
  const getRoughTerrainPenalty = (targetId: string): number => {
    if (targetsThroughRoughTerrain(targetId)) {
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

  // --- STAB Calculations ---
  const actorTypes = computed((): string[] => {
    if (actor.value.type === 'pokemon') {
      return (actor.value.entity as Pokemon).types
    }
    return []
  })

  // P2: Weather Ball type/DB override (PTU p.338+)
  // When Weather Ball is used with active weather, its type and DB change dynamically.
  const isWeatherBall = computed(() => move.value.name?.toLowerCase() === 'weather ball')

  const effectiveMoveType = computed(() => {
    if (isWeatherBall.value) {
      const weather = encounterStore.encounter?.weather ?? null
      return getWeatherBallEffect(weather).type
    }
    return move.value.type
  })

  const effectiveMoveDB = computed(() => {
    if (isWeatherBall.value) {
      const weather = encounterStore.encounter?.weather ?? null
      return getWeatherBallEffect(weather).damageBase
    }
    return move.value.damageBase
  })

  const hasSTAB = computed(() => {
    if (!effectiveMoveType.value) return false
    // PTU p.287: Weapon moves "can never benefit from STAB"
    if (move.value.keywords?.includes('Weapon')) return false
    return checkSTAB(effectiveMoveType.value, actorTypes.value)
  })

  // Weather DB modifier (P1: PTU pp.341-342)
  // Rain: Water +5 DB, Fire -5 DB. Sun: Fire +5 DB, Water -5 DB.
  // Uses effective move type (Weather Ball may have changed it).
  const weatherModifier = computed(() => {
    if (!effectiveMoveDB.value || !effectiveMoveType.value) return 0
    const weather = encounterStore.encounter?.weather ?? null
    return getWeatherDamageModifier(weather, effectiveMoveType.value)
  })

  const effectiveDB = computed(() => {
    if (!effectiveMoveDB.value) return 0
    const weatherAdjustedDB = Math.max(1, effectiveMoveDB.value + weatherModifier.value)
    return hasSTAB.value ? weatherAdjustedDB + 2 : weatherAdjustedDB
  })

  // P2: Sand Force ability damage bonus (PTU p.323)
  // +5 flat damage for Ground/Rock/Steel moves in Sandstorm
  const sandForceDamageBonus = computed(() => {
    const weather = encounterStore.encounter?.weather ?? null
    return getSandForceDamageBonus(actor.value, weather, effectiveMoveType.value)
  })

  // --- Accuracy Calculations ---
  const attackerAccuracyStage = computed((): number => {
    const stages = getStageModifiers(actor.value.entity)
    return stages.accuracy || 0
  })

  // Build dependency bag for the extracted evasion utility
  const evasionDeps: EvasionDependencies = {
    getStageModifiers,
    getPokemonDefenseStat,
    getPokemonSpDefStat,
    getPokemonSpeedStat,
    getHumanStat,
    calculatePhysicalEvasion,
    calculateSpecialEvasion,
    calculateSpeedEvasion
  }

  const getTargetEvasion = (targetId: string): number => {
    const target = targets.value.find(t => t.id === targetId)
    if (!target || !target.entity) return 0

    // Pass wield relationships so equipment overlay affects evasion
    const wieldRels = encounterStore.encounter?.wieldRelationships ?? []
    const evasions = computeTargetEvasions(target, evasionDeps, wieldRels)

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

    const wieldRels = encounterStore.encounter?.wieldRelationships ?? []
    const evasions = computeTargetEvasions(target, evasionDeps, wieldRels)

    if (move.value.damageClass === 'Physical') {
      return evasions.speed > evasions.physical ? 'Speed Evasion' : 'Phys Evasion'
    } else {
      return evasions.speed > evasions.special ? 'Speed Evasion' : 'Spec Evasion'
    }
  }

  /**
   * Check if a combatant has an active (unsuppressed) No Guard ability.
   * No Guard is suppressed while wielded as a Living Weapon (PTU p.306).
   */
  const hasActiveNoGuard = (combatant: Combatant): boolean => {
    if (combatant.type !== 'pokemon') return false
    const pokemon = combatant.entity as Pokemon
    const hasAbility = pokemon.abilities?.some(
      (a: { name: string }) => a.name === 'No Guard'
    ) ?? false
    if (!hasAbility) return false

    // Suppressed while wielded as a Living Weapon
    const wieldRels = encounterStore.encounter?.wieldRelationships ?? []
    return !wieldRels.some(r => r.weaponId === combatant.id)
  }

  /**
   * Get the No Guard accuracy bonus for this attack.
   *
   * Per decree-046: No Guard uses playtest +3/-3 flat accuracy version.
   * +3 bonus to all Attack Rolls for the user (attacker has No Guard),
   * +3 bonus to all Attack Rolls against the user (target has No Guard).
   * These stack if both attacker and target have No Guard.
   *
   * Suppressed while the No Guard Pokemon is wielded as a Living Weapon.
   */
  const getNoGuardBonus = (targetId: string): number => {
    let bonus = 0

    // +3 if the attacker has active No Guard
    if (hasActiveNoGuard(actor.value)) {
      bonus += 3
    }

    // +3 if the target has active No Guard (attacks against them get bonus)
    const target = targets.value.find(t => t.id === targetId)
    if (target && hasActiveNoGuard(target)) {
      bonus += 3
    }

    return bonus
  }

  // --- Environment Accuracy Penalty (P2: ptu-rule-058) ---

  /**
   * Computed environment-based accuracy penalty for the current encounter.
   * Returns a positive number that increases the accuracy threshold (harder to hit).
   * Supports the accuracy_penalty effect type (Dim Cave: 6, Dark Cave: 10).
   *
   * Stored as a positive number per MED-2 sign convention (penalty = positive = worse).
   * decree-048: RAW flat Blindness (-6) and Total Blindness (-10) penalties.
   */
  const environmentAccuracyPenalty = computed((): number => {
    const preset = encounterStore.activeEnvironmentPreset
    if (!preset) return 0

    let penalty = 0
    for (const effect of preset.effects) {
      if (effect.type === 'accuracy_penalty' && effect.accuracyPenalty) {
        penalty += effect.accuracyPenalty
      }
    }
    return penalty
  })

  const getAccuracyThreshold = (targetId: string): number => {
    if (!move.value.ac) return 0

    const evasion = getTargetEvasion(targetId)
    const effectiveEvasion = Math.min(9, evasion)
    // Rough terrain penalty (PTU p.231): +2 to threshold when targeting
    // through rough terrain (enemy-occupied per decree-003, or painted rough per decree-010)
    const roughPenalty = getRoughTerrainPenalty(targetId)
    // Flanking penalty (PTU p.232): -2 to evasion when flanked, reducing threshold (easier to hit)
    // Per decree-040: flanking penalty applies AFTER the evasion cap of 9.
    // effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty
    const flankingPenalty = options?.getFlankingPenalty?.(targetId) ?? 0
    // No Guard bonus (decree-046): +3/-3 flat accuracy, reduces threshold
    const noGuardBonus = getNoGuardBonus(targetId)
    // Environment accuracy penalty (P2: ptu-rule-058)
    const environmentPenalty = environmentAccuracyPenalty.value
    return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty - noGuardBonus + environmentPenalty)
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

  // --- Damage Calculations ---
  const attackStatValue = computed((): number => {
    if (!move.value.damageBase) return 0

    const entity = actor.value.entity
    if (!entity) return 0

    const stages = getStageModifiers(entity)

    // Focus stat bonus for human attackers: +5 AFTER combat stages (PTU p.295)
    // Uses effective equipment (accounts for Living Weapon overlay)
    let focusBonus = 0
    if (actor.value.type === 'human') {
      const equipBonuses = getEquipBonuses(actor.value)
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

  const targetDamageCalcs = computed((): Record<string, TargetDamageCalc> => {
    if (!hasRolledDamage.value || !damageRollResult.value) return {}

    const calcs: Record<string, TargetDamageCalc> = {}

    for (const targetId of hitTargets.value) {
      const target = targets.value.find(t => t.id === targetId)
      if (!target || !target.entity) continue

      const entity = target.entity
      const stages = getStageModifiers(entity)

      // Focus defense bonus for human targets: +5 AFTER combat stages (PTU p.295)
      // Uses effective equipment (accounts for Living Weapon overlay)
      let focusDefBonus = 0
      let equipmentDR = 0
      if (target.type === 'human') {
        const equipBonuses = getEquipBonuses(target)
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

      const effectiveness = effectiveMoveType.value
        ? getTypeEffectiveness(effectiveMoveType.value, targetTypes)
        : 1

      // Subtract defense + equipment DR, add ability damage bonus, then apply effectiveness
      let damage = preDefenseTotal.value - defenseStat - equipmentDR + sandForceDamageBonus.value
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

  // --- Target Selection ---
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

  // --- Confirmation Logic ---
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

    // STAB & Weather
    actorTypes,
    hasSTAB,
    weatherModifier,
    effectiveDB,
    effectiveMoveType,
    effectiveMoveDB,
    isWeatherBall,
    sandForceDamageBonus,

    // Accuracy
    attackerAccuracyStage,
    getTargetEvasion,
    getTargetEvasionLabel,
    getAccuracyThreshold,
    getNoGuardBonus,
    getRoughTerrainPenalty,
    environmentAccuracyPenalty,
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
