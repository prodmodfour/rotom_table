---
review_id: code-review-218
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: refactoring-095+ptu-rule-119
domain: character-lifecycle+combat
commits_reviewed:
  - 4990423
  - 64ecf45
  - a0e3888
  - d2ba092
  - d30b7ba
  - c92bbcc
files_reviewed:
  - app/pages/gm/characters/[id].vue
  - app/utils/combatantCapabilities.ts
  - app/tests/unit/utils/combatantCapabilities.test.ts
  - app/tests/unit/composables/useCharacterCreation.test.ts
  - app/components/create/EdgeSelectionSection.vue
  - app/pages/gm/create.vue
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-119.md
  - artifacts/tickets/open/refactoring/refactoring-095.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-28T12:30:00Z
follows_up: code-review-215
---

## Review Scope

Re-review of 6 fix-cycle commits (4990423..c92bbcc) addressing all 5 issues from code-review-215 (CHANGES_REQUIRED, 2 HIGH + 3 MEDIUM). The original implementation was for ptu-rule-119 (trainer Naturewalk support via capabilities field) and refactoring-095 (guard addEdge() against Skill Edge string injection per decree-027).

### Decree Compliance Check

- **decree-027** (Block Skill Edges from raising Pathetic skills during creation): The `addEdge()` guard using `/^skill edge:/i` correctly blocks injection. The new `EdgeSelectionSection.addEdgeFn` prop path ensures the error is surfaced to the user. Unit tests explicitly verify case-insensitive blocking and normal edge acceptance. Compliant.
- **decree-003** (All tokens passable, enemy-occupied rough terrain): Not affected by these changes.
- **decree-010** (Multi-tag terrain): Not affected.
- **decree-025** (Exclude endpoint cells from rough terrain accuracy penalty): Not affected.

## Issue Resolution Verification

### HIGH-01: Comma-splitting mangles multi-terrain Naturewalk — RESOLVED

**Commit:** 4990423

The `onCapabilitiesChange` parser in `[id].vue` now uses `/,(?![^(]*\))/` (negative lookahead) to split only on commas outside parentheses. Verified correctness for:
- `Naturewalk (Forest), Naturewalk (Ocean)` -- splits correctly at the comma between entries
- `Naturewalk (Forest, Grassland)` -- inner comma preserved
- `Naturewalk (Forest, Grassland), Naturewalk (Ocean, Deep Sea)` -- correctly splits at the outer comma, preserves both inner commas

The JSDoc comment clearly documents the regex purpose. Immutable update pattern `{ ...editData.value, capabilities: parsed }` preserved.

### HIGH-02: No unit tests for trainer Naturewalk — RESOLVED

**Commit:** d2ba092

257 new test lines across two files:

1. **combatantCapabilities.test.ts**: `makeHumanCombatant` helper extended with optional `capabilities` and `position` overrides (previously had neither). New test sections:
   - `getCombatantNaturewalks -- trainer with capabilities` (5 tests): single terrain, multiple terrains, multi-terrain entry, non-Naturewalk caps, empty caps
   - `naturewalkBypassesTerrain -- trainer with capabilities` (4 tests): matching terrain, non-matching terrain, wrong terrain type, no Naturewalk
   - `findNaturewalkImmuneStatuses` (8 tests): trainer on matching terrain, single status, non-matching terrain, terrain disabled, no position, non-immune statuses, Pokemon on matching terrain, default normal terrain fallback

2. **useCharacterCreation.test.ts**: New file (51 lines) with 6 tests covering `addEdge()` guard:
   - Blocks `Skill Edge: Athletics` (returns error string, edges empty)
   - Blocks case-insensitive variants (`skill edge:`, `SKILL EDGE:`)
   - Allows `Basic Edge`, `Iron Mind`, `Multiskill Training` (returns null, edges populated)

All five gaps from HIGH-02 are covered.

### MED-01: addEdge return value silently ignored — RESOLVED

**Commit:** a0e3888

Clean architectural solution using a prop-based validation function instead of emit-and-ignore:

1. `EdgeSelectionSection.vue` receives new `addEdgeFn?: (edgeName: string) => string | null` prop
2. `onAddEdge()` calls `addEdgeFn` directly; on error, sets `edgeError` ref and returns (input preserved)
3. On success (null return), `addEdgeFn` itself has already added the edge to `form.edges` via the composable, so no emit needed
4. Fallback `else` branch emits `addEdge` for callers without `addEdgeFn` — backward compatible
5. Error clears on next keystroke via `@input="edgeError = ''"`
6. Visual feedback via `.form-input--error` border color and `.edge-error` message below input

`create.vue` correctly changed from `@add-edge="creation.addEdge"` to `:add-edge-fn="creation.addEdge"`, passing the function as a prop instead of using it as an event handler.

### MED-02: app-surface.md not updated — RESOLVED

**Commit:** d30b7ba

Comprehensive documentation added under the Characters API section. Documents: field name, Prisma type, purpose (Survivalist class), data format with example, wiring through serializers/combatant service/APIs, utility functions, and UI locations. Placement is logical — right after the trainer sprites section.

### MED-03: tag border-color missing — PARTIALLY RESOLVED (see MED-01 below)

**Commit:** 64ecf45

The `border-color: rgba($color-success, 0.3)` was added to `--capability` in `[id].vue` as requested. However, see MED-01 issue below.

## Issues

### MED-01: border-color is a no-op in `[id].vue` due to missing base border

**File:** `app/pages/gm/characters/[id].vue` (line 620-645)

The `.tag` base class in `[id].vue` has no `border` declaration:
```scss
.tag {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  // no border property
}
```

While `HumanClassesTab.vue` has `border: 1px solid $border-color-default` on its `.tag` base, `[id].vue` does not. Setting `border-color` without a `border-style` and `border-width` produces no visible border (CSS default `border-style` is `none`). The fix follows the letter of code-review-215's request but does not achieve the visual consistency intended.

This is already tracked in refactoring-096 (which notes "Ensure `border-color` is consistently applied (currently missing on `--capability` in `[id].vue`)"). The fix would be to add `border: 1px solid $border-color-default` to the `.tag` base in `[id].vue`, but that would change the visual appearance of ALL tag variants (class, feature, edge) in the character sheet, which is a broader scope change belonging to refactoring-096.

**Not blocking.** The visual inconsistency is pre-existing and already tracked. The developer executed the specific instruction from code-review-215.

## What Looks Good

1. **Regex correctness.** The parentheses-aware split `/,(?![^(]*\))/` is well-chosen. It handles all realistic PTU Naturewalk formats correctly without overcomplicating the parser.

2. **Prop-based validation over emit-and-ignore.** The `addEdgeFn` prop pattern is architecturally superior to the previous `@add-edge` emit approach. The component can now validate and provide feedback synchronously without round-tripping through the parent. Backward compatibility is preserved via the `else` fallback.

3. **Test coverage is thorough.** The 257 new test lines cover all five gaps identified in HIGH-02. The `makeHumanCombatant` helper extension is clean and non-breaking. The `findNaturewalkImmuneStatuses` tests cover all boundary conditions (terrain disabled, no position, non-matching terrain, default terrain fallback).

4. **Decree-027 compliance is proven by tests.** Three test cases explicitly verify case-insensitive blocking of Skill Edge strings, and three tests confirm legitimate edges pass through. The error message clearly directs users to the Skill Edge selector.

5. **app-surface.md documentation is comprehensive.** Single paragraph covers data layer, API, utilities, and UI in appropriate detail for a surface map.

6. **Commit granularity is correct.** Each of the 6 commits addresses exactly one review issue with a clear, descriptive message. The mapping from commit to issue is 1:1.

7. **Immutability preserved.** All reactive state updates use spread operators (`{ ...editData.value, capabilities: parsed }`, `form.edges = [...form.edges, edgeName]`). No direct mutation.

8. **Ticket resolution logs.** Both ptu-rule-119 and refactoring-095 tickets have been updated with fix cycle commit references.

## Verdict

**APPROVED**

All 5 issues from code-review-215 are addressed:
- HIGH-01 (comma splitting): Resolved with correct regex
- HIGH-02 (missing tests): Resolved with 257 lines of comprehensive unit tests
- MED-01 (silent rejection): Resolved with prop-based validation and error UI
- MED-02 (app-surface.md): Resolved with thorough documentation
- MED-03 (border-color): Partially resolved; the CSS addition is correct but ineffective due to pre-existing missing base border (tracked in refactoring-096)

One new MEDIUM (border no-op) is non-blocking because it is pre-existing scope and already tracked. The core functionality (trainer Naturewalk, addEdge guard, test coverage) is correct and complete.

## Required Changes

None. Approved for merge.
