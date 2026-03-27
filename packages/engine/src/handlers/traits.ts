/**
 * Sample trait definitions — 15 traits covering all required composition patterns.
 *
 * Per effect-handler-format.md: trait triggers are functions registered with the event bus.
 * PassiveEffectSpec handles static modifiers.
 */

import type { TraitDefinition, TriggerRegistration } from '../types/effect-contract'
import {
  dealTickDamage, healHP, manageResource,
  applyActiveEffect, modifyCombatStages, modifyFieldState,
  applyStatus,
  noEffect, intercept, merge, hasActiveEffect,
} from '../utilities'

// ─── 1. Volt Absorb — type-absorb (Electric → energy) ───

const voltAbsorbTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'electric') return noEffect()
    return merge(
      intercept(),
      manageResource(ctx, { resource: 'energy', amount: 5, target: 'self' }),
    )
  },
}

export const VOLT_ABSORB: TraitDefinition = {
  id: 'volt-absorb', name: 'Volt Absorb', category: 'innate',
  triggers: [voltAbsorbTrigger],
}

// ─── 2. Water Absorb — type-absorb (Water → HP) ───

const waterAbsorbTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'water') return noEffect()
    return merge(
      intercept(),
      healHP(ctx, { ticks: 1, target: 'self' }),
    )
  },
}

export const WATER_ABSORB: TraitDefinition = {
  id: 'water-absorb', name: 'Water Absorb', category: 'innate',
  triggers: [waterAbsorbTrigger],
}

// ─── 3. Flash Fire — type-absorb + active effect boost ───

const flashFireTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    return merge(
      intercept(),
      applyActiveEffect(ctx, {
        op: 'add',
        effect: {
          effectId: 'flash-fire-boost',
          sourceEntityId: ctx.user.id,
          state: { bonusDamage: 5 },
          expiresAt: { onEvent: 'user-turn-end' },
        },
        target: 'self',
      }),
    )
  },
}

const flashFireConsumption: TriggerRegistration = {
  eventType: 'move-used',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    if (!hasActiveEffect(ctx.user, 'flash-fire-boost')) return noEffect()
    return applyActiveEffect(ctx, { op: 'remove', effectId: 'flash-fire-boost' })
  },
}

export const FLASH_FIRE: TraitDefinition = {
  id: 'flash-fire', name: 'Flash Fire', category: 'innate',
  triggers: [flashFireTrigger, flashFireConsumption],
}

// ─── 4. Rough Skin — contact retaliation ───

const roughSkinTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (!ctx.event.isContact) return noEffect()
    return dealTickDamage(ctx, { ticks: 1, target: ctx.event.sourceEntityId })
  },
}

export const ROUGH_SKIN: TraitDefinition = {
  id: 'rough-skin', name: 'Rough Skin', category: 'innate',
  triggers: [roughSkinTrigger],
}

// ─── 5. Sniper — passive crit bonus damage ───

export const SNIPER: TraitDefinition = {
  id: 'sniper', name: 'Sniper', category: 'innate',
  passiveEffects: { critBonusDamage: 5 },
}

// ─── 6. Technician — passive DB boost for low-DB moves ───

export const TECHNICIAN: TraitDefinition = {
  id: 'technician', name: 'Technician', category: 'innate',
  passiveEffects: { dbBoostThreshold: 6, dbBoostAmount: 2 },
}

// ─── 7. Shell — passive damage reduction ───

export const SHELL: TraitDefinition = {
  id: 'shell', name: 'Shell', category: 'innate',
  scalingParam: 'x',
  // Shell [X] reduces damage by X. The engine reads this at damage application.
  // PassiveEffectSpec doesn't have a DR field — this is handled by the damage pipeline
  // reading the trait's scaling param. For the scaffold, we document the intent.
  passiveEffects: {},
}

// ─── 8. Phaser — movement type grant ───

export const PHASER: TraitDefinition = {
  id: 'phaser', name: 'Phaser', category: 'innate',
  scalingParam: 'x',
  passiveEffects: { movementTypeGrant: 'phase' },
}

// ─── 9. Opportunist — action economy modifier ───

// Opportunist [X]: X additional AoOs + Dark Struggle type
export const OPPORTUNIST: TraitDefinition = {
  id: 'opportunist', name: 'Opportunist', category: 'innate',
  scalingParam: 'x',
  passiveEffects: { struggleAttackTypeOverride: 'dark' },
  // The extra AoO grant is handled by the action economy system reading the trait's scaling param
}

// ─── 10. Dry Skin — type-absorb + weather interaction + fire vulnerability ───

const drySkinAbsorb: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'water') return noEffect()
    return merge(
      intercept(),
      healHP(ctx, { ticks: 1, target: 'self' }),
    )
  },
}

const drySkinFireVulnerability: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    return dealTickDamage(ctx, { ticks: 1, target: ctx.user.id })
  },
}

export const DRY_SKIN: TraitDefinition = {
  id: 'dry-skin', name: 'Dry Skin', category: 'innate',
  triggers: [drySkinAbsorb, drySkinFireVulnerability],
  passiveEffects: { weatherDamageImmunity: 'hail' },
  // Rain healing and Sun damage are turn-start triggers handled by weather automation
}

// ─── 11. Seed Sower — damage-received terrain set ───

const seedSowerTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    return modifyFieldState(ctx, { field: 'terrain', op: 'set', type: 'grassy', rounds: 5 })
  },
}

export const SEED_SOWER: TraitDefinition = {
  id: 'seed-sower', name: 'Seed Sower', category: 'innate',
  triggers: [seedSowerTrigger],
}

// ─── 12. Ice Body — weather-conditional healing ───

const iceBodyTrigger: TriggerRegistration = {
  eventType: 'turn-start',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.encounter.weather?.type !== 'hail') return noEffect()
    return healHP(ctx, { ticks: 1, target: 'self' })
  },
}

export const ICE_BODY: TraitDefinition = {
  id: 'ice-body', name: 'Ice Body', category: 'innate',
  triggers: [iceBodyTrigger],
  passiveEffects: { weatherDamageImmunity: 'hail' },
}

// ─── 13. Fire Manipulation — passive struggle type override ───

export const FIRE_MANIPULATION: TraitDefinition = {
  id: 'fire-manipulation', name: 'Fire Manipulation', category: 'innate',
  scalingParam: 'x',
  passiveEffects: { struggleAttackTypeOverride: 'fire' },
}

// ─── 14. Poison Coated Natural Weapon — passive contact poison ───

const poisonCoatedTrigger: TriggerRegistration = {
  eventType: 'damage-dealt',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (!ctx.event.isContact) return noEffect()
    if (ctx.event.sourceEntityId !== ctx.user.id) return noEffect()
    // Poison on natural 18+ accuracy roll — per trigger-event-field-semantics.md
    if ((ctx.event.accuracyRoll ?? 0) < 18) return noEffect()
    // Per status-application-must-use-applyStatus.md: always use applyStatus
    const target = ctx.allCombatants.find(c => c.id === ctx.event.targetId)
    if (!target) return noEffect()
    const targetCtx = { ...ctx, target }
    return applyStatus(targetCtx, {
      category: 'persistent',
      condition: 'poisoned',
      source: { type: 'trait', id: 'poison-coated', entityId: ctx.user.id },
    })
  },
}

export const POISON_COATED_NATURAL_WEAPON: TraitDefinition = {
  id: 'poison-coated-natural-weapon', name: 'Poison Coated Natural Weapon', category: 'innate',
  passiveEffects: { struggleAttackTypeOverride: 'poison' },
  triggers: [poisonCoatedTrigger],
}

// ─── 15. Intimidate (custom) — switch-in combat stage debuff ───
// Note: Intimidate doesn't exist in the PTR trait vault by that name.
// This represents the pattern of an on-entry debuff trait.

const intimidateTrigger: TriggerRegistration = {
  eventType: 'switch-in',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    // Debuff all enemies' Attack by -1 CS
    const enemies = ctx.allCombatants.filter(c => c.side !== ctx.user.side)
    const results = enemies.map(enemy => {
      const eCtx = { ...ctx, target: enemy }
      return modifyCombatStages(eCtx, { stages: { atk: -1 } })
    })
    return merge(...results)
  },
}

export const INTIMIDATE_TRAIT: TraitDefinition = {
  id: 'intimidate-trait', name: 'Intimidate (Sample)', category: 'innate',
  triggers: [intimidateTrigger],
}

// ─── Export all definitions ───

export const TRAIT_DEFINITIONS: TraitDefinition[] = [
  VOLT_ABSORB, WATER_ABSORB, FLASH_FIRE, ROUGH_SKIN,
  SNIPER, TECHNICIAN, SHELL, PHASER, OPPORTUNIST,
  DRY_SKIN, SEED_SOWER, ICE_BODY, FIRE_MANIPULATION,
  POISON_COATED_NATURAL_WEAPON, INTIMIDATE_TRAIT,
]
