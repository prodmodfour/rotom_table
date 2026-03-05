/**
 * useGmToast - Singleton composable for non-blocking GM toast notifications.
 *
 * Replaces browser alert() calls in the GM encounter flow with dismissable,
 * auto-clearing toast messages. Supports severity-based styling (warning,
 * critical, error, info, success).
 *
 * State is module-scoped (singleton) so any component can read the toast queue
 * and any composable can push new toasts without prop-drilling.
 */

export type GmToastSeverity = 'warning' | 'critical' | 'error' | 'info' | 'success'

export interface GmToast {
  id: number
  message: string
  severity: GmToastSeverity
  /** Timestamp when the toast was created */
  createdAt: number
}

// Module-level singleton state (shared across all consumers)
const toasts = ref<GmToast[]>([])
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

/** Default auto-dismiss durations (ms) by severity */
const DISMISS_DURATIONS: Record<GmToastSeverity, number> = {
  info: 5000,
  success: 4000,
  warning: 8000,
  error: 8000,
  critical: 12000,
}

export function useGmToast() {
  /**
   * Push a new toast notification.
   * Returns the toast id for programmatic dismissal.
   */
  const showToast = (message: string, severity: GmToastSeverity = 'info'): number => {
    const id = nextId++
    const toast: GmToast = {
      id,
      message,
      severity,
      createdAt: Date.now(),
    }
    toasts.value = [...toasts.value, toast]

    // Auto-dismiss after duration
    const duration = DISMISS_DURATIONS[severity]
    const timer = setTimeout(() => {
      dismissToast(id)
    }, duration)
    timers.set(id, timer)

    return id
  }

  /** Dismiss a specific toast by id */
  const dismissToast = (id: number): void => {
    toasts.value = toasts.value.filter(t => t.id !== id)
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  /** Dismiss all toasts */
  const dismissAll = (): void => {
    toasts.value = []
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }
    timers.clear()
  }

  return {
    /** Reactive list of active toasts (read-only for rendering) */
    toasts: readonly(toasts),
    showToast,
    dismissToast,
    dismissAll,
  }
}
