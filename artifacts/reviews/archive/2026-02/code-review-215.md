---
review_id: code-review-215
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: refactoring-095+ptu-rule-119
domain: character-lifecycle+combat
commits_reviewed:
  - d8babb0
  - b4cb879
  - 9c3c0d6
  - 7103752
  - 062f41b
  - 5d3b632
files_reviewed:
  - app/composables/useCharacterCreation.ts
  - app/utils/combatantCapabilities.ts
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/components/character/tabs/HumanClassesTab.vue
  - app/pages/gm/characters/[id].vue
  - app/server/api/characters/[id].put.ts
  - app/server/api/characters/index.post.ts
  - app/server/services/combatant.service.ts
  - app/server/utils/serializers.ts
  - app/components/character/CharacterModal.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-02-28T08:15:00Z
follows_up: null
---

## Review Scope

Reviewing 6 commits (5d3b632..d8babb0) implementing:

1. **refactoring-095**: Guard `addEdge()` in `useCharacterCreation.ts` against Skill Edge string injection that bypasses the patheticSkills check (decree-027).
2. **ptu-rule-119**: Add trainer Naturewalk support via a `capabilities` field on `HumanCharacter` (Survivalist class, PTU p.149/04-trainer-classes.md:4690).

Total: 11 files changed, 111 insertions, 13 deletions.

### Decree Compliance Check

- **decree-027** (Block Skill Edges from raising Pathetic skills during character creation): The `addEdge()` guard correctly prevents injection of `"Skill Edge: ..."` strings that would bypass the `addSkillEdge()` pathetic check. The regex `/^skill edge:/i` blocks case-insensitive matches. This is compliant.
- **decree-003** (All tokens passable, enemy-occupied rough terrain): Not directly affected. The Naturewalk changes correctly do NOT touch enemy-occupied rough terrain logic.
- **decree-010** (Multi-tag terrain): Not affected.

## Issues

### HIGH-01: Comma-splitting in `onCapabilitiesChange` will mangle multi-terrain Naturewalk entries

**File:** `app/pages/gm/characters/[id].vue` (line 432)

The capabilities input parser uses a naive `input.split(',')` to parse the comma-separated text input. However, PTU Naturewalk entries can contain commas inside parentheses: `Naturewalk (Forest, Grassland)`. If a user enters this format (which is valid per PTU 10-indices-and-reference.md:322-323), it will be mangled into `["Naturewalk (Forest", "Grassland)"]`, producing broken capability strings that `parseNaturewalksFromOtherCaps` cannot parse.

The placeholder text (`Naturewalk (Forest), Naturewalk (Ocean)`) guides users toward the one-terrain-per-entry format, which partially mitigates this. But the parser in `combatantCapabilities.ts` (line 245) explicitly supports the multi-terrain format `Naturewalk (Forest, Grassland)`, and PTU RAW uses this format. A user following the book would trigger this bug.

**Fix required:** Either:
- (A) Split on commas that are NOT inside parentheses (regex like `/,(?![^(]*\))/`), or
- (B) Update the hint/placeholder to explicitly warn against commas inside parentheses, and document this as a known limitation, or
- (C) Use a different delimiter (semicolons, newlines, or a tag input UI).

### HIGH-02: No unit tests added for trainer Naturewalk capability

**File:** `app/tests/unit/utils/combatantCapabilities.test.ts`

The existing test file has tests for `getCombatantNaturewalks` and `naturewalkBypassesTerrain`, but:

1. The test `makeHumanCombatant()` helper (line 62-96) does NOT include a `capabilities` field on the entity, so it only tests the "no capabilities" path.
2. No new tests were added to verify that a human combatant WITH `capabilities: ["Naturewalk (Forest)"]` correctly returns `['Forest']` from `getCombatantNaturewalks`.
3. No tests verify that `naturewalkBypassesTerrain` works for human combatants with Naturewalk.
4. No tests verify that `findNaturewalkImmuneStatuses` works for trainer combatants (this function's `combatant.type !== 'pokemon'` early-return guard was removed, which is the core of ptu-rule-119).
5. No tests verify the `addEdge()` guard from refactoring-095.

The existing test at line 99 (`should return empty array for human combatant`) still passes because the stub has no `capabilities`, but this only covers the "no capabilities" code path. The new "trainer with capabilities" path is completely untested.

**Fix required:** Add tests covering:
- Human combatant with `capabilities: ["Naturewalk (Forest)"]` returns `['Forest']` from `getCombatantNaturewalks`
- Human combatant with `capabilities: ["Naturewalk (Forest)"]` returns `true` from `naturewalkBypassesTerrain(_, 'normal')`
- `findNaturewalkImmuneStatuses` filters Slowed/Stuck for trainer on matching terrain
- `addEdge('Skill Edge: Athletics')` returns error string, `addEdge('Basic Edge')` returns null

### MED-01: `addEdge()` return value silently ignored by EdgeSelectionSection caller

**File:** `app/pages/gm/create.vue` (line 186), `app/components/create/EdgeSelectionSection.vue` (line 134)

The `addEdge()` function now returns `string | null`, but the emit-based call chain does not propagate the error:

1. `EdgeSelectionSection.vue` emits `addEdge` with the edge name string
2. `create.vue` binds `@add-edge="creation.addEdge"` which calls `addEdge()` and ignores the return value
3. The input field is cleared (`newEdge.value = ''`) regardless of whether the edge was actually added

If the user types "Skill Edge: Athletics" and presses Enter, nothing will be added to the edges array (correct), but the input field will be cleared and no error message shown (confusing UX). The user gets no feedback about why their edge was rejected.

**Fix required:** Either:
- Show a toast/warning when the return value is non-null, or
- Keep the text in the input field when blocked (don't clear `newEdge.value`), or
- At minimum, add a comment explaining the silent rejection is intentional

### MED-02: `app-surface.md` not updated with new `capabilities` field

**File:** `.claude/skills/references/app-surface.md`

The capabilities field was added to HumanCharacter (Prisma model, TypeScript interface, serializers, APIs), but `app-surface.md` does not mention `capabilities` anywhere. Per review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" -- the `capabilities` field is a new data field added to an existing model, which should be documented.

**Fix required:** Update `app-surface.md` to mention the `capabilities` field on HumanCharacter.

### MED-03: Duplicated tag styling between `[id].vue` and `HumanClassesTab.vue`

**Files:** `app/pages/gm/characters/[id].vue` (lines 617-641), `app/components/character/tabs/HumanClassesTab.vue` (lines 69-98)

Both files define `.tag--class`, `.tag--feature`, `.tag--edge`, and `.tag--capability` styles with slightly different values:
- `[id].vue` uses `rgba($color-accent-scarlet, 0.2)` for features, `rgba($color-info, 0.2)` for edges
- `HumanClassesTab.vue` uses `rgba($color-accent-teal, 0.15)` for features, `rgba($color-warning, 0.15)` for edges

The `--capability` variant is consistent (both use `$color-success`), but the other tag colors diverge between the two views. This is a pre-existing inconsistency, but the developer added `--capability` to both without harmonizing the existing tags. Since this was pre-existing, it is not blocking, but the new `--capability` styling should at minimum be consistent in border style (the `[id].vue` variant omits `border-color` for `--capability`).

**Fix required:** Add `border-color: rgba($color-success, 0.3)` to the `--capability` tag in `[id].vue` to match `HumanClassesTab.vue`. File a ticket for the broader tag color inconsistency.

## What Looks Good

1. **addEdge() guard logic is sound.** The regex `/^skill edge:/i` correctly blocks case-insensitive variants. The function returns a descriptive error string rather than throwing, following the established pattern from `addSkillEdge()` and `setSkillRank()`. The JSDoc clearly cites decree-027.

2. **Prisma schema change is clean.** The `capabilities` field uses `String @default("[]")` consistent with the pattern for `trainerClasses`, `features`, and `edges`. The comment references PTU p.149 and gives example format.

3. **Full data layer coverage.** The capabilities field is properly wired through all 5 data layer touchpoints:
   - `schema.prisma` (DB column)
   - `character.ts` (TypeScript interface)
   - `serializers.ts` (both `serializeCharacter` and `serializeCharacterSummary`)
   - `combatant.service.ts` (`buildHumanEntityFromRecord`)
   - Both API endpoints (`index.post.ts`, `[id].put.ts`)

4. **Defensive `|| '[]'` fallback in serializers and combatant service.** Handles the case where existing DB records have null/undefined capabilities before migration runs. This is the correct pattern used by `equipment` and other post-launch fields.

5. **Clean refactoring of `getCombatantNaturewalks`.** The function properly delegates to `getPokemonNaturewalks` for Pokemon and `parseNaturewalksFromOtherCaps` for humans. The extracted `getPokemonNaturewalks` function preserves the original dual-source (direct + otherCapabilities) merge logic. No behavior change for Pokemon.

6. **`findNaturewalkImmuneStatuses` correctly removes the type guard.** The `combatant.type !== 'pokemon'` early-return was removed, and all subsequent logic (position check, terrain lookup, Naturewalk matching) is type-agnostic. The function already delegates to `naturewalkBypassesTerrain` which calls `getCombatantNaturewalks`, so trainer Naturewalk is automatically supported.

7. **UI for capabilities is well-placed.** The capabilities section in `[id].vue` is shown in edit mode even when empty (so users can add capabilities), and hidden when empty in view mode (no noise). The hint text and placeholder are helpful.

8. **CharacterModal.vue correctly passes capabilities prop.** The `:capabilities="humanData.capabilities"` binding to `HumanClassesTab` is clean and the component handles the optional prop gracefully with `capabilities?.length`.

9. **Commit granularity is good.** Six commits, each with a clear single responsibility: Prisma schema -> TypeScript types -> data layer wiring -> Naturewalk logic -> UI. The addEdge guard is properly isolated in its own commit.

10. **Immutability followed.** `editData.value = { ...editData.value, capabilities: parsed }` in the capabilities parser follows immutable update patterns. No reactive state mutation.

## Verdict

**CHANGES_REQUIRED**

Two HIGH issues must be resolved before approval:

1. **HIGH-01:** The comma-splitting parser will mangle `Naturewalk (Forest, Grassland)` entries. The fix is straightforward -- either use a parentheses-aware split regex or constrain the input format explicitly.

2. **HIGH-02:** No unit tests cover the new trainer Naturewalk code path or the addEdge guard. The existing test file even has a helper `makeHumanCombatant()` that is ready to be extended with a `capabilities` field.

Three MEDIUM issues should also be addressed in the same pass:

3. **MED-01:** The addEdge return value is silently ignored by the UI caller.
4. **MED-02:** `app-surface.md` not updated.
5. **MED-03:** Missing `border-color` on the `--capability` tag in `[id].vue`.

## Required Changes

1. Fix `onCapabilitiesChange` to not split on commas inside parentheses (HIGH-01)
2. Add unit tests for trainer Naturewalk and addEdge guard (HIGH-02)
3. Show user feedback or preserve input when addEdge blocks a Skill Edge string (MED-01)
4. Update `app-surface.md` with capabilities field documentation (MED-02)
5. Add `border-color` to `--capability` tag in `[id].vue` (MED-03)
