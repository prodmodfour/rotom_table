/**
 * Combat utility functions.
 *
 * Per effect-utility-catalog.md — rollAccuracy, modifyCombatStages, healHP,
 * manageResource, displaceEntity, modifyInitiative, modifyActionEconomy,
 * applyActiveEffect, modifyMoveLegality.
 */

import type { EntityId, CombatStages } from '../types/base'
import type {
  EffectContext,
  EffectResult,
  MoveRestriction,
  Duration,
} from '../types/effect-contract'
import type { ActiveEffect, StatusType, VolatileType } from '../types/lens'
import type { WeatherType } from '../types/field-state'
import { noEffect } from './result'
import { maxHp, tickValue } from './stat'
import { resolveTargetLens } from './resolve'

// ─── Accuracy ───

export interface RollAccuracyParams {
  ac: number
}

export interface AccuracyResult {
  hit: boolean
  roll: number
  result: EffectResult
}

/**
 * Compare accuracy roll against target evasion.
 * Per natural-one-misses-natural-twenty-hits.md:
 * nat 1 always misses, nat 20 always hits.
 */
export function rollAccuracy(ctx: EffectContext, params: RollAccuracyParams): AccuracyResult {
  const roll = ctx.resolution.accuracyRoll

  // Natural extremes
  if (roll === 1) {
    return { hit: false, roll, result: missResult(ctx, roll) }
  }
  if (roll === 20) {
    return { hit: true, roll, result: hitResult(ctx, roll) }
  }

  // Evasion is derived — floor(def/5) for physical, floor(spdef/5) for special, floor(spd/5) for speed
  // The defender chooses which evasion to use. For simplification in the engine,
  // we use the highest applicable evasion from the target.
  const physEvasion = Math.min(6, Math.floor(ctx.target.stats.def / 5))
  const specEvasion = Math.min(6, Math.floor(ctx.target.stats.spdef / 5))
  const spdEvasion = Math.min(6, Math.floor(ctx.target.stats.spd / 5))
  const bestEvasion = Math.max(physEvasion, specEvasion, spdEvasion)

  // Accuracy CS is additive, not multiplier table
  const accuracyCS = ctx.user.combatStages.accuracy ?? 0

  const hit = roll + accuracyCS >= params.ac + bestEvasion
  return hit
    ? { hit: true, roll, result: hitResult(ctx, roll) }
    : { hit: false, roll, result: missResult(ctx, roll) }
}

function hitResult(ctx: EffectContext, roll: number): EffectResult {
  const result = noEffect()
  result.events = [{
    round: ctx.encounter.round,
    type: 'accuracy-check',
    sourceId: ctx.user.id,
    targetId: ctx.target.id,
    amount: roll,
  }]
  return result
}

function missResult(ctx: EffectContext, roll: number): EffectResult {
  const result = noEffect()
  result.success = false
  result.events = [{
    round: ctx.encounter.round,
    type: 'accuracy-check',
    sourceId: ctx.user.id,
    targetId: ctx.target.id,
    amount: roll,
  }]
  return result
}

// ─── Combat Stages ───

export interface ModifyCombatStagesParams {
  stages: Partial<CombatStages>
  target?: 'self' | EntityId
}

/** Add or subtract combat stages. Clamping handled by engine application. */
export function modifyCombatStages(ctx: EffectContext, params: ModifyCombatStagesParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.target.id)
  const result = noEffect()
  result.combatantDeltas.set(targetId, { combatStages: params.stages })
  return result
}

// ─── Healing ───

export interface HealHPParams {
  amount?: number
  ticks?: number
  target?: 'self' | EntityId
}

/** Restore HP. Per utility-self-targeting-convention.md: undefined ≡ 'self'. */
export function healHP(ctx: EffectContext, params: HealHPParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
  const isSelfTarget = params.target === 'self' || params.target === undefined
  const targetLens = isSelfTarget
    ? ctx.user
    : resolveTargetLens(ctx, targetId, params.target)

  let amount = params.amount ?? 0
  if (params.ticks) {
    amount = tickValue(targetLens, targetLens.level ?? undefined) * params.ticks
  }

  const result = noEffect()
  result.combatantDeltas.set(targetId, { hpDelta: amount })
  result.events = [{
    round: ctx.encounter.round,
    type: 'heal',
    sourceId: ctx.user.id,
    targetId,
    amount,
  }]
  return result
}

// ─── Resource Management ───

export interface ManageResourceParams {
  resource: 'energy' | 'fatigue' | 'mettle' | 'tempHp'
  amount: number
  target?: 'self' | EntityId
}

/** Modify energy, fatigue, mettle, or temp HP. */
export function manageResource(ctx: EffectContext, params: ManageResourceParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.target.id)
  const result = noEffect()

  switch (params.resource) {
    case 'energy':
      result.combatantDeltas.set(targetId, { energyCurrent: params.amount })
      break
    case 'fatigue':
      result.combatantDeltas.set(targetId, { fatigueLevel: params.amount })
      break
    case 'mettle':
      result.combatantDeltas.set(targetId, { mettlePoints: params.amount })
      break
    case 'tempHp':
      result.combatantDeltas.set(targetId, { tempHp: params.amount })
      break
  }

  return result
}

// ─── Position ───

export interface DisplaceEntityParams {
  direction: 'push' | 'pull' | 'away-from-user' | 'toward-user'
  distance: number | '6-weight-class' | 'highest-movement-trait'
  target?: EntityId
}

/** Modify position (push, pull, reposition). */
export function displaceEntity(ctx: EffectContext, params: DisplaceEntityParams): EffectResult {
  const targetId = params.target ?? ctx.target.id
  const targetLens = resolveTargetLens(ctx, targetId, params.target)

  let distance: number
  if (params.distance === '6-weight-class') {
    distance = Math.max(0, 6 - targetLens.weightClass)
  } else if (params.distance === 'highest-movement-trait') {
    distance = targetLens.movementTypes.reduce((max, m) => Math.max(max, m.speed), 0)
  } else {
    distance = params.distance
  }

  // Position manipulation is simplified — actual grid math is Ring 3B
  // For now, we signal the displacement via the delta
  const result = noEffect()
  if (targetLens.position && distance > 0) {
    // Simple push: add distance to x based on direction
    const dx = (params.direction === 'push' || params.direction === 'away-from-user') ? distance : -distance
    result.combatantDeltas.set(targetId, {
      position: { x: targetLens.position.x + dx, y: targetLens.position.y },
    })
  }

  return result
}

// ─── Initiative ───

export interface ModifyInitiativeParams {
  op: 'set' | 'set-next-after'
  value?: number
  relativeTo?: EntityId
  target?: EntityId
}

/** Manipulate turn order. */
export function modifyInitiative(ctx: EffectContext, params: ModifyInitiativeParams): EffectResult {
  const targetId = params.target ?? ctx.target.id
  const result = noEffect()

  if (params.op === 'set') {
    result.combatantDeltas.set(targetId, {
      initiativeOverride: params.value ?? 0,
    })
  }
  // 'set-next-after' requires turn order manipulation beyond delta model — simplified here

  return result
}

// ─── Action Economy ───

export interface ModifyActionEconomyParams {
  budgetChanges?: Partial<{ standard: number; movement: number; swift: number }>
  outOfTurnChanges?: Partial<{ aooRemaining: number; interruptUsed: boolean }>
  target?: 'self' | EntityId
}

export function modifyActionEconomy(ctx: EffectContext, params: ModifyActionEconomyParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.target.id)
  const result = noEffect()
  result.combatantDeltas.set(targetId, {
    ...(params.budgetChanges ? { actionBudget: params.budgetChanges } : {}),
    ...(params.outOfTurnChanges ? { outOfTurnUsage: params.outOfTurnChanges } : {}),
  })
  return result
}

// ─── Active Effects ───

export interface ApplyActiveEffectParams {
  op: 'add' | 'remove'
  effect?: ActiveEffect
  effectId?: string
  target?: 'self' | EntityId
}

export function applyActiveEffect(ctx: EffectContext, params: ApplyActiveEffectParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.target.id)
  const result = noEffect()

  if (params.op === 'add' && params.effect) {
    result.combatantDeltas.set(targetId, {
      activeEffects: [{ op: 'add', effect: params.effect }],
    })
  } else if (params.op === 'remove' && params.effectId) {
    result.combatantDeltas.set(targetId, {
      activeEffects: [{ op: 'remove', effectId: params.effectId }],
    })
  }

  return result
}

// ─── Move Legality ───

export interface ModifyMoveLegalityParams {
  restriction: MoveRestriction
  duration: Duration
  target?: EntityId
}

export function modifyMoveLegality(ctx: EffectContext, params: ModifyMoveLegalityParams): EffectResult {
  const targetId = params.target ?? ctx.target.id
  const result = noEffect()
  result.combatantDeltas.set(targetId, {
    activeEffects: [{
      op: 'add',
      effect: {
        effectId: `move-restriction-${params.restriction}`,
        sourceEntityId: ctx.user.id,
        state: { restriction: params.restriction },
        expiresAt: params.duration.rounds ? { round: ctx.encounter.round + params.duration.rounds } : undefined,
        clearedBy: params.duration.clearedBy,
      },
    }],
  })
  return result
}

// ─── State Query Helpers ───

export function targetHasStatus(ctx: EffectContext, condition: StatusType | VolatileType): boolean {
  return ctx.target.statusConditions.some(s => s.condition === condition)
    || ctx.target.volatileConditions.some(v => v.condition === condition)
}

export function targetHasAnyStatus(ctx: EffectContext): boolean {
  return ctx.target.statusConditions.length > 0
    || ctx.target.volatileConditions.length > 0
}

export function weatherIs(ctx: EffectContext, type: WeatherType): boolean {
  return ctx.encounter.weather?.type === type
}

export function hasActiveEffect(lens: { activeEffects: ActiveEffect[] }, effectId: string): boolean {
  return lens.activeEffects.some(e => e.effectId === effectId)
}

export function getAdjacentAllies(ctx: EffectContext, params?: { max?: number }): EffectContext['allCombatants'] {
  const allies = ctx.allCombatants.filter(c =>
    c.side === ctx.user.side && c.id !== ctx.user.id
  )
  return params?.max ? allies.slice(0, params.max) : allies
}

export function getEntitiesInRange(
  ctx: EffectContext,
  params: { scope: 'all' | 'enemies' | 'allies'; aoe: string },
): EffectContext['allCombatants'] {
  // Simplified — real spatial queries are Ring 3B
  return ctx.allCombatants.filter(c => {
    if (c.id === ctx.user.id) return false
    if (params.scope === 'enemies') return c.side !== ctx.user.side
    if (params.scope === 'allies') return c.side === ctx.user.side
    return true
  })
}

// ─── Context Switching ───

export function withUser<T>(
  ctx: EffectContext,
  newUser: EffectContext['user'],
  fn: (ctx: EffectContext) => T,
): T {
  return fn({ ...ctx, user: newUser })
}
