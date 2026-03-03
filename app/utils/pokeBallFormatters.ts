/**
 * Shared formatting utilities for Poke Ball modifier display.
 * Used by BallSelector, BallConditionPreview, and CaptureRateDisplay.
 */

/**
 * Format a ball modifier as a signed string.
 * PTU convention: negative modifier = easier capture, positive = harder.
 */
export function formatModifier(mod: number): string {
  if (mod === 0) return '+0'
  return mod > 0 ? `+${mod}` : `${mod}`
}

/**
 * Return a CSS class reflecting whether a modifier is beneficial or detrimental.
 * In PTU capture, a negative modifier makes capture easier (good) and positive harder (bad).
 */
export function modifierClass(mod: number): string {
  if (mod < 0) return 'mod--positive'  // Negative modifier = easier capture = good
  if (mod > 0) return 'mod--negative'  // Positive modifier = harder capture = bad
  return 'mod--neutral'
}
