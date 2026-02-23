/**
 * Trainer sprite URL generator.
 *
 * Uses Pokemon Showdown trainer sprites as the source:
 * https://play.pokemonshowdown.com/sprites/trainers/{name}.png
 *
 * Follows the same pattern as usePokemonSprite.ts: a composable
 * function that returns URL-building helpers, auto-imported by Nuxt.
 */

export function useTrainerSprite() {
  const BASE_URL = 'https://play.pokemonshowdown.com/sprites/trainers'

  /**
   * Get the full sprite URL for a trainer sprite key.
   *
   * - If the key is null/empty, returns null (caller should show fallback).
   * - If the key looks like a full URL (starts with 'http'), returns it as-is
   *   for backward compatibility with any existing raw URLs in the database.
   * - Otherwise, constructs the Showdown CDN URL from the key.
   */
  const getTrainerSpriteUrl = (spriteKey: string | null | undefined): string | null => {
    if (!spriteKey) return null
    if (spriteKey.startsWith('http')) return spriteKey
    return `${BASE_URL}/${spriteKey}.png`
  }

  /**
   * Check if a value is a sprite key (vs. a full URL or empty).
   */
  const isSpriteKey = (value: string | null | undefined): boolean => {
    return !!value && !value.startsWith('http')
  }

  return {
    getTrainerSpriteUrl,
    isSpriteKey,
    BASE_URL
  }
}
