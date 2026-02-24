import type { Peer } from 'crossws'

interface WebSocketEvent {
  type: string
  data: unknown
}

interface ClientInfo {
  role: 'gm' | 'group' | 'player'
  encounterId?: string
  characterId?: string
}

// Store connected peers with their info - shared across ws handler and API routes
export const peers = new Map<Peer, ClientInfo>()

// Safely send message to a peer
export function safeSend(peer: Peer, message: string) {
  try {
    peer.send(message)
  } catch {
    // Peer may have disconnected, remove from map
    peers.delete(peer)
  }
}

// Broadcast to all connected peers
export function broadcast(event: WebSocketEvent, excludePeer?: Peer) {
  const message = JSON.stringify(event)
  for (const [peer] of peers) {
    if (peer !== excludePeer) {
      safeSend(peer, message)
    }
  }
}

// Broadcast to all group role peers
export function broadcastToGroup(eventType: string, data: unknown) {
  const message = JSON.stringify({ type: eventType, data })
  for (const [peer, info] of peers) {
    if (info.role === 'group') {
      safeSend(peer, message)
    }
  }
}

// Broadcast to peers watching a specific encounter
export function broadcastToEncounter(encounterId: string, event: WebSocketEvent, excludePeer?: Peer) {
  const message = JSON.stringify(event)
  for (const [peer, info] of peers) {
    if (peer !== excludePeer && info.encounterId === encounterId) {
      safeSend(peer, message)
    }
  }
}

// Notify helpers for API routes
export function notifyEncounterUpdate(encounterId: string, encounter: unknown) {
  broadcastToEncounter(encounterId, {
    type: 'encounter_update',
    data: encounter
  })
}

export function notifyTurnChange(encounterId: string, turnData: unknown) {
  broadcastToEncounter(encounterId, {
    type: 'turn_change',
    data: turnData
  })
}

export function notifyMoveExecuted(encounterId: string, moveData: unknown) {
  broadcastToEncounter(encounterId, {
    type: 'move_executed',
    data: moveData
  })
}

// Player-related broadcasts

// Broadcast to all player-role clients in a specific encounter
export function broadcastToPlayers(encounterId: string, event: WebSocketEvent) {
  const message = JSON.stringify(event)
  for (const [peer, info] of peers) {
    if (info.role === 'player' && info.encounterId === encounterId) {
      safeSend(peer, message)
    }
  }
}

// Send to a specific player by characterId
export function sendToPlayer(characterId: string, event: WebSocketEvent) {
  const message = JSON.stringify(event)
  for (const [peer, info] of peers) {
    if (info.role === 'player' && info.characterId === characterId) {
      safeSend(peer, message)
    }
  }
}

// Broadcast to both group and player clients (e.g. scene events)
export function broadcastToGroupAndPlayers(eventType: string, data: unknown) {
  const message = JSON.stringify({ type: eventType, data })
  for (const [peer, info] of peers) {
    if (info.role === 'group' || info.role === 'player') {
      safeSend(peer, message)
    }
  }
}

// Scene-related broadcasts (sent to both group and player clients)
export function notifySceneUpdate(sceneId: string, scene: unknown) {
  broadcastToGroupAndPlayers('scene_update', { sceneId, scene })
}

export function notifyScenePokemonAdded(sceneId: string, pokemon: unknown) {
  broadcastToGroupAndPlayers('scene_pokemon_added', { sceneId, pokemon })
}

export function notifyScenePokemonRemoved(sceneId: string, pokemonId: string) {
  broadcastToGroupAndPlayers('scene_pokemon_removed', { sceneId, pokemonId })
}

export function notifySceneCharacterAdded(sceneId: string, character: unknown) {
  broadcastToGroupAndPlayers('scene_character_added', { sceneId, character })
}

export function notifySceneCharacterRemoved(sceneId: string, characterId: string) {
  broadcastToGroupAndPlayers('scene_character_removed', { sceneId, characterId })
}

export function notifyScenePositionsUpdated(sceneId: string, positions: unknown) {
  broadcastToGroupAndPlayers('scene_positions_updated', { sceneId, positions })
}

export function notifySceneGroupCreated(sceneId: string, group: unknown) {
  broadcastToGroupAndPlayers('scene_group_created', { sceneId, group })
}

export function notifySceneGroupUpdated(sceneId: string, group: unknown) {
  broadcastToGroupAndPlayers('scene_group_updated', { sceneId, group })
}

export function notifySceneGroupDeleted(sceneId: string, groupId: string) {
  broadcastToGroupAndPlayers('scene_group_deleted', { sceneId, groupId })
}
