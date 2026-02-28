import { prisma } from '~/server/utils/prisma'
import {
  peers,
  safeSend,
  broadcast,
  broadcastToEncounter,
  broadcastToGroup,
  broadcastToGroupAndPlayers
} from '~/server/utils/websocket'
import {
  registerPendingRequest,
  consumePendingRequest
} from '~/server/utils/pendingRequests'

interface WebSocketEvent {
  type: string
  data: unknown
}

// =============================================
// Helper: Forward event to GM(s) in an encounter
// Registers requestId -> characterId for response routing.
// =============================================

function forwardToGm(encounterId: string | null, event: WebSocketEvent, excludePeer: Parameters<typeof safeSend>[0]) {
  const data = event.data as { requestId?: string; playerId?: string }
  if (data.requestId && data.playerId) {
    registerPendingRequest(data.requestId, data.playerId)
  }

  const message = JSON.stringify(event)
  for (const [otherPeer, otherInfo] of peers) {
    if (otherPeer === excludePeer || otherInfo.role !== 'gm') continue
    if (encounterId && otherInfo.encounterId !== encounterId) continue
    safeSend(otherPeer, message)
  }
}

// =============================================
// Helper: Route response to a player by requestId
// Looks up pendingRequests, sends to matching player, deletes entry.
// =============================================

function routeToPlayer(requestId: string, event: WebSocketEvent) {
  const characterId = consumePendingRequest(requestId)
  if (!characterId) return

  const message = JSON.stringify(event)
  for (const [otherPeer, otherInfo] of peers) {
    if (otherInfo.role === 'player' && otherInfo.characterId === characterId) {
      safeSend(otherPeer, message)
    }
  }
}

// =============================================
// Helper: Send full encounter state
// =============================================

async function sendEncounterState(peer: Parameters<typeof safeSend>[0], encounterId: string) {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId }
    })

    if (encounter) {
      const parsed = {
        id: encounter.id,
        name: encounter.name,
        battleType: encounter.battleType,
        weather: encounter.weather ?? null,
        weatherDuration: encounter.weatherDuration ?? 0,
        weatherSource: encounter.weatherSource ?? null,
        combatants: JSON.parse(encounter.combatants),
        currentRound: encounter.currentRound,
        currentTurnIndex: encounter.currentTurnIndex,
        turnOrder: JSON.parse(encounter.turnOrder),
        currentPhase: encounter.currentPhase ?? 'pokemon',
        trainerTurnOrder: JSON.parse(encounter.trainerTurnOrder || '[]'),
        pokemonTurnOrder: JSON.parse(encounter.pokemonTurnOrder || '[]'),
        declarations: JSON.parse(encounter.declarations || '[]'),
        isActive: encounter.isActive,
        isPaused: encounter.isPaused,
        isServed: encounter.isServed,
        moveLog: JSON.parse(encounter.moveLog),
        defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
      }

      peer.send(JSON.stringify({
        type: 'encounter_update',
        data: parsed
      }))
    }
  } catch {
    // Failed to send encounter state - peer may have disconnected
  }
}

// =============================================
// Helper: Send current tab state to a peer
// =============================================

async function sendTabState(peer: Parameters<typeof safeSend>[0]) {
  try {
    const state = await prisma.groupViewState.findUnique({
      where: { id: 'singleton' }
    })

    if (state) {
      peer.send(JSON.stringify({
        type: 'tab_state',
        data: {
          activeTab: state.activeTab,
          activeSceneId: state.activeSceneId
        }
      }))
    }
  } catch {
    // Failed to send tab state
  }
}

// =============================================
// Helper: Send active scene to a player peer
// Queries DB for the active scene, sends scene_sync message.
// =============================================

async function sendActiveScene(peer: Parameters<typeof safeSend>[0]) {
  try {
    const scene = await prisma.scene.findFirst({
      where: { isActive: true }
    })

    if (!scene) return

    const characters = JSON.parse(scene.characters) as Array<{
      id: string; characterId: string; name: string; groupId?: string | null
    }>
    const pokemon = JSON.parse(scene.pokemon) as Array<{
      id: string; species: string; nickname?: string | null; groupId?: string | null
    }>
    const groups = JSON.parse(scene.groups) as Array<{
      id: string; name: string
    }>

    // Look up which characters are player characters vs NPCs
    const characterIds = characters.map(c => c.characterId)
    const dbCharacters = characterIds.length > 0
      ? await prisma.humanCharacter.findMany({
          where: { id: { in: characterIds } },
          select: { id: true, isPlayerCharacter: true }
        })
      : []
    const pcSet = new Set(dbCharacters.filter(c => c.isPlayerCharacter).map(c => c.id))

    // Look up pokemon owners
    const pokemonIds = pokemon.map(p => p.id)
    const dbPokemon = pokemonIds.length > 0
      ? await prisma.pokemon.findMany({
          where: { id: { in: pokemonIds } },
          select: { id: true, ownerId: true }
        })
      : []
    const ownerMap = new Map(dbPokemon.map(p => [p.id, p.ownerId]))

    const payload = {
      scene: {
        id: scene.id,
        name: scene.name,
        description: scene.description,
        locationName: scene.locationName,
        locationImage: scene.locationImage,
        weather: scene.weather,
        isActive: scene.isActive,
        characters: characters.map(c => ({
          id: c.characterId,
          name: c.name,
          isPlayerCharacter: pcSet.has(c.characterId)
        })),
        pokemon: pokemon.map(p => ({
          id: p.id,
          nickname: p.nickname ?? null,
          species: p.species,
          ownerId: ownerMap.get(p.id) ?? null
        })),
        groups: groups.map(g => ({
          id: g.id,
          name: g.name
        }))
      }
    }

    safeSend(peer, JSON.stringify({
      type: 'scene_sync',
      data: payload
    }))
  } catch {
    // Failed to send active scene - peer may have disconnected
  }
}

// =============================================
// WebSocket Handler
// =============================================

export default defineWebSocketHandler({
  open(peer) {
    // Default to group role until identified
    peers.set(peer, { role: 'group' })

    // Send welcome message
    peer.send(JSON.stringify({
      type: 'connected',
      data: { peerId: peer.id }
    }))
  },

  message(peer, message) {
    try {
      const event: WebSocketEvent = JSON.parse(message.text())
      const clientInfo = peers.get(peer)

      switch (event.type) {
        case 'identify':
          // Client identifies as GM, group, or player
          if (clientInfo) {
            const data = event.data as { role?: 'gm' | 'group' | 'player'; encounterId?: string; characterId?: string }
            clientInfo.role = data.role || 'group'
            clientInfo.encounterId = data.encounterId
            if (data.role === 'player' && data.characterId) {
              clientInfo.characterId = data.characterId
            }

            // If group client, send current tab state
            if (clientInfo.role === 'group') {
              sendTabState(peer)
            }

            // If player client, send active scene and current tab state
            if (clientInfo.role === 'player') {
              sendActiveScene(peer)
              sendTabState(peer)
            }
          }
          break

        case 'keepalive':
          // Respond with keepalive_ack to prevent tunnel idle timeout
          safeSend(peer, JSON.stringify({
            type: 'keepalive_ack',
            data: { timestamp: Date.now() }
          }))
          break

        case 'join_encounter':
          // Join a specific encounter room
          if (clientInfo) {
            const data = event.data as { encounterId: string }
            clientInfo.encounterId = data.encounterId
            // Send current encounter state
            sendEncounterState(peer, data.encounterId)
          }
          break

        case 'leave_encounter':
          // Leave encounter room
          if (clientInfo) {
            clientInfo.encounterId = undefined
          }
          break

        case 'sync_request':
          // Client requesting full state sync
          if (clientInfo?.encounterId) {
            sendEncounterState(peer, clientInfo.encounterId)
          }
          break

        case 'tab_sync_request':
          // Client requesting tab state (group and player clients)
          if (clientInfo?.role === 'group' || clientInfo?.role === 'player') {
            sendTabState(peer)
          }
          break

        case 'scene_request':
          // Player requesting current active scene
          if (clientInfo?.role === 'player') {
            sendActiveScene(peer)
          }
          break

        case 'encounter_update':
          // GM updates encounter state, broadcast to all viewers
          if (clientInfo?.role === 'gm' && clientInfo.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'turn_change':
          // Turn changed, notify all viewers
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'damage_applied':
          // Damage was applied to a combatant
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'heal_applied':
          // Healing was applied
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'status_change':
          // Status condition changed
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'move_executed':
          // A move was used
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'combatant_added':
          // A combatant was added to encounter
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'combatant_removed':
          // A combatant was removed from encounter
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'trainer_declared':
          // A trainer declared an action during League Battle declaration phase
          if (clientInfo?.role === 'gm' && clientInfo.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'declaration_update':
          // Declarations array updated (after declare or phase transition)
          if (clientInfo?.role === 'gm' && clientInfo.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'player_action':
          // Player or group submitting an action (for GM to see)
          if ((clientInfo?.role === 'player' || clientInfo?.role === 'group') && clientInfo.encounterId) {
            forwardToGm(clientInfo.encounterId, event, peer)
          }
          break

        case 'player_action_ack':
          // GM acknowledging a player action — route to originating player
          if (clientInfo?.role === 'gm') {
            const data = event.data as { requestId?: string }
            if (data.requestId) {
              routeToPlayer(data.requestId, event)
            }
          }
          break

        case 'group_view_request':
          // Player requesting a Group View tab change — forward to GM for approval
          if (clientInfo?.role === 'player') {
            forwardToGm(null, event, peer)
          }
          break

        case 'group_view_response':
          // GM responding to a group view change request — route to requesting player
          if (clientInfo?.role === 'gm') {
            const data = event.data as { requestId?: string }
            if (data.requestId) {
              routeToPlayer(data.requestId, event)
            }
          }
          break

        case 'player_move_request':
          // Player requesting a token move on the VTT grid — forward to GM
          if (clientInfo?.role === 'player' && clientInfo.encounterId) {
            forwardToGm(clientInfo.encounterId, event, peer)
          }
          break

        case 'player_move_response':
          // GM responding to a player move request — route to requesting player
          if (clientInfo?.role === 'gm') {
            const data = event.data as { requestId?: string }
            if (data.requestId) {
              routeToPlayer(data.requestId, event)
            }
          }
          break

        case 'player_turn_notify':
          // GM notifying a specific player that it is their turn
          // Route to the player identified by combatantId's owner
          if (clientInfo?.role === 'gm') {
            const data = event.data as { playerId?: string }
            if (data.playerId) {
              const message = JSON.stringify(event)
              for (const [otherPeer, otherInfo] of peers) {
                if (otherInfo.role === 'player' && otherInfo.characterId === data.playerId) {
                  safeSend(otherPeer, message)
                }
              }
            }
          }
          break

        case 'serve_encounter':
          // GM serves an encounter to group and player views
          if (clientInfo?.role === 'gm') {
            const data = event.data as { encounterId: string }
            if (data.encounterId) {
              broadcastToEncounter(data.encounterId, {
                type: 'encounter_served',
                data: event.data
              }, peer)
              // Also broadcast to all group and player clients not in a specific encounter
              const servedMsg = JSON.stringify({
                type: 'encounter_served',
                data: event.data
              })
              for (const [otherPeer, otherInfo] of peers) {
                if (otherPeer !== peer && (otherInfo.role === 'group' || otherInfo.role === 'player')) {
                  safeSend(otherPeer, servedMsg)
                }
              }
            }
          }
          break

        case 'encounter_unserved':
          // GM unserves an encounter
          if (clientInfo?.role === 'gm') {
            const data = event.data as { encounterId?: string }
            if (data.encounterId) {
              // Broadcast to all group and player clients
              const unservedMsg = JSON.stringify({
                type: 'encounter_unserved',
                data: event.data
              })
              for (const [otherPeer, otherInfo] of peers) {
                if (otherPeer !== peer && (otherInfo.role === 'group' || otherInfo.role === 'player')) {
                  safeSend(otherPeer, unservedMsg)
                }
              }
            }
          }
          break

        case 'character_update':
          // Character data changed
          broadcast(event, peer)
          break

        case 'movement_preview':
          // GM previewing a move, broadcast to group views
          if (clientInfo?.role === 'gm' && clientInfo.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'scene_update':
          // Scene data changed, broadcast to group and player views
          if (clientInfo?.role === 'gm') {
            broadcastToGroupAndPlayers(event.type, event.data)
          }
          break
      }
    } catch {
      // Failed to handle WebSocket message
    }
  },

  close(peer) {
    peers.delete(peer)
  },

  error(peer) {
    peers.delete(peer)
  }
})
