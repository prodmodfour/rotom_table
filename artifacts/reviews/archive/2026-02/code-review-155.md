---
review_id: code-review-155
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003-track-b-p0
domain: player-view
commits_reviewed:
  - 689cb48
  - aa25732
  - cb56759
  - 4cfb11b
  - b38c2e6
  - 606d725
  - 3e1f82d
  - 723ff37
  - d0028f1
files_reviewed:
  - app/server/api/player/import/[characterId].post.ts
  - app/server/api/player/export/[characterId].get.ts
  - app/components/gm/ServerAddressDisplay.vue
  - app/composables/useCharacterExportImport.ts
  - app/components/player/PlayerCharacterSheet.vue
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-24T20:15:00Z
follows_up: code-review-152
---

## Review Scope

Re-review of 9 fix commits (689cb48..d0028f1) addressing all 8 issues from code-review-152 (CHANGES_REQUIRED). The original rules-review-142 was APPROVED; this re-review verifies no rules regressions from the fixes.

## Issue Resolution Verification

### C1: Remove `.passthrough()` from Zod schemas -- RESOLVED

**Commit:** 689cb48

The fix removes `.passthrough()` from both locations identified in the original review:

1. `pokemonImportSchema.moves` array items: `z.object({ id, name }).passthrough()` changed to `z.object({ id, name })`
2. `importPayloadSchema.character`: `z.object({ id, background, personality, goals, notes }).passthrough()` changed to `z.object({ id, background, personality, goals, notes })`

Zod's default behavior strips unknown keys, so any extra fields in the import payload are now silently dropped rather than passed through. The schemas now precisely validate only the fields the import endpoint uses. Defense-in-depth is correctly restored -- even if future code accidentally references raw import data, it cannot contain unexpected fields.

**Verified:** Final state of `[characterId].post.ts` lines 11-32 confirms no `.passthrough()` anywhere in the schema definitions.

### H1: Click-outside handler for ServerAddressDisplay -- RESOLVED

**Commit:** aa25732

The fix adds:
1. A `ref="containerRef"` on the root `.server-address` div (template line 2)
2. A `containerRef = ref<HTMLElement | null>(null)` in script setup
3. A `handleClickOutside()` function that checks `containerRef.value.contains(event.target)` and sets `expanded = false` if the click was outside
4. The click-outside listener is added via `document.addEventListener('click', handleClickOutside, true)` when the panel expands, and removed when it collapses
5. Cleanup in `onUnmounted()` removes the listener

The implementation is correct:
- Uses capture phase (`true` as third argument) to catch clicks before they bubble, preventing edge cases where click propagation is stopped
- Properly scoped to the `.server-address` container, so clicking the toggle button or copy buttons inside the panel does not dismiss it
- Listener is conditionally attached (only when expanded), avoiding unnecessary global listeners when the panel is closed
- Cleanup in `onUnmounted` prevents memory leaks if the component is destroyed while expanded

### H2: Single transaction for character + Pokemon updates -- RESOLVED

**Commit:** cb56759

The fix restructures the import endpoint to wrap all database writes in a single `prisma.$transaction()`:

Before: Character update was a standalone `prisma.humanCharacter.update()` outside any transaction, followed by a separate `prisma.$transaction()` for Pokemon updates only.

After (lines 240-252): A single interactive transaction (`prisma.$transaction(async (tx) => { ... })`) executes both the character update and all Pokemon updates atomically. If any update fails, all changes are rolled back.

The transaction uses the interactive pattern (`async (tx) =>`) rather than the batch pattern (`prisma.$transaction([...])`) which is appropriate here since the character update is conditional (`if (hasCharacterUpdates)`).

### H3: Misleading `fieldsUpdated` count -- RESOLVED

**Commit:** 4cfb11b

The fix separates the counts into distinct fields:

Server response (lines 260-261):
```typescript
const characterFieldsUpdated = Object.keys(characterUpdate).length
const pokemonUpdated = pokemonUpdates.length
```

These are returned as separate fields (`characterFieldsUpdated`, `pokemonUpdated`) instead of a single `fieldsUpdated` sum.

Client composable (lines 100-122): The message now clearly distinguishes the two:
- `"Updated 3 character field(s) and 2 Pokemon."` when both have changes
- `"Updated 3 character field(s)."` when only character fields changed
- `"Updated 2 Pokemon."` when only Pokemon changed

The units are now explicit and unambiguous. The `totalUpdated` sum is still computed client-side for the zero-check and return value, which is correct since it only needs to know "any changes at all."

### M1: `importResult` renamed to `operationResult` -- RESOLVED

**Commit:** b38c2e6

Complete rename across both files:
- `useCharacterExportImport.ts`: `ImportResult` interface renamed to `OperationResult`, `importResult` ref renamed to `operationResult`, `importResultClass` computed renamed to `operationResultClass`, `clearImportResult` renamed to `clearOperationResult`. All 8 internal references updated.
- `PlayerCharacterSheet.vue`: Template bindings updated from `importResult` to `operationResult`, `importResultClass` to `operationResultClass`, `clearImportResult` to `clearOperationResult`. Destructured return values updated to match.

The CSS class names (`import-result--error`, `import-result--warning`, `import-result--success`) were NOT renamed, which is acceptable -- these are internal CSS class names that do not leak into the API surface. Renaming them would require touching the SCSS partial as well for zero functional benefit.

### M2: `app-surface.md` updated -- RESOLVED

**Commit:** 723ff37

The following additions were made to `app-surface.md`:

1. **GM layout components:** New section after GM routes table documenting `ServerAddressDisplay.vue` with its key behaviors (LAN address panel, click-outside dismiss, clipboard copy)
2. **Player composables:** `useCharacterExportImport.ts` added to the "Key player composables" list with description
3. **Player Data endpoints:** New `### Player Data (/api/player)` section with both `GET /api/player/export/:characterId` and `POST /api/player/import/:characterId` documented with their descriptions
4. **Settings endpoint:** New `### Settings (/api/settings)` section with `GET /api/settings/server-info` documented

All 3 endpoints, 1 composable, and 1 component are accounted for. The descriptions accurately reflect the implemented functionality.

### M3: Hardcoded version replaced -- RESOLVED

**Commit:** 606d725

The fix reads the version from `package.json` at module load time:

```typescript
import { readFileSync } from 'fs'
import { resolve } from 'path'

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
const APP_VERSION: string = packageJson.version || '0.0.0'
```

The version is read once at server startup (module-level `const`), not on every request. `process.cwd()` in a Nuxt/Nitro context resolves to the `app/` directory, which contains `package.json` with `version: "1.0.0"`. The fallback to `'0.0.0'` handles the unlikely case where `version` is missing from `package.json`.

Using `readFileSync` at module level is the correct pattern for Nitro server endpoints -- it runs once during module initialization and incurs no per-request I/O cost.

### M4: Refetch server addresses on each expand -- RESOLVED

**Commit:** 3e1f82d

The fix removes the guard condition `addresses.value.length === 0 && !loading.value` from the watcher, so `fetchServerInfo()` is called every time the panel is expanded:

```typescript
watch(expanded, (isExpanded) => {
  if (isExpanded) {
    fetchServerInfo()
    document.addEventListener('click', handleClickOutside, true)
  } else {
    document.removeEventListener('click', handleClickOutside, true)
  }
})
```

This ensures that if the GM's network changes (IP change, interface switch), the displayed addresses are refreshed on every panel open. The `fetchServerInfo()` function sets `loading = true` while fetching, which the template handles with a loading state, so there is no flash of stale data.

## Rules Regression Check

The rules-review-142 APPROVED the original implementation. The fix commits do not modify any rules-relevant logic:

- **Editable field whitelist** (`charEditableFields = ['background', 'personality', 'goals', 'notes']`) is unchanged at line 107
- **Move reordering safety** (server-authoritative move matching via `serverMoveIds.has()`, mapping back to server move objects) is unchanged at lines 191-228
- **Conflict detection** (server wins when `updatedAt > exportedAt`) is unchanged
- **Pokemon field scope** (nickname, heldItem, moves only) is unchanged

No rules regressions introduced.

## What Looks Good

1. **Each fix is a single focused commit.** 9 commits for 8 issues (the M1 rename required changes in both the composable and the component, correctly done in a single commit since the rename is one logical change). Commit messages are clear and reference the issue ID from the original review.

2. **Transaction pattern is correct.** The interactive transaction (`prisma.$transaction(async (tx) => {...})`) is the right choice here since the character update is conditional. The batch pattern would have required building the array dynamically, which is less readable.

3. **Click-outside implementation is robust.** Using capture phase prevents edge cases with stopped propagation. The listener is properly lifecycle-managed (added on expand, removed on collapse, cleaned up on unmount).

4. **The M4 fix is the minimal correct change.** Simply removing the guard condition is cleaner than adding a refresh button, and matches the review's suggestion (a). The loading state in the template prevents stale data display.

5. **No scope creep.** The fixes address exactly the 8 issues raised and nothing else. No unrelated changes were bundled in.

## Verdict

**APPROVED**

All 8 issues from code-review-152 are fully resolved. Each fix is correct, minimal, and introduces no regressions. The rules-review-142 APPROVED status is preserved -- no rules-relevant logic was modified by the fix commits.
