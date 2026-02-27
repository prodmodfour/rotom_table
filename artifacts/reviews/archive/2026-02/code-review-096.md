---
review_id: code-review-096
target: bug-029
trigger: orchestrator-routed
reviewed_commits:
  - 3a6951b
verdict: APPROVED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

## Summary

Reviewed the fix for bug-029: Character PUT endpoint now validates AP fields (`drainedAp`, `boundAp`, `currentAp`) with bounds clamping and fixes error handler to preserve `statusCode` on re-thrown errors.

## Changes Reviewed

**File:** `app/server/api/characters/[id].put.ts`

1. **AP bounds validation (lines 50-72):** When any AP field is present in the request body, the endpoint fetches the character's current level from the DB (lightweight `select: { level: true }` query), computes `maxAp` via `calculateMaxAp(level)`, and clamps each AP value to `Math.min(maxAp, Math.max(0, Math.floor(value)))`. If `body.level` is also being updated in the same request, it uses the incoming level for the maxAp calculation, which is correct -- the new level should govern the new AP bounds.

2. **Error handler fix (line 87):** `if (error.statusCode) throw error` before the generic `createError({ statusCode: 500 })`. This prevents the 404 from the character-not-found check (line 58) from being swallowed into a generic 500. Correct and necessary.

3. **Ticket status update:** Status changed from `open` to `in-progress`. Fix log added with clear description.

## Verification

### AP clamping logic: CORRECT

`Math.min(maxAp, Math.max(0, Math.floor(value)))` -- this correctly:
- Floors to integer (handles `5.7` -> `5`)
- Clamps minimum to 0 (handles `-3` -> `0`)
- Clamps maximum to maxAp (handles `999` -> `maxAp`)
- Order of operations is correct: floor first, then min/max bounds

### `calculateMaxAp` import: CORRECT

Imported from `~/utils/restHealing`. The function is `5 + Math.floor(level / 5)` which matches PTU Core p221 (Level 1 = 5 AP, Level 5 = 6 AP, etc.). Same function used by all other AP-mutating endpoints (`extended-rest`, `new-day`, `encounter/end`, `scene/deactivate`, `scene/activate`).

### Lightweight DB query: CORRECT

`prisma.humanCharacter.findUnique({ where: { id }, select: { level: true } })` is the minimal query needed. Only executed when AP fields are present in the request body (the `hasApUpdate` guard). The `body.level` preference on line 60 is a good edge-case catch -- if level and AP are updated simultaneously, the new level governs bounds.

### Error handler fix: CORRECT

The `if (error.statusCode) throw error` guard on line 87 is the standard H3 pattern for re-throwing `createError` errors. Without it, the 404 from line 58 would be caught and re-wrapped as a 500, losing the original status code and message.

### Duplicate check: CONFIRMED

- Prisma schema confirms AP fields exist only on `HumanCharacter` (not `Pokemon`)
- All other AP mutations go through dedicated endpoints that already compute AP correctly: `extended-rest.post.ts`, `new-day.post.ts`, `heal-injury.post.ts`, `encounters/[id]/end.post.ts`, `scenes/[id]/deactivate.post.ts`, `scenes/[id]/activate.post.ts`
- The character PUT is the only generic endpoint that accepts raw AP values from the client

## Observations (Filed as Tickets)

None. No new issues identified that warrant tickets.

## Notes

**NaN edge case:** If a non-numeric value (e.g., `"abc"`) is passed as an AP field, `Math.floor("abc")` produces `NaN`, which propagates through `Math.max` and `Math.min`. Prisma would reject `NaN` for an `Int` column at the DB layer, producing an error caught by the catch block and returned as a 500. This is acceptable for a GM-only endpoint -- the ticket scope was bounds validation for numeric values, and type coercion is a separate concern that applies to every field in this endpoint equally (e.g., `body.level`, `body.maxHp`, `body.injuries` are all passed through without type checks). Not filing a ticket since the existing Prisma type safety provides an adequate safety net.

**Pre-existing pattern:** The entire endpoint lacks input type validation (all fields are passed through with only `!== undefined` guards). This is a pre-existing pattern, not introduced by this commit. If input type validation becomes a priority, it should be addressed holistically across the endpoint, not piecemeal for AP fields.

## Verdict: APPROVED

Clean, minimal fix that addresses the ticket requirements completely. Clamping logic is correct. Error handler fix is a necessary companion change. No regressions introduced. Ticket status should be updated to `resolved` upon merge.
