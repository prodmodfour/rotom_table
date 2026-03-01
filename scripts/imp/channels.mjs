import { config } from './config.mjs'
import { client } from './client.mjs'

const EVENT_CHANNEL_MAP = {
  // Pipeline lifecycle
  plan_created: 'pipeline',
  plan_deleted: 'pipeline',
  slaves_launched: 'pipeline',
  slave_started: 'pipeline',
  slave_completed: 'pipeline',
  slave_failed: 'pipeline',
  all_slaves_done: 'pipeline',
  collection_started: 'pipeline',
  collection_complete: 'pipeline',
  merge_result: 'pipeline',
  state_updated: 'pipeline',

  // Errors
  build_failure: 'errors',
  test_failure: 'errors',
  merge_conflict: 'errors',
  smoke_failure: 'errors',

  // Coverage
  matrix_complete: 'coverage',
  coverage_update: 'coverage',
  audit_summary: 'coverage',

  // Tickets
  ticket_created: 'tickets',
  decree_need: 'tickets',

  // Relay
  relay_sent: 'relay',
  relay_received: 'relay',

  // Fallback
  test: 'pipeline',
  info: 'pipeline',
}

// Cache resolved channel objects by config value
const channelCache = new Map()

export function getChannelForEvent(eventType) {
  const channelKey = EVENT_CHANNEL_MAP[eventType] || 'pipeline'
  return config.channels[channelKey]
}

/**
 * Resolve a channel config value to a Discord channel object.
 * Supports numeric snowflake IDs and #channel-name strings.
 */
async function resolveChannel(channelValue) {
  if (!channelValue) return null
  if (channelCache.has(channelValue)) return channelCache.get(channelValue)

  let channel = null

  // Try as snowflake ID first (all digits)
  if (/^\d+$/.test(channelValue)) {
    try {
      channel = await client.channels.fetch(channelValue)
    } catch {
      // Not a valid ID
    }
  }

  // Fall back to name-based lookup
  if (!channel) {
    const name = channelValue.replace(/^#/, '')
    const guild = client.guilds.cache.get(config.guildId)
    if (guild) {
      const channels = await guild.channels.fetch()
      channel = channels.find(c => c.name === name) || null
    }
  }

  if (channel) {
    channelCache.set(channelValue, channel)
  }
  return channel
}

export async function sendToChannel(channelValue, content) {
  const channel = await resolveChannel(channelValue)
  if (!channel) {
    console.error(`Channel not found: ${channelValue}`)
    return null
  }
  return channel.send(content)
}

export async function sendEvent(eventType, content) {
  const channelValue = getChannelForEvent(eventType)
  return sendToChannel(channelValue, content)
}
