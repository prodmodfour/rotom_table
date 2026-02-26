import { prisma } from '~/server/utils/prisma'
import { calculateCaptureRate, getCaptureDescription } from '~/utils/captureRate'
import { isLegendarySpecies } from '~/constants/legendarySpecies'
import type { StatusCondition } from '~/types'

interface CaptureRateRequest {
  pokemonId?: string
  // Or provide data directly
  level?: number
  currentHp?: number
  maxHp?: number
  species?: string
  statusConditions?: StatusCondition[]
  injuries?: number
  isShiny?: boolean
  isLegendary?: boolean  // GM override for legendary status
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureRateRequest>(event)

  let level: number
  let currentHp: number
  let maxHp: number
  let evolutionStage: number = 1
  let maxEvolutionStage: number = 1
  let statusConditions: StatusCondition[] = []
  let injuries: number = 0
  let isShiny: boolean = false
  let species: string = ''

  if (body.pokemonId) {
    // Look up Pokemon from database
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: body.pokemonId }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    level = pokemon.level
    currentHp = pokemon.currentHp
    maxHp = pokemon.maxHp
    statusConditions = JSON.parse(pokemon.statusConditions || '[]')
    injuries = pokemon.injuries || 0
    isShiny = pokemon.shiny || false
    species = pokemon.species

    // Look up species data for evolution info
    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species }
    })

    if (speciesData) {
      evolutionStage = speciesData.evolutionStage
      maxEvolutionStage = speciesData.maxEvolutionStage
    }
  } else {
    // Use provided data
    if (body.level === undefined || body.currentHp === undefined || body.maxHp === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Must provide pokemonId or (level, currentHp, maxHp)'
      })
    }

    level = body.level
    currentHp = body.currentHp
    maxHp = body.maxHp
    statusConditions = body.statusConditions || []
    injuries = body.injuries || 0
    isShiny = body.isShiny || false
    species = body.species || 'Unknown'

    // Look up species for evolution info if provided
    if (body.species) {
      const speciesData = await prisma.speciesData.findUnique({
        where: { name: body.species }
      })

      if (speciesData) {
        evolutionStage = speciesData.evolutionStage
        maxEvolutionStage = speciesData.maxEvolutionStage
      }
    }
  }

  // Legendary detection: GM override takes priority, otherwise auto-detect from species name
  const isLegendary = body.isLegendary ?? isLegendarySpecies(species)

  const result = calculateCaptureRate({
    level,
    currentHp,
    maxHp,
    evolutionStage,
    maxEvolutionStage,
    statusConditions,
    injuries,
    isShiny,
    isLegendary
  })

  return {
    success: true,
    data: {
      species,
      level,
      currentHp,
      maxHp,
      captureRate: result.captureRate,
      difficulty: getCaptureDescription(result.captureRate),
      canBeCaptured: result.canBeCaptured,
      hpPercentage: Math.round(result.hpPercentage),
      breakdown: result.breakdown
    }
  }
})
