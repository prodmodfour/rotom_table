---
review_id: code-review-076
trigger: orchestrator-routed
target_tickets: [refactoring-043, ptu-rule-064]
reviewed_commits: [e2644c6, 7c487e0, 90478cf, a350d92, 0e04e5d, d8a081b, f4ac0e5, 400717d]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T03:15:00Z
reviewer: senior-reviewer
---

## Scope

**Batch A review** covering two tickets:

1. **refactoring-043** -- Pokemon detail page decomposition. Extracted 6 child components from the 1384-line `[id].vue` page, reducing it to 389 lines. Commits: 7c487e0, 90478cf, a350d92, 0e04e5d, d8a081b, f4ac0e5.
2. **ptu-rule-064** -- Template stat fallback defaults. Changed HP fallback from `0` to `10` and Attack/SpAtk fallback from `0` to `5` in both template endpoints. Commit: e2644c6.

## Issues Found

### CRITICAL

None.

### HIGH

**H1. Shiny badge uses HTML entity star character instead of Phosphor Icon** (`PokemonEditForm.vue:5`)

The shiny badge renders `&#9733;` (a Unicode star). Project rules mandate Phosphor Icons for all UI elements, never emojis or Unicode characters. This was carried over from the original page, so it is pre-existing -- but it was touched during extraction and should have been caught.

File: `/home/ashraf/pokemon_ttrpg/session_helper/app/components/pokemon/PokemonEditForm.vue`, line 5.

Note: `CharacterModal.vue` has the same pattern with `★`. Both should use a Phosphor star icon. File ticket for `CharacterModal.vue`.

**H2. Inconsistent `update:editData` merge strategy between PokemonEditForm and PokemonStatsTab**

- `PokemonEditForm` at parent line 42: `@update:edit-data="editData = $event"` -- direct replacement.
- `PokemonStatsTab` at parent line 74: `@update:edit-data="editData = { ...editData, ...$event }"` -- merge.

Both child components already emit a fully-spread copy of `props.editData` with the changed field. PokemonStatsTab emits `{ ...props.editData, currentHp: val }`, and PokemonEditForm emits `{ ...props.editData, [field]: value }`. Both already produce complete `editData` objects.

The parent's merge in the PokemonStatsTab handler `{ ...editData, ...$event }` is redundant but harmless today. However, the inconsistency is a maintenance hazard -- a future developer may assume the child only emits a partial diff (because the parent merges), and emit `{ currentHp: val }` without spreading, which would silently wipe all other fields through the PokemonEditForm handler path.

Pick one strategy and use it everywhere. Recommended: always emit full object from child, always assign directly in parent (like PokemonEditForm).

### MEDIUM

**M1. Heavy SCSS duplication across extracted components**

The following style blocks are duplicated across multiple Pokemon child components:

| Style block | Duplicated in |
|---|---|
| `@keyframes fadeIn` | StatsTab, MovesTab, SkillsTab, CapabilitiesTab (4 copies) |
| `@keyframes rollIn` | MovesTab, SkillsTab (2 copies) |
| `.roll-result` (full block, ~60 lines) | MovesTab, SkillsTab (2 copies) |
| `.empty-state` | MovesTab, SkillsTab (2 copies) |
| `.info-section` | StatsTab, SkillsTab, CapabilitiesTab (3 copies) |
| `.tab-content` animation | StatsTab, MovesTab, SkillsTab, CapabilitiesTab (4 copies) |
| `.type-badge` (18 type colors) | EditForm, MovesTab (2 copies, ~40 lines each) |

These should be extracted into shared SCSS partials (e.g., `_pokemon-sheet.scss`) or a shared base component. The type badge colors in particular are prime candidates for a global mixin or utility class since they appear in many other places too.

File a refactoring ticket.

**M2. `v-model` used directly on `editData` in Notes tab (parent page lines 129, 133)**

The Notes tab uses `v-model="editData.notes"` and `v-model="editData.heldItem"` which mutates the `editData` ref in-place. This violates the project's immutability rule. While `editData` is a local ref (not a prop), the mutation pattern is inconsistent with how the extracted components handle updates (they emit new objects). If the Notes tab is ever extracted, this would become a prop mutation bug.

Recommend changing to `:value` + `@input` with a spread pattern, consistent with the other extracted components.

## What Looks Good

1. **Clean extraction discipline.** Each commit extracts exactly one component with no behavioral changes mixed in. The 6-commit series is well-structured and easy to bisect.

2. **Proper props/emits contracts.** All components use `defineProps<>` with proper typing and `defineEmits<>` with typed event signatures. No prop mutations detected anywhere.

3. **PokemonStatsTab computed writables.** The `localCurrentHp`/`localMaxHp` computed getters/setters are an idiomatic Vue pattern for two-way binding through emit without prop mutation. Well done.

4. **PokemonLevelUpPanel isolation.** The panel correctly takes minimal props (`pokemonId`, `currentLevel`, `targetLevel`) and fetches its own data from the server. Good separation of concerns.

5. **ptu-rule-064 fix is correct and complete.** Both `from-encounter.post.ts` (line 68) and `load.post.ts` (line 84) now use `{ hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }` as the fallback. The original had `hp: 0, attack: 0, specialAttack: 0` which would produce a maxHp of `(1*2) + (0*3) + 10 = 12` for a level 1 trainer instead of the correct `(1*2) + (10*3) + 10 = 42`. The fix aligns with PTU Level 1 Trainer starting stats.

6. **No other stat fallback locations need the fix.** The only other `hp: 0` in the codebase is in `pokemon-generator.service.ts:357` which is an accumulator initialization (correct). The `pokemon-generator.service.ts:90` uses `hp: 5` as a base stat default for species lookup failure, which is a different context.

7. **Parent page final line count: 389.** Well under the 400 target. PokemonStatsTab at 401 lines is 1 line over the ideal but well under the 800 hard limit, and the extra line count is driven by legitimately verbose SCSS status badge styles.

## New Tickets Filed

**refactoring-049: Extract shared Pokemon sheet SCSS into partials**
- Deduplicate `fadeIn`, `rollIn`, `roll-result`, `empty-state`, `info-section`, `tab-content`, and `type-badge` styles
- Move to `app/assets/scss/_pokemon-sheet.scss` or similar shared partial
- Impact: 6 components, ~200 lines of duplicated CSS

**ptu-rule-068: Replace Unicode star shiny badge with Phosphor Icon**
- `PokemonEditForm.vue:5` uses `&#9733;`
- `CharacterModal.vue:19` uses `★`
- Both should use Phosphor `PhStar` or `PhStarFill` component
- Low effort, project convention enforcement

## Verdict

**APPROVED_WITH_ISSUES**

The refactoring extraction is clean and correctly preserves behavior. The ptu-rule-064 fix is correct and complete. Two new tickets filed for SCSS duplication (M1) and icon convention (H1/ptu-rule-068). H2 (inconsistent merge strategy) should be addressed in the SCSS dedup pass or as a standalone cleanup -- not blocking, but should not be deferred past the next refactoring cycle.
