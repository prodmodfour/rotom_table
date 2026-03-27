/**
 * Damage utilities.
 *
 * Per effect-utility-catalog.md — dealDamage runs the nine-step damage formula.
 * dealTickDamage deals flat HP-fraction damage.
 */

import type { PokemonType, DamageClass, EntityId } from '../types/base'
import type { EffectContext, EffectResult } from '../types/effect-contract'
import { DB_TO_DICE, getTypeEffectiveness, applyStageMultiplier, computeTickValue } from '../constants'
import { noEffect } from './result'
import { effectiveStat, tickValue } from './stat'
import { resolveTargetLens, resolveTarget } from './resolve'

export interface DealDamageParams {
  db: number
  type: PokemonType
  class: DamageClass
  dbModifiers?: number[]
  bonusDamage?: number
  defenderStat?: 'def' | 'spdef'
  target?: EntityId | 'event-source'
}

export interface DealTickDamageParams {
  ticks: number
  type?: PokemonType
  target?: EntityId | 'event-source'
}

/**
 * Run the nine-step damage formula.
 * Per damage-formula-step-order.md.
 *
 * Steps:
 * 1. Initial DB from move
 * 2. Five/Double-Strike (not handled here — multi-hit loops in handler)
 * 3. DB modifiers (STAB, etc.) — passed via dbModifiers
 * 4. Crit — uses resolution.damageRolls (pre-rolled)
 * 5. Roll damage — uses resolution.damageRolls
 * 6. Add attacker's stat
 * 7. Subtract defender's stat (floor 1 per non-immune-attacks-deal-damage)
 * 8. Type effectiveness (floor 1 unless immune)
 * 9. Apply to HP
 */
export function dealDamage(ctx: EffectContext, params: DealDamageParams): EffectResult {
  const targetId = resolveTarget(ctx, params.target)
  const targetLens = resolveTargetLens(ctx, targetId, params.target)

  // Step 1: Initial DB
  let db = params.db

  // Step 3: DB modifiers (STAB + others)
  if (params.dbModifiers) {
    for (const mod of params.dbModifiers) db += mod
  }
  // STAB check: if user has the move's type, +2 DB
  if (ctx.user.types && ctx.user.types.includes(params.type)) {
    db += 2
  }

  // Clamp DB to table range
  db = Math.max(1, Math.min(28, db))

  // Step 5: Roll damage (from pre-rolled resolution context)
  const diceExpr = DB_TO_DICE[db]
  if (!diceExpr) return noEffect()

  // Use first available damage roll, or compute set damage (average)
  const diceTotal = ctx.resolution.damageRolls.length > 0
    ? ctx.resolution.damageRolls[0]
    : Math.floor(diceExpr.dice * ((diceExpr.sides + 1) / 2))
  const rollResult = diceTotal + diceExpr.flat

  // Step 4: Crit doubles dice portion only (not flat, not stats)
  // Natural 20 on accuracy roll = crit
  const isCrit = ctx.resolution.accuracyRoll === 20
  const critBonus = isCrit ? diceTotal : 0

  // Step 6: Add attacker's relevant stat
  const attackStat = params.class === 'physical' ? 'atk' : 'spatk'
  const attackerStatValue = effectiveStat(ctx.user, attackStat)

  // Step 7: Subtract defender's relevant stat
  const defendStat = params.defenderStat ?? (params.class === 'physical' ? 'def' : 'spdef')
  const defenderStatValue = effectiveStat(targetLens, defendStat)

  let damage = rollResult + critBonus + attackerStatValue + (params.bonusDamage ?? 0) - defenderStatValue
  // Floor 1 per non-immune-attacks-deal-damage.md (post-defense)
  damage = Math.max(1, damage)

  // Step 8: Type effectiveness
  const defenderTypes = targetLens.types ?? []
  const effectiveness = getTypeEffectiveness(params.type, defenderTypes)

  if (effectiveness === 0) {
    // Full immunity — 0 damage
    return buildDamageResult(targetId, 0, [])
  }

  damage = Math.floor(damage * effectiveness)
  // Floor 1 post-effectiveness per non-immune-attacks-deal-damage.md
  damage = Math.max(1, damage)

  // Step 9: Build result with hpDelta
  return buildDamageResult(targetId, -damage, [{
    round: ctx.encounter.round,
    type: 'damage-dealt',
    sourceId: ctx.user.id,
    targetId,
    moveId: ctx.effectSource.id,
    isDamagingMove: true,
    amount: damage,
  }])
}

/**
 * Deal flat tick-based damage. Separate from dealDamage —
 * no attack stat, no defense stat, no STAB, no DB, no crit.
 */
export function dealTickDamage(ctx: EffectContext, params: DealTickDamageParams): EffectResult {
  const targetId = resolveTarget(ctx, params.target)
  const targetLens = resolveTargetLens(ctx, targetId, params.target)

  const tick = tickValue(targetLens, targetLens.level ?? undefined)
  let damage = tick * params.ticks

  // Apply type effectiveness if type provided
  if (params.type) {
    const defenderTypes = targetLens.types ?? []
    const effectiveness = getTypeEffectiveness(params.type, defenderTypes)
    if (effectiveness === 0) return buildDamageResult(targetId, 0, [])
    damage = Math.floor(damage * effectiveness)
    damage = Math.max(1, damage)
  }

  return buildDamageResult(targetId, -damage, [{
    round: ctx.encounter.round,
    type: 'damage-dealt',
    sourceId: ctx.user.id,
    targetId,
    amount: damage,
  }])
}

function buildDamageResult(
  targetId: EntityId,
  hpDelta: number,
  events: EffectResult['events'],
): EffectResult {
  const result = noEffectBase()
  if (hpDelta !== 0) {
    result.combatantDeltas.set(targetId, { hpDelta })
  }
  result.events = events
  return result
}

function noEffectBase(): EffectResult {
  return {
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
}
