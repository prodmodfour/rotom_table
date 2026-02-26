import type { WebSocketEvent } from '~/types/api'
import type { GridPosition, Combatant } from '~/types'
import type { PlayerMoveRequest, PlayerMoveResponse } from '~/types/player-sync'
import type { FogState } from '~/stores/fogOfWar'

/**
 * Player grid view state management composable.
 *
 * Manages:
 * - Token ownership detection (isOwnCombatant)
 * - Fog-filtered visible tokens
 * - Move request flow: select own token -> tap destination -> confirm -> pending
 * - Pending move tracking with server response handling
 * - Information asymmetry (own = full, allied = name+exactHP, enemy = name+%HP)
 */

interface PendingMove {
  requestId: string
  combatantId: string
  from: GridPosition
  to: GridPosition
  distance: number
  timestamp: number
}

interface TokenInfo {
  combatantId: string
  position: GridPosition
  size: number
}

export function usePlayerGridView(options: {
  characterId: Ref<string | null>
  pokemonIds: Ref<string[]>
  send: (event: WebSocketEvent) => void
  onMessage: (listener: (msg: WebSocketEvent) => void) => (() => void)
}) {
  const encounterStore = useEncounterStore()
  const fogStore = useFogOfWarStore()
  const playerStore = usePlayerIdentityStore()

  // State
  const selectedCombatantId = ref<string | null>(null)
  const pendingMove = ref<PendingMove | null>(null)
  const moveConfirmTarget = ref<{ position: GridPosition; distance: number } | null>(null)

  const MOVE_REQUEST_TIMEOUT_MS = 30_000
  let moveTimeoutTimer: ReturnType<typeof setTimeout> | null = null

  // =============================================
  // Ownership Detection
  // =============================================

  /**
   * Check if a combatant belongs to the current player.
   */
  const isOwnCombatant = (combatant: Combatant): boolean => {
    const charId = options.characterId.value
    if (!charId) return false
    return combatant.entityId === charId || options.pokemonIds.value.includes(combatant.entityId)
  }

  /**
   * Get the player's own combatants in the encounter.
   */
  const ownCombatants = computed((): Combatant[] => {
    if (!encounterStore.encounter) return []
    return encounterStore.encounter.combatants.filter(c => isOwnCombatant(c))
  })

  // =============================================
  // Fog-Filtered Visible Tokens
  // =============================================

  /**
   * Tokens visible to the player based on fog of war state.
   * Only 'revealed' cells show tokens. Hidden and explored cells hide tokens.
   * When fog is disabled, all tokens are visible.
   */
  const visibleTokens = computed((): TokenInfo[] => {
    if (!encounterStore.encounter) return []

    const combatants = encounterStore.encounter.combatants
    return combatants
      .filter(c => c.position != null)
      .filter(c => {
        if (!fogStore.enabled) return true
        const pos = c.position!
        const state: FogState = fogStore.getCellState(pos.x, pos.y)
        return state === 'revealed'
      })
      .map(c => ({
        combatantId: c.id,
        position: c.position!,
        size: c.tokenSize || 1
      }))
  })

  // =============================================
  // Information Asymmetry
  // =============================================

  type InfoLevel = 'full' | 'allied' | 'enemy'

  /**
   * Determine what level of information the player can see for a combatant.
   * Own = full info, Allies = name + exact HP, Enemies = name + %HP.
   */
  const getInfoLevel = (combatant: Combatant): InfoLevel => {
    if (isOwnCombatant(combatant)) return 'full'
    if (combatant.side === 'players' || combatant.side === 'allies') return 'allied'
    return 'enemy'
  }

  // =============================================
  // Token Selection (Player Mode)
  // =============================================

  /**
   * Select a combatant's token. Only allows selecting own tokens.
   */
  const selectToken = (combatantId: string): void => {
    const combatant = encounterStore.encounter?.combatants.find(c => c.id === combatantId)
    if (!combatant || !isOwnCombatant(combatant)) return

    selectedCombatantId.value = combatantId
    moveConfirmTarget.value = null
  }

  /**
   * Clear the current token selection.
   */
  const clearSelection = (): void => {
    selectedCombatantId.value = null
    moveConfirmTarget.value = null
  }

  // =============================================
  // Move Request Flow
  // =============================================

  /**
   * Set a destination cell for the selected token.
   * This opens the confirmation sheet, does NOT yet send the request.
   */
  const setMoveTarget = (position: GridPosition, distance: number): void => {
    if (!selectedCombatantId.value) return
    moveConfirmTarget.value = { position, distance }
  }

  /**
   * Confirm and send the move request to the GM.
   */
  const confirmMove = (): void => {
    const combatantId = selectedCombatantId.value
    const target = moveConfirmTarget.value
    if (!combatantId || !target) return

    const combatant = encounterStore.encounter?.combatants.find(c => c.id === combatantId)
    if (!combatant?.position) return

    const requestId = `mv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const request: PlayerMoveRequest = {
      requestId,
      playerId: playerStore.characterId ?? '',
      combatantId,
      fromPosition: { ...combatant.position },
      toPosition: { ...target.position },
      distance: target.distance
    }

    pendingMove.value = {
      requestId,
      combatantId,
      from: { ...combatant.position },
      to: { ...target.position },
      distance: target.distance,
      timestamp: Date.now()
    }

    options.send({ type: 'player_move_request', data: request })
    moveConfirmTarget.value = null

    // Auto-timeout after 30s
    moveTimeoutTimer = setTimeout(() => {
      if (pendingMove.value?.requestId === requestId) {
        pendingMove.value = null
      }
    }, MOVE_REQUEST_TIMEOUT_MS)
  }

  /**
   * Cancel the pending move confirmation (before sending).
   */
  const cancelMoveConfirm = (): void => {
    moveConfirmTarget.value = null
  }

  /**
   * Handle the GM's response to a move request.
   */
  const handleMoveResponse = (response: PlayerMoveResponse): void => {
    if (!pendingMove.value || response.requestId !== pendingMove.value.requestId) return

    if (moveTimeoutTimer) {
      clearTimeout(moveTimeoutTimer)
      moveTimeoutTimer = null
    }

    pendingMove.value = null
    selectedCombatantId.value = null
  }

  // =============================================
  // Auto-Center Helpers
  // =============================================

  /**
   * Find the primary own token to center the view on.
   * Returns the character's combatant position, or the first pokemon.
   */
  const primaryTokenPosition = computed((): GridPosition | null => {
    const own = ownCombatants.value
    if (own.length === 0) return null

    // Prefer the character combatant
    const charCombatant = own.find(c => c.entityId === options.characterId.value)
    if (charCombatant?.position) return charCombatant.position

    // Fall back to first pokemon with a position
    const withPos = own.find(c => c.position != null)
    return withPos?.position ?? null
  })

  // =============================================
  // WebSocket Listener
  // =============================================

  let removeListener: (() => void) | null = null

  onMounted(() => {
    removeListener = options.onMessage((msg: WebSocketEvent) => {
      if (msg.type === 'player_move_response') {
        handleMoveResponse(msg.data as PlayerMoveResponse)
      }
    })
  })

  onUnmounted(() => {
    if (removeListener) {
      removeListener()
      removeListener = null
    }
    if (moveTimeoutTimer) {
      clearTimeout(moveTimeoutTimer)
      moveTimeoutTimer = null
    }
  })

  return {
    // Ownership
    isOwnCombatant,
    ownCombatants,
    // Visibility
    visibleTokens,
    getInfoLevel,
    // Selection
    selectedCombatantId: readonly(selectedCombatantId),
    selectToken,
    clearSelection,
    // Move request
    moveConfirmTarget: readonly(moveConfirmTarget),
    pendingMove: readonly(pendingMove),
    setMoveTarget,
    confirmMove,
    cancelMoveConfirm,
    // Auto-center
    primaryTokenPosition
  }
}
