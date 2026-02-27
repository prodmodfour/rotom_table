---
ticket_id: refactoring-076
category: EXT-COSMETIC
priority: P4
status: resolved
source: code-review-144 M1
created_by: slave-collector (plan-20260223-104924)
created_at: 2026-02-23T11:30:00Z
---

# refactoring-076: Restore 9px font-size for PokemonCard stat cell labels

## Summary

The SCSS extraction in feature-003 P0 fix cycle (commit 818f479) unified `.player-stat-cell__label` and `.player-stat-cell__stage` to 10px (from `PlayerCharacterSheet.vue`). The original `PlayerPokemonCard.vue` used 9px for space efficiency on the compact mobile card. A `:deep()` override was not added to restore the original sizing.

## Affected Files

- `app/components/player/PlayerPokemonCard.vue` (add `:deep()` override for 9px label/stage)

## Suggested Fix

Add a `:deep()` override in `PlayerPokemonCard.vue`:

```scss
.pokemon-card__stats {
  :deep(.player-stat-cell__label) {
    font-size: 9px;
  }
  :deep(.player-stat-cell__stage) {
    font-size: 9px;
  }
}
```

## Impact

- **Code health:** Cosmetic-only — 1px difference on compact stat grids
- **Testability:** No logic changes
- **Extensibility:** None

## Resolution Log

- **Commit:** Added `:deep()` overrides in `PlayerPokemonCard.vue` `.pokemon-card__stats` for `.player-stat-cell__label` and `.player-stat-cell__stage` to restore 9px font-size
- **Files changed:** `app/components/player/PlayerPokemonCard.vue`
