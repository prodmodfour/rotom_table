---
ticket_id: refactoring-006
priority: P2
categories:
  - LLM-MAGIC
  - LLM-INCONSISTENT
affected_files:
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/move.post.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
`breather.post.ts` defines its own `VOLATILE_CONDITIONS` and `DEFAULT_STAGES` constants that duplicate definitions elsewhere. `move.post.ts` uses `uuid.v4()` while `breather.post.ts` uses `crypto.randomUUID()` for the same purpose (log entry IDs). Magic constants and inconsistent implementations make it harder for LLM agents to verify correctness.

## Findings

### Finding 1: LLM-MAGIC
- **Metric:** 2 constant arrays defined locally that duplicate canonical definitions
- **Threshold:** Hardcoded domain strings/numbers in 2+ files
- **Impact:** If the list of volatile conditions changes (e.g., adding a new condition from a PTU supplement), `breather.post.ts` must be updated independently. The canonical list in `constants/statusConditions.ts` would be updated but this local copy could be missed.
- **Evidence:**
  - `breather.post.ts:13-19` — `VOLATILE_CONDITIONS` array (5 entries)
  - `breather.post.ts:21-29` — `DEFAULT_STAGES` object
  - Canonical sources: `constants/statusConditions.ts` (VOLATILE_CONDITIONS), `combatant.service.ts:255-265` (`createDefaultStageModifiers()`)

### Finding 2: LLM-INCONSISTENT
- **Metric:** Two different UUID generation methods for the same purpose
- **Threshold:** Same operation done differently across files
- **Impact:** Minor, but LLM agents copy patterns. A new endpoint might use either method inconsistently.
- **Evidence:**
  - `move.post.ts:5` — `import { v4 as uuidv4 } from 'uuid'`, line 89: `id: uuidv4()`
  - `breather.post.ts:118` — `id: crypto.randomUUID()`

## Suggested Refactoring
1. Import `VOLATILE_CONDITIONS` from `constants/statusConditions.ts` instead of redefining locally
2. Import `createDefaultStageModifiers()` from `combatant.service.ts` (or export the constant)
3. Standardize on one UUID method across all encounter API handlers (prefer `crypto.randomUUID()` as it's built-in and doesn't require a dependency)

Estimated commits: 1

## Related Lessons
- none (new finding)

## Resolution Log
- Commits: 767e6f3
- Files changed:
  - `app/constants/statusConditions.ts` — added Enraged + Suppressed to VOLATILE_CONDITIONS, removed Suppressed from OTHER_CONDITIONS (PTU 1.05 p.247)
  - `app/server/services/combatant.service.ts` — exported `createDefaultStageModifiers()`
  - `app/server/api/encounters/[id]/breather.post.ts` — replaced local VOLATILE_CONDITIONS and DEFAULT_STAGES with imports; now clears all volatile conditions + Slowed + Stuck per PTU p.245
  - `app/server/api/encounters/[id]/move.post.ts` — replaced `uuid.v4()` with `crypto.randomUUID()`, removed uuid import
- New files created: none
- Tests passing: 134/134 combat tests pass
- Bug fix included: breather previously only cleared 5 conditions (Confused, Cursed, Enraged, Suppressed, Flinched); now correctly clears all 12 (10 volatile + Slowed + Stuck)
- Review fix commit: a95b67e — added Slowed+Stuck breather e2e test (HIGH #1), updated stale header comment (MEDIUM #2)
