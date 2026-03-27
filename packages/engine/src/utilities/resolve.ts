/**
 * Target resolution utilities.
 *
 * Shared lookup logic for resolving target IDs to combatant lenses.
 * Extracted from damage.ts per finding 133 — silent fallback on lookup
 * failure masks bugs (see finding 120).
 */

import type { EntityId } from '../types/base'
import type { EffectContext, TriggerContext } from '../types/effect-contract'
import type { CombatantLens } from '../types/lens'

function isTriggerContext(ctx: EffectContext): ctx is TriggerContext {
  return 'eventSource' in ctx
}

/** Resolve a target ID to the corresponding lens from allCombatants.
 *  Throws if a specified target ID is not found — silent substitution masked finding 120. */
export function resolveTargetLens(ctx: EffectContext, targetId: EntityId, target?: EntityId | 'event-source'): CombatantLens {
  if (!target) return ctx.target
  const found = ctx.allCombatants.find(c => c.id === targetId)
  if (!found) throw new Error(`Target ${targetId} not found in allCombatants`)
  return found
}

/** Resolve a target param to an EntityId, handling 'event-source' for trigger contexts. */
export function resolveTarget(ctx: EffectContext, target?: EntityId | 'event-source'): EntityId {
  if (target === 'event-source') {
    return isTriggerContext(ctx) ? ctx.eventSource.id : ctx.target.id
  }
  return target ?? ctx.target.id
}
