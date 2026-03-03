/**
 * Movement modifier calculations for PTU combat.
 *
 * Extracted to a shared utility so both client-side composables
 * and server-side services can apply movement modifiers consistently.
 *
 * PTU Rules:
 * - Stuck: cannot Shift at all — effective speed 0 (PTU 1.05 p.231)
 * - Tripped: must spend Shift Action to stand up — effective speed 0 (PTU 1.05 p.251)
 * - Slowed: reduce all movement speeds by half
 * - Speed CS: additive bonus/penalty of half stage value (PTU 1.05 p.234), min 2
 * - Sprint (tempCondition): +50% movement speed for the turn
 */

import type { Combatant } from '~/types/encounter'

/**
 * Apply movement-modifying conditions and combat stage effects to base speed.
 *
 * Exported as a pure function for use in both client composables and server services.
 *
 * @param combatant - The combatant whose conditions affect the speed
 * @param speed - The base speed to modify
 * @returns The modified speed after applying all movement conditions
 */
export function applyMovementModifiers(combatant: Combatant, speed: number): number {
  let modifiedSpeed = speed
  const conditions = combatant.entity.statusConditions ?? []
  const tempConditions = combatant.tempConditions ?? []

  // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
  if (conditions.includes('Stuck')) {
    return 0
  }

  // Tripped: must spend Shift Action to stand up before moving (PTU 1.05 p.251)
  if (conditions.includes('Tripped') || tempConditions.includes('Tripped')) {
    return 0
  }

  // Slowed: reduce all movement speeds by half
  if (conditions.includes('Slowed')) {
    modifiedSpeed = Math.floor(modifiedSpeed / 2)
  }

  // Speed Combat Stage modifier (-6 to +6): additive bonus/penalty
  // PTU 1.05 p.234: "bonus or penalty to all Movement Speeds equal to
  // half your current Speed Combat Stage value rounded down"
  const speedStage = combatant.entity.stageModifiers?.speed ?? 0
  if (speedStage !== 0) {
    const clamped = Math.max(-6, Math.min(6, speedStage))
    const stageBonus = Math.trunc(clamped / 2)
    modifiedSpeed = modifiedSpeed + stageBonus
    // PTU 1.05 p.700: negative CS may never reduce movement below 2
    if (stageBonus < 0) {
      modifiedSpeed = Math.max(modifiedSpeed, 2)
    }
  }

  // Sprint: +50% movement speed for the turn (tracked as tempCondition)
  if (tempConditions.includes('Sprint')) {
    modifiedSpeed = Math.floor(modifiedSpeed * 1.5)
  }

  // Minimum speed is 1 (can always move at least 1 cell unless at 0)
  return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
}
