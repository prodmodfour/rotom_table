/**
 * Server-side validation for significance tier values.
 * Whitelist matches the SignificanceTier union type in ~/utils/encounterBudget.ts.
 * Capped at 'significant' per decree-030 (PTU Core p.460: x1 to about x5).
 */

export const VALID_SIGNIFICANCE_TIERS = [
  'insignificant',
  'everyday',
  'significant'
] as const

export type ValidSignificanceTier = typeof VALID_SIGNIFICANCE_TIERS[number]

/**
 * Validate that a significance tier string is one of the allowed values.
 * Throws a 400 error if the value is present but invalid.
 * Allows undefined/null (tier is optional in most endpoints).
 */
export function validateSignificanceTier(tier: unknown): void {
  if (tier === undefined || tier === null) return

  if (
    typeof tier !== 'string' ||
    !VALID_SIGNIFICANCE_TIERS.includes(tier as ValidSignificanceTier)
  ) {
    throw createError({
      statusCode: 400,
      message: `significanceTier must be one of: ${VALID_SIGNIFICANCE_TIERS.join(', ')}`
    })
  }
}
