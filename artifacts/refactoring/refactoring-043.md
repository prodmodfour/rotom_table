---
ticket_id: refactoring-043
priority: P2
status: resolved
category: EXT-GOD
source: code-review-074, code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Pokemon detail page (`app/pages/gm/pokemon/[id].vue`) is at 1384 lines, well over the 800-line project limit. Was already at 1242 lines before the level-up info panel addition (+142 lines).

## Affected Files

- `app/pages/gm/pokemon/[id].vue` (1384 lines)

## Suggested Refactoring

Extract tab content into separate components:
1. Stats tab → `PokemonStatsTab.vue`
2. Moves tab → `PokemonMovesTab.vue`
3. Level-up info panel → `PokemonLevelUpPanel.vue`
4. Edit form sections → `PokemonEditForm.vue`

Target: main page file under 400 lines, tab components 200-300 lines each.

## Resolution Log

**Result:** Main page reduced from 1384 lines to 388 lines (72% reduction). All 578 unit tests pass.

### Commits

1. `7c487e0` - Extract `PokemonStatsTab.vue` (stats grid, combat state, nature display)
2. `90478cf` - Extract `PokemonMovesTab.vue` (move cards, attack/damage roll display)
3. `a350d92` - Extract `PokemonLevelUpPanel.vue` (level-up detection + info panel)
4. `0e04e5d` - Extract `PokemonEditForm.vue` (header sprite, species/level/gender fields, type badges)
5. `d8a081b` - Extract `PokemonSkillsTab.vue` (skill rolls, training info, egg groups)
6. `f4ac0e5` - Extract `PokemonCapabilitiesTab.vue` (movement capabilities, other capabilities)

### Files Changed

- `app/pages/gm/pokemon/[id].vue` — 1384 → 388 lines

### New Files Created

- `app/components/pokemon/PokemonStatsTab.vue` (266 lines)
- `app/components/pokemon/PokemonMovesTab.vue` (260 lines)
- `app/components/pokemon/PokemonLevelUpPanel.vue` (131 lines)
- `app/components/pokemon/PokemonEditForm.vue` (166 lines)
- `app/components/pokemon/PokemonSkillsTab.vue` (192 lines)
- `app/components/pokemon/PokemonCapabilitiesTab.vue` (113 lines)

### Test Status

- All 578 unit tests pass (Vitest)
- Playwright e2e tests show pre-existing collection errors (unrelated to this change)

- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
