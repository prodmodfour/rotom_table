import { watch, existsSync, mkdirSync } from 'node:fs'

/**
 * Watch a file or directory with per-file debouncing.
 * Returns the FSWatcher instance for cleanup.
 */
export function debouncedWatch(path, callback, delayMs = 200) {
  const timeouts = new Map()

  const watcher = watch(path, { persistent: false }, (eventType, filename) => {
    const key = filename || '__default__'
    if (timeouts.has(key)) clearTimeout(timeouts.get(key))
    timeouts.set(key, setTimeout(() => {
      timeouts.delete(key)
      callback(eventType, filename)
    }, delayMs))
  })

  watcher.on('error', error => {
    console.error(`Watch error on ${path}:`, error.message)
  })

  return watcher
}

/**
 * Watch a directory that may not exist yet.
 * Polls for directory creation, then starts watching.
 * Returns a cleanup function.
 */
export function watchWithRetry(path, callback, { delayMs = 200, pollMs = 5000 } = {}) {
  let watcher = null
  let pollInterval = null
  let stopped = false

  function startWatch() {
    if (stopped) return
    if (watcher) {
      try { watcher.close() } catch {}
    }
    try {
      watcher = debouncedWatch(path, callback, delayMs)
      watcher.on('error', () => {
        // Directory might have been deleted, start polling again
        if (!stopped) startPoll()
      })
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    } catch {
      startPoll()
    }
  }

  function startPoll() {
    if (stopped || pollInterval) return
    pollInterval = setInterval(() => {
      if (existsSync(path)) {
        startWatch()
      }
    }, pollMs)
  }

  if (existsSync(path)) {
    startWatch()
  } else {
    startPoll()
  }

  return function cleanup() {
    stopped = true
    if (watcher) {
      try { watcher.close() } catch {}
    }
    if (pollInterval) {
      clearInterval(pollInterval)
    }
  }
}

/**
 * Ensure a directory exists, creating it if needed.
 */
export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}
