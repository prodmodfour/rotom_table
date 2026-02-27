---
ticket_id: refactoring-026
priority: P1
categories:
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/pokemon/[id].vue
  - app/pages/gm/characters/[id].vue
estimated_scope: medium
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

The healing tab UI and handlers are nearly identical between `pokemon/[id].vue` and `characters/[id].vue`. Five handler functions and the healing status/actions template are copy-pasted with only the entity type ('pokemon' vs 'character') differing. This is ~100 lines of duplicated logic + ~100 lines of duplicated template.

## Findings

### Finding 1: EXT-DUPLICATE — Healing handlers
- **Metric:** 5 nearly identical async functions (handleRest, handleExtendedRest, handlePokemonCenter, handleHealInjury, handleNewDay) in both files
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** Bug fixes to healing behavior must be applied in both files. The `useRestHealing` composable is already used, but the handler wrappers (null check → call → set result → reload) are duplicated.
- **Evidence:**
  - pokemon/[id].vue lines 623-666 (5 handlers)
  - characters/[id].vue lines 428-471 (5 handlers, identical structure)

### Finding 2: EXT-DUPLICATE — Healing tab template
- **Metric:** ~90 lines of near-identical template for healing status display and action buttons
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** UI changes to healing (e.g., adding a new healing action) must be replicated in both files.
- **Evidence:**
  - pokemon/[id].vue lines 405-512 (healing tab template)
  - characters/[id].vue lines 208-331 (healing tab template — adds Drain AP section for trainers)

### Finding 3: EXT-DUPLICATE — Healing info computed
- **Metric:** The `healingInfo` computed property is identical except for field access patterns
- **Threshold:** >10 similar lines
- **Impact:** Both use `(entity as any)` to access healing fields, duplicating the type-safety workaround
- **Evidence:**
  - pokemon/[id].vue lines 612-621
  - characters/[id].vue lines 417-426

## Suggested Refactoring

1. Create `app/components/common/HealingTab.vue` that accepts props: `entityType: 'pokemon' | 'character'`, `entityId: string`, `entity: Pokemon | HumanCharacter`
2. Move healing handlers, healingInfo computed, and healing UI into the new component
3. The component can use `useRestHealing` internally and emit `healed` event for parent to reload
4. Characters-only features (Drain AP) can be conditionally rendered based on entityType prop
5. Replace healing tab in both pages with `<HealingTab :entity-type="..." :entity-id="..." :entity="..." @healed="reload" />`

Estimated commits: 2-3

## Related Lessons
- Pattern H (duplication chains spawn cascading tickets) — retrospective-summary.md
- Pattern F (duplicate code paths for same operation) — retrospective-summary.md

## Resolution Log
- Commits: 860abf3, 50ee867, 8eaa354
- Files changed: app/pages/gm/pokemon/[id].vue (-382 lines healing code), app/pages/gm/characters/[id].vue (953 → 680 lines, -273 lines healing code)
- New files created: app/components/common/HealingTab.vue (314 lines — shared between both pages)
- Tests passing: 508/508 unit tests pass (Vitest); no new type errors introduced
- Notes: All 5 duplicated healing handlers (handleRest, handleExtendedRest, handlePokemonCenter, handleHealInjury, handleNewDay), healingInfo computed, healing template (~100 lines each), and healing SCSS (~95 lines each) consolidated into HealingTab.vue. Character-only features (Drain AP display, Drain AP heal action) conditionally rendered via entityType prop. Both pages now use `<HealingTab entity-type="..." :entity-id="..." :entity="..." @healed="reload" />`.
