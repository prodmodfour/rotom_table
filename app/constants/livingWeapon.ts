/**
 * Living Weapon species configuration.
 * Maps species name to weapon properties per PTU pp.305-306.
 *
 * Used by getLivingWeaponConfig() in combatantCapabilities.ts
 * to determine if a Pokemon can be wielded and what it provides.
 */

/**
 * Configuration for a Living Weapon species.
 */
export interface LivingWeaponConfig {
  /** Species name (must match Pokemon.species exactly) */
  species: string
  /** Weapon type for PTU weapon proficiency checks */
  weaponType: 'Simple' | 'Fine'
  /** Equipment slots occupied when wielded */
  occupiedSlots: ('mainHand' | 'offHand')[]
  /** Whether this counts as a shield (Aegislash) */
  grantsShield: boolean
  /** Evasion bonus from dual-wielding (Doublade only) */
  dualWieldEvasionBonus: number
  /** Weapon moves granted to the Pokemon while wielded */
  grantedMoves: LivingWeaponMove[]
  /** Human-readable equipment description */
  equipmentDescription: string
}

/**
 * A weapon move granted by the Living Weapon capability.
 * Added to the Pokemon's move list while wielded.
 */
export interface LivingWeaponMove {
  name: string
  type: 'Normal'
  frequency: 'EOT' | 'Scene x2'
  ac: number
  damageBase: number
  damageClass: 'Physical'
  range: string
  effect: string
  /** Adept or Master weapon move tier */
  tier: 'Adept' | 'Master'
  /** Required Combat skill rank for the wielder to grant this move */
  requiredRank: 'Adept' | 'Master'
}

// === Weapon Move Definitions (PTU pp.288-290) ===

const WOUNDING_STRIKE: LivingWeaponMove = {
  name: 'Wounding Strike',
  type: 'Normal',
  frequency: 'EOT',
  ac: 2,
  damageBase: 6,
  damageClass: 'Physical',
  range: 'WR, 1 Target',
  effect: 'The target loses a Tick of Hit Points.',
  tier: 'Adept',
  requiredRank: 'Adept',
}

const DOUBLE_SWIPE: LivingWeaponMove = {
  name: 'Double Swipe',
  type: 'Normal',
  frequency: 'EOT',
  ac: 2,
  damageBase: 4,
  damageClass: 'Physical',
  range: 'WR, 2 Targets; or WR, 1 Target, Double Strike',
  effect: 'None',
  tier: 'Adept',
  requiredRank: 'Adept',
}

const BLEED: LivingWeaponMove = {
  name: 'Bleed!',
  type: 'Normal',
  frequency: 'Scene x2',
  ac: 2,
  damageBase: 9,
  damageClass: 'Physical',
  range: 'WR, 1 Target',
  effect: 'The target loses a Tick of Hit Points at the start of their next three turns.',
  tier: 'Master',
  requiredRank: 'Master',
}

// === Species Configuration ===

export const LIVING_WEAPON_CONFIG: Record<string, LivingWeaponConfig> = {
  'Honedge': {
    species: 'Honedge',
    weaponType: 'Simple',
    occupiedSlots: ['mainHand'],
    grantsShield: false,
    dualWieldEvasionBonus: 0,
    grantedMoves: [WOUNDING_STRIKE],
    equipmentDescription: 'Small Melee Weapon (Simple)',
  },
  'Doublade': {
    species: 'Doublade',
    weaponType: 'Simple',
    occupiedSlots: ['mainHand', 'offHand'],
    grantsShield: false,
    dualWieldEvasionBonus: 2,
    grantedMoves: [DOUBLE_SWIPE],
    equipmentDescription: 'Two Small Melee Weapons (Simple, +2 Evasion)',
  },
  'Aegislash': {
    species: 'Aegislash',
    weaponType: 'Fine',
    occupiedSlots: ['mainHand', 'offHand'],
    grantsShield: true,
    dualWieldEvasionBonus: 0,
    grantedMoves: [WOUNDING_STRIKE, BLEED],
    equipmentDescription: 'Small Melee Weapon + Light Shield (Fine)',
  },
}

/**
 * All species that have the Living Weapon capability.
 */
export const LIVING_WEAPON_SPECIES = Object.keys(LIVING_WEAPON_CONFIG)
