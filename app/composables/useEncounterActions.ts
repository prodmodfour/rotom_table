import type { StageModifiers, StatusCondition, GridConfig, GridPosition, MovementPreview, Encounter, WebSocketEvent } from '~/types'

export interface BreatherShiftResult {
  combatantId: string
  combatantName: string
}

interface EncounterActionsOptions {
  encounter: Ref<Encounter | null>
  send: (event: WebSocketEvent) => void
  refreshUndoRedoState: () => void
}

export function useEncounterActions(options: EncounterActionsOptions) {
  const { encounter, send, refreshUndoRedoState } = options
  const encounterStore = useEncounterStore()
  const encounterGridStore = useEncounterGridStore()
  const encounterCombatStore = useEncounterCombatStore()
  const { getCombatantName } = useCombatantDisplay()

  // Helper to broadcast encounter updates
  const broadcastUpdate = async () => {
    await nextTick()
    if (encounterStore.encounter) {
      send({ type: 'encounter_update', data: encounterStore.encounter })
    }
  }

  // Helper to find combatant
  const findCombatant = (combatantId: string) => {
    return encounter.value?.combatants.find(c => c.id === combatantId)
  }

  // Combat action handlers
  const handleAction = async (combatantId: string, action: { type: string; data: unknown }) => {
    if (['standard', 'shift', 'swift'].includes(action.type)) {
      await encounterStore.useAction(combatantId, action.type as 'standard' | 'shift' | 'swift')
    }
  }

  const handleDamage = async (combatantId: string, damage: number) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    encounterStore.captureSnapshot(`Applied ${damage} damage to ${name}`)
    await encounterStore.applyDamage(combatantId, damage)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleHeal = async (combatantId: string, amount: number, tempHp?: number, healInjuries?: number) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    const parts: string[] = []
    if (amount > 0) parts.push(`${amount} HP`)
    if (tempHp && tempHp > 0) parts.push(`${tempHp} Temp HP`)
    if (healInjuries && healInjuries > 0) parts.push(`${healInjuries} injury`)
    encounterStore.captureSnapshot(`Healed ${name} (${parts.join(', ')})`)
    await encounterStore.healCombatant(combatantId, amount, tempHp ?? 0, healInjuries ?? 0)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleStages = async (combatantId: string, changes: Partial<StageModifiers>, absolute: boolean) => {
    if (!encounterStore.encounter) return
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    encounterStore.captureSnapshot(`Changed ${name}'s combat stages`)
    encounterStore.encounter = await encounterCombatStore.setCombatStages(
      encounterStore.encounter.id, combatantId, changes as Record<string, number>, absolute
    )
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleStatus = async (combatantId: string, add: StatusCondition[], remove: StatusCondition[], override: boolean = false) => {
    if (!encounterStore.encounter) return
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    const parts: string[] = []
    if (add.length > 0) parts.push(`added ${add.join(', ')}`)
    if (remove.length > 0) parts.push(`removed ${remove.join(', ')}`)
    encounterStore.captureSnapshot(`${name}: ${parts.join('; ')}`)

    try {
      encounterStore.encounter = await encounterCombatStore.updateStatusConditions(
        encounterStore.encounter.id, combatantId, add, remove, override
      )
      refreshUndoRedoState()
      await broadcastUpdate()
    } catch (error: unknown) {
      // Decree-012: type immunity rejection — show informative alert
      const fetchError = error as { statusCode?: number; data?: { message?: string } }
      if (fetchError.statusCode === 409) {
        const msg = fetchError.data?.message || 'Type immunity prevents this status condition'
        alert(`Status blocked: ${msg}\n\nUse the Status Conditions modal and "Force Apply (GM Override)" to bypass.`)
        return
      }
      alert(`Failed to update status conditions for ${name}`)
    }
  }

  // Maneuver name mapping
  const maneuverNames: Record<string, string> = {
    'push': 'Push',
    'sprint': 'Sprint',
    'trip': 'Trip',
    'grapple': 'Grapple',
    'disarm': 'Disarm',
    'dirty-trick': 'Dirty Trick',
    'intercept-melee': 'Intercept Melee',
    'intercept-ranged': 'Intercept Ranged',
    'take-a-breather': 'Take a Breather'
  }

  const handleExecuteMove = async (
    combatantId: string,
    moveId: string,
    targetIds: string[],
    damage?: number,
    targetDamages?: Record<string, number>
  ) => {
    const combatant = findCombatant(combatantId)
    if (!combatant) return

    const moveName = moveId === 'struggle' ? 'Struggle' : (combatant.type === 'pokemon'
      ? ((combatant.entity as { moves?: { id: string; name: string }[] }).moves?.find(
          m => m.id === moveId || m.name === moveId
        )?.name || moveId)
      : moveId)

    encounterStore.captureSnapshot(`${getCombatantName(combatant)} used ${moveName}`)
    await encounterStore.executeMove(combatantId, moveId, targetIds, damage, targetDamages)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleExecuteAction = async (combatantId: string, actionType: string): Promise<BreatherShiftResult | undefined> => {
    const combatant = findCombatant(combatantId)
    if (!combatant || !encounterStore.encounter) return undefined

    const name = getCombatantName(combatant)
    let breatherShift: BreatherShiftResult | undefined

    // Handle maneuvers (prefixed with 'maneuver:')
    if (actionType.startsWith('maneuver:')) {
      const maneuverId = actionType.replace('maneuver:', '')
      const maneuverName = maneuverNames[maneuverId] || maneuverId
      encounterStore.captureSnapshot(`${name} used ${maneuverName}`)

      // Use standard action for most maneuvers
      if (['push', 'sprint', 'trip', 'grapple', 'disarm', 'dirty-trick'].includes(maneuverId)) {
        await encounterStore.useAction(combatantId, 'standard')
      }
      // Full actions use both standard and shift
      if (['take-a-breather', 'take-a-breather-assisted', 'intercept-melee', 'intercept-ranged'].includes(maneuverId)) {
        await encounterStore.useAction(combatantId, 'standard')
        await encounterStore.useAction(combatantId, 'shift')
      }
      // Special handling for Sprint: persist Sprint tempCondition via server endpoint
      if (maneuverId === 'sprint') {
        encounterStore.encounter = await encounterCombatStore.sprint(
          encounterStore.encounter.id, combatantId
        )
      }
      // Special handling for Take a Breather (standard and assisted variants)
      if (maneuverId === 'take-a-breather' || maneuverId === 'take-a-breather-assisted') {
        const assisted = maneuverId === 'take-a-breather-assisted'
        encounterStore.encounter = await encounterCombatStore.takeABreather(
          encounterStore.encounter.id, combatantId, assisted
        )
        // Signal that the GM needs to shift this combatant away from enemies (PTU p.245)
        // Both standard and assisted variants require the shift — "both the assisting
        // Trainer and their target must Shift as far away from enemies as possible,
        // using the lower of the two's maximum movement for a single Shift."
        breatherShift = { combatantId, combatantName: name }
      }
    } else {
      // Handle standard actions
      switch (actionType) {
        case 'shift':
          encounterStore.captureSnapshot(`${name} used Shift action`)
          await encounterStore.useAction(combatantId, 'shift')
          break
        case 'pass':
          encounterStore.captureSnapshot(`${name} passed their turn`)
          // Persist pass via server endpoint (marks all actions as used)
          encounterStore.encounter = await encounterCombatStore.pass(
            encounterStore.encounter.id, combatantId
          )
          break
      }
    }

    refreshUndoRedoState()
    await broadcastUpdate()
    return breatherShift
  }

  // VTT Grid handlers
  const handleGridConfigUpdate = async (config: GridConfig) => {
    if (!encounterStore.encounter) return
    const updatedConfig = await encounterGridStore.updateGridConfig(encounterStore.encounter.id, config)
    encounterStore.encounter.gridConfig = {
      ...encounterStore.encounter.gridConfig,
      ...updatedConfig
    }
  }

  const handleTokenMove = async (combatantId: string, position: GridPosition) => {
    if (!encounterStore.encounter) return
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    encounterStore.captureSnapshot(`Moved ${name} to (${position.x}, ${position.y})`)
    await encounterGridStore.updateCombatantPosition(encounterStore.encounter.id, combatantId, position)
    const localCombatant = encounterStore.encounter.combatants.find(c => c.id === combatantId)
    if (localCombatant) {
      localCombatant.position = position
    }
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleBackgroundUpload = async (file: File) => {
    if (!encounterStore.encounter) return
    try {
      const background = await encounterGridStore.uploadBackgroundImage(encounterStore.encounter.id, file)
      encounterStore.encounter.gridConfig = {
        ...encounterStore.encounter.gridConfig,
        background
      }
    } catch (error) {
      console.error('Failed to upload background:', error)
    }
  }

  const handleBackgroundRemove = async () => {
    if (!encounterStore.encounter) return
    try {
      await encounterGridStore.removeBackgroundImage(encounterStore.encounter.id)
      encounterStore.encounter.gridConfig = {
        ...encounterStore.encounter.gridConfig,
        background: undefined
      }
    } catch (error) {
      console.error('Failed to remove background:', error)
    }
  }

  const handleMovementPreviewChange = (preview: MovementPreview | null) => {
    send({ type: 'movement_preview', data: preview })
  }

  return {
    // Combat handlers
    handleAction,
    handleDamage,
    handleHeal,
    handleStages,
    handleStatus,
    // Move/action handlers
    handleExecuteMove,
    handleExecuteAction,
    // VTT handlers
    handleGridConfigUpdate,
    handleTokenMove,
    handleBackgroundUpload,
    handleBackgroundRemove,
    handleMovementPreviewChange
  }
}
