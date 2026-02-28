/**
 * Apply damage to a combatant with PTU mechanics
 *
 * After damage application, this endpoint also handles:
 * - Heavily Injured penalty: 5+ injuries causes additional HP loss (PTU p.250)
 * - Death check: 10+ injuries OR HP below death threshold (PTU p.251)
 * - League Battle exemption: HP-based death suppressed (decree-021)
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse } from '~/server/services/encounter.service'
import { calculateDamage, applyDamageToEntity } from '~/server/services/combatant.service'
import { syncDamageToDatabase, syncStagesToDatabase } from '~/server/services/entity-update.service'
import { checkHeavilyInjured, applyHeavilyInjuredPenalty, checkDeath } from '~/utils/injuryMechanics'
import type { StatusCondition } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId || typeof body.damage !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'combatantId and damage are required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)
    const entity = combatant.entity
    const isLeagueBattle = record.battleType === 'trainer'

    // Capture pre-damage HP for unclamped calculation
    const hpBeforeDamage = entity.currentHp

    // Calculate damage with PTU mechanics
    const damageResult = calculateDamage(
      body.damage,
      hpBeforeDamage,
      entity.maxHp,
      entity.temporaryHp || 0,
      entity.injuries || 0
    )

    // Apply damage to combatant entity (mutates entity)
    applyDamageToEntity(combatant, damageResult)

    // Unclamped HP after damage (before heavily injured penalty)
    // calculateDamage clamps to 0, but the actual value can go negative
    const unclampedAfterDamage = hpBeforeDamage - damageResult.hpDamage

    // --- Heavily Injured penalty (PTU p.250) ---
    // "takes Damage from an attack, they lose Hit Points equal to the number of Injuries"
    // Uses the NEW injury count (damage may have added injuries)
    const heavilyInjuredCheck = checkHeavilyInjured(damageResult.newInjuries)
    let heavilyInjuredHpLoss = 0

    if (heavilyInjuredCheck.isHeavilyInjured && entity.currentHp > 0) {
      const penalty = applyHeavilyInjuredPenalty(entity.currentHp, damageResult.newInjuries)
      heavilyInjuredHpLoss = penalty.hpLost
      entity.currentHp = penalty.newHp

      // Check if heavily injured penalty caused fainting
      if (penalty.newHp === 0 && !damageResult.fainted) {
        const currentConditions: StatusCondition[] = entity.statusConditions || []
        if (!currentConditions.includes('Fainted')) {
          entity.statusConditions = ['Fainted', ...currentConditions]
        }
      }
    }

    // --- Death check (PTU p.251) ---
    // Use unclamped HP for death threshold: pre-damage HP - hpDamage - heavilyInjuredPenalty
    const finalUnclampedHp = unclampedAfterDamage - heavilyInjuredHpLoss

    const deathCheck = checkDeath(
      entity.currentHp,
      entity.maxHp,
      damageResult.newInjuries,
      isLeagueBattle,
      finalUnclampedHp
    )

    // Apply death status if conditions met (unless GM has suppressed via body.suppressDeath)
    if (deathCheck.isDead && !body.suppressDeath) {
      const currentConditions: StatusCondition[] = entity.statusConditions || []
      if (!currentConditions.includes('Dead')) {
        entity.statusConditions = ['Dead', ...currentConditions.filter(s => s !== 'Dead')]
      }
    }

    // Sync to database — use entity.currentHp which may include heavily injured penalty
    await syncDamageToDatabase(
      combatant,
      entity.currentHp,
      damageResult.newTempHp,
      damageResult.newInjuries,
      entity.statusConditions || [],
      damageResult.injuryGained
    )

    // Sync reversed stageModifiers when fainted (decree-005: status CS effects are
    // reversed on faint by applyDamageToEntity, but syncDamageToDatabase doesn't
    // include stageModifiers — sync them separately)
    if (damageResult.fainted && entity.stageModifiers) {
      await syncStagesToDatabase(combatant, entity.stageModifiers)
    }

    // Track defeated enemies for XP
    let defeatedEnemies = JSON.parse(record.defeatedEnemies)
    const isDefeated = damageResult.fainted || deathCheck.isDead
    if (isDefeated && combatant.side === 'enemies') {
      const entityName = combatant.type === 'pokemon'
        ? (entity as { species: string }).species
        : (entity as { name: string }).name
      defeatedEnemies.push({
        species: entityName,
        level: entity.level,
        type: combatant.type
      })
    }

    await saveEncounterCombatants(id, combatants, { defeatedEnemies })

    const response = buildEncounterResponse(record, combatants, { defeatedEnemies })

    return {
      success: true,
      data: response,
      damageResult: {
        combatantId: body.combatantId,
        ...damageResult,
        // Heavily injured penalty info
        heavilyInjured: heavilyInjuredCheck.isHeavilyInjured,
        heavilyInjuredHpLoss,
        // Death check info
        deathCheck: {
          isDead: deathCheck.isDead,
          cause: deathCheck.cause,
          leagueSuppressed: deathCheck.leagueSuppressed
        }
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to apply damage'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
