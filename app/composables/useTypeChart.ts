// PTU 1.05 type effectiveness and immunity utilities
import {
  TYPE_CHART,
  getTypeEffectiveness,
  getEffectivenessLabel
} from '~/utils/typeChart'
import {
  TYPE_STATUS_IMMUNITIES,
  isImmuneToStatus,
  findImmuneStatuses,
  getImmuneType
} from '~/utils/typeStatusImmunity'

export function useTypeChart() {
  // Check if move gets STAB (Same Type Attack Bonus)
  const hasSTAB = (moveType: string, userTypes: string[]): boolean => {
    return userTypes.includes(moveType)
  }

  return {
    typeEffectiveness: TYPE_CHART,
    getTypeEffectiveness,
    getEffectivenessDescription: getEffectivenessLabel,
    getEffectivenessLabel,
    typeImmunities: TYPE_STATUS_IMMUNITIES,
    isImmuneToStatus,
    findImmuneStatuses,
    getImmuneType,
    hasSTAB
  }
}
