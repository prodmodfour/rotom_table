/**
 * Use a healing item on a combatant in an active encounter.
 *
 * Request body:
 * - itemName: string -- key in HEALING_ITEM_CATALOG
 * - userId: string -- combatant ID of the item user
 * - targetId: string -- combatant ID of the item target
 * - targetAccepts?: boolean -- whether the target agrees (default: true)
 *
 * P0: HP restoration only.
 * P1: Status cure, revive, combined items (all categories supported).
 * P2: Action economy (Standard Action cost), adjacency check, inventory.
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse }
  from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { applyHealingItem, getEntityDisplayName }
  from '~/server/services/healing-item.service'
import { HEALING_ITEM_CATALOG } from '~/constants/healingItems'
import { broadcastToEncounter } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  if (!body.itemName || !body.userId || !body.targetId) {
    throw createError({
      statusCode: 400,
      message: 'itemName, userId, and targetId are required'
    })
  }

  // Validate item exists
  const item = HEALING_ITEM_CATALOG[body.itemName]
  if (!item) {
    throw createError({
      statusCode: 400,
      message: `Unknown item: ${body.itemName}`
    })
  }

  // P1: All healing item categories are now supported
  const allowedCategories = ['restorative', 'cure', 'combined', 'revive']
  if (!allowedCategories.includes(item.category)) {
    throw createError({
      statusCode: 400,
      message: `${item.name} has unsupported category: ${item.category}`
    })
  }

  // Target may refuse
  if (body.targetAccepts === false) {
    return {
      success: true,
      data: null,
      itemResult: {
        itemName: body.itemName,
        refused: true,
        message: 'Target refused the item. Item was not consumed.'
      }
    }
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const user = findCombatant(combatants, body.userId)
    const target = findCombatant(combatants, body.targetId)

    // Apply item (applyHealingItem validates internally)
    const itemResult = applyHealingItem(body.itemName, target)

    if (!itemResult.success) {
      throw createError({ statusCode: 400, message: itemResult.error || 'Item application failed' })
    }

    // Sync to database (HP, status conditions, and stage modifiers for CS reversal)
    await syncEntityToDatabase(target, {
      currentHp: target.entity.currentHp,
      temporaryHp: target.entity.temporaryHp || 0,
      injuries: target.entity.injuries || 0,
      statusConditions: target.entity.statusConditions || [],
      stageModifiers: target.entity.stageModifiers
    })

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    // Broadcast item_used event via WebSocket
    broadcastToEncounter(id, {
      type: 'item_used',
      data: {
        encounterId: id,
        itemName: body.itemName,
        userName: getEntityDisplayName(user),
        targetName: getEntityDisplayName(target),
        effects: itemResult.effects
      }
    })

    return {
      success: true,
      data: response,
      itemResult: {
        itemName: body.itemName,
        userName: getEntityDisplayName(user),
        targetName: getEntityDisplayName(target),
        ...itemResult.effects,
        refused: false
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to use item'
    throw createError({ statusCode: 500, message })
  }
})
