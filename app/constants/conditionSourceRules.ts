/**
 * Source-dependent clearing rules for condition instances (decree-047).
 *
 * For Persistent and Volatile conditions, clearing behavior is always
 * determined by the static per-condition flags (they clear on faint per RAW).
 *
 * For Other conditions, the source type can override the static flags.
 * Per decree-047: move-inflicted Other conditions clear on faint,
 * terrain-based Other conditions do not.
 */
import { getConditionDef } from '~/constants/statusConditions'
import type { StatusCondition, ConditionSourceType, ConditionInstance } from '~/types'

export interface ConditionClearingOverrides {
  clearsOnFaint: boolean
  clearsOnRecall: boolean
  clearsOnEncounterEnd: boolean
}

/**
 * Source-type to clearing-behavior override map.
 * Only consulted for 'other' category conditions.
 * An empty object means "use the static condition def flag."
 */
export const SOURCE_CLEARING_RULES: Record<ConditionSourceType, Partial<ConditionClearingOverrides>> = {
  'move':        { clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true },
  'ability':     { clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true },
  // NOTE: terrain/weather clearsOnRecall is false here but decree-053 rules it
  // should be true (RAW: switching clears Stuck/Slowed). Pending ptu-rule-156
  // to set clearsOnRecall: true and add send-out re-apply hook.
  'terrain':     { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: true },
  'weather':     { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: true },
  'item':        { clearsOnFaint: true, clearsOnRecall: true, clearsOnEncounterEnd: true },
  'environment': { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: false },
  'manual':      { clearsOnFaint: false, clearsOnRecall: false, clearsOnEncounterEnd: false },
  // 'system' intentionally omits clearsOnRecall/clearsOnEncounterEnd so that
  // breather-applied conditions (Tripped, Vulnerable) fall back to their static
  // per-condition flags, which correctly clear on recall and encounter end.
  'system':      { clearsOnFaint: false },
  'unknown':     {}                          // No override: use static condition def
}

/**
 * Determine whether a specific condition instance should be cleared on faint.
 *
 * Logic:
 * 1. Persistent/Volatile: always use static clearsOnFaint flag (true per RAW).
 * 2. Other + known source: check SOURCE_CLEARING_RULES for override.
 * 3. Other + unknown/no source: use static flag (false per decree-047).
 */
export function shouldClearOnFaint(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)

  // Persistent and Volatile always clear on faint per PTU p.248
  if (def.category !== 'other') {
    return def.clearsOnFaint
  }

  // Other condition: check source-based override
  if (instance?.sourceType) {
    const sourceRule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (sourceRule && sourceRule.clearsOnFaint !== undefined) {
      return sourceRule.clearsOnFaint
    }
  }

  // Fallback: static condition def flag (clearsOnFaint: false for Other, decree-047)
  return def.clearsOnFaint
}

/**
 * Determine whether a specific condition instance should be cleared on recall.
 * Same pattern as shouldClearOnFaint: source overrides only for Other conditions.
 */
export function shouldClearOnRecall(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)

  // Non-other conditions: use static clearsOnRecall flag
  if (def.category !== 'other') {
    return def.clearsOnRecall
  }

  // Other condition: check source-based override
  if (instance?.sourceType) {
    const rule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (rule?.clearsOnRecall !== undefined) {
      return rule.clearsOnRecall
    }
  }

  // Fallback: static condition def flag
  return def.clearsOnRecall
}

/**
 * Determine whether a specific condition instance should be cleared at encounter end.
 * Same pattern as shouldClearOnFaint: source overrides only for Other conditions.
 */
export function shouldClearOnEncounterEnd(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)

  // Non-other conditions: use static clearsOnEncounterEnd flag
  if (def.category !== 'other') {
    return def.clearsOnEncounterEnd
  }

  // Other condition: check source-based override
  if (instance?.sourceType) {
    const rule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (rule?.clearsOnEncounterEnd !== undefined) {
      return rule.clearsOnEncounterEnd
    }
  }

  // Fallback: static condition def flag
  return def.clearsOnEncounterEnd
}

/**
 * Build a default ConditionInstance for a condition with no known source.
 * Used when seeding conditionInstances from pre-existing statusConditions.
 */
export function buildUnknownSourceInstance(condition: StatusCondition): ConditionInstance {
  return {
    condition,
    sourceType: 'unknown',
    sourceLabel: 'Unknown source'
  }
}

/**
 * Build a ConditionInstance for a GM-applied condition.
 */
export function buildManualSourceInstance(condition: StatusCondition): ConditionInstance {
  return {
    condition,
    sourceType: 'manual',
    sourceLabel: 'GM applied'
  }
}

/**
 * Format a condition for display, including source label for Other conditions.
 * Used in GM view to show what applied an Other condition.
 *
 * Display rules:
 * - Persistent/Volatile: condition name only (source doesn't affect behavior)
 * - Other with manual source: condition name only (GM applied it, they know why)
 * - Other with unknown source: condition name + "(source unknown)"
 * - Other with specific source: condition name + "(sourceLabel)"
 */
export function formatConditionDisplay(
  condition: StatusCondition,
  instances?: ConditionInstance[]
): string {
  const def = getConditionDef(condition)
  if (def.category !== 'other') return condition

  const instance = instances?.find(i => i.condition === condition)
  if (!instance || instance.sourceType === 'manual') return condition
  if (instance.sourceType === 'unknown') return `${condition} (source unknown)`
  return `${condition} (${instance.sourceLabel})`
}
