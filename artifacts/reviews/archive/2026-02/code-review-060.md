---
review_id: code-review-060
follows_up: code-review-057
ticket_id: bug-011
commits: [2b2f804]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-19
---

## Re-Review: bug-011 — code-review-057 MEDIUM fixes

### Commit Reviewed
- `2b2f804` — fix: address code-review-057 feedback for bug-011 weight changes

### Files Changed
- `app/components/habitat/EncounterTableModal.vue` (1 line)
- `app/server/api/encounter-tables/[id]/entries/index.post.ts` (8 lines)
- `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts` (8 lines)
- `app/tests/e2e/artifacts/tickets/bug/bug-011.md` (1 line)

---

### M1: `max="100"` restored on inline weight input — RESOLVED

The `max="100"` attribute is back on line 138 of `EncounterTableModal.vue`, sitting in the correct position between `min="0.1"` and `step="0.1"`. The full attribute set is now `min="0.1" max="100" step="0.1"`, which matches the guard-rail intent from the original review. Verified in the rendered file at lines 134-142.

### M2: Weight validation added to both POST endpoints — RESOLVED

**Base table entries** (`index.post.ts` lines 46-52): Validation block is identical to the PUT endpoint pattern at `[entryId].put.ts` line 17:
```typescript
if (body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
```
Placement is correct — after species existence check, before duplicate check. The `body.weight ?? 10` fallback on line 75 is reached only when `body.weight` is `undefined` (which passes the guard), so the default of 10 never conflicts with the `>= 0.1` validation.

**Modification entries** (`modifications/[modId]/entries/index.post.ts` lines 49-55): Same validation with the additional `!body.remove` guard:
```typescript
if (!body.remove && body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
```
The `!body.remove` guard is correct. When `body.remove` is truthy, the Prisma create on line 76 sets `weight: null` (via the ternary `body.remove ? null : (body.weight ?? 10)`), so weight validation is irrelevant for removal entries. The schema confirms `ModificationEntry.weight` is `Float?` (nullable), and `remove` is `Boolean @default(false)`. The guard correctly avoids rejecting a valid removal request that has no weight field.

Both error responses use statusCode 400 and the same message string as the PUT endpoint. Consistent.

### M3: Ticket status updated to resolved — RESOLVED

`bug-011.md` line 5 now reads `status: resolved`. The resolution log in the ticket body was already present from the prior commit and accurately describes the schema change and code paths verified.

---

### Additional Checks

1. **No new issues introduced.** The commit is purely additive — one HTML attribute restored, two validation guards inserted, one status string changed. No existing logic was modified or reordered. No imports changed. No file size concerns (all files well under 800 lines).

2. **Validation pattern consistency verified.** All three weight-touching endpoints (1 PUT, 2 POSTs) now share the same validation expression. The only difference is the modification POST's `!body.remove` prefix, which is specific to that endpoint's domain semantics.

3. **No modification entry PUT endpoint exists** (`app/server/api/encounter-tables/[id]/modifications/[modId]/entries/` has only `index.post.ts`), so there is no missing validation gap in an update path. Modification entries are created or deleted, not updated in place.

---

### Verdict: APPROVED

All three MEDIUM issues from code-review-057 are resolved correctly. The validation pattern matches the existing PUT endpoint exactly. The `!body.remove` guard is semantically sound. No new issues. This ticket is ready for Game Logic Reviewer.
