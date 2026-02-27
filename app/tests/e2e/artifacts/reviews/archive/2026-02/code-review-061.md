---
review_id: code-review-061
ticket_id: bug-015
commits: [f496cad]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

## Review: bug-015 — Features/edges not editable via PUT endpoint

### Commit Reviewed
- `f496cad` — fix: add features/edges handling to character PUT endpoint

### Files Changed
- `app/server/api/characters/[id].put.ts` (2 lines added)

---

### Fix Analysis

The fix adds two lines at lines 39-40 of the PUT endpoint:

```typescript
if (body.features !== undefined) updateData.features = JSON.stringify(body.features)
if (body.edges !== undefined) updateData.edges = JSON.stringify(body.edges)
```

**Pattern consistency verified.** These two lines are structurally identical to the six other JSON-stringified fields in the same endpoint (lines 37-43): `trainerClasses`, `skills`, `inventory`, `statusConditions`, `stageModifiers`. All use `body.X !== undefined` as the guard and `JSON.stringify(body.X)` as the value. The placement between `skills` (line 38) and `inventory` (line 41) matches the field ordering in the POST endpoint (`index.post.ts` lines 37-40) and the Prisma schema (lines 34-38), keeping the grouping consistent.

**Prisma schema confirmed.** Both `features` and `edges` are `String @default("[]")` columns on the `HumanCharacter` model (schema lines 37-38), identical in type and default to `trainerClasses`. `JSON.stringify` on an array produces a valid string for these columns.

**Serializer confirmed.** `serializeCharacter()` in `app/server/utils/serializers.ts` already calls `JSON.parse(character.features)` and `JSON.parse(character.edges)` (lines 89-90, 151-152). The round-trip is complete: client sends array, PUT stringifies it to DB, GET/PUT response parses it back to array.

**POST endpoint parity confirmed.** The POST endpoint (`index.post.ts` lines 39-40) handles these fields identically via `JSON.stringify(body.features || [])`. The PUT uses `!== undefined` instead of `|| []` because PUT is a partial update (only set fields that were provided), while POST always needs a value. This is the correct pattern difference between create and update.

**Entity-update service checked.** `app/server/services/entity-update.service.ts` does not reference `features` or `edges`. This is correct — entity-update handles real-time combat state (HP, status, injuries), not character progression data.

**Other update call sites checked.** The 7 other `prisma.humanCharacter.update` call sites are in rest, extended-rest, new-day, heal-injury, and pokemon-center endpoints. None touch features/edges. No gap.

**Client-side observation.** The `HumanClassesTab.vue` component and the `gm/characters/[id].vue` page display features and edges as read-only tags. There is no edit UI (no input fields, no save button for features/edges). The PUT endpoint fix is necessary for API correctness and enables future UI editing, but the client does not yet exercise this code path through the UI. This is consistent with the ticket scope (the ticket addresses the API gap; UI editing is a separate concern). The API can be exercised through direct requests and tests.

**No input validation on features/edges.** The endpoint accepts any value for `features` and `edges` without type checking. If a client sends `features: "not-an-array"`, it will be stringified as `"\"not-an-array\""` and stored, then `JSON.parse` in the serializer will return the string, not an array. However, this is not a new issue introduced by this commit — the same lack of validation exists for all six other JSON-stringified fields (`trainerClasses`, `skills`, `inventory`, `statusConditions`, `stageModifiers`). Filing a validation gap as a new concern would be appropriate, but it is not a regression from this fix and does not block this review.

---

### What Looks Good

1. **Minimal, surgical fix.** Two lines added, zero lines modified. The change does exactly what the ticket requires and nothing more.
2. **Pattern adherence is exact.** Guard expression, stringify call, field ordering, and grouping all match the established patterns in the file.
3. **Thorough fix log.** The ticket documents the root cause, the fix, the duplicate code path check, and the Pokemon model check. All claims verified against actual code.
4. **Commit message is well-formed.** Conventional commit format, descriptive body explaining why the fields were frozen.

---

### Verdict: APPROVED

The fix is correct, minimal, and follows the established patterns exactly. The round-trip through Prisma, serializer, and client types is complete. No regressions. No new issues introduced. This ticket is ready for Game Logic Reviewer.
