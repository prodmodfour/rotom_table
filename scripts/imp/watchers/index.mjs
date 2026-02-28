import { startSlaveStatusWatcher } from './slave-status.mjs'
import { startSlavePlanWatcher } from './slave-plan.mjs'
import { startStateFileWatcher } from './state-files.mjs'

const cleanups = []

export function startWatchers() {
  console.log('Starting file watchers...')

  cleanups.push(startSlaveStatusWatcher())
  cleanups.push(startSlavePlanWatcher())
  cleanups.push(startStateFileWatcher())

  console.log('File watchers active.')
}

export function stopWatchers() {
  for (const cleanup of cleanups) {
    if (typeof cleanup === 'function') {
      cleanup()
    }
  }
  cleanups.length = 0
  console.log('File watchers stopped.')
}
