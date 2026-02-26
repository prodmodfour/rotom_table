import { prisma } from '~/server/utils/prisma'
import { calculateCaptureRate, attemptCapture, getCaptureDescription } from '~/utils/captureRate'
import { isLegendarySpecies } from '~/constants/legendarySpecies'
import type { StatusCondition } from '~/types'

interface CaptureAttemptRequest {
  pokemonId: string
  trainerId: string
  accuracyRoll?: number  // The accuracy check roll (to detect nat 20)
  modifiers?: number     // Equipment/feature/ball modifiers (pre-calculated by GM)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureAttemptRequest>(event)

  if (!body.pokemonId || !body.trainerId) {
    throw createError({
      statusCode: 400,
      message: 'pokemonId and trainerId are required'
    })
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

  // Get species data for evolution info
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

  // Attempt capture
  const captureResult = attemptCapture(
    rateResult.captureRate,
    trainer.level,
    body.modifiers || 0,
    criticalHit
  )

  // If captured, auto-link Pokemon to trainer and update origin
  if (captureResult.success) {
    await prisma.pokemon.update({
      where: { id: body.pokemonId },
      data: {
        ownerId: body.trainerId,
        origin: 'captured'
      }
    })
  }

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
      difficulty: getCaptureDescription(rateResult.captureRate),
      breakdown: rateResult.breakdown,
      pokemon: {
        id: pokemon.id,
        species: pokemon.species,
        level: pokemon.level,
        currentHp: pokemon.currentHp,
        maxHp: pokemon.maxHp,
        hpPercentage: Math.round(rateResult.hpPercentage),
        ownerId: captureResult.success ? body.trainerId : pokemon.ownerId,
        origin: captureResult.success ? 'captured' : pokemon.origin
      },
      trainer: {
        id: trainer.id,
        name: trainer.name,
        level: trainer.level
      }
    }
  }
})
