---
ticket_id: refactoring-050
priority: P3
status: resolved
category: UI-CONVENTION
source: code-review-076
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`PokemonEditForm.vue` line 5 uses `&#9733;` (Unicode star) for the shiny badge instead of a Phosphor Icon, violating the project convention of using Phosphor Icons over emojis/Unicode characters. Also affects `CharacterModal.vue`.

## Affected Files

- `app/components/pokemon/PokemonEditForm.vue`
- `app/components/encounter/CharacterModal.vue`

## Fix

Replace Unicode star character with appropriate Phosphor Icon (e.g., `PhStar` or `PhSparkle`).

## Resolution Log

- **Resolved:** 2026-02-20
- **Changes:**
  - `app/components/pokemon/PokemonEditForm.vue`: Replaced `&#9733;` Unicode star in `<span>` with `<PhStar>` component using `weight="fill"` and `:size="20"`. Removed unnecessary `font-size` from `.shiny-badge` CSS (size now controlled by `:size` prop).
  - `app/components/character/CharacterModal.vue`: Replaced `★` Unicode star in `<span>` with `<PhStar>` component using `weight="fill"` and `:size="20"`. Removed unnecessary `font-size` from `.shiny-badge` CSS.
- **Note:** Ticket listed affected path as `app/components/encounter/CharacterModal.vue` but the actual file is at `app/components/character/CharacterModal.vue`. Both instances were the only Unicode star occurrences in the codebase (verified via grep).
