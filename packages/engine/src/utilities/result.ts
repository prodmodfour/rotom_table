/**
 * Core EffectResult construction and merging utilities.
 *
 * Per effect-handler-contract.md — handlers compose results using merge().
 * noEffect() returns an empty result. intercept() signals event blocking.
 */

import type { EntityId, StateDelta, EntityWriteDelta, EncounterDelta } from '../types'
import type { EffectResult, CombatEvent, PendingModification, EmbeddedActionSpec, TriggeredEffect } from '../types'

/** Returns an empty EffectResult — no state changes, no events */
export function noEffect(): EffectResult {
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

/** Signals that the pending event should be blocked entirely */
export function intercept(): EffectResult {
  return {
    ...noEffect(),
    intercepted: true,
  }
}

/**
 * Merge multiple EffectResults into one.
 *
 * Per effect-handler-contract.md merging rules:
 * - combatantDeltas: merge by entity ID (additive fields sum, replacement last-writer-wins, mutations concatenate)
 * - encounterDelta: mutations concatenate
 * - events: concatenate in order
 * - triggers: concatenate
 * - success: last-writer-wins
 * - intercepted: true if any result is intercepted
 * - embeddedActions: concatenate
 * - pendingModifications: concatenate
 */
export function merge(...results: EffectResult[]): EffectResult {
  const merged = noEffect()

  for (const result of results) {
    // Merge combatant deltas
    for (const [entityId, delta] of result.combatantDeltas) {
      const existing = merged.combatantDeltas.get(entityId)
      if (existing) {
        merged.combatantDeltas.set(entityId, mergeStateDeltas(existing, delta))
      } else {
        merged.combatantDeltas.set(entityId, { ...delta })
      }
    }

    // Merge entity write deltas
    for (const [entityId, delta] of result.entityWriteDeltas) {
      const existing = merged.entityWriteDeltas.get(entityId)
      if (existing) {
        merged.entityWriteDeltas.set(entityId, { ...existing, ...delta })
      } else {
        merged.entityWriteDeltas.set(entityId, { ...delta })
      }
    }

    // Merge encounter deltas
    if (result.encounterDelta) {
      merged.encounterDelta = mergeEncounterDeltas(merged.encounterDelta, result.encounterDelta)
    }

    // Concatenate arrays
    merged.events.push(...result.events)
    merged.triggers.push(...result.triggers)
    merged.embeddedActions.push(...result.embeddedActions)
    merged.pendingModifications.push(...result.pendingModifications)

    // Last-writer-wins for success
    merged.success = result.success

    // Any interception wins
    if (result.intercepted) merged.intercepted = true
  }

  return merged
}

/** Merge two StateDelta objects for the same entity */
function mergeStateDeltas(a: StateDelta, b: StateDelta): StateDelta {
  const merged: StateDelta = { ...a }

  // Additive fields
  if (b.hpDelta !== undefined) merged.hpDelta = (merged.hpDelta ?? 0) + b.hpDelta
  if (b.injuries !== undefined) merged.injuries = (merged.injuries ?? 0) + b.injuries
  if (b.energyCurrent !== undefined) merged.energyCurrent = (merged.energyCurrent ?? 0) + b.energyCurrent
  if (b.mettlePoints !== undefined) merged.mettlePoints = (merged.mettlePoints ?? 0) + b.mettlePoints
  if (b.fatigueLevel !== undefined) merged.fatigueLevel = (merged.fatigueLevel ?? 0) + b.fatigueLevel

  // Additive-with-clamp (combat stages)
  if (b.combatStages) {
    merged.combatStages = merged.combatStages ?? {}
    for (const [key, value] of Object.entries(b.combatStages)) {
      const existing = (merged.combatStages as Record<string, number | undefined>)[key] ?? 0
      ;(merged.combatStages as Record<string, number>)[key] = existing + (value ?? 0)
    }
  }

  // Replacement fields (last-writer-wins)
  if (b.tempHp !== undefined) merged.tempHp = b.tempHp
  if (b.position !== undefined) merged.position = b.position
  if (b.initiativeOverride !== undefined) merged.initiativeOverride = b.initiativeOverride
  if (b.actedThisRound !== undefined) merged.actedThisRound = b.actedThisRound
  if (b.stealthRockHitThisEncounter !== undefined) merged.stealthRockHitThisEncounter = b.stealthRockHitThisEncounter
  if (b.actionBudget !== undefined) merged.actionBudget = { ...merged.actionBudget, ...b.actionBudget }
  if (b.outOfTurnUsage !== undefined) merged.outOfTurnUsage = { ...merged.outOfTurnUsage, ...b.outOfTurnUsage }

  // Mutation fields (concatenate)
  if (b.statusConditions) {
    merged.statusConditions = [...(merged.statusConditions ?? []), ...b.statusConditions]
  }
  if (b.volatileConditions) {
    merged.volatileConditions = [...(merged.volatileConditions ?? []), ...b.volatileConditions]
  }
  if (b.activeEffects) {
    merged.activeEffects = [...(merged.activeEffects ?? []), ...b.activeEffects]
  }

  return merged
}

/** Merge two EncounterDeltas by concatenating mutations */
function mergeEncounterDeltas(a: EncounterDelta | null, b: EncounterDelta): EncounterDelta {
  if (!a) return { ...b }

  return {
    weather: b.weather ?? a.weather,
    terrain: b.terrain ?? a.terrain,
    hazards: [...(a.hazards ?? []), ...(b.hazards ?? [])],
    blessings: [...(a.blessings ?? []), ...(b.blessings ?? [])],
    coats: [...(a.coats ?? []), ...(b.coats ?? [])],
    vortexes: [...(a.vortexes ?? []), ...(b.vortexes ?? [])],
    deploymentChanges: [...(a.deploymentChanges ?? []), ...(b.deploymentChanges ?? [])],
  }
}
