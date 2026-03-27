/**
 * Sample move handlers — 30 moves covering all required composition patterns.
 *
 * Per effect-handler-format.md: handlers are functions (ctx) => EffectResult.
 * Metadata + handler are bundled in MoveDefinition constants.
 */

import type { MoveHandler, MoveDefinition } from '../types/effect-contract'
import {
  rollAccuracy, dealDamage, dealTickDamage,
  applyStatus, modifyCombatStages, healHP, manageResource,
  displaceEntity, modifyInitiative, modifyMoveLegality,
  applyActiveEffect, modifyFieldState,
  addBlessing, addHazard, addCoat, addVortex, consumeBlessing,
  noEffect, intercept, merge,
  targetHasAnyStatus, effectiveStat, maxHp, getEntitiesInRange, getAdjacentAllies, withUser,
} from '../utilities'

// ─── 1. Pound — pure damage (simple) ───

const pound: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result, dealDamage(ctx, { db: 4, type: 'normal', class: 'physical' }))
}

export const POUND: MoveDefinition = {
  id: 'pound', name: 'Pound', type: 'normal', damageClass: 'physical',
  damageBase: 4, accuracy: 2, range: { type: 'melee' }, energyCost: 1,
  handler: pound,
}

// ─── 2. Thunderbolt — pure damage + status chance ───

const thunderbolt: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  const dmg = dealDamage(ctx, { db: 9, type: 'electric', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { category: 'persistent', condition: 'paralyzed' })
    : noEffect()
  return merge(acc.result, dmg, status)
}

export const THUNDERBOLT: MoveDefinition = {
  id: 'thunderbolt', name: 'Thunderbolt', type: 'electric', damageClass: 'special',
  damageBase: 9, accuracy: 2, range: { type: 'ranged', min: 1, max: 4 }, energyCost: 4,
  handler: thunderbolt,
}

// ─── 3. Flamethrower — pure damage + status chance ───

const flamethrower: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  const dmg = dealDamage(ctx, { db: 9, type: 'fire', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { category: 'persistent', condition: 'burned' })
    : noEffect()
  return merge(acc.result, dmg, status)
}

export const FLAMETHROWER: MoveDefinition = {
  id: 'flamethrower', name: 'Flamethrower', type: 'fire', damageClass: 'special',
  damageBase: 9, accuracy: 2, range: { type: 'ranged', min: 1, max: 4 }, energyCost: 4,
  handler: flamethrower,
}

// ─── 4. Ice Beam — pure damage + status chance ───

const iceBeam: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  const dmg = dealDamage(ctx, { db: 9, type: 'ice', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { category: 'persistent', condition: 'frozen' })
    : noEffect()
  return merge(acc.result, dmg, status)
}

export const ICE_BEAM: MoveDefinition = {
  id: 'ice-beam', name: 'Ice Beam', type: 'ice', damageClass: 'special',
  damageBase: 9, accuracy: 2, range: { type: 'ranged', min: 1, max: 4 }, energyCost: 3,
  handler: iceBeam,
}

// ─── 5. Swords Dance — self-buff ───

const swordsDance: MoveHandler = (ctx) => {
  return modifyCombatStages(ctx, { stages: { atk: 2 }, target: 'self' })
}

export const SWORDS_DANCE: MoveDefinition = {
  id: 'swords-dance', name: 'Swords Dance', type: 'normal', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'self' }, energyCost: 1,
  handler: swordsDance,
}

// ─── 6. Dragon Dance — self-buff (multi-stat) ───

const dragonDance: MoveHandler = (ctx) => {
  return modifyCombatStages(ctx, { stages: { atk: 1, spd: 1 }, target: 'self' })
}

export const DRAGON_DANCE: MoveDefinition = {
  id: 'dragon-dance', name: 'Dragon Dance', type: 'dragon', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'self' }, energyCost: 1,
  handler: dragonDance,
}

// ─── 7. Thunder Wave — status-only (auto-hit) ───

const thunderWave: MoveHandler = (ctx) => {
  // Thunder Wave cannot miss per PTR rules. Type immunity still checked in applyStatus.
  return applyStatus(ctx, { category: 'persistent', condition: 'paralyzed' })
}

export const THUNDER_WAVE: MoveDefinition = {
  id: 'thunder-wave', name: 'Thunder Wave', type: 'electric', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 5,
  handler: thunderWave,
}

// ─── 8. Will-O-Wisp — status-only ───

const willOWisp: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 5 })
  if (!acc.hit) return acc.result
  return merge(acc.result, applyStatus(ctx, { category: 'persistent', condition: 'burned' }))
}

export const WILL_O_WISP: MoveDefinition = {
  id: 'will-o-wisp', name: 'Will-O-Wisp', type: 'fire', damageClass: 'status',
  damageBase: null, accuracy: 5, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 1,
  handler: willOWisp,
}

// ─── 9. Toxic — status-only (badly poisoned) ───

const toxic: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 4 })
  if (!acc.hit) return acc.result
  return merge(acc.result, applyStatus(ctx, { category: 'persistent', condition: 'badly-poisoned' }))
}

export const TOXIC: MoveDefinition = {
  id: 'toxic', name: 'Toxic', type: 'poison', damageClass: 'status',
  damageBase: null, accuracy: 4, range: { type: 'ranged', min: 1, max: 4 }, energyCost: 5,
  handler: toxic,
}

// ─── 10. Earthquake — AoE ───

const earthquake: MoveHandler = (ctx) => {
  const targets = getEntitiesInRange(ctx, { scope: 'all', aoe: 'burst-3' })
  const results = targets.map(target => {
    const tCtx = { ...ctx, target }
    const acc = rollAccuracy(tCtx, { ac: 2 })
    if (!acc.hit) return acc.result
    return merge(acc.result, dealDamage(tCtx, { db: 10, type: 'ground', class: 'physical' }))
  })
  return merge(...results)
}

export const EARTHQUAKE: MoveDefinition = {
  id: 'earthquake', name: 'Earthquake', type: 'ground', damageClass: 'physical',
  damageBase: 10, accuracy: 2, range: { type: 'field' }, energyCost: 6,
  keywords: ['groundsource'],
  handler: earthquake,
}

// ─── 11. Bullet Seed — multi-hit (Five Strike) ───

const bulletSeed: MoveHandler = (ctx) => {
  const hitCount = ctx.resolution.multiHitCount // 2-5, pre-determined
  const results = Array.from({ length: hitCount }, () => {
    const acc = rollAccuracy(ctx, { ac: 4 })
    if (!acc.hit) return acc.result
    return merge(acc.result, dealDamage(ctx, { db: 3, type: 'grass', class: 'physical' }))
  })
  return merge(...results)
}

export const BULLET_SEED: MoveDefinition = {
  id: 'bullet-seed', name: 'Bullet Seed', type: 'grass', damageClass: 'physical',
  damageBase: 3, accuracy: 4, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 2,
  keywords: ['five-strike'],
  handler: bulletSeed,
}

// ─── 12. Gyro Ball — conditional DB modifier (speed comparison) ───

const gyroBall: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  const userSpd = effectiveStat(ctx.user, 'spd')
  const targetSpd = effectiveStat(ctx.target, 'spd')
  const bonus = targetSpd > userSpd ? targetSpd - userSpd : 0
  return merge(acc.result, dealDamage(ctx, { db: 6, type: 'steel', class: 'physical', bonusDamage: bonus }))
}

export const GYRO_BALL: MoveDefinition = {
  id: 'gyro-ball', name: 'Gyro Ball', type: 'steel', damageClass: 'physical',
  damageBase: 6, accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 3,
  handler: gyroBall,
}

// ─── 13. Hex — conditional DB modifier (status check) ───

const hex: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  const db = targetHasAnyStatus(ctx) ? 13 : 7
  return merge(acc.result, dealDamage(ctx, { db, type: 'ghost', class: 'special' }))
}

export const HEX: MoveDefinition = {
  id: 'hex', name: 'Hex', type: 'ghost', damageClass: 'special',
  damageBase: 7, accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 5,
  handler: hex,
}

// ─── 14. Psyshock — replacement effect (special targeting Def) ───

const psyshock: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result, dealDamage(ctx, { db: 8, type: 'psychic', class: 'special', defenderStat: 'def' }))
}

export const PSYSHOCK: MoveDefinition = {
  id: 'psyshock', name: 'Psyshock', type: 'psychic', damageClass: 'special',
  damageBase: 8, accuracy: 2, range: { type: 'ranged', min: 1, max: 4 }, energyCost: 2,
  handler: psyshock,
}

// ─── 15. Toxic Spikes — hazard ───

const toxicSpikes: MoveHandler = (ctx) => {
  return addHazard(ctx, 'toxic-spikes', { maxLayers: 2 })
}

export const TOXIC_SPIKES: MoveDefinition = {
  id: 'toxic-spikes', name: 'Toxic Spikes', type: 'poison', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'field' }, energyCost: 1,
  keywords: ['hazard'],
  handler: toxicSpikes,
}

// ─── 16. Stealth Rock — hazard (typed tick damage on switch-in) ───

const stealthRock: MoveHandler = (ctx) => {
  return addHazard(ctx, 'stealth-rock', { maxLayers: 1 })
}

export const STEALTH_ROCK: MoveDefinition = {
  id: 'stealth-rock', name: 'Stealth Rock', type: 'rock', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'field' }, energyCost: 3,
  keywords: ['hazard'],
  handler: stealthRock,
}

// ─── 17. Safeguard — blessing ───

const safeguard: MoveHandler = (ctx) => {
  return addBlessing(ctx, 'safeguard', { activations: 3 })
}

export const SAFEGUARD: MoveDefinition = {
  id: 'safeguard', name: 'Safeguard', type: 'normal', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'field' }, energyCost: 3,
  keywords: ['blessing'],
  handler: safeguard,
}

// ─── 18. Aqua Ring — coat (self-heal per turn) ───

const aquaRing: MoveHandler = (ctx) => {
  return addCoat(ctx, 'aqua-ring', {
    target: 'self',
    onTurnStart: (_triggerCtx) => healHP(_triggerCtx, { ticks: 1, target: 'self' }),
  })
}

export const AQUA_RING: MoveDefinition = {
  id: 'aqua-ring', name: 'Aqua Ring', type: 'water', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'self' }, energyCost: 3,
  keywords: ['coat'],
  handler: aquaRing,
}

// ─── 19. Wide Guard — interrupt (multi-target block) ───

const wideGuard: MoveHandler = (ctx) => {
  // Wide Guard is an interrupt — it intercepts multi-target moves hitting allies
  return intercept()
}

export const WIDE_GUARD: MoveDefinition = {
  id: 'wide-guard', name: 'Wide Guard', type: 'rock', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'self' }, energyCost: 3,
  keywords: ['interrupt', 'shield', 'trigger'],
  handler: wideGuard,
}

// ─── 20. Protect — interrupt (full interception) ───

const protect: MoveHandler = (ctx) => {
  return intercept()
}

export const PROTECT: MoveDefinition = {
  id: 'protect', name: 'Protect', type: 'normal', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'self' }, energyCost: 3,
  keywords: ['interrupt', 'shield', 'trigger'],
  handler: protect,
}

// ─── 21. Whirlpool — vortex + damage ───

const whirlpool: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 4 })
  if (!acc.hit) return acc.result
  const dmg = dealDamage(ctx, { db: 4, type: 'water', class: 'special' })
  const vortex = addVortex(ctx, { appliesTrapped: true })
  return merge(acc.result, dmg, vortex)
}

export const WHIRLPOOL: MoveDefinition = {
  id: 'whirlpool', name: 'Whirlpool', type: 'water', damageClass: 'special',
  damageBase: 4, accuracy: 4, range: { type: 'ranged', min: 1, max: 3 }, energyCost: 3,
  keywords: ['vortex'],
  handler: whirlpool,
}

// ─── 22. Circle Throw — displacement + damage ───

const circleThrow: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 4 })
  if (!acc.hit) return acc.result
  const dmg = dealDamage(ctx, { db: 6, type: 'fighting', class: 'physical' })
  const push = displaceEntity(ctx, { direction: 'push', distance: '6-weight-class' })
  // Trip on 15+
  const trip = acc.roll >= 15
    ? applyStatus(ctx, { category: 'volatile', condition: 'tripped' })
    : noEffect()
  return merge(acc.result, dmg, push, trip)
}

export const CIRCLE_THROW: MoveDefinition = {
  id: 'circle-throw', name: 'Circle Throw', type: 'fighting', damageClass: 'physical',
  damageBase: 6, accuracy: 4, range: { type: 'melee' }, energyCost: 2,
  keywords: ['push'],
  handler: circleThrow,
}

// ─── 23. Roar — displacement + forced switch ───

const roar: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  const push = displaceEntity(ctx, { direction: 'away-from-user', distance: 'highest-movement-trait' })
  return merge(acc.result, push)
}

export const ROAR: MoveDefinition = {
  id: 'roar', name: 'Roar', type: 'normal', damageClass: 'status',
  damageBase: null, accuracy: 2, range: { type: 'field' }, energyCost: 3,
  keywords: ['sonic', 'social'],
  handler: roar,
}

// ─── 24. Quash — initiative manipulation ───

const quash: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result, modifyInitiative(ctx, { op: 'set', value: 0 }))
}

export const QUASH: MoveDefinition = {
  id: 'quash', name: 'Quash', type: 'dark', damageClass: 'status',
  damageBase: null, accuracy: 2, range: { type: 'ranged', min: 1, max: 10 }, energyCost: 0,
  keywords: ['social'],
  handler: quash,
}

// ─── 25. Heal Block — healing denial ───

const healBlock: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result, modifyMoveLegality(ctx, {
    restriction: 'disabled',
    duration: { clearedBy: ['switch-out', 'take-a-breather'] },
  }))
}

export const HEAL_BLOCK: MoveDefinition = {
  id: 'heal-block', name: 'Heal Block', type: 'psychic', damageClass: 'status',
  damageBase: null, accuracy: 2, range: { type: 'ranged', min: 1, max: 6 }, energyCost: 1,
  handler: healBlock,
}

// ─── 26. Recover — healing (self, 50% max HP) ───

const recover: MoveHandler = (ctx) => {
  const healAmount = Math.floor(maxHp(ctx.user, ctx.user.level ?? undefined) / 2)
  return healHP(ctx, { amount: healAmount, target: 'self' })
}

export const RECOVER: MoveDefinition = {
  id: 'recover', name: 'Recover', type: 'normal', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'self' }, energyCost: 3,
  handler: recover,
}

// ─── 27. Rain Dance — weather set ───

const rainDance: MoveHandler = (ctx) => {
  return modifyFieldState(ctx, { field: 'weather', op: 'set', type: 'rain', rounds: 5 })
}

export const RAIN_DANCE: MoveDefinition = {
  id: 'rain-dance', name: 'Rain Dance', type: 'water', damageClass: 'status',
  damageBase: null, accuracy: 0, range: { type: 'field' }, energyCost: 3,
  keywords: ['weather'],
  handler: rainDance,
}

// ─── 28. Beat Up — multi-entity delegation ───

const beatUp: MoveHandler = (ctx) => {
  // User + up to 2 adjacent allies each make a Dark-type Struggle Attack (DB 4)
  const userAtk = dealDamage(ctx, { db: 4, type: 'dark', class: 'physical' })
  const allyAtks = getAdjacentAllies(ctx, { max: 2 }).map(ally =>
    withUser(ctx, ally, (c) => dealDamage(c, { db: 4, type: 'dark', class: 'physical' }))
  )
  return merge(userAtk, ...allyAtks)
}

export const BEAT_UP: MoveDefinition = {
  id: 'beat-up', name: 'Beat Up', type: 'dark', damageClass: 'physical',
  damageBase: null, accuracy: 0, range: { type: 'melee' }, energyCost: 2,
  handler: beatUp,
}

// ─── 29. Surf — AoE (Line 6) ───

const surf: MoveHandler = (ctx) => {
  const targets = getEntitiesInRange(ctx, { scope: 'all', aoe: 'line-6' })
  const results = targets.map(target => {
    const tCtx = { ...ctx, target }
    const acc = rollAccuracy(tCtx, { ac: 2 })
    if (!acc.hit) return acc.result
    return merge(acc.result, dealDamage(tCtx, { db: 9, type: 'water', class: 'special' }))
  })
  return merge(...results)
}

export const SURF: MoveDefinition = {
  id: 'surf', name: 'Surf', type: 'water', damageClass: 'special',
  damageBase: 9, accuracy: 2, range: { type: 'field' }, energyCost: 4,
  handler: surf,
}

// ─── 30. Struggle Bug — damage + opponent debuff ───

const struggleBug: MoveHandler = (ctx) => {
  const targets = getEntitiesInRange(ctx, { scope: 'enemies', aoe: 'cone-2' })
  const results = targets.map(target => {
    const tCtx = { ...ctx, target }
    const acc = rollAccuracy(tCtx, { ac: 2 })
    if (!acc.hit) return acc.result
    const dmg = dealDamage(tCtx, { db: 5, type: 'bug', class: 'special' })
    const debuff = modifyCombatStages(tCtx, { stages: { spatk: -1 } })
    return merge(acc.result, dmg, debuff)
  })
  return merge(...results)
}

export const STRUGGLE_BUG: MoveDefinition = {
  id: 'struggle-bug', name: 'Struggle Bug', type: 'bug', damageClass: 'special',
  damageBase: 5, accuracy: 2, range: { type: 'field' }, energyCost: 2,
  handler: struggleBug,
}

// ─── Export all definitions ───

export const MOVE_DEFINITIONS: MoveDefinition[] = [
  POUND, THUNDERBOLT, FLAMETHROWER, ICE_BEAM,
  SWORDS_DANCE, DRAGON_DANCE, THUNDER_WAVE, WILL_O_WISP, TOXIC,
  EARTHQUAKE, BULLET_SEED, GYRO_BALL, HEX, PSYSHOCK,
  TOXIC_SPIKES, STEALTH_ROCK, SAFEGUARD, AQUA_RING,
  WIDE_GUARD, PROTECT, WHIRLPOOL, CIRCLE_THROW, ROAR, QUASH,
  HEAL_BLOCK, RECOVER, RAIN_DANCE, BEAT_UP, SURF, STRUGGLE_BUG,
]
