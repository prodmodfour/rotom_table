/**
 * Use a healing item on a combatant in an active encounter.
 *
 * Request body:
 * - itemName: string -- key in HEALING_ITEM_CATALOG
 * - userId: string -- combatant ID of the item user
 * - targetId: string -- combatant ID of the item target
 * - targetAccepts?: boolean -- whether the target agrees (default: true)
 * - skipInventory?: boolean -- GM override: skip inventory check/consumption
 *
 * P0: HP restoration only.
 * P1: Status cure, revive, combined items (all categories supported).
 * P2: Action economy (Standard Action cost), adjacency check, inventory.
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse }
  from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { applyHealingItem, getEntityDisplayName, checkItemRange, findTrainerForPokemon }
  from '~/server/services/healing-item.service'
import { HEALING_ITEM_CATALOG } from '~/constants/healingItems'
import { broadcastToEncounter } from '~/server/utils/websocket'
import { prisma } from '~/server/utils/prisma'
import type { HumanCharacter, Pokemon, InventoryItem } from '~/types/character'

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

  // Target may refuse (PTU p.276: no costs charged, item not consumed)
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

    // P2: Turn validation — user must be the current turn combatant or releasing a held action
    if (record.isActive) {
      const turnOrder = JSON.parse(record.turnOrder) as string[]
      const currentTurnId = turnOrder[record.currentTurnIndex]
      const isUsersTurn = currentTurnId === body.userId
      const hasHeldAction = user.holdAction?.isHolding === true
      if (!isUsersTurn && !hasHeldAction) {
        throw createError({
          statusCode: 400,
          message: 'Can only use items on your own turn (or with a held action)'
        })
      }
    }

    // P2: Self-use detection
    const isSelfUse = body.userId === body.targetId

    // P2: Adjacency check (Section M — PTU p.276: physical contact required)
    const rangeResult = checkItemRange(
      user.position,
      user.tokenSize || 1,
      target.position,
      target.tokenSize || 1,
      isSelfUse
    )

    if (!rangeResult.adjacent) {
      throw createError({
        statusCode: 400,
        message: `Must be adjacent to target to use items (current distance: ${rangeResult.distance}m)`
      })
    }

    // P2: Standard Action enforcement (Section J — PTU p.276)
    if (isSelfUse) {
      // Self-use: Full-Round Action (Standard + Shift) — Section L
      if (user.turnState.standardActionUsed || user.turnState.shiftActionUsed) {
        throw createError({
          statusCode: 400,
          message: 'Using an item on yourself requires a Full-Round Action (Standard + Shift). Not enough actions remaining.'
        })
      }
    } else {
      // Use on another: Standard Action
      if (user.turnState.standardActionUsed) {
        throw createError({
          statusCode: 400,
          message: 'Using an item requires a Standard Action. Standard Action already used this turn.'
        })
      }
    }

    // P2: Inventory check and consumption (Section N)
    const skipInventory = body.skipInventory === true
    let inventoryConsumed = false
    let remainingQuantity: number | undefined

    if (!skipInventory) {
      // Resolve the trainer who owns the item
      const trainer = user.type === 'human'
        ? user
        : findTrainerForPokemon(combatants, user)

      if (!trainer) {
        throw createError({
          statusCode: 400,
          message: 'Cannot determine which trainer owns the item'
        })
      }

      const trainerEntity = trainer.entity as HumanCharacter
      const trainerInventory: InventoryItem[] = trainerEntity.inventory || []
      const inventoryItem = trainerInventory.find(
        inv => inv.name === body.itemName
      )

      if (!inventoryItem || inventoryItem.quantity <= 0) {
        throw createError({
          statusCode: 400,
          message: `${body.itemName} not found in trainer's inventory`
        })
      }

      // Apply item first, then deduct inventory on success (below)
    }

    // Apply item (applyHealingItem validates internally)
    const itemResult = applyHealingItem(body.itemName, target)

    if (!itemResult.success) {
      throw createError({ statusCode: 400, message: itemResult.error || 'Item application failed' })
    }

    // P2: Consume actions after successful application
    if (isSelfUse) {
      // Full-Round Action consumes both Standard and Shift
      user.turnState = {
        ...user.turnState,
        standardActionUsed: true,
        shiftActionUsed: true
      }
    } else {
      // Standard Action only
      user.turnState = {
        ...user.turnState,
        standardActionUsed: true
      }
    }

    // P2: Medic Training edge check (Section J — PTU p.139)
    // Medic Training exempts the TARGET from forfeiting actions, not the user's action cost
    const hasMedicTraining = user.type === 'human' &&
      ((user.entity as HumanCharacter).edges || [])
        .some(e => e.toLowerCase().includes('medic training'))

    // P2: Target forfeits next Standard + Shift Action (Section K — PTU p.276)
    // Only for non-self-use and without Medic Training
    const targetForfeitsActions = !isSelfUse && !hasMedicTraining
    if (targetForfeitsActions) {
      target.turnState = {
        ...target.turnState,
        forfeitStandardAction: true,
        forfeitShiftAction: true
      }
    }

    // P2: Deduct from inventory after successful application
    if (!skipInventory) {
      const trainer = user.type === 'human'
        ? user
        : findTrainerForPokemon(combatants, user)

      if (trainer) {
        const trainerEntity = trainer.entity as HumanCharacter
        const updatedInventory = (trainerEntity.inventory || []).map(
          (inv: InventoryItem) => {
            if (inv.name === body.itemName) {
              return { ...inv, quantity: inv.quantity - 1 }
            }
            return inv
          }
        ).filter((inv: InventoryItem) => inv.quantity > 0)

        // Update the entity in the combatant (immutable)
        trainer.entity = {
          ...trainer.entity,
          inventory: updatedInventory
        } as HumanCharacter

        // Persist inventory to DB
        await prisma.humanCharacter.update({
          where: { id: trainer.entityId },
          data: {
            inventory: JSON.stringify(updatedInventory)
          }
        })

        // Track remaining quantity for response
        const after = updatedInventory.find(
          (inv: InventoryItem) => inv.name === body.itemName
        )
        remainingQuantity = after ? after.quantity : 0
        inventoryConsumed = true
      }
    }

    // Sync target to database (HP, status conditions, stage modifiers for CS reversal)
    await syncEntityToDatabase(target, {
      currentHp: target.entity.currentHp,
      temporaryHp: target.entity.temporaryHp || 0,
      injuries: target.entity.injuries || 0,
      statusConditions: target.entity.statusConditions || [],
      stageModifiers: target.entity.stageModifiers
    })

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    // Broadcast item_used event via WebSocket (P2: includes action economy details)
    const actionCost = isSelfUse ? 'full_round' : 'standard'
    broadcastToEncounter(id, {
      type: 'item_used',
      data: {
        encounterId: id,
        itemName: body.itemName,
        userName: getEntityDisplayName(user),
        targetName: getEntityDisplayName(target),
        effects: itemResult.effects,
        actionCost,
        targetForfeitsActions,
        inventoryConsumed,
        ...(remainingQuantity !== undefined && { remainingQuantity })
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
        refused: false,
        actionCost,
        targetForfeitsActions,
        inventoryConsumed,
        ...(remainingQuantity !== undefined && { remainingQuantity })
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to use item'
    throw createError({ statusCode: 500, message })
  }
})
