/**
 * PTU 1.05 Equipment Catalog
 * Standard equipment items from 09-gear-and-items.md (p.286-295)
 *
 * Items are keyed by name. The GM can also equip custom items via the API
 * by passing a full EquippedItem object rather than referencing a catalog entry.
 */

import type { EquippedItem, EquipmentSlot } from '~/types/character'
import { PhBaseballCap, PhTShirt, PhSword, PhHandPalm, PhSneakerMove, PhCircle } from '@phosphor-icons/vue'
import type { Component } from 'vue'

export const EQUIPMENT_CATALOG: Record<string, EquippedItem> = {
  // === Body Slot ===
  'Light Armor': {
    name: 'Light Armor',
    slot: 'body',
    damageReduction: 5,
    cost: 8000,
    description: 'Grants 5 Damage Reduction.',
  },
  'Heavy Armor': {
    name: 'Heavy Armor',
    slot: 'body',
    damageReduction: 10,
    speedDefaultCS: -1,
    cost: 12000,
    description: 'Grants 10 Damage Reduction. Speed default Combat Stage is -1.',
  },
  'Stealth Clothes': {
    name: 'Stealth Clothes',
    slot: 'body',
    cost: 2000,
    description: '+4 to Stealth Checks to remain unseen (max total +4).',
  },

  // === Head Slot ===
  'Helmet': {
    name: 'Helmet',
    slot: 'head',
    conditionalDR: { amount: 15, condition: 'Critical Hits only' },
    cost: 2250,
    description: '15 DR against Critical Hits. Resists Headbutt/Zen Headbutt flinch.',
  },
  'Dark Vision Goggles': {
    name: 'Dark Vision Goggles',
    slot: 'head',
    grantedCapabilities: ['Darkvision'],
    cost: 1000,
    description: 'Grants the Darkvision Capability while worn.',
  },
  'Gas Mask': {
    name: 'Gas Mask',
    slot: 'head',
    grantedCapabilities: ['Gas Mask Immunity'],
    cost: 1500,
    description: 'Breathe through toxins/smoke. Immune to powder and gas moves.',
  },
  'Re-Breather': {
    name: 'Re-Breather',
    slot: 'head',
    grantedCapabilities: ['Gilled'],
    cost: 4000,
    description: 'Grants the Gilled Capability for up to an hour. Refills in 5 minutes in open air.',
  },

  // === Off-Hand Slot ===
  'Light Shield': {
    name: 'Light Shield',
    slot: 'offHand',
    evasionBonus: 2,
    canReady: true,
    readiedBonuses: { evasionBonus: 4, damageReduction: 10, appliesSlowed: true },
    cost: 3000,
    description: '+2 Evasion. Readied: +4 Evasion, 10 DR, but Slowed.',
  },
  'Heavy Shield': {
    name: 'Heavy Shield',
    slot: 'offHand',
    evasionBonus: 2,
    canReady: true,
    readiedBonuses: { evasionBonus: 6, damageReduction: 15, appliesSlowed: true },
    cost: 4500,
    description: '+2 Evasion. Readied: +6 Evasion, 15 DR, but Slowed.',
  },

  // === Feet Slot ===
  'Running Shoes': {
    name: 'Running Shoes',
    slot: 'feet',
    cost: 2000,
    description: '+2 Athletics (max +3), +1 Overland Speed.',
  },
  'Snow Boots': {
    name: 'Snow Boots',
    slot: 'feet',
    grantedCapabilities: ['Naturewalk (Tundra)'],
    conditionalSpeedPenalty: { amount: -1, condition: 'On ice or deep snow' },
    cost: 1500,
    description: 'Naturewalk (Tundra), -1 Overland on ice/deep snow.',
  },
  'Jungle Boots': {
    name: 'Jungle Boots',
    slot: 'feet',
    grantedCapabilities: ['Naturewalk (Forest)'],
    cost: 1500,
    description: 'Naturewalk (Forest).',
  },

  // === Accessory Slot ===
  'Focus (Attack)': {
    name: 'Focus (Attack)',
    slot: 'accessory',
    statBonus: { stat: 'attack', value: 5 },
    cost: 6000,
    description: '+5 Attack (applied after Combat Stages).',
  },
  'Focus (Defense)': {
    name: 'Focus (Defense)',
    slot: 'accessory',
    statBonus: { stat: 'defense', value: 5 },
    cost: 6000,
    description: '+5 Defense (applied after Combat Stages).',
  },
  'Focus (Special Attack)': {
    name: 'Focus (Special Attack)',
    slot: 'accessory',
    statBonus: { stat: 'specialAttack', value: 5 },
    cost: 6000,
    description: '+5 Special Attack (applied after Combat Stages).',
  },
  'Focus (Special Defense)': {
    name: 'Focus (Special Defense)',
    slot: 'accessory',
    statBonus: { stat: 'specialDefense', value: 5 },
    cost: 6000,
    description: '+5 Special Defense (applied after Combat Stages).',
  },
  'Focus (Speed)': {
    name: 'Focus (Speed)',
    slot: 'accessory',
    statBonus: { stat: 'speed', value: 5 },
    cost: 6000,
    description: '+5 Speed (applied after Combat Stages).',
  },
}

/** Valid equipment slot names */
export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  'head', 'body', 'mainHand', 'offHand', 'feet', 'accessory'
] as const

/** Human-readable labels for equipment slots */
export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: 'Head',
  body: 'Body',
  mainHand: 'Main Hand',
  offHand: 'Off-Hand',
  feet: 'Feet',
  accessory: 'Accessory'
}

/** Phosphor icon components for each equipment slot */
export const SLOT_ICONS: Record<EquipmentSlot, Component> = {
  head: PhBaseballCap,
  body: PhTShirt,
  mainHand: PhSword,
  offHand: PhHandPalm,
  feet: PhSneakerMove,
  accessory: PhCircle
}

/** Human-readable labels for stat keys (used in equipment bonus display) */
export const STAT_LABELS: Record<string, string> = {
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp. Atk',
  specialDefense: 'Sp. Def',
  speed: 'Speed',
  hp: 'HP',
  accuracy: 'Accuracy',
  evasion: 'Evasion'
}
