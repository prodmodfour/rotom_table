import type { Combatant, Pokemon, HumanCharacter, StatusCondition } from '~/types'
import type { WieldRelationship } from '~/types/combat'
import { ZERO_EVASION_CONDITIONS } from '~/constants/statusConditions'
import { computeEquipmentBonuses, computeEffectiveEquipment } from '~/utils/equipmentBonuses'
import { LIVING_WEAPON_CONFIG } from '~/constants/livingWeapon'

export interface EvasionValues {
  physical: number
  special: number
  speed: number
}

export interface EvasionDependencies {
  getStageModifiers: (entity: Pokemon | HumanCharacter) => Record<string, number>
  getPokemonDefenseStat: (entity: Pokemon | HumanCharacter) => number
  getPokemonSpDefStat: (entity: Pokemon | HumanCharacter) => number
  getPokemonSpeedStat: (entity: Pokemon | HumanCharacter) => number
  getHumanStat: (entity: Pokemon | HumanCharacter, stat: string) => number
  calculatePhysicalEvasion: (defense: number, defenseStages?: number, evasionBonus?: number, statBonus?: number) => number
  calculateSpecialEvasion: (spDef: number, spDefStages?: number, evasionBonus?: number, statBonus?: number) => number
  calculateSpeedEvasion: (speed: number, speedStages?: number, evasionBonus?: number, statBonus?: number) => number
}

/**
 * Compute all three evasion values for a target, including Focus bonuses
 * and equipment evasion. Returns physical, special, and speed evasion
 * with the evasion bonus already applied.
 *
 * PTU p.234 (07-combat.md:648-653): Evasion bonus from moves/effects is additive,
 * stacking on top of stat-derived evasion. This is NOT a combat stage multiplier.
 * PTU p.294-295: Equipment evasion bonus (shields) and Focus stat bonuses.
 *
 * PTU p.246-247: Vulnerable, Frozen, and Asleep set evasion to 0.
 * Checks both entity.statusConditions and combatant.tempConditions
 * (Take a Breather applies Vulnerable via tempConditions).
 *
 * When wieldRelationships is provided, accounts for Living Weapon equipment
 * overlay (which may change evasion bonuses, e.g., Doublade +2, Aegislash shield).
 */
export function computeTargetEvasions(
  target: Combatant,
  deps: EvasionDependencies,
  wieldRelationships?: WieldRelationship[]
): EvasionValues {
  const entity = target.entity

  // Check for zero-evasion conditions from both statusConditions and tempConditions.
  // ZeroEvasion is a synthetic tempCondition applied by the assisted breather variant (PTU p.245).
  const hasZeroEvasionCondition = entity.statusConditions?.some(
    (c: StatusCondition) => ZERO_EVASION_CONDITIONS.includes(c)
  ) || target.tempConditions?.some(
    (c: string) => (ZERO_EVASION_CONDITIONS as readonly string[]).includes(c) || c === 'ZeroEvasion'
  )
  if (hasZeroEvasionCondition) {
    return { physical: 0, special: 0, speed: 0 }
  }

  const stages = deps.getStageModifiers(entity)

  let evasionBonus = stages.evasion ?? 0
  let focusDefBonus = 0
  let focusSpDefBonus = 0
  let focusSpeedBonus = 0
  if (target.type === 'human') {
    // Compute equipment bonuses, accounting for Living Weapon overlay if present
    let equipment = (entity as HumanCharacter).equipment ?? {}
    if (wieldRelationships) {
      const wieldRel = wieldRelationships.find(r => r.wielderId === target.id)
      if (wieldRel) {
        const config = LIVING_WEAPON_CONFIG[wieldRel.weaponSpecies]
        if (config) {
          equipment = computeEffectiveEquipment(equipment, config, wieldRel.isFainted)
        }
      }
    }
    const equipBonuses = computeEquipmentBonuses(equipment)
    evasionBonus += equipBonuses.evasionBonus
    focusDefBonus = equipBonuses.statBonuses.defense ?? 0
    focusSpDefBonus = equipBonuses.statBonuses.specialDefense ?? 0
    focusSpeedBonus = equipBonuses.statBonuses.speed ?? 0
  }

  const speedStat = target.type === 'pokemon'
    ? deps.getPokemonSpeedStat(entity)
    : deps.getHumanStat(entity, 'speed')
  const defStat = target.type === 'pokemon'
    ? deps.getPokemonDefenseStat(entity)
    : deps.getHumanStat(entity, 'defense')
  const spDefStat = target.type === 'pokemon'
    ? deps.getPokemonSpDefStat(entity)
    : deps.getHumanStat(entity, 'specialDefense')

  return {
    physical: deps.calculatePhysicalEvasion(defStat, stages.defense, evasionBonus, focusDefBonus),
    special: deps.calculateSpecialEvasion(spDefStat, stages.specialDefense, evasionBonus, focusSpDefBonus),
    speed: deps.calculateSpeedEvasion(speedStat, stages.speed, evasionBonus, focusSpeedBonus)
  }
}
