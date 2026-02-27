/**
 * Map a numeric type effectiveness multiplier to a CSS class name
 * for styling effectiveness badges.
 */
export function getEffectivenessClass(effectiveness: number): string {
  if (effectiveness === 0) return 'immune'
  if (effectiveness <= 0.25) return 'double-resist'
  if (effectiveness < 1) return 'resist'
  if (effectiveness >= 2) return 'double-super'
  if (effectiveness > 1) return 'super'
  return 'neutral'
}
