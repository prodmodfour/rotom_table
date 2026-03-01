/**
 * POST /api/pokemon/:id/assign-ability
 *
 * Assign a new ability to a Pokemon at a Level 20 or Level 40 milestone.
 *
 * Body: {
 *   abilityName: string,     // Name of the ability to assign
 *   milestone: 'second' | 'third'  // Which milestone
 * }
 *
 * Validation:
 * 1. Pokemon must exist
 * 2. Pokemon's level must be >= 20 (for second) or >= 40 (for third)
 * 3. Pokemon must not already have the target number of abilities
 *    (second: must have < 2, third: must have < 3)
 * 4. Ability must be in the valid pool for the milestone
 * 5. Ability must exist in AbilityData (to fetch effect text)
 *
 * PTU Core p.200: Level 20 = Second Ability, Level 40 = Third Ability
 */

import { prisma } from '~/server/utils/prisma'
import { getAbilityPool } from '~/utils/abilityAssignment'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Pokemon ID is required' })
  }

  if (!body?.abilityName || typeof body.abilityName !== 'string') {
    throw createError({ statusCode: 400, message: 'abilityName is required' })
  }

  if (body.milestone !== 'second' && body.milestone !== 'third') {
    throw createError({ statusCode: 400, message: 'milestone must be "second" or "third"' })
  }

  try {
    // Fetch Pokemon
    const pokemon = await prisma.pokemon.findUnique({
      where: { id }
    })

    if (!pokemon) {
      throw createError({ statusCode: 404, message: 'Pokemon not found' })
    }

    const currentAbilities = JSON.parse(pokemon.abilities || '[]') as Array<{ name: string; effect: string }>

    // Validate milestone eligibility
    if (body.milestone === 'second') {
      if (pokemon.level < 20) {
        throw createError({
          statusCode: 400,
          message: 'Pokemon must be Level 20+ for second ability'
        })
      }
      if (currentAbilities.length >= 2) {
        throw createError({
          statusCode: 400,
          message: 'Pokemon already has 2+ abilities'
        })
      }
    } else {
      if (pokemon.level < 40) {
        throw createError({
          statusCode: 400,
          message: 'Pokemon must be Level 40+ for third ability'
        })
      }
      if (currentAbilities.length < 2) {
        throw createError({
          statusCode: 400,
          message: 'Pokemon must have a second ability before gaining a third. Assign the second ability first (Level 20 milestone).'
        })
      }
      if (currentAbilities.length >= 3) {
        throw createError({
          statusCode: 400,
          message: 'Pokemon already has 3+ abilities'
        })
      }
    }

    // Fetch species data for ability pool
    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species }
    })

    if (!speciesData) {
      throw createError({
        statusCode: 404,
        message: `Species data not found for ${pokemon.species}`
      })
    }

    const speciesAbilities = JSON.parse(speciesData.abilities || '[]') as string[]

    // Compute valid pool
    const pool = getAbilityPool({
      speciesAbilities,
      numBasicAbilities: speciesData.numBasicAbilities,
      currentAbilities: currentAbilities.map(a => a.name),
      milestone: body.milestone
    })

    // Validate chosen ability is in pool
    if (!pool.available.some(a => a.name === body.abilityName)) {
      throw createError({
        statusCode: 400,
        message: `${body.abilityName} is not available for ${body.milestone} ability assignment`
      })
    }

    // Fetch ability effect from AbilityData
    const abilityData = await prisma.abilityData.findUnique({
      where: { name: body.abilityName }
    })

    const newAbility = {
      name: body.abilityName,
      effect: abilityData?.effect ?? ''
    }

    // Append to abilities array (immutable)
    const updatedAbilities = [...currentAbilities, newAbility]

    // Update Pokemon
    const updated = await prisma.pokemon.update({
      where: { id },
      data: { abilities: JSON.stringify(updatedAbilities) }
    })

    return {
      success: true,
      data: {
        id: updated.id,
        abilities: updatedAbilities,
        assignedAbility: newAbility,
        milestone: body.milestone
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to assign ability'
    throw createError({ statusCode: 500, message })
  }
})
