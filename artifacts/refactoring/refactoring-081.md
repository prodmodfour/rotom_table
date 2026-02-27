---
ticket_id: refactoring-081
priority: P1
category: EXT-BUG
status: resolved
domain: player-view
source: sass-compilation-error
created_by: manual
created_at: 2026-02-25
resolved_at: 2026-02-26
---

# refactoring-081: Fix incompatible SCSS unit addition in player-view

## Summary

`_player-view.scss` line 184 adds `$spacing-md` (1rem) to `18px`, which are incompatible SASS units. This causes a Vite CSS compilation error that blocks the dev server with an overlay error.

## Error

```
[sass] 1rem and 18px have incompatible units.
    ╷
184 │     padding: $spacing-xs 0 0 ($spacing-md + 18px);
    │                               ^^^^^^^^^^^^^^^^^^
    ╵
  assets/scss/components/_player-view.scss 184:31
```

## Affected Files

1. `app/assets/scss/components/_player-view.scss:184`

## Fix

Replace the arithmetic addition with `calc()` which handles mixed units at runtime:

```scss
// Before (broken)
padding: $spacing-xs 0 0 ($spacing-md + 18px);

// After (fixed)
padding: $spacing-xs 0 0 calc(#{$spacing-md} + 18px);
```

Alternatively, convert `18px` to rem (`1.125rem` assuming 16px base) so both operands share the same unit, but `calc()` is more robust.

## Severity

**Build-breaking** — the dev server shows an error overlay and the player view styles fail to compile.

## Resolution Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-26 | f3fc8ae | Replace `($spacing-md + 18px)` with `calc(#{$spacing-md} + 18px)` in `_player-view.scss:184` — fixes SASS unit incompatibility |
