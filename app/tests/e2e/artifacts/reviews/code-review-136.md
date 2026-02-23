---
review_id: code-review-136
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-079
domain: combat
commits_reviewed:
  - d0ab030
  - 126879e
files_reviewed:
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/composables/useMoveCalculation.ts
  - app/utils/equipmentBonuses.ts
  - app/utils/damageCalculation.ts
  - app/constants/equipment.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-23T06:30:00Z
follows_up: null
---

## Review Scope

Reviewing ptu-rule-079 fix: helmet conditional DR (+15 on critical hits) was previously skipped on the server when the GM provided a manual `body.damageReduction` override. The fix separates the helmet conditional DR check into its own independent block so it applies on top of both manual override and equipment-based DR.

**Commits:** 2 (1 code fix, 1 ticket update)
**Files changed:** 1 source file (`calculate-damage.post.ts`), 1 ticket file
**Scope:** Minimal and well-targeted. Only the server-side DR logic was modified.

## Code Structure Analysis

### Fix Mechanics (d0ab030)

The original code had a single `if (effectiveDR === undefined && targetEquipBonuses)` block that contained both the base equipment DR assignment AND the helmet conditional DR loop. When a manual `body.damageReduction` was provided, `effectiveDR` was not undefined, so the entire block was skipped -- including helmet DR.

The fix correctly separates the two concerns:

1. **Block 1 (lines 179-181):** If no manual DR override AND target has equipment, use equipment-based DR. Unchanged logic.
2. **Block 2 (lines 183-190):** If critical hit AND target has equipment bonuses, add conditional DR (helmet +15) on top of whatever `effectiveDR` was determined. New independent block.

The `(effectiveDR ?? 0)` fallback on line 187 is correct and handles the edge case where neither manual override nor equipment armor exists but the target has a helmet (e.g., a human with a helmet and no armor receiving a crit). In this case, `effectiveDR` would still be `undefined` at line 187 because the first block's condition (`effectiveDR === undefined && targetEquipBonuses`) would set it to `targetEquipBonuses.damageReduction` which is 0 -- so actually, `effectiveDR` is 0 at that point, not undefined. The `?? 0` is a safe defensive fallback but is not strictly reachable in the current code flow. This is fine -- it prevents future regressions if the first block's logic ever changes.

### Server/Client Parity Check

**Client (`useMoveCalculation.ts`, lines 444-457):**
- `equipmentDR` starts at 0
- Adds `equipBonuses.damageReduction` (armor sum)
- Adds helmet conditional DR if `isCriticalHit.value`
- No concept of manual override -- always computes from equipment
- Helmet DR always stacks on top of armor DR

**Server (`calculate-damage.post.ts`, lines 175-190):**
- `effectiveDR` starts as `body.damageReduction` (manual override, or undefined)
- If undefined AND target has equipment: uses equipment DR
- Independently: if critical AND target has equipment: adds helmet conditional DR on top

**Scenario matrix:**

| Scenario | Server Before | Server After | Client | Match? |
|---|---|---|---|---|
| No override, no crit | Equipment DR | Equipment DR | Equipment DR | Yes |
| No override, crit + helmet | Equipment DR + 15 | Equipment DR + 15 | Equipment DR + 15 | Yes |
| Manual override, no crit | Manual DR | Manual DR | N/A (no manual) | N/A |
| Manual override, crit + helmet | Manual DR (BUG) | Manual DR + 15 (FIXED) | N/A | Fixed |
| No override, crit, no helmet | Equipment DR | Equipment DR | Equipment DR | Yes |
| Pokemon target, crit | No equipment | No equipment | No equipment | Yes |

Server/client parity is restored for all applicable scenarios. The manual override path is server-only by design (GM escape hatch).

### Duplicate Code Path Check

Searched for `conditionalDR`, `helmet`, and `Critical Hits only` across the codebase. Only two code paths process helmet conditional DR:
- Server: `calculate-damage.post.ts` (fixed)
- Client: `useMoveCalculation.ts` (already correct)

No other code paths exist. The `computeEquipmentBonuses` utility and `equipment.ts` constants only define the data structures -- they do not apply helmet DR logic.

### Immutability Check

No mutation violations. The fix only reassigns `effectiveDR` (a local `let` variable). No reactive objects, no props, no store state is mutated.

### File Size Check

`calculate-damage.post.ts`: 280 lines (well under 800 limit).
`useMoveCalculation.ts`: 655 lines (under 800 limit).

### Commit Granularity

Two commits with appropriate granularity:
1. `d0ab030` -- the actual code fix (1 file, 8 insertions, 7 deletions)
2. `126879e` -- ticket update with fix log documentation

## What Looks Good

1. **Minimal, surgical fix.** Only the specific bug was addressed -- no scope creep, no unnecessary refactoring.
2. **Correct root cause analysis.** The ticket's fix log accurately identifies the nesting issue and explains the structural separation.
3. **Defensive coding.** The `(effectiveDR ?? 0)` fallback protects against future regressions even though it is not strictly reachable in the current flow.
4. **Clear comments.** The new comment on lines 182-183 explicitly states the design intent: "Applied on top of BOTH manual override and equipment-based DR."
5. **Duplicate code path check was performed.** The developer verified no other code paths handle helmet DR.

## Verdict

**APPROVED.** The fix is correct, minimal, and restores server/client parity. No issues found.

## Required Changes

None.
