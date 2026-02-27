---
review_id: code-review-057
ticket_id: bug-011
commits: [d6e6ad7, 86bb112]
verdict: CHANGES_REQUIRED
reviewer: senior-reviewer
date: 2026-02-19
---

## Review: bug-011 — Int weight column truncates fractional weights to 0

### Commits Reviewed
- `d6e6ad7` — fix: change encounter table weight columns from Int to Float
- `86bb112` — docs: update bug-011 ticket status

### Files Changed
- `app/prisma/schema.prisma` (2 lines)
- `app/components/habitat/EncounterTableModal.vue` (3 lines)

---

### MEDIUM Issues

#### M1: `max` attribute removed from weight input without replacement
**File:** `app/components/habitat/EncounterTableModal.vue:138`

The diff shows `max="100"` was removed from the inline weight input but not replaced. The `EntryRow.vue` component (the detail-view weight editor) also has no `max` attribute. While there is no hard upper-bound rule for weights, removing the only client-side guard means a user can type `999999` or a negative value (the `min="0.1"` only blocks HTML stepping, not typed values). The `[entryId].put.ts` server endpoint validates `weight >= 0.1` but has no upper-bound check either.

**Fix:** Add `max="100"` back (or choose a reasonable ceiling). No functional reason to remove it. This is a minor regression in client-side guard rails.

#### M2: Entry creation endpoints accept weight without validation
**File:** `app/server/api/encounter-tables/[id]/entries/index.post.ts:67`
**File:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts:68`

Both entry creation endpoints pass `body.weight` directly to Prisma with only a fallback default (`body.weight ?? 10`). Unlike the PUT endpoint which validates `weight >= 0.1`, these POST endpoints accept any number including 0, negative values, or `NaN` (if body parsing yields it). This was a pre-existing gap but the ticket's scope ("change Int to Float") naturally widens it because fractional inputs are now explicitly supported by the UI.

**Fix:** Add the same validation from `[entryId].put.ts` (line 17) to both POST endpoints:
```typescript
if (body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
  throw createError({ statusCode: 400, message: 'Weight must be a number >= 0.1' })
}
```

#### M3: Ticket status still says `in-progress` instead of `resolved`
**File:** `app/tests/e2e/artifacts/tickets/bug/bug-011.md:5`

The docs commit (`86bb112`) is described as "update bug-011 ticket status" but the frontmatter still reads `status: in-progress`. Should be `status: resolved` if the fix is considered complete.

---

### What Looks Good

1. **Schema change is safe.** SQLite stores all numbers as IEEE 754 doubles internally. Changing the Prisma declaration from `Int` to `Float` just changes how Prisma reads/writes the value. Existing integer weights (10, 5, 2, 1) are perfectly representable as floats with no precision loss. No data migration needed.

2. **Weighted random selection is float-safe.** The algorithm in `generate.post.ts:137-148` accumulates `totalWeight` via `reduce` then subtracts per-entry `weight` in a loop. This standard weighted random pattern works correctly with floating-point values. The `totalWeight === 0` guard on line 123 protects against empty pools.

3. **TypeScript types already used `number`.** The `habitat.ts` type file declares `weight: number` for all interfaces, and `RARITY_WEIGHTS` already included `legendary: 0.1`. The Float change in Prisma aligns the DB layer with the types that were already correct.

4. **Duplicate code path audit was thorough.** The developer verified `EntryRow.vue` (uses `parseFloat`, `min="0.1"`, `step="0.1"`), `ModificationCard.vue` (uses `min="0.1"`, `step="0.1"`), and the PUT endpoint (validates `>= 0.1`). No `parseInt` truncation found on weight values anywhere.

5. **Legendary preset addition is appropriate.** Adding `<option :value="0.1">Legendary (0.1)</option>` to the dropdown mirrors the existing `RARITY_WEIGHTS.legendary` constant in `habitat.ts`. The `:value` binding correctly passes the number `0.1` (not the string `"0.1"`).

6. **Export/import cycle works.** The export endpoint (`export.get.ts:55`) passes `entry.weight` through directly as a number, and the import endpoint (`import.post.ts:131`) maps `entry.weight` to the Prisma create. Both are type-agnostic and handle floats correctly.

7. **File sizes are within limits.** Largest file touched is `EncounterTableModal.vue` at 506 lines. All files well under 800-line cap.

---

### Verdict: CHANGES_REQUIRED

Three medium issues found. M1 and M2 are minor guard-rail gaps; M3 is a documentation error. None are correctness bugs — the core fix (Int to Float migration + weighted selection) is correct and safe. Fix M1-M3 and this can proceed to Game Logic Reviewer.

### Prompt for Developer

```
Fix three medium issues from code-review-057 for bug-011:

M1: In `app/components/habitat/EncounterTableModal.vue` line 138, add `max="100"` back to the weight input. The diff accidentally removed it when changing `min` and `step`.

M2: Add weight validation to both entry creation endpoints:
- `app/server/api/encounter-tables/[id]/entries/index.post.ts` — before line 63, add:
  if (body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
    throw createError({ statusCode: 400, message: 'Weight must be a number >= 0.1' })
  }
- `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts` — before line 64, add the same validation.

M3: In `app/tests/e2e/artifacts/tickets/bug/bug-011.md` line 5, change `status: in-progress` to `status: resolved`.

Commit each fix separately.
```
