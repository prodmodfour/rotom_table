---
ticket_id: refactoring-002
priority: P1
categories:
  - EXT-DUPLICATE
  - LLM-INCONSISTENT
affected_files:
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
Grid placement logic (occupied cell tracking, `canFit()` check, side-based auto-placement with fallback) is duplicated verbatim across two API handlers. If placement rules change, both files must be updated independently — exactly the pattern flagged by Developer Lesson 2.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** ~38 lines of identical logic across 2 files
- **Threshold:** 10+ similar lines in 2+ files
- **Impact:** Placement bug fix in one file won't propagate to the other. LLM agents may update one file and miss the other.
- **Evidence:**
  - `combatants.post.ts:117-175` — occupied cells set, `canFit()`, `sidePositions`, two-pass placement
  - `wild-spawn.post.ts:48-113` — identical occupied cells set, identical `canFit()`, identical `sidePositions`, identical two-pass placement

### Finding 2: LLM-INCONSISTENT
- **Metric:** Same operation implemented twice with subtle differences
- **Threshold:** Same operation done differently across files
- **Impact:** `combatants.post.ts` calculates `tokenSize` from capabilities (line 54), while `wild-spawn.post.ts` hardcodes `tokenSize = 1` (line 87). This may be intentional (wild spawns are always size 1) but the inconsistency makes it hard for LLM agents to know which pattern to follow.
- **Evidence:** `combatants.post.ts:54` vs `wild-spawn.post.ts:87`

## Suggested Refactoring
1. Create `app/server/services/grid-placement.service.ts` with:
   - `buildOccupiedCellsSet(combatants)` — returns `Set<string>`
   - `findPlacementPosition(occupiedCells, side, tokenSize, gridWidth, gridHeight)` — returns `{x, y}`
2. Import and use in both `combatants.post.ts` and `wild-spawn.post.ts`
3. Keep `canFit()` as private in the service
4. Consider whether wild-spawn token size should also derive from capabilities

Estimated commits: 2

## Related Lessons
- Developer Lesson 2: "Identify and update all code paths that perform the same operation" — this is a direct instance of the duplicate-path pattern that caused bug-001's incomplete fix

## Resolution Log
- Commits:
  - `c5ecc91` — extract grid-placement.service.ts
  - `8589bf6` — use service in combatants.post.ts (-77 lines)
  - `c82b8c3` — use service in wild-spawn.post.ts (-63 lines)
  - `9576503` — use service in from-scene.post.ts (-54 lines, third duplicate not in original ticket)
- Files changed:
  - `app/server/api/encounters/[id]/combatants.post.ts`
  - `app/server/api/encounters/[id]/wild-spawn.post.ts`
  - `app/server/api/encounters/from-scene.post.ts`
- New files created:
  - `app/server/services/grid-placement.service.ts` (145 lines)
- Tests passing: 446/447 (1 pre-existing failure in settings.test.ts unrelated to this change)
- Net lines removed: ~194 lines of duplicate logic replaced by shared service
- Note: Found and fixed a third duplicate in `from-scene.post.ts` beyond the two listed in the ticket
