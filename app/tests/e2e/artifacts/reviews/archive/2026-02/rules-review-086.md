---
review_id: rules-review-086
target: bug-029
trigger: orchestrator-routed
reviewed_commits:
  - 3a6951b
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Review: AP Validation in Character PUT Endpoint

### Scope

Commit `3a6951b` adds server-side bounds validation for `drainedAp`, `boundAp`, and `currentAp` fields in the `PUT /api/characters/:id` endpoint.

### PTU Rule Verification

#### 1. Max AP Formula

**Source:** PTU Core p.221 (Chapter 6 - Playing the Game):
> "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points."

**Implementation in `calculateMaxAp` (`app/utils/restHealing.ts` line 219-221):**
```ts
export function calculateMaxAp(level: number): number {
  return 5 + Math.floor(level / 5)
}
```

**Verification by example:**
| Level | Formula Result | PTU Expected |
|-------|---------------|-------------|
| 1     | 5 + floor(1/5) = 5 | 5 |
| 4     | 5 + floor(4/5) = 5 | 5 |
| 5     | 5 + floor(5/5) = 6 | 6 |
| 10    | 5 + floor(10/5) = 7 | 7 |
| 15    | 5 + floor(15/5) = 8 | 8 (book's explicit example) |
| 20    | 5 + floor(20/5) = 9 | 9 |
| 50    | 5 + floor(50/5) = 15 | 15 |

**CORRECT.** The formula matches the book's rule and its worked example (Level 15 = 8 AP).

#### 2. AP Field Clamping

**Implementation in `[id].put.ts` (lines 63-71):**
```ts
if (body.drainedAp !== undefined) {
  updateData.drainedAp = Math.min(maxAp, Math.max(0, Math.floor(body.drainedAp)))
}
if (body.boundAp !== undefined) {
  updateData.boundAp = Math.min(maxAp, Math.max(0, Math.floor(body.boundAp)))
}
if (body.currentAp !== undefined) {
  updateData.currentAp = Math.min(maxAp, Math.max(0, Math.floor(body.currentAp)))
}
```

Each AP field is clamped to `[0, maxAp]` and forced to an integer via `Math.floor`. This is **correct** defensive validation:

- **Lower bound (0):** AP cannot be negative. There is no PTU rule allowing negative AP pools.
- **Upper bound (maxAp):** No AP subfield can exceed the total AP pool. While the book does not explicitly say "drainedAp <= maxAp", it is a logical invariant: you cannot drain more AP than the maximum that exists.
- **Integer enforcement:** AP is a discrete resource (whole points only). `Math.floor` correctly truncates fractional inputs.

**CORRECT.**

#### 3. Level Resolution for Concurrent Updates

When both `body.level` and an AP field are updated in the same request, the endpoint correctly uses the incoming `body.level` to compute `maxAp` rather than the stale DB value (line 60):

```ts
const level = body.level !== undefined ? body.level : character.level
```

This avoids a race condition where a level-up + AP set in the same PUT would clamp against the old (lower) max AP.

**CORRECT.**

#### 4. Error Handler Fix

The error handler now re-throws errors that already carry a `statusCode` (e.g., the 404 from character lookup), preventing them from being swallowed as generic 500s. This is not a PTU rules concern but is structurally sound.

### Observations (Non-Blocking)

1. **No cross-field constraint between drainedAp + boundAp + currentAp:** The PTU rule is that `availableAp = maxAp - drainedAp - boundAp`, and `currentAp` should represent the remaining spendable pool. The validation does not enforce `drainedAp + boundAp + currentAp <= maxAp`. This is acceptable for a GM-facing defensive-only endpoint -- the GM may intentionally set these independently, and the rest of the codebase (composables, dedicated endpoints) correctly computes the relationship. A stricter relational constraint could be added later if needed but is not a PTU rules violation at this layer.

2. **Shared utility reuse:** The endpoint correctly imports and uses the canonical `calculateMaxAp` function from `restHealing.ts`, which is the same function used by all other AP-touching code paths (`extended-rest`, `new-day`, `scene/deactivate`, `encounter/end`). This ensures formula consistency across the application.

### Verdict

**PASS.** The AP validation correctly implements PTU 1.05 rules. The `calculateMaxAp` formula matches the book's stated rule and worked example. All three AP fields are properly bounded to `[0, maxAp]` as non-negative integers. Level resolution handles concurrent level + AP updates correctly.
