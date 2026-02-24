import { peers, safeSend } from '~/server/utils/websocket'

/**
 * REST fallback for player action requests.
 * Forwards the action to GM via server-side WebSocket broadcast.
 * Used when the player's WebSocket is momentarily disconnected.
 *
 * POST /api/player/action-request
 * Body: { playerId, playerName, action, requestId, ... }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.playerId || !body.action) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: playerId, action'
    })
  }

  // Build the WebSocket event to forward to GM
  const wsEvent = {
    type: 'player_action',
    data: body
  }

  const message = JSON.stringify(wsEvent)
  let gmFound = false

  // Forward to all GM peers
  for (const [peer, info] of peers) {
    if (info.role === 'gm') {
      safeSend(peer, message)
      gmFound = true
    }
  }

  if (!gmFound) {
    return {
      success: false,
      error: 'No GM connected to receive the action request'
    }
  }

  return {
    success: true,
    data: {
      requestId: body.requestId ?? null,
      forwarded: true
    }
  }
})
