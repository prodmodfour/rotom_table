---
review_id: code-review-106
ticket: refactoring-046
commits: aa015c9, c45c246, cdc80af
reviewer: senior-reviewer
verdict: CHANGES_REQUIRED
date: 2026-02-20
---

## Review: refactoring-046 — Duplicate capabilities display + AP restore loop

### Scope

Three commits reviewed:

1. `aa015c9` — Extract `CapabilitiesDisplay.vue` from duplicated capabilities markup in `gm/characters/[id].vue` and `HumanStatsTab.vue`
2. `c45c246` — Extract `restoreSceneAp()` from duplicated AP restore logic in `activate.post.ts` and `deactivate.post.ts`
3. `cdc80af` — Ticket resolution update

---

### Issue 1 — CRITICAL: SCSS visual regression in HumanStatsTab.vue

**File:** `app/components/character/CapabilitiesDisplay.vue` (line 66-70)

The extracted component uses the `gm/characters/[id].vue` version of `.capability-block` styling:

```scss
.capability-block {
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  // no border
}
```

But the original `HumanStatsTab.vue` had **different** styling:

```scss
.capability-block {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
}
```

Two differences:
- Background color: `$color-bg-tertiary` vs `$color-bg-secondary`
- Border: `1px solid $border-color-default` vs none

This is a visual regression for the `HumanStatsTab.vue` consumer. The two consumers intentionally had different visual treatments because they appear in different layout contexts (`HumanStatsTab` has its stat-blocks using `$color-bg-tertiary` with borders, so the capabilities matched that pattern; `[id].vue` uses `$color-bg-secondary` without borders for its stat-blocks).

**Fix:** The extracted component should match the styling of the context it appears in. Two options:
- (A) Add an optional `variant` prop (e.g., `variant: 'default' | 'bordered'`) that toggles the border and background color.
- (B) Accept that one view's styling changes slightly and intentionally unify to one style. If this is the chosen approach, document it as an intentional design decision, not a silent change.

Option A is the cleaner approach since the two contexts genuinely use different card backgrounds.

---

### Issue 2 — MEDIUM: `restoreSceneAp` silently swallows JSON parse errors

**File:** `app/server/services/scene.service.ts` (line 19)

```ts
const characters: Array<{ characterId?: string; id?: string }> = JSON.parse(charactersJson || '[]')
```

If `charactersJson` contains malformed JSON (not `null`/`undefined`/empty, but genuinely corrupt), `JSON.parse` will throw an unhandled error. The original inline code had the same issue, so this is not a regression, but this is the right time to fix it since we are touching the code.

**Fix:** Wrap the parse in a try-catch that returns 0 (no characters to restore) on parse failure, and log a warning so corruption is visible:

```ts
let characters: Array<{ characterId?: string; id?: string }>
try {
  characters = JSON.parse(charactersJson || '[]')
} catch {
  console.warn('restoreSceneAp: failed to parse characters JSON, skipping AP restore')
  return 0
}
```

---

### What went well

1. **`scene.service.ts` extraction is clean.** The function signature (`charactersJson: string`) matches the Prisma schema (`characters String @default("[]")`). The grouping optimization from `activate.post.ts` is correctly preserved, and the deactivate endpoint now benefits from the same batched transaction approach instead of N individual updates. This is a genuine performance improvement.

2. **Return value contract is correct.** The activate endpoint discards the return value (matching its original behavior), and the deactivate endpoint uses it in its response message (matching its original `apRestoredCount` behavior).

3. **`CapabilitiesDisplay.vue` template markup is identical.** All 7 capabilities, the `m` suffix on jump/throwing range, the `weightClass != null` ternary -- all match exactly.

4. **Prop interface is clean.** Using `TrainerDerivedStats` from the existing utility type is the right choice. Both consumers already compute this type, so passing it as a prop avoids re-importing the computation logic into the shared component.

5. **JSDoc on `restoreSceneAp` is thorough.** Includes the PTU rule reference, explains the batching strategy, and documents the return value.

6. **Immutability preserved in the grouping loop.** The `ids: [...existing.ids, char.id]` spread creates a new array instead of mutating.

7. **Early return guards.** Both `characterIds.length === 0` and `dbCharacters.length === 0` checks prevent unnecessary DB calls.

---

### Verdict: CHANGES_REQUIRED

Issue 1 (SCSS regression) must be fixed before this can be approved. The two original consumers had intentionally different capability-block styling, and the extraction silently dropped the `HumanStatsTab` variant.

Issue 2 (JSON parse) should be addressed in the same pass since the file is already open.
