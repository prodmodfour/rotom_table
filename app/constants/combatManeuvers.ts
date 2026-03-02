/**
 * PTU 1.05 Combat Maneuvers
 * Extracted from GMActionModal for reuse
 */

import type { AoOTrigger } from '~/types/combat'

export interface Maneuver {
  id: string
  name: string
  actionType: 'standard' | 'full' | 'interrupt' | 'shift' | 'free'
  actionLabel: string
  ac: number | null
  icon: string
  shortDesc: string
  requiresTarget: boolean
  /** AoO trigger type this maneuver may provoke (PTU p.241) */
  provokesAoO?: AoOTrigger
  /** Whether this maneuver is an Interrupt-type maneuver */
  isInterrupt?: boolean
}

export const COMBAT_MANEUVERS: Maneuver[] = [
  {
    id: 'push',
    name: 'Push',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 4,
    icon: '/icons/phosphor/arrow-fat-right.svg',
    shortDesc: 'Push target 1m away (opposed Combat/Athletics)',
    requiresTarget: true,
    provokesAoO: 'maneuver_other'
  },
  {
    id: 'sprint',
    name: 'Sprint',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: null,
    icon: '/icons/phosphor/person-simple-run.svg',
    shortDesc: '+50% Movement Speed this turn',
    requiresTarget: false
  },
  {
    id: 'trip',
    name: 'Trip',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 6,
    icon: '/icons/phosphor/sneaker-move.svg',
    shortDesc: 'Trip target (opposed Combat/Acrobatics)',
    requiresTarget: true,
    provokesAoO: 'maneuver_other'
  },
  {
    id: 'grapple',
    name: 'Grapple',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 4,
    icon: '/icons/phosphor/hand-grabbing.svg',
    shortDesc: 'Initiate grapple (opposed Combat/Athletics)',
    requiresTarget: true,
    provokesAoO: 'maneuver_other'
  },
  {
    id: 'disarm',
    name: 'Disarm',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 6,
    icon: '/icons/phosphor/hand-fist.svg',
    shortDesc: 'Force target to drop held item (opposed Combat/Stealth)',
    requiresTarget: true,
    provokesAoO: 'maneuver_other'
  },
  {
    id: 'dirty-trick',
    name: 'Dirty Trick',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 2,
    icon: '/icons/phosphor/eye-slash.svg',
    shortDesc: 'Hinder, Blind, or Low Blow (once per Scene per target)',
    requiresTarget: true,
    provokesAoO: 'maneuver_other'
  },
  {
    id: 'disengage',
    name: 'Disengage',
    actionType: 'shift',
    actionLabel: 'Shift Action',
    ac: null,
    icon: '/icons/phosphor/arrow-u-down-left.svg',
    shortDesc: 'Shift 1m without provoking Attack of Opportunity.',
    requiresTarget: false
  },
  {
    id: 'intercept-melee',
    name: 'Intercept Melee',
    actionType: 'interrupt',
    actionLabel: 'Full + Interrupt',
    ac: null,
    icon: '/icons/phosphor/shield.svg',
    shortDesc: 'Take melee hit meant for adjacent ally',
    requiresTarget: false,
    isInterrupt: true
  },
  {
    id: 'intercept-ranged',
    name: 'Intercept Ranged',
    actionType: 'interrupt',
    actionLabel: 'Full + Interrupt',
    ac: null,
    icon: '/icons/phosphor/shield.svg',
    shortDesc: 'Intercept ranged attack for ally',
    requiresTarget: false,
    isInterrupt: true
  },
  {
    id: 'take-a-breather',
    name: 'Take a Breather',
    actionType: 'full',
    actionLabel: 'Full Action',
    ac: null,
    icon: '/icons/phosphor/wind.svg',
    shortDesc: 'Reset stages, cure volatile status, become Tripped. Must Shift away from enemies.',
    requiresTarget: false
  },
  {
    id: 'take-a-breather-assisted',
    name: 'Take a Breather (Assisted)',
    actionType: 'full',
    actionLabel: 'Full Action',
    ac: null,
    icon: '/icons/phosphor/heart-half.svg',
    shortDesc: 'Assisted breather: reset stages, cure volatile status, Tripped + 0 Evasion (no Vulnerable). Adjacent ally must spend Standard Action.',
    requiresTarget: false
  }
]
