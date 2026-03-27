/**
 * Field state utilities.
 *
 * Per effect-utility-catalog.md — modifyFieldState, addBlessing, addHazard, addCoat,
 * consumeBlessing, removeHazard, modifyDeployment.
 */

import type { EntityId, Side, GridPosition } from '../types/base'
import type { WeatherType, TerrainType } from '../types/field-state'
import type { EffectContext, EffectResult, TraitTriggerHandler } from '../types/effect-contract'
import { noEffect } from './result'

// ─── Weather / Terrain ───

export type ModifyFieldStateParams =
  | { field: 'weather'; op: 'set'; type: WeatherType; rounds?: number }
  | { field: 'terrain'; op: 'set'; type: TerrainType; rounds?: number }
  | { field: 'weather' | 'terrain'; op: 'clear' }

export function modifyFieldState(ctx: EffectContext, params: ModifyFieldStateParams): EffectResult {
  const result = noEffect()

  if (params.op === 'clear') {
    if (params.field === 'weather') {
      result.encounterDelta = { weather: { op: 'clear' } }
    } else {
      result.encounterDelta = { terrain: { op: 'clear' } }
    }
  } else if (params.field === 'weather') {
    result.encounterDelta = {
      weather: { op: 'set', type: params.type, roundsRemaining: params.rounds ?? 5 },
    }
  } else {
    result.encounterDelta = {
      terrain: { op: 'set', type: params.type, roundsRemaining: params.rounds ?? 5 },
    }
  }

  return result
}

// ─── Blessings ───

export interface AddBlessingParams {
  activations: number
  // Trigger handlers registered with the event bus when blessing is created
  onStatusApplied?: TraitTriggerHandler
  onDamageReceived?: TraitTriggerHandler
}

export function addBlessing(ctx: EffectContext, blessingType: string, params: AddBlessingParams): EffectResult {
  const result = noEffect()
  result.encounterDelta = {
    blessings: [{
      op: 'add',
      instance: {
        blessingType,
        teamSide: ctx.user.side,
        activationsRemaining: params.activations,
      },
    }],
  }
  return result
}

export function consumeBlessing(ctx: EffectContext, blessingType: string): EffectResult {
  const result = noEffect()
  result.encounterDelta = {
    blessings: [{ op: 'consume', blessingType }],
  }
  return result
}

// ─── Hazards ───

export interface AddHazardParams {
  maxLayers: number
  positions?: GridPosition[]
  onSwitchIn?: TraitTriggerHandler
}

export function addHazard(ctx: EffectContext, hazardType: string, params: AddHazardParams): EffectResult {
  const result = noEffect()
  const positions = params.positions ?? [{ x: 0, y: 0 }]
  result.encounterDelta = {
    hazards: [{
      op: 'add',
      instance: {
        type: hazardType,
        positions,
        layers: 1,
        ownerSide: ctx.user.side,
      },
    }],
  }
  return result
}

export function removeHazard(ctx: EffectContext, hazardType: string, params?: { side?: Side }): EffectResult {
  const result = noEffect()
  result.encounterDelta = {
    hazards: [{
      op: 'remove-by-type',
      type: hazardType,
      side: params?.side ?? ctx.target.side,
    }],
  }
  return result
}

// ─── Coats ───

export interface AddCoatParams {
  target: 'self' | EntityId
  onTurnStart?: TraitTriggerHandler
  onTurnEnd?: TraitTriggerHandler
}

export function addCoat(ctx: EffectContext, coatType: string, params: AddCoatParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : params.target
  const result = noEffect()
  result.encounterDelta = {
    coats: [{
      op: 'add',
      instance: {
        type: coatType,
        entityId: targetId,
        triggerTiming: params.onTurnStart ? 'turn-start' : 'turn-end',
      },
    }],
  }
  return result
}

// ─── Vortexes ───

export function addVortex(ctx: EffectContext, params: {
  appliesTrapped?: boolean
  appliesSlowed?: boolean
  target?: EntityId
}): EffectResult {
  const targetId = params.target ?? ctx.target.id
  const result = noEffect()
  result.encounterDelta = {
    vortexes: [{
      op: 'add',
      instance: {
        targetId,
        casterId: ctx.user.id,
        appliesTrapped: params.appliesTrapped ?? true,
        appliesSlowed: params.appliesSlowed ?? false,
        turnsElapsed: 0,
      },
    }],
  }
  return result
}

// ─── Deployment ───

export function modifyDeployment(ctx: EffectContext, params: {
  op: 'switch-out' | 'switch-in' | 'faint'
  trainerId: string
  entityId: string
}): EffectResult {
  const result = noEffect()
  result.encounterDelta = {
    deploymentChanges: [params],
  }
  return result
}
