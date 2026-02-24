import type { Combatant, Move, Pokemon, HumanCharacter } from '~/types'
import type { PlayerActionRequest } from '~/types/api'
import type { TurnPhase } from '~/types/combat'

/**
 * Composable for player combat action logic.
 * Handles turn detection, action execution (direct via store),
 * and request sending (via WebSocket to GM).
 *
 * Direct actions: use move, shift, struggle, pass turn
 * Requested actions: use item, switch pokemon, combat maneuvers
 */
export function usePlayerCombat() {
  const encounterStore = useEncounterStore()
  const playerStore = usePlayerIdentityStore()
  const { send } = useWebSocket()

  // =============================================
  // Turn Detection
  // =============================================

  const currentCombatant = computed((): Combatant | null =>
    encounterStore.currentCombatant
  )

  /**
   * Whether the current turn belongs to the player.
   * Checks if the current combatant's entityId matches
   * the player's character ID or any of their pokemon IDs.
   */
  const isMyTurn = computed((): boolean => {
    const current = currentCombatant.value
    if (!current || !playerStore.character) return false

    const myCharId = playerStore.character.id
    const myPokemonIds = playerStore.pokemon.map(p => p.id)
    return current.entityId === myCharId || myPokemonIds.includes(current.entityId)
  })

  /**
   * The combatant object when it is the player's turn.
   * Returns null if it is not the player's turn.
   */
  const myActiveCombatant = computed((): Combatant | null => {
    if (!isMyTurn.value) return null
    return currentCombatant.value
  })

  /**
   * Whether the active combatant is a pokemon (vs trainer).
   */
  const isActivePokemon = computed((): boolean =>
    myActiveCombatant.value?.type === 'pokemon'
  )

  // =============================================
  // League Battle Phase Awareness
  // =============================================

  const isLeagueBattle = computed((): boolean =>
    encounterStore.isLeagueBattle
  )

  const currentPhase = computed((): TurnPhase =>
    encounterStore.currentPhase
  )

  /**
   * In league battles, trainers declare during trainer phase,
   * pokemon act during pokemon phase.
   */
  const isTrainerPhase = computed((): boolean =>
    currentPhase.value === 'trainer_declaration' || currentPhase.value === 'trainer_resolution'
  )

  const isPokemonPhase = computed((): boolean =>
    currentPhase.value === 'pokemon'
  )

  // =============================================
  // Turn State Tracking
  // =============================================

  const turnState = computed(() => {
    const combatant = myActiveCombatant.value
    if (!combatant) {
      return {
        standardActionUsed: false,
        shiftActionUsed: false,
        swiftActionUsed: false,
        hasActed: false
      }
    }
    return combatant.turnState
  })

  const canUseStandardAction = computed((): boolean =>
    !turnState.value.standardActionUsed
  )

  const canUseShiftAction = computed((): boolean =>
    !turnState.value.shiftActionUsed
  )

  const canUseSwiftAction = computed((): boolean =>
    !turnState.value.swiftActionUsed
  )

  /**
   * Whether the active combatant can be commanded this turn.
   * In league battles, a newly switched-in Pokemon cannot be commanded
   * on the turn it enters (PTU p.227). Shift and pass remain available.
   */
  const canBeCommanded = computed((): boolean =>
    turnState.value.canBeCommanded ?? true
  )

  // =============================================
  // Move Availability
  // =============================================

  /**
   * Get the moves for the active combatant.
   * Returns pokemon moves for pokemon combatants,
   * empty array for human combatants (trainers use features, not moves).
   */
  const activeMoves = computed((): Move[] => {
    const combatant = myActiveCombatant.value
    if (!combatant) return []

    if (combatant.type === 'pokemon') {
      return (combatant.entity as Pokemon).moves
    }
    return []
  })

  /**
   * Check if a move is exhausted (frequency limit reached).
   * Returns { exhausted: boolean, reason: string }.
   */
  const isMoveExhausted = (move: Move): { exhausted: boolean; reason: string } => {
    const sceneNumber = encounterStore.sceneNumber
    const currentRound = encounterStore.currentRound

    switch (move.frequency) {
      case 'At-Will':
        return { exhausted: false, reason: '' }

      case 'EOT': {
        // Every Other Turn: can't use if used last turn
        const lastUsed = move.lastTurnUsed ?? 0
        if (lastUsed >= currentRound - 1 && lastUsed > 0) {
          return { exhausted: true, reason: 'Used last turn (EOT)' }
        }
        return { exhausted: false, reason: '' }
      }

      case 'Scene':
        if ((move.usedThisScene ?? 0) >= 1) {
          return { exhausted: true, reason: 'Already used this scene' }
        }
        return { exhausted: false, reason: '' }

      case 'Scene x2':
        if ((move.usedThisScene ?? 0) >= 2) {
          return { exhausted: true, reason: 'Used 2/2 this scene' }
        }
        return { exhausted: false, reason: '' }

      case 'Scene x3':
        if ((move.usedThisScene ?? 0) >= 3) {
          return { exhausted: true, reason: 'Used 3/3 this scene' }
        }
        return { exhausted: false, reason: '' }

      case 'Daily':
        if ((move.usedToday ?? 0) >= 1) {
          return { exhausted: true, reason: 'Already used today' }
        }
        return { exhausted: false, reason: '' }

      case 'Daily x2':
        if ((move.usedToday ?? 0) >= 2) {
          return { exhausted: true, reason: 'Used 2/2 today' }
        }
        return { exhausted: false, reason: '' }

      case 'Daily x3':
        if ((move.usedToday ?? 0) >= 3) {
          return { exhausted: true, reason: 'Used 3/3 today' }
        }
        return { exhausted: false, reason: '' }

      case 'Static':
        return { exhausted: true, reason: 'Static (passive only)' }

      default:
        return { exhausted: false, reason: '' }
    }
  }

  /**
   * Whether any usable moves remain (for struggle check).
   */
  const hasUsableMoves = computed((): boolean => {
    return activeMoves.value.some(m => !isMoveExhausted(m).exhausted)
  })

  // =============================================
  // Direct Actions (player executes via encounterStore)
  // =============================================

  /**
   * Execute a move against selected targets.
   * Direct action — calls the server API through encounterStore.
   */
  const executeMove = async (moveId: string, targetIds: string[]): Promise<void> => {
    const combatant = myActiveCombatant.value
    if (!combatant) {
      throw new Error('Cannot execute move: not your turn')
    }

    await encounterStore.executeMove(combatant.id, moveId, targetIds)
  }

  /**
   * Use the Shift action (move 1 meter).
   * Direct action — marks shift action as used.
   */
  const useShiftAction = async (): Promise<void> => {
    const combatant = myActiveCombatant.value
    if (!combatant) {
      throw new Error('Cannot shift: not your turn')
    }

    await encounterStore.useAction(combatant.id, 'shift')
  }

  /**
   * Use Struggle — Normal Type, AC 4, DB 4, Melee, Physical. No STAB.
   * Available as a Standard Action alternative to using a Move.
   * Struggle is executed as a move with a special 'struggle' moveId.
   */
  const useStruggle = async (targetIds: string[]): Promise<void> => {
    const combatant = myActiveCombatant.value
    if (!combatant) {
      throw new Error('Cannot struggle: not your turn')
    }

    await encounterStore.executeMove(combatant.id, 'struggle', targetIds)
  }

  /**
   * Pass the turn (end combatant's turn).
   * Direct action — advances to next turn.
   */
  const passTurn = async (): Promise<void> => {
    if (!myActiveCombatant.value) {
      throw new Error('Cannot pass turn: not your turn')
    }

    await encounterStore.nextTurn()
  }

  // =============================================
  // Requested Actions (send via WebSocket to GM)
  // =============================================

  const generateRequestId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const buildBaseRequest = (): Pick<PlayerActionRequest, 'requestId' | 'playerId' | 'playerName'> => ({
    requestId: generateRequestId(),
    playerId: playerStore.characterId ?? '',
    playerName: playerStore.characterName ?? 'Player'
  })

  /**
   * Request to use an item.
   * Sends a player_action WebSocket message for GM approval.
   */
  const requestUseItem = (itemId: string, itemName: string): void => {
    const request: PlayerActionRequest = {
      ...buildBaseRequest(),
      action: 'use_item',
      itemId,
      itemName
    }
    send({ type: 'player_action', data: request })
  }

  /**
   * Request to switch Pokemon.
   * Sends a player_action WebSocket message for GM approval.
   */
  const requestSwitchPokemon = (pokemonId: string): void => {
    const request: PlayerActionRequest = {
      ...buildBaseRequest(),
      action: 'switch_pokemon',
      pokemonId
    }
    send({ type: 'player_action', data: request })
  }

  /**
   * Request to perform a combat maneuver.
   * Sends a player_action WebSocket message for GM approval.
   */
  const requestManeuver = (maneuverId: string, maneuverName: string): void => {
    const request: PlayerActionRequest = {
      ...buildBaseRequest(),
      action: 'maneuver',
      maneuverId,
      maneuverName
    }
    send({ type: 'player_action', data: request })
  }

  // =============================================
  // Target Helpers
  // =============================================

  /**
   * Get all combatants that can be targeted.
   * Excludes fainted combatants.
   */
  const validTargets = computed((): Combatant[] => {
    if (!encounterStore.encounter) return []

    return encounterStore.encounter.combatants.filter(c => {
      const hp = c.type === 'pokemon'
        ? (c.entity as Pokemon).currentHp
        : (c.entity as HumanCharacter).currentHp
      return hp > 0
    })
  })

  /**
   * Get non-fainted team pokemon (for switch pokemon).
   * Excludes the currently active combatant's entity.
   */
  const switchablePokemon = computed((): Pokemon[] => {
    const activePokemonId = myActiveCombatant.value?.entityId
    return playerStore.pokemon.filter(p =>
      p.currentHp > 0 && p.id !== activePokemonId
    )
  })

  /**
   * Get the trainer's inventory (for use item).
   */
  const trainerInventory = computed(() => {
    if (!playerStore.character) return []
    return playerStore.character.inventory.filter(item => item.quantity > 0)
  })

  return {
    // Turn detection
    isMyTurn,
    myActiveCombatant,
    isActivePokemon,
    currentCombatant,

    // League battle awareness
    isLeagueBattle,
    currentPhase,
    isTrainerPhase,
    isPokemonPhase,

    // Turn state
    turnState,
    canUseStandardAction,
    canUseShiftAction,
    canUseSwiftAction,
    canBeCommanded,

    // Move availability
    activeMoves,
    isMoveExhausted,
    hasUsableMoves,

    // Direct actions
    executeMove,
    useShiftAction,
    useStruggle,
    passTurn,

    // Requested actions (via WS)
    requestUseItem,
    requestSwitchPokemon,
    requestManeuver,

    // Target helpers
    validTargets,
    switchablePokemon,
    trainerInventory
  }
}
