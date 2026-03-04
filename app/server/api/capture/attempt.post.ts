import { prisma } from '~/server/utils/prisma'
import { calculateCaptureRate, attemptCapture, getCaptureDescription } from '~/utils/captureRate'
import { isLegendarySpecies } from '~/constants/legendarySpecies'
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'
import type { BallConditionContext } from '~/constants/pokeBalls'
import { applyTrainerXp, isNewSpecies } from '~/utils/trainerExperience'
import type { TrainerXpResult } from '~/utils/trainerExperience'
import { broadcast } from '~/server/utils/websocket'
import { buildConditionContext } from '~/server/services/ball-condition.service'
import type { StatusCondition } from '~/types'

interface CaptureAttemptRequest {
  pokemonId: string
  trainerId: string
  accuracyRoll?: number  // The accuracy check roll (to detect nat 20)
  /** Accuracy threshold computed by the client (decree-042: includes accuracy stages, evasion, terrain).
   *  When provided, the server validates roll >= threshold instead of hardcoded AC 6.
   *  Must be >= 1. Falls back to 6 (base Poke Ball AC) when omitted for backwards compat. */
  accuracyThreshold?: number
  ballType?: string      // Key in POKE_BALL_CATALOG (default: 'Basic Ball')
  modifiers?: number     // Additional non-ball modifiers (features, equipment)
  encounterId?: string   // Active encounter ID (for round tracking, active Pokemon lookup)
  /** GM overrides for ball condition context (e.g., isDarkOrLowLight, targetWasBaited) */
  conditionContext?: Partial<BallConditionContext>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureAttemptRequest>(event)

  if (!body.pokemonId || !body.trainerId) {
    throw createError({
      statusCode: 400,
      message: 'pokemonId and trainerId are required'
    })
  }

  // PTU p.214: Server-side accuracy validation (decree-042).
  // Uses client-provided threshold (which includes accuracy stages, Speed Evasion,
  // flanking, and rough terrain per the full accuracy system), falling back to
  // base AC 6 when threshold is not provided (backwards compatibility).
  // Natural 1 always misses, natural 20 always hits, otherwise roll >= threshold.
  if (body.accuracyRoll !== undefined) {
    if (typeof body.accuracyRoll !== 'number'
      || !Number.isInteger(body.accuracyRoll)
      || body.accuracyRoll < 1
      || body.accuracyRoll > 20) {
      throw createError({
        statusCode: 400,
        message: 'accuracyRoll must be an integer between 1 and 20'
      })
    }

    // Validate threshold if provided.
    // The server trusts the client-provided threshold because this is a single-user
    // GM tool (no adversarial clients), and full server-side recomputation would
    // require encounter context (combatant positions, terrain grid, flanking
    // geometry) that is not available in this endpoint.
    const threshold = body.accuracyThreshold ?? 6
    if (typeof threshold !== 'number' || !Number.isInteger(threshold) || threshold < 1) {
      throw createError({
        statusCode: 400,
        message: 'accuracyThreshold must be a positive integer'
      })
    }

    const roll = body.accuracyRoll
    const isNat1 = roll === 1
    const isNat20 = roll === 20
    const hits = isNat1 ? false : (isNat20 ? true : roll >= threshold)

    if (!hits) {
      throw createError({
        statusCode: 400,
        message: isNat1
          ? 'Natural 1 — ball missed! (auto-miss)'
          : `Accuracy roll ${roll} does not meet threshold ${threshold} — ball missed`
      })
    }
  }

  // Look up Pokemon
  const pokemon = await prisma.pokemon.findUnique({
    where: { id: body.pokemonId }
  })

  if (!pokemon) {
    throw createError({
      statusCode: 404,
      message: 'Pokemon not found'
    })
  }

  // PTU capture rules target wild Pokemon only — owned Pokemon cannot be captured
  if (pokemon.ownerId) {
    throw createError({
      statusCode: 400,
      message: 'Cannot capture an owned Pokemon'
    })
  }

  // Look up Trainer
  const trainer = await prisma.humanCharacter.findUnique({
    where: { id: body.trainerId }
  })

  if (!trainer) {
    throw createError({
      statusCode: 404,
      message: 'Trainer not found'
    })
  }

  // Get species data for evolution info and ball condition context
  const speciesData = await prisma.speciesData.findUnique({
    where: { name: pokemon.species }
  })

  const evolutionStage = speciesData?.evolutionStage || 1
  const maxEvolutionStage = speciesData?.maxEvolutionStage || evolutionStage

  // Legendary detection: auto-detect from species name
  const isLegendary = isLegendarySpecies(pokemon.species)

  // Calculate capture rate
  const rateResult = calculateCaptureRate({
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    evolutionStage,
    maxEvolutionStage,
    statusConditions: JSON.parse(pokemon.statusConditions || '[]') as StatusCondition[],
    injuries: pokemon.injuries || 0,
    isShiny: pokemon.shiny || false,
    isLegendary
  })

  // Check if capture is possible
  if (!rateResult.canBeCaptured) {
    return {
      success: false,
      data: {
        captured: false,
        reason: 'Pokemon is at 0 HP and cannot be captured',
        captureRate: rateResult.captureRate,
        difficulty: getCaptureDescription(rateResult.captureRate)
      }
    }
  }

  // Was the accuracy check a critical hit (natural 20)?
  const criticalHit = body.accuracyRoll === 20

  // Ball type resolution and validation
  const ballType = body.ballType || DEFAULT_BALL_TYPE
  const ballDef = POKE_BALL_CATALOG[ballType]

  if (body.ballType && !ballDef) {
    throw createError({
      statusCode: 400,
      message: `Unknown ball type: ${body.ballType}`
    })
  }

  // Build ball condition context from DB data
  const conditionContext = await buildConditionContext(
    pokemon, speciesData, trainer, body.encounterId, body.conditionContext
  )

  const ballResult = calculateBallModifier(ballType, conditionContext)

  // Attempt capture with ball modifier separated from other modifiers
  const captureResult = attemptCapture(
    rateResult.captureRate,
    trainer.level,
    body.modifiers || 0,
    criticalHit,
    ballResult.total
  )

  // Track species XP data for the response
  let speciesXpAwarded = false
  let speciesXpResult: TrainerXpResult | null = null

  // Track post-capture effect
  let postCaptureEffect: { type: string; description: string } | undefined

  // If captured, auto-link Pokemon to trainer and update origin
  if (captureResult.success) {
    await prisma.pokemon.update({
      where: { id: body.pokemonId },
      data: {
        ownerId: body.trainerId,
        origin: 'captured'
      }
    })

    // Apply post-capture effects based on ball type
    if (ballDef?.postCaptureEffect === 'heal_full') {
      // Heal Ball: restore to real max HP (decree-015: use real max HP)
      // PTU p.273: "A caught Pokemon will heal to Max HP immediately upon capture."
      await prisma.pokemon.update({
        where: { id: body.pokemonId },
        data: { currentHp: pokemon.maxHp }
      })
      postCaptureEffect = {
        type: 'heal_full',
        description: `${pokemon.species} was healed to full HP (${pokemon.maxHp}) by the Heal Ball.`,
      }
    } else if (ballDef?.postCaptureEffect === 'loyalty_plus_one') {
      // Friend Ball: +1 Loyalty (PTU p.279)
      const currentLoyalty = (pokemon as any).loyalty ?? 2
      const newLoyalty = Math.min(6, currentLoyalty + 1)
      await prisma.pokemon.update({
        where: { id: body.pokemonId },
        data: { loyalty: newLoyalty } as any
      })
      postCaptureEffect = {
        type: 'loyalty_plus_one',
        description: `${pokemon.species} starts with +1 Loyalty (Friend Ball). Loyalty: ${currentLoyalty} -> ${newLoyalty}.`,
      }
    } else if (ballDef?.postCaptureEffect === 'raised_happiness') {
      // Luxury Ball: raised happiness (no mechanical effect yet — happiness not tracked)
      postCaptureEffect = {
        type: 'raised_happiness',
        description: `${pokemon.species} is easily pleased and starts with raised happiness (Luxury Ball).`,
      }
    }

    // Check for new species -> +1 trainer XP (PTU Core p.461)
    const trainerRecord = await prisma.humanCharacter.findUnique({
      where: { id: body.trainerId },
      select: { ownedSpecies: true, trainerXp: true, level: true, name: true }
    })

    if (trainerRecord) {
      const existingSpecies: string[] = JSON.parse(trainerRecord.ownedSpecies || '[]')
      const normalizedSpecies = pokemon.species.toLowerCase().trim()

      if (isNewSpecies(pokemon.species, existingSpecies)) {
        const updatedSpecies = [...existingSpecies, normalizedSpecies]

        const xpCalc = applyTrainerXp({
          currentXp: trainerRecord.trainerXp,
          currentLevel: trainerRecord.level,
          xpToAdd: 1
        })

        await prisma.humanCharacter.update({
          where: { id: body.trainerId },
          data: {
            ownedSpecies: JSON.stringify(updatedSpecies),
            trainerXp: xpCalc.newXp,
            level: xpCalc.newLevel
          }
        })

        speciesXpAwarded = true
        speciesXpResult = xpCalc

        if (xpCalc.levelsGained > 0) {
          broadcast({ type: 'character_update', data: { characterId: body.trainerId } })
        }
      }
    }
  }

  // Broadcast capture attempt to all connected clients (Group View, Player View)
  broadcast({
    type: 'capture_attempt',
    data: {
      pokemonId: body.pokemonId,
      trainerId: body.trainerId,
      trainerName: trainer.name,
      pokemonSpecies: pokemon.species,
      ballType,
      captured: captureResult.success,
      roll: captureResult.roll,
      modifiedRoll: captureResult.modifiedRoll,
      captureRate: rateResult.captureRate,
      ballModifier: ballResult.total,
      postCaptureEffect: postCaptureEffect?.type,
    }
  })

  return {
    success: true,
    data: {
      captured: captureResult.success,
      roll: captureResult.roll,
      modifiedRoll: captureResult.modifiedRoll,
      captureRate: rateResult.captureRate,
      effectiveCaptureRate: captureResult.effectiveCaptureRate,
      naturalHundred: captureResult.naturalHundred,
      criticalHit,
      trainerLevel: trainer.level,
      modifiers: body.modifiers || 0,
      ballModifier: ballResult.total,
      ballType,
      difficulty: getCaptureDescription(rateResult.captureRate),
      breakdown: rateResult.breakdown,
      ballBreakdown: {
        baseModifier: ballResult.base,
        conditionalModifier: ballResult.conditional,
        conditionMet: ballResult.conditionMet,
        conditionDescription: ballResult.description ?? ballDef?.conditionDescription,
      },
      pokemon: {
        id: pokemon.id,
        species: pokemon.species,
        level: pokemon.level,
        // If Heal Ball was used, show the healed HP in the response
        currentHp: (captureResult.success && ballDef?.postCaptureEffect === 'heal_full')
          ? pokemon.maxHp
          : pokemon.currentHp,
        maxHp: pokemon.maxHp,
        hpPercentage: Math.round(rateResult.hpPercentage),
        ownerId: captureResult.success ? body.trainerId : pokemon.ownerId,
        origin: captureResult.success ? 'captured' : pokemon.origin
      },
      trainer: {
        id: trainer.id,
        name: trainer.name,
        level: trainer.level
      },
      postCaptureEffect,
      speciesXp: captureResult.success ? {
        awarded: speciesXpAwarded,
        species: pokemon.species,
        xpResult: speciesXpResult
      } : undefined
    }
  }
})

