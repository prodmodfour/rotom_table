/**
 * PTU 1.05 Status Condition Definitions
 *
 * Per decree-038: Each condition has independent behavior flags.
 * Category (persistent/volatile/other) is for display/grouping only.
 * Behaviors (clearsOnRecall, clearsOnEncounterEnd, clearsOnFaint) are
 * determined by per-condition flags, NOT by category membership.
 */
import type { StatusCondition, StageModifiers } from '~/types'

// ============================================
// CONDITION DEFINITION TYPE
// ============================================

export type ConditionCategory = 'persistent' | 'volatile' | 'other'

export interface StatusConditionDef {
  readonly name: StatusCondition
  readonly category: ConditionCategory
  /** Whether this condition is cleared when a Pokemon is recalled into its Poke Ball */
  readonly clearsOnRecall: boolean
  /** Whether this condition is cleared at encounter end */
  readonly clearsOnEncounterEnd: boolean
  /** Whether this condition is cleared when the entity faints (PTU p.248) */
  readonly clearsOnFaint: boolean
}

// ============================================
// MASTER CONDITION DEFINITIONS (decree-038)
// ============================================

/**
 * Single source of truth for all status condition behaviors.
 * Category is for UI grouping only. Behavior flags drive game logic.
 *
 * PTU references:
 * - Persistent (p.246): Burn, Freeze, Paralysis, Poison, Badly Poisoned
 * - Volatile (p.247): Sleep, Confusion, Flinch, Infatuation, Curse, Disable, Rage, Suppression
 * - Other: Fainted, Dead, Stuck, Slowed, Trapped, Tripped, Vulnerable
 * - Faint (p.248): "automatically cured of all Persistent and Volatile Status Conditions"
 * - Recall (p.247-248): "Volatile Afflictions are cured completely... by recalling"
 *   Also cleared: Stuck, Slowed, Tripped, Vulnerable (p.247: "may be removed by switching")
 *   NOT cleared: Persistent, Fainted, Dead, Trapped (prevents recall entirely)
 */
export const STATUS_CONDITION_DEFS: Record<StatusCondition, StatusConditionDef> = {
  // === Persistent conditions ===
  // PTU p.246: retained even if recalled into Poke Ball
  'Burned': {
    name: 'Burned',
    category: 'persistent',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: true
  },
  'Frozen': {
    name: 'Frozen',
    category: 'persistent',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: true
  },
  'Paralyzed': {
    name: 'Paralyzed',
    category: 'persistent',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: true
  },
  'Poisoned': {
    name: 'Poisoned',
    category: 'persistent',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: true
  },
  'Badly Poisoned': {
    name: 'Badly Poisoned',
    category: 'persistent',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: true
  },

  // === Volatile conditions ===
  // PTU p.247: normally cured by recall and at encounter end
  'Asleep': {
    name: 'Asleep',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Bad Sleep': {
    name: 'Bad Sleep',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Confused': {
    name: 'Confused',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Flinched': {
    name: 'Flinched',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Infatuated': {
    name: 'Infatuated',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Cursed': {
    name: 'Cursed',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Disabled': {
    name: 'Disabled',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Enraged': {
    name: 'Enraged',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Suppressed': {
    name: 'Suppressed',
    category: 'volatile',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },

  // === Other conditions ===
  'Fainted': {
    name: 'Fainted',
    category: 'other',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: false  // Fainted doesn't clear itself
  },
  'Dead': {
    name: 'Dead',
    category: 'other',
    clearsOnRecall: false,
    clearsOnEncounterEnd: false,
    clearsOnFaint: false
  },
  'Stuck': {
    name: 'Stuck',
    category: 'other',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Slowed': {
    name: 'Slowed',
    category: 'other',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Trapped': {
    name: 'Trapped',
    category: 'other',
    clearsOnRecall: false,   // Trapped prevents recall entirely
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Tripped': {
    name: 'Tripped',
    category: 'other',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  },
  'Vulnerable': {
    name: 'Vulnerable',
    category: 'other',
    clearsOnRecall: true,
    clearsOnEncounterEnd: true,
    clearsOnFaint: true
  }
} as const

// ============================================
// DERIVED ARRAYS (for backward compatibility & display grouping)
// ============================================

/** Get all condition defs as an array */
export const ALL_CONDITION_DEFS: readonly StatusConditionDef[] =
  Object.values(STATUS_CONDITION_DEFS)

/** Persistent conditions — for UI display grouping only (decree-038) */
export const PERSISTENT_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.category === 'persistent').map(d => d.name)

/** Volatile conditions — for UI display grouping only (decree-038) */
export const VOLATILE_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.category === 'volatile').map(d => d.name)

/** Other conditions — for UI display grouping only (decree-038) */
export const OTHER_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.category === 'other').map(d => d.name)

/** All status conditions */
export const ALL_STATUS_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.map(d => d.name)

// ============================================
// BEHAVIOR-DERIVED ARRAYS (decree-038)
// ============================================

/**
 * Conditions cleared when a Pokemon is recalled into its Poke Ball.
 * Derived from per-condition clearsOnRecall flags (decree-038).
 */
export const RECALL_CLEARED_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.clearsOnRecall).map(d => d.name)

/**
 * Conditions cleared at encounter end.
 * Derived from per-condition clearsOnEncounterEnd flags (decree-038).
 */
export const ENCOUNTER_END_CLEARED_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.clearsOnEncounterEnd).map(d => d.name)

/**
 * Conditions cleared on faint.
 * Derived from per-condition clearsOnFaint flags (decree-038).
 * PTU p.248: "automatically cured of all Persistent and Volatile Status Conditions"
 */
export const FAINT_CLEARED_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.clearsOnFaint).map(d => d.name)

// ============================================
// MECHANIC-SPECIFIC ARRAYS (not category-derived)
// ============================================

/**
 * Conditions that deal tick damage at end of turn.
 * PTU p.246-247: Burn/Poison (1 tick), Badly Poisoned (escalating),
 * Cursed (2 ticks on Standard Action only per decree-032).
 */
export const TICK_DAMAGE_CONDITIONS: StatusCondition[] = [
  'Burned', 'Poisoned', 'Badly Poisoned', 'Cursed'
]

/**
 * Conditions that set evasion to 0.
 * PTU p.246 (Frozen), p.247 (Asleep, Vulnerable):
 * "Evasion becomes 0" / "The target's evasion becomes 0"
 */
export const ZERO_EVASION_CONDITIONS: StatusCondition[] = [
  'Vulnerable', 'Frozen', 'Asleep'
]

// ============================================
// COMBAT STAGE EFFECTS
// ============================================

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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the definition for a status condition.
 */
export function getConditionDef(condition: StatusCondition): StatusConditionDef {
  return STATUS_CONDITION_DEFS[condition]
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
