---
review_id: code-review-008
target: refactoring-005
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-16
commits_reviewed:
  - 8168ecc
files_reviewed:
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/utils/diceRoller.ts
  - app/types/encounter.ts
scenarios_to_rerun: []
---

## Review: refactoring-005 — Extract initiative sorting into encounter service

### Status

| Requirement | Status |
|-------------|--------|
| Move `sortByInitiativeWithRollOff()` to `encounter.service.ts` | Done |
| Type parameter as `Combatant[]` | Done |
| Replace inline `rollD20()` with existing `rollDie(20)` | Done |
| Remove all `any` annotations from handler | Done |
| No behavioral changes | Confirmed |

### Verification

**Behavioral equivalence confirmed:**
- Removed `rollD20()`: `Math.floor(Math.random() * 20) + 1`
- Replacement `rollDie(20)` (diceRoller.ts:32-33): `Math.floor(Math.random() * sides) + 1` — identical formula
- Initiative sorting logic is byte-for-byte identical except: `any[]` → `Combatant[]`, `(c: any)` → `(c)`, `[init, group]` → `[, group]` (unused variable cleanup)
- All 3 call sites in `start.post.ts` (lines 65, 67, 79) pass the same arguments as before

**Type correctness confirmed:**
- `Combatant` interface at `encounter.ts:17` includes `initiative: number` (line 22) and `initiativeRollOff?: number` (line 26) — both fields accessed by the extracted function
- `combatants: Combatant[]` annotation at `start.post.ts:27` replaces the untyped `JSON.parse()` result
- All `.forEach()`, `.filter()`, `.map()` callbacks in the handler now infer types from `Combatant[]` — no explicit `any` needed

**No stale references:**
- `rollD20` — zero occurrences remaining in codebase
- `sortByInitiativeWithRollOff` — defined once in service, imported once in handler, called 3 times

**File sizes:** `encounter.service.ts` is 259 lines, `start.post.ts` is 115 lines — both well within limits.

### Issues

None.

### What looks good

- Clean 1:1 extraction with no logic changes mixed in — exactly what a refactoring commit should be
- Good JSDoc on the extracted function documenting the mutation behavior: "Mutates initiativeRollOff on tied combatants, then returns a new sorted array"
- Unused variable `init` in `for (const [init, group])` correctly cleaned to `[, group]`
- Reused existing `rollDie` utility instead of creating a new one — follows DRY principle
- Resolution Log in the ticket is complete and accurate

### Verdict

**APPROVED** — Pure extraction refactoring. Logic is identical, types are correct, no behavioral changes. No scenarios need re-running since this is a type-only + location-only change with no functional delta.
