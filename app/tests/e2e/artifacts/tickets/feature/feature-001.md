---
ticket_id: feature-001
priority: P3
status: design-complete
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
