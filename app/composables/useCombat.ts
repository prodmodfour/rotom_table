import type { Pokemon, HumanCharacter } from '~/types'
import { calculateEvasion } from '~/utils/damageCalculation'

// PTU 1.05 combat calculations and utilities
export function useCombat() {
  // ===========================================
  // PTU Combat Stage Multipliers
  // Positive stages: +20% per stage
  // Negative stages: -10% per stage
  // ===========================================
  const stageMultipliers: Record<number, number> = {
    [-6]: 0.4,
    [-5]: 0.5,
    [-4]: 0.6,
    [-3]: 0.7,
    [-2]: 0.8,
    [-1]: 0.9,
    [0]: 1.0,
    [1]: 1.2,
    [2]: 1.4,
    [3]: 1.6,
    [4]: 1.8,
    [5]: 2.0,
    [6]: 2.2
  }

  // Apply stage modifier to a stat
  const applyStageModifier = (baseStat: number, stage: number): number => {
    const clampedStage = Math.max(-6, Math.min(6, stage))
    const multiplier = stageMultipliers[clampedStage]
    return Math.floor(baseStat * multiplier)
  }

  // ===========================================
  // PTU HP Calculation
  // Pokemon HP = Level + (HP stat × 3) + 10
  // Trainer HP = Level × 2 + (HP stat × 3) + 10
  // ===========================================
  const calculatePokemonMaxHP = (level: number, hpStat: number): number => {
    return level + (hpStat * 3) + 10
  }

  const calculateTrainerMaxHP = (level: number, hpStat: number): number => {
    return (level * 2) + (hpStat * 3) + 10
  }

  // PTU Evasion — canonical implementation in ~/utils/damageCalculation.ts
  // Wrappers below provide semantic aliases for the three evasion types.

  const calculatePhysicalEvasion = (defense: number, defenseStages: number = 0, evasionBonus: number = 0, statBonus: number = 0): number => {
    return calculateEvasion(defense, defenseStages, evasionBonus, statBonus)
  }

  const calculateSpecialEvasion = (spDef: number, spDefStages: number = 0, evasionBonus: number = 0, statBonus: number = 0): number => {
    return calculateEvasion(spDef, spDefStages, evasionBonus, statBonus)
  }

  const calculateSpeedEvasion = (speed: number, speedStages: number = 0, evasionBonus: number = 0, statBonus: number = 0): number => {
    return calculateEvasion(speed, speedStages, evasionBonus, statBonus)
  }

  // Get health percentage
  const getHealthPercentage = (current: number, max: number): number => {
    return Math.round((current / max) * 100)
  }

  // Get health status class
  const getHealthStatus = (percentage: number): 'healthy' | 'warning' | 'critical' | 'fainted' => {
    if (percentage <= 0) return 'fainted'
    if (percentage > 50) return 'healthy'
    if (percentage > 25) return 'warning'
    return 'critical'
  }

  // ===========================================
  // PTU Injury System
  // Injuries occur at HP markers: 50%, 0%, -50%, -100%
  // Or from Massive Damage (50%+ of max HP in one hit)
  // ===========================================
  const checkForInjury = (
    previousHp: number,
    currentHp: number,
    maxHp: number,
    damageTaken: number
  ): { injured: boolean; reason: string } => {
    // Check for Massive Damage (50%+ of max HP in one hit)
    if (damageTaken >= maxHp * 0.5) {
      return { injured: true, reason: 'Massive Damage' }
    }

    // Check if crossed an HP marker
    const previousPercent = (previousHp / maxHp) * 100
    const currentPercent = (currentHp / maxHp) * 100

    const markers = [50, 0, -50, -100]
    for (const marker of markers) {
      if (previousPercent > marker && currentPercent <= marker) {
        return { injured: true, reason: `Crossed ${marker}% HP marker` }
      }
    }

    return { injured: false, reason: '' }
  }

  // Calculate XP gain (PTU formula)
  const calculateXPGain = (defeatedLevel: number, participantCount: number): number => {
    const baseXP = defeatedLevel * 10
    return Math.floor(baseXP / participantCount)
  }

  // Check if entity can act (not fainted/frozen/asleep)
  const canAct = (entity: Pokemon | HumanCharacter): boolean => {
    const currentHp = entity.currentHp

    if (currentHp <= 0) return false

    const conditions = entity.statusConditions
    if (conditions.includes('Frozen') || conditions.includes('Asleep')) {
      return false
    }

    return true
  }

  // ===========================================
  // PTU Accuracy Check
  // Roll d20 >= AC to hit
  // AC = Move's Base AC + Target's Evasion - Attacker's Accuracy modifiers
  // Natural 1 always misses, Natural 20 always hits
  // ===========================================
  const getAccuracyThreshold = (
    baseAC: number,
    attackerAccuracy: number,
    defenderEvasion: number
  ): number => {
    // Modified AC = Base AC - Accuracy Stages + Evasion (max +9 from evasion)
    const effectiveEvasion = Math.min(9, defenderEvasion)
    return Math.max(1, baseAC - attackerAccuracy + effectiveEvasion)
  }

  // ===========================================
  // PTU Action Points
  // Max AP = 5 + floor(TrainerLevel / 5)
  // ===========================================
  const calculateMaxActionPoints = (trainerLevel: number): number => {
    return 5 + Math.floor(trainerLevel / 5)
  }

  // ===========================================
  // PTU Movement from Speed Combat Stages
  // Bonus/penalty to movement = floor(Speed CS / 2)
  // Minimum movement is 2
  // ===========================================
  const calculateMovementModifier = (speedCombatStages: number): number => {
    return Math.floor(speedCombatStages / 2)
  }

  const calculateEffectiveMovement = (baseMovement: number, speedCombatStages: number): number => {
    const modifier = calculateMovementModifier(speedCombatStages)
    return Math.max(2, baseMovement + modifier)
  }

  return {
    // Stage modifiers
    stageMultipliers,
    applyStageModifier,

    // HP calculations
    calculatePokemonMaxHP,
    calculateTrainerMaxHP,

    // Evasion calculations
    calculateEvasion,
    calculatePhysicalEvasion,
    calculateSpecialEvasion,
    calculateSpeedEvasion,

    // Health utilities
    getHealthPercentage,
    getHealthStatus,

    // Injury system
    checkForInjury,

    // XP
    calculateXPGain,

    // Action utilities
    canAct,
    getAccuracyThreshold,

    // Action Points
    calculateMaxActionPoints,

    // Movement
    calculateMovementModifier,
    calculateEffectiveMovement
  }
}
