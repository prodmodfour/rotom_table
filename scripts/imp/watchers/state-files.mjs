import { resolve } from 'node:path'
import { config } from '../config.mjs'
import { readFileSafe, parseFrontmatter } from '../formatters/parsers.mjs'
import { sendEvent } from '../channels.mjs'
import { watchWithRetry } from './debounce.mjs'
import { EmbedBuilder } from 'discord.js'

const stateDir = resolve(config.projectRoot, 'artifacts/state')

const WATCHED_FILES = ['dev-state.md', 'test-state.md']

// Track last-seen updated_by to avoid duplicate notifications
const lastUpdatedBy = new Map()

export function startStateFileWatcher() {
  // Seed last-seen values
  for (const file of WATCHED_FILES) {
    const content = readFileSafe(resolve(stateDir, file))
    if (content) {
      const { frontmatter } = parseFrontmatter(content)
      lastUpdatedBy.set(file, frontmatter.updated_by || '')
    }
  }

  return watchWithRetry(stateDir, (_eventType, filename) => {
    if (!filename || !WATCHED_FILES.includes(filename)) return
    checkStateUpdate(filename)
  }, { delayMs: 500 })
}

async function checkStateUpdate(filename) {
  const content = readFileSafe(resolve(stateDir, filename))
  if (!content) return

  const { frontmatter } = parseFrontmatter(content)
  const newUpdatedBy = frontmatter.updated_by || ''
  const oldUpdatedBy = lastUpdatedBy.get(filename) || ''

  if (newUpdatedBy === oldUpdatedBy) return

  lastUpdatedBy.set(filename, newUpdatedBy)
  console.log(`State file updated: ${filename} by ${newUpdatedBy}`)

  try {
    const embed = new EmbedBuilder()
      .setTitle(`State Updated: ${filename}`)
      .setDescription(`Updated by: ${newUpdatedBy}\nTimestamp: ${frontmatter.last_updated || '?'}`)
      .setColor(0x9b59b6)
      .setTimestamp()

    await sendEvent('state_updated', { embeds: [embed] })
  } catch (error) {
    console.error('Failed to send state update notification:', error.message)
  }
}
