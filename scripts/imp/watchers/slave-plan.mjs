import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { config } from '../config.mjs'
import { readJsonSafe } from '../formatters/parsers.mjs'
import { planCreatedEmbed } from '../formatters/embeds.mjs'
import { sendEvent } from '../channels.mjs'
import { watchWithRetry } from './debounce.mjs'
import { resetAllDoneFlag } from './slave-status.mjs'

const worktreesDir = resolve(config.projectRoot, '.worktrees')
const planPath = resolve(worktreesDir, 'slave-plan.json')

let lastPlanExists = false
let pollInterval = null

export function startSlavePlanWatcher() {
  lastPlanExists = existsSync(planPath)

  // fs.watch on the .worktrees directory to detect plan file creation/deletion
  const cleanup = watchWithRetry(worktreesDir, (_eventType, filename) => {
    if (filename !== 'slave-plan.json') return
    checkPlanChange()
  })

  // Polling fallback every 30 seconds (inotify backup per plan)
  pollInterval = setInterval(checkPlanChange, 30000)

  return function cleanupAll() {
    cleanup()
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }
}

async function checkPlanChange() {
  const nowExists = existsSync(planPath)

  if (!lastPlanExists && nowExists) {
    lastPlanExists = true
    resetAllDoneFlag()
    console.log('Slave plan created')

    const plan = readJsonSafe(planPath)
    if (!plan) return

    try {
      const embed = planCreatedEmbed(plan)
      await sendEvent('plan_created', { embeds: [embed] })
    } catch (error) {
      console.error('Failed to send plan creation notification:', error.message)
    }
  } else if (lastPlanExists && !nowExists) {
    lastPlanExists = false
    console.log('Slave plan removed')

    try {
      await sendEvent('plan_deleted', { content: '📋 Slave plan removed.' })
    } catch (error) {
      console.error('Failed to send plan deletion notification:', error.message)
    }
  }
}
