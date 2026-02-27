---
review_id: code-review-025
target: refactoring-014
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-17
commits_reviewed:
  - 916e890
files_reviewed:
  - app/server/api/characters/import-csv.post.ts
  - app/stores/groupViewTabs.ts
  - app/tests/e2e/scenarios/capture/capture-helpers.ts
  - app/tests/e2e/scenarios/combat/combat-helpers.ts
scenarios_to_rerun: []
---

## Summary

4 pre-existing type errors resolved across 4 files. All fixes are minimal, correct, and introduce no behavioral changes. The commit also introduces `capture-helpers.ts` as a new file (168 lines) — this file existed on disk as untracked from prior capture test work and was committed here because `nuxi typecheck` was reporting the import error in it.

## Status

| Fix | File | Change | Status |
|-----|------|--------|--------|
| 1 | `import-csv.post.ts:493` | `pokemon.gender ?? undefined` | Correct |
| 2 | `groupViewTabs.ts:260` | URL cast `as string` | Correct |
| 3 | `capture-helpers.ts:1` | `import type { APIRequestContext }` | Correct |
| 4 | `combat-helpers.ts:1` | `import type { APIRequestContext }` | Correct |

## Fix Analysis

**Fix 1 — null/undefined mismatch (import-csv.post.ts:493):**
Prisma schema has `Pokemon.gender` as `String?` (nullable). Prisma's `create()` input type expects `string | undefined`, not `string | null`. The CSV parser produces `string | null`. The `?? undefined` coercion is the correct fix — it converts null to undefined while preserving actual string values.

**Fix 2 — typed route inference (groupViewTabs.ts:260):**
Nuxt's `$fetch` infers route parameters from template literal types. The parameterized path `/api/scenes/${id}` triggers typed route inference that restricts allowed HTTP methods. Casting to `string` bypasses this incorrect inference for DELETE. This is a known Nuxt 3 workaround and doesn't affect runtime behavior.

**Fix 3 & 4 — verbatimModuleSyntax (test helpers):**
Both files import `APIRequestContext` which is a type-only import. With `verbatimModuleSyntax` enabled, TypeScript requires explicit `import type` syntax. Correct fix.

## Observations

**New file in commit scope:** `capture-helpers.ts` (168 lines) was previously untracked on disk. The worker committed the entire file to resolve the type error. The file content follows established patterns from `combat-helpers.ts` and includes capture-domain-specific helpers (`getCaptureRate`, `attemptCapture`, `createTrainer`, `deleteTrainer`). The shared helpers (`createPokemon`, `getPokemon`, encounter helpers) are intentionally duplicated per domain — each test domain maintains its own helper subset. This is acceptable for test infrastructure.

**Remaining type errors:** `nuxi typecheck` still reports 2 errors in `pages/gm/create.vue:346` and `pages/gm/scenes/[id].vue:109` (both null/undefined mismatches similar to Fix 1). These are pre-existing and were not in the ticket's scope. They should be filed as a follow-up.

## Verdict

APPROVED. All 4 targeted type errors are resolved. No behavioral changes. The 2 remaining type errors in `create.vue` and `scenes/[id].vue` should be filed as a new refactoring ticket.
