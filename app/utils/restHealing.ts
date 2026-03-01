/**
 * PTU Rest & Healing System
 *
 * Rules:
 * - 30 min rest = heal 1/16th max HP (up to 8 hours/day = 480 min)
 * - Cannot heal HP if 5+ injuries
 * - Each injury reduces effective max HP by 10% (PTU Core Chapter 9)
 * - Extended Rest (4+ hours): clears persistent status, restores AP, daily moves
 * - Pokemon Center: 1 hour base, +30min per injury (or +1hr if 5+ injuries), max 3 injuries/day
 * - Natural injury healing: 1 injury after 24 hours without new injuries
 */

import { STATUS_CONDITION_DEFS } from '~/constants/statusConditions'

/**
 * Compute injury-reduced effective max HP.
 * PTU Core Chapter 9: each injury reduces max HP by 1/10th.
 * Example: 50 maxHp with 3 injuries = floor(50 * 7/10) = 35.
 */
export function getEffectiveMaxHp(maxHp: number, injuries: number): number {
  if (injuries <= 0) return maxHp
  const effectiveInjuries = Math.min(injuries, 10)
  return Math.floor(maxHp * (10 - effectiveInjuries) / 10)
}

// Check if a day has passed since the last reset
export function shouldResetDailyCounters(lastReset: Date | null): boolean {
  if (!lastReset) return true

  const now = new Date()
  const lastResetDate = new Date(lastReset)

  // Check if it's a different calendar day
  return now.toDateString() !== lastResetDate.toDateString()
}

// Calculate HP healed from 30 minutes of rest
export function calculateRestHealing(params: {
  currentHp: number
  maxHp: number
  injuries: number
  restMinutesToday: number
}): { hpHealed: number; canHeal: boolean; reason?: string } {
  const { currentHp, maxHp, injuries, restMinutesToday } = params

  // Cannot heal if 5+ injuries
  if (injuries >= 5) {
    return { hpHealed: 0, canHeal: false, reason: 'Cannot rest-heal with 5+ injuries' }
  }

  // Cannot heal if already at max rest for the day (8 hours = 480 min)
  if (restMinutesToday >= 480) {
    return { hpHealed: 0, canHeal: false, reason: 'Already rested maximum 8 hours today' }
  }

  // Injury-reduced effective max HP (PTU Core Ch.9: each injury reduces max HP by 10%)
  const effectiveMax = getEffectiveMaxHp(maxHp, injuries)

  // Cannot heal if already at effective max HP
  if (currentHp >= effectiveMax) {
    return { hpHealed: 0, canHeal: false, reason: 'Already at full HP' }
  }

  // Healing amount: 1/16th of REAL max HP (PTU p.250: "use the real maximum")
  // decree-029: minimum 1 HP per rest period (house-rule for usability)
  const healAmount = Math.max(1, Math.floor(maxHp / 16))
  // Healing cap: injury-reduced effective max (PTU p.250: "could only heal up to")
  const actualHeal = Math.min(healAmount, effectiveMax - currentHp)

  return { hpHealed: actualHeal, canHeal: true }
}

// Calculate if natural injury healing is available (24 hours since last injury)
export function canHealInjuryNaturally(lastInjuryTime: Date | null): boolean {
  if (!lastInjuryTime) return false

  const now = new Date()
  const injuryTime = new Date(lastInjuryTime)
  const hoursSinceInjury = (now.getTime() - injuryTime.getTime()) / (1000 * 60 * 60)

  return hoursSinceInjury >= 24
}

// Calculate Pokemon Center healing time
export function calculatePokemonCenterTime(injuries: number): {
  baseTime: number // minutes
  injuryTime: number // minutes
  totalTime: number // minutes
  timeDescription: string
} {
  const baseTime = 60 // 1 hour base

  let injuryTime = 0
  if (injuries >= 5) {
    // 1 hour per injury if 5+
    injuryTime = injuries * 60
  } else {
    // 30 min per injury otherwise
    injuryTime = injuries * 30
  }

  const totalTime = baseTime + injuryTime

  // Format time description
  const hours = Math.floor(totalTime / 60)
  const mins = totalTime % 60
  let timeDescription = ''
  if (hours > 0) {
    timeDescription += `${hours} hour${hours > 1 ? 's' : ''}`
    if (mins > 0) timeDescription += ` ${mins} min`
  } else {
    timeDescription = `${mins} min`
  }

  return { baseTime, injuryTime, totalTime, timeDescription }
}

// Calculate how many injuries can be healed at Pokemon Center
export function calculatePokemonCenterInjuryHealing(params: {
  injuries: number
  injuriesHealedToday: number
}): { injuriesHealed: number; remaining: number; atDailyLimit: boolean } {
  const { injuries, injuriesHealedToday } = params

  // Max 3 injuries per day from all sources
  const maxHealable = Math.max(0, 3 - injuriesHealedToday)
  const injuriesHealed = Math.min(injuries, maxHealable)

  return {
    injuriesHealed,
    remaining: injuries - injuriesHealed,
    atDailyLimit: injuriesHealedToday >= 3
  }
}

// Get status conditions that would be cleared by extended rest.
// PTU Core Ch.9: Extended Rest clears persistent conditions.
// Uses category from STATUS_CONDITION_DEFS (decree-038).
export function getStatusesToClear(statusConditions: string[]): string[] {
  return statusConditions.filter(status =>
    STATUS_CONDITION_DEFS[status as keyof typeof STATUS_CONDITION_DEFS]?.category === 'persistent'
  )
}

// Remove persistent status conditions from array.
// Uses category from STATUS_CONDITION_DEFS (decree-038).
export function clearPersistentStatusConditions(statusConditions: string[]): string[] {
  return statusConditions.filter(status =>
    STATUS_CONDITION_DEFS[status as keyof typeof STATUS_CONDITION_DEFS]?.category !== 'persistent'
  )
}

// Calculate rest healing info for display
export interface RestHealingInfo {
  canRestHeal: boolean
  restMinutesRemaining: number
  hpPerRest: number
  injuries: number
  canHealInjuryNaturally: boolean
  hoursSinceLastInjury: number | null
  hoursUntilNaturalHeal: number | null
  injuriesHealedToday: number
  injuriesRemainingToday: number
}

export function getRestHealingInfo(params: {
  maxHp: number
  injuries: number
  restMinutesToday: number
  lastInjuryTime: Date | null
  injuriesHealedToday: number
}): RestHealingInfo {
  const { maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday } = params

  const canRestHeal = injuries < 5 && restMinutesToday < 480
  const restMinutesRemaining = Math.max(0, 480 - restMinutesToday)
  // decree-029: minimum 1 HP per rest period (house-rule for usability)
  const hpPerRest = Math.max(1, Math.floor(maxHp / 16))

  let hoursSinceLastInjury: number | null = null
  let hoursUntilNaturalHeal: number | null = null

  if (lastInjuryTime) {
    const now = new Date()
    hoursSinceLastInjury = (now.getTime() - new Date(lastInjuryTime).getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastInjury < 24) {
      hoursUntilNaturalHeal = 24 - hoursSinceLastInjury
    }
  }

  return {
    canRestHeal,
    restMinutesRemaining,
    hpPerRest,
    injuries,
    canHealInjuryNaturally: canHealInjuryNaturally(lastInjuryTime),
    hoursSinceLastInjury,
    hoursUntilNaturalHeal,
    injuriesHealedToday,
    injuriesRemainingToday: Math.max(0, 3 - injuriesHealedToday)
  }
}

/**
 * Check if a daily-frequency move is eligible for Extended Rest refresh.
 * PTU Core p.252: "Daily-Frequency Moves are also regained during an
 * Extended Rest, if the Move hasn't been used since the previous day."
 *
 * A move used today cannot be refreshed by tonight's Extended Rest.
 * Only moves used before today (yesterday or earlier) are eligible.
 */
export function isDailyMoveRefreshable(lastUsedAt: string | null | undefined): boolean {
  if (!lastUsedAt) return true // No usage record → eligible
  const usedDate = new Date(lastUsedAt)
  const today = new Date()
  return usedDate.toDateString() !== today.toDateString()
}

/**
 * Calculate max Action Points for a trainer.
 * Per PTU Core (p221): Trainers have 5 AP + 1 more for every 5 Trainer Levels.
 * Level 1 = 5 AP, Level 5 = 6 AP, Level 10 = 7 AP, Level 15 = 8 AP.
 */
export function calculateMaxAp(level: number): number {
  return 5 + Math.floor(level / 5)
}

/**
 * Calculate available AP accounting for bound and drained AP.
 * Per PTU Core (p221):
 *   - Bound AP remains off-limits until the binding effect ends
 *   - Drained AP remains unavailable until Extended Rest
 *   - Total available = max AP - bound AP - drained AP
 */
export function calculateAvailableAp(maxAp: number, boundAp: number, drainedAp: number): number {
  return Math.max(0, maxAp - boundAp - drainedAp)
}

/**
 * Calculate available AP after scene-end restoration.
 * Per PTU Core (p221): AP is completely regained at the end of each Scene.
 * Drained AP remains unavailable until Extended Rest.
 * Bound AP remains off-limits until the binding effect ends.
 */
export function calculateSceneEndAp(level: number, drainedAp: number, boundAp: number = 0): number {
  const maxAp = calculateMaxAp(level)
  return calculateAvailableAp(maxAp, boundAp, drainedAp)
}
