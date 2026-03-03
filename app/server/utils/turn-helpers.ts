/**
 * Turn Processing Helpers
 *
 * Helper functions extracted from next-turn.post.ts for turn lifecycle management.
 * These handle combatant state resets, phase transitions, and skip logic
 * for League Battle and Full Contact turn progression.
 */

import { getOverlandSpeed } from '~/utils/combatantCapabilities'
import { applyMovementModifiers } from '~/utils/movementModifiers'
import type { TrainerDeclaration } from '~/types/combat'

/**
 * Reset a trainer's turn state during resolution phase so they can execute
 * their declared action. Trainers get fresh action economy during resolution.
 * Acceptable mutation here because combatants are freshly parsed from JSON.
 */
export function resetResolvingTrainerTurnState(combatants: any[], combatantId: string) {
  const trainer = combatants.find((c: any) => c.id === combatantId)
  if (trainer) {
    trainer.hasActed = false
    trainer.actionsRemaining = 2
    trainer.shiftActionsRemaining = 1
    // Clear temporary conditions (Sprint, Tripped, etc.) that last "until next turn".
    // These were skipped during declaration phase — the resolution turn is the trainer's actual turn.
    trainer.tempConditions = []
    // Preserve forfeit flags from item use (PTU p.276, feature-020 P2)
    const forfeitStandard = trainer.turnState?.forfeitStandardAction === true
    const forfeitShift = trainer.turnState?.forfeitShiftAction === true
    trainer.turnState = {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
      ...(forfeitStandard && { forfeitStandardAction: true }),
      ...(forfeitShift && { forfeitShiftAction: true })
    }
  }
}

/**
 * Reset hasActed for all trainers entering the resolution phase.
 * Declaration phase marked them as acted for turn progression purposes,
 * but their actual turn is in resolution — clear hasActed so the UI
 * doesn't show them as already acted.
 * Acceptable mutation here because combatants are freshly parsed from JSON.
 */
export function resetAllTrainersForResolution(combatants: any[], resolutionOrder: string[]) {
  const trainerIds = new Set(resolutionOrder)
  combatants.forEach((c: any) => {
    if (trainerIds.has(c.id)) {
      c.hasActed = false
    }
  })
}

/**
 * Reset all combatants for a new round by mutating each object in the array.
 * Acceptable here because combatants are freshly parsed from JSON (no shared references).
 *
 * Handles skipNextRound (Advanced Priority penalty, P1):
 * If a combatant has skipNextRound=true, they are pre-marked as acted
 * and the flag is cleared for subsequent rounds.
 */
export function resetCombatantsForNewRound(combatants: any[]) {
  combatants.forEach((c: any) => {
    // Check for Advanced Priority / Interrupt penalty (P1 spec B4, F3)
    const shouldSkip = c.skipNextRound === true
    if (shouldSkip) {
      c.hasActed = true // Pre-mark as acted so they skip their turn
      c.actionsRemaining = 0
      c.shiftActionsRemaining = 0
    } else {
      c.hasActed = false
      c.actionsRemaining = 2
      c.shiftActionsRemaining = 1
    }
    c.skipNextRound = false // Always clear the flag
    c.readyAction = null
    // Preserve forfeit flags from item use (PTU p.276, feature-020 P2)
    // These persist across round boundaries until the combatant's next turn
    const forfeitStandard = c.turnState?.forfeitStandardAction === true
    const forfeitShift = c.turnState?.forfeitShiftAction === true
    c.turnState = {
      hasActed: shouldSkip,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
      ...(forfeitStandard && { forfeitStandardAction: true }),
      ...(forfeitShift && { forfeitShiftAction: true })
    }
    // Reset out-of-turn action usage for new round (feature-016)
    c.outOfTurnUsage = {
      aooUsed: false,
      priorityUsed: false,
      interruptUsed: false
    }
    c.disengaged = false
    // Reset hold action state for new round (P1)
    c.holdAction = {
      isHolding: false,
      holdUntilInitiative: null,
      holdUsedThisRound: false
    }
    // Reset mount movement for new round (feature-004)
    // Apply movement modifiers (Slowed, Speed CS, Sprint) from the mount's conditions
    // ONCE here so the client returns movementRemaining directly without re-applying.
    if (c.mountState) {
      if (!c.mountState.isMounted) {
        // This is the mount -- recalculate from its own modified Overland speed
        const mountSpeed = applyMovementModifiers(c, getOverlandSpeed(c))
        c.mountState = { ...c.mountState, movementRemaining: mountSpeed }
      } else {
        // This is the rider -- sync movement with mount partner's modified speed
        const mountPartner = combatants.find((p: any) => p.id === c.mountState.partnerId)
        if (mountPartner) {
          const mountSpeed = applyMovementModifiers(mountPartner, getOverlandSpeed(mountPartner))
          c.mountState = { ...c.mountState, movementRemaining: mountSpeed }
        }
      }
    }
  })
}

/**
 * Auto-skip fainted trainers during declaration phase (edge case H1).
 * A fainted trainer cannot declare actions. Advances currentTurnIndex
 * past any fainted trainers. Returns the updated index.
 */
export function skipFaintedTrainers(
  startIndex: number,
  turnOrder: string[],
  combatants: any[]
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const combatant = combatants.find((c: any) => c.id === combatantId)
    // Stop at the first non-fainted trainer (HP > 0)
    if (combatant && combatant.entity.currentHp > 0) break
    index++
  }
  return index
}

/**
 * Auto-skip trainers with no declaration during resolution phase (edge case H1).
 * If a trainer was fainted during declaration (or otherwise has no declaration),
 * they have nothing to resolve. Advances currentTurnIndex past them.
 * Returns the updated index.
 */
export function skipUndeclaredTrainers(
  startIndex: number,
  turnOrder: string[],
  declarations: TrainerDeclaration[],
  currentRound: number
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const hasDeclaration = declarations.some(
      d => d.combatantId === combatantId && d.round === currentRound
    )
    if (hasDeclaration) break
    index++
  }
  return index
}

/**
 * Auto-skip Pokemon that cannot be commanded this round (P1 Section G).
 * PTU p.229: "they cannot command the Pokemon that was Released as part
 * of the Switch for the remainder of the Round"
 *
 * This occurs when a Pokemon was switched in during a League Battle
 * and the switch was NOT a fainted/forced switch.
 * Skips only non-fainted Pokemon with canBeCommanded=false.
 * Marks skipped Pokemon as having acted (they lose their turn).
 */
export function skipUncommandablePokemon(
  startIndex: number,
  turnOrder: string[],
  combatants: any[]
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const combatant = combatants.find((c: any) => c.id === combatantId)
    if (!combatant) { index++; continue }
    // Only skip if cannot be commanded AND not fainted (fainted skip is separate)
    if (combatant.turnState?.canBeCommanded === false && combatant.entity.currentHp > 0) {
      combatant.hasActed = true
      index++
      continue
    }
    break
  }
  return index
}

/**
 * Decrement weather duration at end of round (PTU: weather lasts N rounds).
 * Returns new weather state without mutating inputs.
 */
export function decrementWeather(
  weather: string | null,
  weatherDuration: number,
  weatherSource: string | null
): { weather: string | null; weatherDuration: number; weatherSource: string | null } {
  if (weather && weatherDuration > 0 && weatherSource !== 'manual') {
    const newDuration = weatherDuration - 1
    if (newDuration <= 0) {
      return { weather: null, weatherDuration: 0, weatherSource: null }
    }
    return { weather, weatherDuration: newDuration, weatherSource }
  }
  return { weather, weatherDuration, weatherSource }
}
