import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { config } from '../config.mjs'
import { readJsonSafe } from '../formatters/parsers.mjs'
import { slaveTransitionEmbed } from '../formatters/embeds.mjs'
import { sendEvent } from '../channels.mjs'
import { watchWithRetry } from './debounce.mjs'

const statusDir = resolve(config.projectRoot, '.worktrees/slave-status')

// In-memory cache of last-seen status per slave
const statusCache = new Map()

export function startSlaveStatusWatcher() {
  // Seed cache with current state
  seedCache()

  return watchWithRetry(statusDir, (_eventType, filename) => {
    if (!filename || !filename.endsWith('.json')) return
    checkTransition(filename)
  })
}

function seedCache() {
  try {
    const files = readdirSync(statusDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const data = readJsonSafe(resolve(statusDir, file))
      if (data) {
        statusCache.set(file, data.status)
      }
    }
  } catch {
    // dir may not exist
  }
}

async function checkTransition(filename) {
  const filePath = resolve(statusDir, filename)
  const data = readJsonSafe(filePath)
  if (!data) return

  const oldStatus = statusCache.get(filename) || null
  const newStatus = data.status

  if (oldStatus === newStatus) return

  statusCache.set(filename, newStatus)
  console.log(`Slave transition: ${filename} ${oldStatus} → ${newStatus}`)

  const eventType = newStatus === 'failed' ? 'slave_failed'
    : newStatus === 'completed' ? 'slave_completed'
    : 'slave_started'

  try {
    const embed = slaveTransitionEmbed(data.slave_id || filename, oldStatus, newStatus, data)
    await sendEvent(eventType, { embeds: [embed] })
  } catch (error) {
    console.error('Failed to send slave transition notification:', error.message)
  }
}
