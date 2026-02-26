/**
 * Round a percentage to the nearest display tier for enemy HP masking.
 *
 * In player mode, enemy HP bars show approximate health instead of exact values.
 * This function snaps a raw HP percentage to one of six tiers:
 *   100 (full), 75, 50, 25, 10 (critical), 0 (fainted).
 *
 * The 10% "critical" tier prevents enemies at 1-24% from appearing at 0%,
 * preserving the distinction between low HP and fainted.
 *
 * Thresholds use midpoint rounding between tiers:
 *   >= 88 -> 100, >= 63 -> 75, >= 38 -> 50, >= 25 -> 25, > 0 -> 10, <= 0 -> 0
 */
export function roundToDisplayTier(percentage: number): number {
  if (percentage <= 0) return 0
  if (percentage >= 100) return 100
  if (percentage >= 88) return 100
  if (percentage >= 63) return 75
  if (percentage >= 38) return 50
  if (percentage >= 25) return 25
  return 10 // "critical" -- low but not fainted
}
