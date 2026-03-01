import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import { config } from '../config.mjs'
import { readJsonSafe } from '../formatters/parsers.mjs'
import { slaveTransitionEmbed } from '../formatters/embeds.mjs'
import { sendEvent } from '../channels.mjs'
import { watchWithRetry } from './debounce.mjs'

const statusDir = resolve(config.projectRoot, '.worktrees/slave-status')
const planPath = resolve(config.projectRoot, '.worktrees/slave-plan.json')

// In-memory cache of last-seen status per slave
const statusCache = new Map()

// Track whether we've already sent the "all done" notification for this plan
let allDoneNotified = false

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
    const payload = { embeds: [embed] }

    // Add View Logs button for completed/failed slaves
    if (newStatus === 'completed' || newStatus === 'failed') {
      const slaveNum = data.slave_id || filename.replace('slave-', '').replace('.json', '')
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`view_logs_${slaveNum}`)
          .setLabel('View Logs')
          .setStyle(ButtonStyle.Secondary)
      )
      payload.components = [row]
    }

    await sendEvent(eventType, payload)
  } catch (error) {
    console.error('Failed to send slave transition notification:', error.message)
  }

  // Check if all slaves in the plan are now done
  if ((newStatus === 'completed' || newStatus === 'failed') && !allDoneNotified) {
    await checkAllSlavesDone()
  }
}

async function checkAllSlavesDone() {
  const plan = readJsonSafe(planPath)
  if (!plan || !plan.total_slaves) return

  let statusFiles
  try {
    statusFiles = readdirSync(statusDir).filter(f => f.endsWith('.json'))
  } catch {
    return
  }

  const statuses = statusFiles
    .map(f => readJsonSafe(resolve(statusDir, f)))
    .filter(Boolean)

  if (statuses.length < plan.total_slaves) return

  const allTerminal = statuses.every(s =>
    s.status === 'completed' || s.status === 'failed'
  )

  if (!allTerminal) return

  allDoneNotified = true

  const completed = statuses.filter(s => s.status === 'completed').length
  const failed = statuses.filter(s => s.status === 'failed').length

  const color = failed > 0 ? 0xf39c12 : 0x2ecc71
  const title = failed > 0
    ? `All Slaves Finished (${failed} failed)`
    : 'All Slaves Completed'

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `**Plan:** \`${plan.plan_id}\`\n` +
      `**Completed:** ${completed} | **Failed:** ${failed} | **Total:** ${plan.total_slaves}\n\n` +
      'Run `/collect_slaves` to merge results to master.'
    )
    .setColor(color)
    .setTimestamp()

  try {
    await sendEvent('all_slaves_done', { embeds: [embed] })
    console.log('All slaves done notification sent.')
  } catch (error) {
    console.error('Failed to send all-slaves-done notification:', error.message)
  }
}

export function resetAllDoneFlag() {
  allDoneNotified = false
}
