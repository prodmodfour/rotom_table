/**
 * Status condition utilities.
 *
 * Per effect-utility-catalog.md — applyStatus adds conditions with type immunity checks.
 * removeStatus removes conditions with cure CS reversal.
 */

import type { PokemonType, CombatStatKey } from '../types/base'
import type { EffectContext, EffectResult } from '../types/effect-contract'
import type { StatusMutation, VolatileMutation } from '../types/delta'
import type { EffectSource, StatusType, VolatileType } from '../types/lens'
import { noEffect } from './result'

export type ApplyStatusParams =
  | { category: 'persistent'; condition: StatusType; source?: EffectSource }
  | { category: 'volatile'; condition: VolatileType; source?: EffectSource }

export type RemoveStatusParams =
  | { category: 'persistent'; condition: StatusType }
  | { category: 'volatile'; condition: VolatileType }

/**
 * Type-based status immunities.
 * Per type-grants-status-immunity.md:
 * Electric → Paralysis, Fire → Burn, Ghost → Stuck/Trapped,
 * Ice → Frozen, Poison/Steel → Poison
 */
const STATUS_TYPE_IMMUNITIES: Partial<Record<StatusType, PokemonType[]>> = {
  paralyzed: ['electric'],
  burned: ['fire'],
  frozen: ['ice'],
  poisoned: ['poison', 'steel'],
  'badly-poisoned': ['poison', 'steel'],
  stuck: ['ghost'],
  trapped: ['ghost'],
}

/** Apply a status condition. Handles type immunity checks internally. */
export function applyStatus(ctx: EffectContext, params: ApplyStatusParams): EffectResult {
  const target = ctx.target
  const targetTypes = target.types ?? []

  // Type immunity check — only persistent conditions have type immunities
  if (params.category === 'persistent') {
    const immuneTypes = STATUS_TYPE_IMMUNITIES[params.condition]
    if (immuneTypes) {
      for (const type of targetTypes) {
        if (immuneTypes.includes(type)) return noEffect()
      }
    }
  }

  const source = params.source ?? {
    type: ctx.effectSource.type,
    id: ctx.effectSource.id,
    entityId: ctx.effectSource.entityId,
  }

  const result: EffectResult = {
    combatantDeltas: new Map(),
    encounterDelta: null,
    entityWriteDeltas: new Map(),
    events: [{
      round: ctx.encounter.round,
      type: 'status-applied',
      sourceId: ctx.user.id,
      targetId: target.id,
    }],
    triggers: [],
    success: true,
    intercepted: false,
    embeddedActions: [],
    pendingModifications: [],
  }

  if (params.category === 'persistent') {
    // Status CS auto-application per status-cs-auto-apply-with-tracking.md
    // Burn: -2 Def, Poison/Badly Poisoned: -2 SpDef
    const appliedCombatStages: Partial<Record<CombatStatKey, number>> = {}
    if (params.condition === 'burned') {
      appliedCombatStages['def'] = -2
    } else if (params.condition === 'poisoned' || params.condition === 'badly-poisoned') {
      appliedCombatStages['spdef'] = -2
    }

    const mutation: StatusMutation = {
      op: 'add',
      condition: params.condition,
      source,
      appliedCombatStages: Object.keys(appliedCombatStages).length > 0
        ? appliedCombatStages : undefined,
    }

    result.combatantDeltas.set(target.id, {
      statusConditions: [mutation],
      ...(Object.keys(appliedCombatStages).length > 0
        ? { combatStages: appliedCombatStages }
        : {}),
    })
  } else {
    const mutation: VolatileMutation = {
      op: 'add',
      condition: params.condition,
      source,
    }

    result.combatantDeltas.set(target.id, {
      volatileConditions: [mutation],
    })
  }

  return result
}

/** Remove a status condition. */
export function removeStatus(ctx: EffectContext, params: RemoveStatusParams): EffectResult {
  const result: EffectResult = {
    combatantDeltas: new Map(),
    encounterDelta: null,
    entityWriteDeltas: new Map(),
    events: [],
    triggers: [],
    success: true,
    intercepted: false,
    embeddedActions: [],
    pendingModifications: [],
  }

  if (params.category === 'persistent') {
    result.combatantDeltas.set(ctx.target.id, {
      statusConditions: [{ op: 'remove', condition: params.condition }],
    })
  } else {
    result.combatantDeltas.set(ctx.target.id, {
      volatileConditions: [{ op: 'remove', condition: params.condition }],
    })
  }

  return result
}
