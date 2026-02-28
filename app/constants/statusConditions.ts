/**
 * PTU 1.05 Status Condition Categories
 * Extracted for reuse across components
 */
import type { StatusCondition, StageModifiers } from '~/types'

export const PERSISTENT_CONDITIONS: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned'
]

export const VOLATILE_CONDITIONS: StatusCondition[] = [
  'Asleep', 'Bad Sleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed',
  'Disabled', 'Enraged', 'Suppressed'
]

export const OTHER_CONDITIONS: StatusCondition[] = [
  'Fainted', 'Dead', 'Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable'
]

export const ALL_STATUS_CONDITIONS: StatusCondition[] = [
  ...PERSISTENT_CONDITIONS,
  ...VOLATILE_CONDITIONS,
  ...OTHER_CONDITIONS
]

/**
 * Conditions that set evasion to 0.
 * PTU p.246 (Frozen), p.247 (Asleep, Vulnerable):
 * "Evasion becomes 0" / "The target's evasion becomes 0"
 */
export const ZERO_EVASION_CONDITIONS: StatusCondition[] = [
  'Vulnerable', 'Frozen', 'Asleep'
]

/**
 * Status conditions with inherent combat stage effects (PTU 1.05)
 * - Burned: -2 Defense CS (p.246)
 * - Paralyzed: -4 Speed CS (p.247)
 * - Poisoned: -2 Special Defense CS (p.247)
 *
 * Per decree-005: auto-applied with source tracking.
 */
export const STATUS_CS_EFFECTS: ReadonlyArray<{
  condition: StatusCondition
  stat: keyof StageModifiers
  value: number
}> = [
  { condition: 'Burned', stat: 'defense', value: -2 },
  { condition: 'Paralyzed', stat: 'speed', value: -4 },
  { condition: 'Poisoned', stat: 'specialDefense', value: -2 },
  { condition: 'Badly Poisoned', stat: 'specialDefense', value: -2 }
] as const

/**
 * Look up the CS effect for a status condition.
 * Returns undefined if the condition has no inherent CS effect.
 */
export function getStatusCsEffect(condition: StatusCondition): { stat: keyof StageModifiers; value: number } | undefined {
  const entry = STATUS_CS_EFFECTS.find(e => e.condition === condition)
  if (!entry) return undefined
  return { stat: entry.stat, value: entry.value }
}

/**
 * Get CSS class for a status condition
 */
export function getConditionClass(condition: StatusCondition): string {
  const classMap: Record<string, string> = {
    'Burned': 'condition--burn',
    'Frozen': 'condition--freeze',
    'Paralyzed': 'condition--paralysis',
    'Poisoned': 'condition--poison',
    'Badly Poisoned': 'condition--poison',
    'Asleep': 'condition--sleep',
    'Bad Sleep': 'condition--sleep',
    'Confused': 'condition--confusion',
    'Fainted': 'condition--fainted',
    'Dead': 'condition--dead',
    'Flinched': 'condition--flinch',
    'Infatuated': 'condition--infatuation'
  }
  return classMap[condition] || 'condition--default'
}
