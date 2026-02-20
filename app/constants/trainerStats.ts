/**
 * Shared PTU trainer stat allocation constants.
 *
 * Used by both the useCharacterCreation composable and
 * the StatAllocationSection component to avoid duplication.
 *
 * Reference: PTU Core Chapter 2, p. 15
 */

/** Base HP stat for a new trainer */
export const BASE_HP = 10

/** Base value for non-HP stats (Atk, Def, SpA, SpD, Spe) */
export const BASE_OTHER = 5

/** Total stat points to distribute at level 1 */
export const TOTAL_STAT_POINTS = 10

/** Maximum points that can be assigned to a single stat at level 1 */
export const MAX_POINTS_PER_STAT = 5
