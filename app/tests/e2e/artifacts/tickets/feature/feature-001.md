---
ticket_id: feature-001
priority: P3
status: in-progress
domain: character-lifecycle
source: product-roadmap
created_by: user
created_at: 2026-02-22
design_complexity: single-phase
design_spec: design-trainer-sprites-001
---

# feature-001: B2W2 Trainer Sprites for NPC/Player Avatars

## Summary

Human characters (NPCs and players) currently display letter-initial fallbacks because there is no way to set an avatar through the UI. Replace this with a B2W2 trainer sprite picker so that every human character has a visual identity consistent with the Pokemon sprite aesthetic already used for Pokemon (`usePokemonSprite.ts` sources Gen 1-5 from B2W2).

## Requirements

- Characters should be assignable a trainer sprite from the B2W2 sprite catalog
- Sprite selection available during character creation and editing
- All views (GM, Group, Player) render the selected sprite where avatars appear today
- The existing `avatarUrl` field on `HumanCharacter` already stores the value -- no schema migration needed
- Letter-initial fallback remains for characters without a selected sprite

## Design Questions

- Sprite source: CDN (PokeAPI, Showdown) vs bundled assets? Licensing implications?
- Sprite catalog size: how many trainer classes/types are available in B2W2?
- Picker UX: grid with categories? Search/filter?

## Design Answers

- **Sprite source:** Pokemon Showdown CDN (`play.pokemonshowdown.com/sprites/trainers/`). Same CDN already used for Gen 6+ Pokemon sprites. 800+ trainer sprites available. PokeAPI does not have trainer sprites.
- **Catalog size:** 150-200 curated sprites from the 800+ available, organized into 9 categories (Protagonists, Gym Leaders, Elite/Champions, Villains, Grunts, Generic Male/Female, Specialists, Other).
- **Picker UX:** Modal grid with category filter tabs, search input, click-to-select, clear/confirm actions. 80x80 sprite cells with labels.

## Scope

Small. Single-phase design spec sufficient. The data plumbing (DB field, API serialization, component rendering slots) already exists -- this is primarily a sprite source decision + picker component + composable.

## Design Spec

See `design-trainer-sprites-001.md` for the full design document.

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-22 | Design spec written | `design-trainer-sprites-001.md` covering sprite source, composable, picker component, and 17 integration points |
| 2026-02-23 | P0 implementation | Branch `slave/6-dev-feature-001-p0-20260223-085530` |
| 2026-02-23 | P0 fix cycle | Branch `slave/1-dev-feature-001-fix-20260223-104924` — code-review-143 CHANGES_REQUIRED fixes (C1, M1, M2, M3). H1 deferred to refactoring-075 |

### P0 Commits

| Hash | Message |
|------|---------|
| `7f9dd1f` | feat: add trainer sprite catalog with 180 curated sprites |
| `0a9c67d` | feat: add useTrainerSprite composable for avatar URL resolution |
| `d78d29d` | feat: add TrainerSpritePicker modal component |
| `86ce748` | feat: integrate TrainerSpritePicker into character creation forms |
| `76fb481` | feat: integrate TrainerSpritePicker into character editing views |
| `9d56757` | feat: update avatar rendering to use trainer sprite resolution |
| `3393ffd` | feat: update remaining avatar displays to use trainer sprite resolution |

### P0 Fix Cycle Commits (code-review-143)

| Hash | Message |
|------|---------|
| `477547f` | fix: assign defineProps return value in HumanCard to prevent runtime crash |
| `2cb1710` | fix: add deliberate-invocation comments for getTrainerSpriteUrl in v-for |
| `e1c2562` | fix: standardize avatar error handling to reactive null-out pattern |
| `ae3ac24` | fix: replace pokemon-placeholder fallback with reactive null-out for human avatars |
| `cca2210` | docs: add trainer sprite files to app-surface.md |
