// Player synchronization types for Track C (Integration)
// WebSocket protocol expansion: player-GM communication, scene sync, group view control

import type { GridPosition } from './spatial'

/**
 * Action types available to players in combat.
 * Direct actions (use_move, shift, struggle, pass) are executed immediately.
 * Requested actions (use_item, switch_pokemon, maneuver, move_token) require GM approval.
 */
export type PlayerActionType =
  | 'use_move' | 'shift' | 'struggle' | 'pass'
  | 'use_item' | 'switch_pokemon' | 'maneuver' | 'move_token'
  | 'capture'           // Throw a Poke Ball (Standard Action, PTU p.227)
  | 'breather'          // Take a Breather maneuver (Full Action, PTU p.245)
  | 'use_healing_item'  // Use a healing item (Standard Action, PTU p.276)

/**
 * Player action request with requestId tracking for response routing.
 * Sent via player_action WebSocket message or REST fallback.
 * Server stores requestId -> characterId for routing the GM's response.
 */
export interface PlayerActionRequest {
  requestId: string
  playerId: string
  playerName: string
  action: PlayerActionType
  moveId?: string
  moveName?: string
  targetIds?: string[]
  targetNames?: string[]
  itemId?: string
  itemName?: string
  pokemonId?: string
  pokemonName?: string
  maneuverId?: string
  maneuverName?: string
  fromPosition?: GridPosition
  toPosition?: GridPosition

  // Capture-specific (action: 'capture')
  targetPokemonId?: string
  targetPokemonName?: string
  ballType?: string
  captureRatePreview?: number
  trainerCombatantId?: string

  // Breather-specific (action: 'breather')
  combatantId?: string
  assisted?: boolean

  // Healing item specific (action: 'use_healing_item')
  healingItemName?: string
  healingTargetId?: string
  healingTargetName?: string
}

/**
 * GM acknowledgment of a player action request.
 * Routed back to the originating player via pendingRequests map.
 */
export interface PlayerActionAck {
  requestId: string
  status: 'accepted' | 'rejected' | 'pending'
  reason?: string
  result?: unknown
}

/**
 * Targeted notification sent to a player when their combatant's turn begins.
 * Triggers vibration, visual flash, and auto-switch to Encounter tab.
 */
export interface PlayerTurnNotification {
  playerId: string
  combatantId: string
  combatantName: string
  combatantType: 'trainer' | 'pokemon'
  round: number
  availableActions: {
    canUseMove: boolean
    canShift: boolean
    canStruggle: boolean
    canPass: boolean
    canUseItem: boolean
    canSwitchPokemon: boolean
    canManeuver: boolean
  }
}

/**
 * Player token movement request (P1 — defined here for protocol completeness).
 * Sent when player taps own token then taps destination cell.
 */
export interface PlayerMoveRequest {
  requestId: string
  playerId: string
  combatantId: string
  fromPosition: GridPosition
  toPosition: GridPosition
  path?: GridPosition[]
  distance: number
}

/**
 * GM response to a player movement request.
 * 'modified' means GM adjusted the destination.
 */
export interface PlayerMoveResponse {
  requestId: string
  status: 'approved' | 'rejected' | 'modified'
  position?: GridPosition
  reason?: string
}

/**
 * Player request to change the Group View tab (P1 — defined for protocol completeness).
 * Requires GM approval for scene/lobby tab changes.
 */
export interface GroupViewRequest {
  requestId: string
  playerId: string
  playerName: string
  requestType: 'tab_change'
  tab?: string
  sceneId?: string
}

/**
 * GM response to a Group View change request.
 */
export interface GroupViewResponse {
  requestId: string
  status: 'approved' | 'rejected'
  reason?: string
}

/**
 * Scene data payload pushed to players on connect and scene activation.
 * Stripped to player-visible fields only (no terrains, modifiers, etc.).
 */
export interface SceneSyncPayload {
  scene: {
    id: string
    name: string
    description: string | null
    locationName: string | null
    locationImage: string | null
    weather: string | null
    isActive: boolean
    characters: Array<{ id: string; name: string; isPlayerCharacter: boolean }>
    pokemon: Array<{ id: string; nickname: string | null; species: string; ownerId: string | null }>
    groups: Array<{ id: string; name: string }>
  }
}
