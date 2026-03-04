---
review_id: code-review-323
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-114
domain: pokemon-lifecycle
commits_reviewed:
  - d689a341
  - 92dac8f7
  - 3bfee7a3
  - 80d29081
files_reviewed:
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/utils/trainerExperience.ts
  - app/server/api/characters/[id]/xp-history.get.ts
  - app/server/api/characters/[id].put.ts
  - app/server/utils/serializers.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/tests/unit/api/trainerXp.test.ts
  - app/prisma/CLAUDE.md
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/refactoring/refactoring-114.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Review Scope

Pure rename of `capturedSpecies` to `ownedSpecies` across 10 source files and 2 documentation files. The rename corrects PTU terminology: the field tracks species a trainer has caught, hatched, or evolved (PTU p.461), not just captured. 4 commits with clean layering: schema first, then TypeScript source, then docs, then ticket update.

## Completeness Verification

Performed a full-codebase `grep` for `capturedSpecies` across all source code directories (`app/`, `.claude/`, root CLAUDE.md). The only remaining occurrence is the intentional `@map("capturedSpecies")` in `schema.prisma` line 81, which preserves the DB column name. Zero stale references in:

- `app/components/` -- no matches
- `app/composables/` -- no matches (the ticket listed `useTrainerXp.ts` as affected, but it does not reference this field)
- `app/stores/` -- no matches
- `app/pages/` -- no matches
- `app/server/` -- no matches
- `app/prisma/seed*.ts` -- no matches
- `.claude/skills/references/` -- no matches

Historical artifact files (`artifacts/designs/`, `artifacts/reviews/`, `artifacts/tickets/resolved/`) retain `capturedSpecies` references. This is correct -- they are historical records and should not be modified.

## Prisma @map Approach

The `@map("capturedSpecies")` directive on line 81 of `schema.prisma` is the correct Prisma approach for renaming a field without changing the underlying database column. This means:

1. The Prisma Client exposes `ownedSpecies` in TypeScript
2. The SQLite column remains `capturedSpecies`
3. No migration or `prisma db push` is needed -- existing databases continue to work
4. No data loss risk

This is textbook Prisma field aliasing.

## TypeScript Consistency

All 8 TypeScript source files are updated consistently:

- **Type definition** (`character.ts:284`): `ownedSpecies: string[]` with improved comment referencing catches, hatches, and evolves
- **Utility** (`trainerExperience.ts:91`): `isNewSpecies()` parameter renamed from `capturedSpecies` to `ownedSpecies`, JSDoc updated
- **Serializers** (`serializers.ts:121, 192`): Both `serializeCharacter` and `serializeCharacterSummary` updated
- **API endpoints** (`attempt.post.ts`, `evolve.post.ts`, `xp-history.get.ts`, `[id].put.ts`): All Prisma `select` and `data` fields updated
- **Tests** (`trainerXp.test.ts:67`): Test factory character object updated

## Behavioral Changes

Confirmed: zero behavioral changes. Every modification is a pure identifier rename. No logic was added, removed, or reordered. The diff shows exact 1:1 substitution of `capturedSpecies` with `ownedSpecies` in every context.

## Commit Granularity

Four commits with correct layering:

1. `d689a341` -- Schema only (1 file) -- establishes the Prisma field rename
2. `92dac8f7` -- All TypeScript source (8 files) -- updates all code references
3. `3bfee7a3` -- Documentation only (2 files) -- CLAUDE.md and app-surface.md
4. `80d29081` -- Ticket update (1 file) -- resolution log

This is good granularity for a rename. Schema first ensures the Prisma field exists before code references it.

## Decrees

No active decrees apply to this domain. No new ambiguities discovered.

## Issues

None.

## What Looks Good

1. **Thorough coverage.** All 10 source files that reference the field were updated. The grep verification confirms no stale references remain in active source code.
2. **Correct Prisma technique.** Using `@map()` to alias the field avoids a destructive migration while giving the codebase accurate terminology.
3. **Improved documentation.** The schema comment now explicitly mentions "catches, hatches, evolves per PTU p.461" and the type comment says "catches, hatches, evolves (lowercase)" -- both more accurate than the original "captured species" framing.
4. **Historical artifacts preserved.** Old reviews, designs, and resolved tickets retain the original terminology as historical record, which is the correct approach.
5. **Clean commit messages.** Each commit explains the "why" (PTU terminology accuracy) and the "what" (which files changed).

## Verdict

**APPROVED.** This is a clean, complete rename with no behavioral changes, correct Prisma technique, and thorough coverage across all source files and documentation. No issues found.

## Required Changes

None.
