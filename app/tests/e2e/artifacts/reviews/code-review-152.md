---
review_id: code-review-152
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-003-track-b-p0
domain: player-view
commits_reviewed:
  - 8f2f0fc
  - 3b62b67
  - 9ad897e
  - 1131ee0
  - 0a6c8b3
  - 6ed4904
  - 8128905
files_reviewed:
  - app/server/api/player/export/[characterId].get.ts
  - app/server/api/player/import/[characterId].post.ts
  - app/server/api/settings/server-info.get.ts
  - app/composables/useCharacterExportImport.ts
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/gm/ServerAddressDisplay.vue
  - app/layouts/gm.vue
  - app/assets/scss/components/_player-view.scss
  - app/pages/player/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 4
reviewed_at: 2026-02-24T17:45:00Z
follows_up: null
---

## Review Scope

Track B P0 of feature-003 (Player View Infrastructure): JSON export/import for out-of-session character management and ServerAddressDisplay component for LAN connectivity. 7 commits, 9 files changed, 988 insertions.

Design spec: `design-player-view-infra-001.md` -- P0 scope covers export/import endpoints, export/import UI in PlayerCharacterSheet, and server address display in GM View.

## Issues

### CRITICAL

#### C1: Export strips Pokemon `id` from character response, but import relies on Pokemon `id` for matching

**File:** `app/server/api/player/export/[characterId].get.ts` (line 43-47)

The export endpoint returns:
```typescript
character: {
  ...serializedCharacter,
  pokemon: undefined   // Character's pokemon field is removed
},
pokemon: serializedPokemon   // Pokemon are in a separate top-level array
```

`serializeCharacter()` already includes `pokemonIds` (array of IDs) and a `pokemon` array (via `serializeLinkedPokemon`). The export then sets `pokemon: undefined` on the character object to avoid duplication and places the full `serializePokemon()` output in a separate `pokemon` array. This works correctly.

However, the **import endpoint** (line 152-154) does:
```typescript
for (const importPokemon of payload.pokemon) {
  const serverPokemon = ownedPokemonMap.get(importPokemon.id)
  if (!serverPokemon) continue
```

The import matches Pokemon by `id`. The Zod schema for `pokemonImportSchema` requires `id: z.string().min(1)`. The `serializePokemon()` function includes `id` in its output. So the Pokemon IDs ARE present in the export. This path works.

**The actual critical issue:** The import endpoint's `importPayloadSchema` uses `.passthrough()` on both the character object and pokemon moves. The `character` schema does:
```typescript
character: z.object({
  id: z.string().min(1),
  background: z.string().nullable().optional(),
  // ...
}).passthrough()
```

The `.passthrough()` means the entire serialized character (with stats, equipment, inventory, etc.) passes validation and is available in `payload.character`. While the import only reads `charEditableFields` (`background`, `personality`, `goals`, `notes`), the **response** at line 264 re-fetches and returns the full updated character:
```typescript
character: updatedCharacter ? serializeCharacter(updatedCharacter) : null
```

This is fine for the happy path, but the `.passthrough()` combined with the loose validation means a malicious or corrupted import file with extra fields silently passes validation. A crafted payload with `{ character: { id: "abc", name: "HACKED", level: 99, ... } }` would pass Zod validation. The server-side code correctly only writes the 4 editable fields, so **no data corruption occurs**. But the validation is misleadingly loose.

**Reclassification:** On closer inspection, the server correctly limits writes to the 4 editable fields regardless of what passes Zod. Downgrading this from "data corruption" to a defense-in-depth concern. However, the `.passthrough()` on `pokemonImportSchema`'s moves is more concerning:

```typescript
moves: z.array(z.object({
  id: z.string(),
  name: z.string()
}).passthrough()).optional()
```

The import endpoint at line 200-235 reads `importPokemon.moves` and processes them. The `validImportMoves.filter()` checks move IDs against server state, so unknown moves are excluded. The `reorderedMoves` at line 209 maps to the full server move objects (not import move objects), so `.passthrough()` data never reaches the DB.

**Revised verdict:** The code is actually safe against injection. However, `.passthrough()` is an anti-pattern for import validation -- it creates a false sense of security. **Upgrade to strict schemas** (remove `.passthrough()`) so that unexpected fields are explicitly rejected. This protects against future regressions where someone might accidentally use `importPokemon.moves` data directly.

**Required fix:** Remove `.passthrough()` from `importPayloadSchema.character` and `pokemonImportSchema.moves`. Use `.strict()` or simply omit `.passthrough()` (Zod strips unknown keys by default).

### HIGH

#### H1: ServerAddressDisplay panel has no click-outside dismiss behavior

**File:** `app/components/gm/ServerAddressDisplay.vue` (lines 12-49)

The expandable panel (`server-address__panel`) opens on toggle button click and positions itself absolutely below the button. There is no click-outside handler to dismiss it. If the GM clicks elsewhere on the page, the panel stays open indefinitely, obscuring UI beneath it. This is inconsistent with standard dropdown/popover behavior and creates a UX issue in the GM header where space is tight.

**Required fix:** Add a click-outside handler (either a Vue directive like `v-click-outside` or a manual `document.addEventListener('click', ...)` with cleanup in `onUnmounted`). When clicking outside the `.server-address` container, set `expanded = false`.

#### H2: Character update and Pokemon updates are not in a single transaction

**File:** `app/server/api/player/import/[characterId].post.ts` (lines 137-251)

The import endpoint performs two separate database operations:
1. `prisma.humanCharacter.update()` at line 138 (outside transaction)
2. `prisma.$transaction(pokemonUpdates.map(...))` at line 246 (Pokemon only)

If the character update succeeds but the Pokemon transaction fails, the database is left in a partially updated state. The character fields are written but Pokemon changes are lost. The error handler at line 270 catches this and returns a 500, but the character changes are NOT rolled back.

**Required fix:** Wrap both the character update and Pokemon updates in a single `prisma.$transaction()` call:
```typescript
await prisma.$transaction(async (tx) => {
  if (Object.keys(characterUpdate).length > 0) {
    await tx.humanCharacter.update({ where: { id: characterId }, data: characterUpdate })
  }
  for (const { id, data } of pokemonUpdates) {
    await tx.pokemon.update({ where: { id }, data })
  }
})
```

#### H3: `fieldsUpdated` count is misleading

**File:** `app/server/api/player/import/[characterId].post.ts` (line 259)

```typescript
const totalUpdated = Object.keys(characterUpdate).length + pokemonUpdates.length
```

This counts the number of character **fields** updated plus the number of **Pokemon** that had any update. These are different units. If you update 3 character fields and 2 Pokemon (each with 2 fields), the count is `3 + 2 = 5`, but the player might interpret this as "5 fields updated" when it's really "3 fields + 2 entities". The composable at line 105 displays: `Imported ${fieldsUpdated} change(s)`.

**Required fix:** Either count consistently (all individual field changes across all entities) or change the label to be clearer: "Updated X character field(s) and Y Pokemon."

### MEDIUM

#### M1: Export error uses `importResult` variable name for export failures

**File:** `app/composables/useCharacterExportImport.ts` (lines 55-60)

```typescript
} catch (err: any) {
  importResult.value = {
    success: false,
    message: `Export failed: ${err.message || 'Unknown error'}`,
```

When export fails, the error is stored in `importResult`. This reuses the import result ref for export errors, which means:
1. If there was a previous import result banner showing, it gets overwritten by the export error
2. The CSS class mapping (`importResultClass`) applies import-themed styling to an export error
3. The variable name is semantically wrong

**Required fix:** Add a separate `exportResult` ref, or rename `importResult` to a generic `operationResult`. The banner in `PlayerCharacterSheet.vue` already renders based on the ref's content, so the UI would work either way, but the naming should be consistent.

#### M2: `app-surface.md` not updated with new endpoints/components

The following were added but `app-surface.md` was not updated:
- `GET /api/player/export/:characterId`
- `POST /api/player/import/:characterId`
- `GET /api/settings/server-info`
- `useCharacterExportImport` composable
- `ServerAddressDisplay` component

Per the review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" -- it was not.

**Required fix:** Update `app-surface.md` with the 3 new endpoints, 1 new composable, and 1 new component.

#### M3: Hardcoded `appVersion: '1.0.0'` in export endpoint

**File:** `app/server/api/player/export/[characterId].get.ts` (line 41)

```typescript
appVersion: '1.0.0',
```

This is a magic string. The app version is not tracked in a central location. When the app version changes, this hardcoded string will be stale. The import endpoint does not currently validate `appVersion`, so it has no functional impact today, but it sets a maintenance trap.

**Required fix:** Either read the version from `package.json` or a shared constant, or remove `appVersion` from the export metadata if it is not used for validation.

#### M4: ServerAddressDisplay fetches only on first expand, no refresh mechanism

**File:** `app/components/gm/ServerAddressDisplay.vue` (lines 118-122)

```typescript
watch(expanded, (isExpanded) => {
  if (isExpanded && addresses.value.length === 0 && !loading.value) {
    fetchServerInfo()
  }
})
```

The server info is fetched only once (first time the panel is expanded). If the GM's network changes (e.g., switching from ethernet to WiFi, or IP changes via DHCP), the displayed addresses become stale. There is no refresh button and no way to re-fetch without a full page reload.

**Required fix:** Either (a) refetch every time the panel is expanded (remove the `addresses.value.length === 0` guard), or (b) add a small refresh button inside the panel that calls `fetchServerInfo()`.

## What Looks Good

1. **Commit granularity is excellent.** 7 commits, each focused on a single responsibility: export endpoint, import endpoint, server-info endpoint, composable, UI integration, ServerAddressDisplay component, layout integration. Perfectly matches the project's commit guidelines.

2. **Import endpoint's conservative edit scope.** The design spec defines exactly which fields players can edit offline (background, personality, goals, notes, nicknames, held items, move order). The implementation enforces this precisely -- the server-side whitelist (`charEditableFields`) ignores any other fields in the payload regardless of what Zod allows through.

3. **Conflict detection logic is sound.** The `character.updatedAt > exportedAt` comparison correctly identifies server-side changes made after the export was created. Prisma's `updatedAt` is a `DateTime @updatedAt` which auto-updates on writes, so it reliably tracks the last server modification. The resolution strategy (server wins, report conflicts) matches the design spec.

4. **Move reordering logic is safe.** The import endpoint at lines 199-235 only accepts moves that already exist on the server (`serverMoveIds.has(m.id)`), maps back to the full server move objects (not import objects), and appends any server moves not in the import. This prevents move injection and preserves server-authoritative move data.

5. **ServerAddressDisplay component is well-structured.** Lazy-loads on first expand, sorts interfaces by priority (eth > wlan > other), has clipboard copy with fallback for non-HTTPS contexts (textarea trick), proper cleanup of timeout in `onUnmounted`, and uses Phosphor Icons consistently.

6. **Composable follows project patterns.** `useCharacterExportImport` returns `readonly()` refs, uses `computed` for derived state, and separates concerns cleanly from the component. The download mechanism (Blob + createObjectURL + programmatic click + revokeObjectURL) is the standard browser pattern for file downloads.

7. **SCSS organization follows existing patterns.** Export/import styles were extracted to the shared `_player-view.scss` partial rather than kept in scoped component styles, consistent with the file's header comment about eliminating duplication.

## Verdict

**CHANGES_REQUIRED**

The critical `.passthrough()` issue (C1) is a defense-in-depth concern that should be fixed to prevent future regressions. The non-transactional character + Pokemon updates (H2) is a genuine data consistency risk. The missing click-outside handler (H1) creates a persistent UX issue in the GM header. All are straightforward fixes.

## Required Changes

| ID | Severity | File | Fix |
|----|----------|------|-----|
| C1 | CRITICAL | `import/[characterId].post.ts` | Remove `.passthrough()` from Zod schemas; use default strip behavior or `.strict()` |
| H1 | HIGH | `ServerAddressDisplay.vue` | Add click-outside handler to dismiss the panel |
| H2 | HIGH | `import/[characterId].post.ts` | Wrap character + Pokemon updates in a single `prisma.$transaction()` |
| H3 | HIGH | `import/[characterId].post.ts` + `useCharacterExportImport.ts` | Fix `fieldsUpdated` counting to be consistent units, or clarify the UI label |
| M1 | MEDIUM | `useCharacterExportImport.ts` | Rename `importResult` to generic `operationResult` or add separate `exportResult` ref |
| M2 | MEDIUM | `app-surface.md` | Add 3 new endpoints, 1 composable, 1 component to surface manifest |
| M3 | MEDIUM | `export/[characterId].get.ts` | Replace hardcoded `'1.0.0'` with a shared constant or read from `package.json` |
| M4 | MEDIUM | `ServerAddressDisplay.vue` | Add refresh mechanism (refetch on each expand or add refresh button) |
