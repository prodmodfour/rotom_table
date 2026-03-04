---
ticket: refactoring-114
category: EXT-NAMING
priority: P3
severity: LOW
status: in-progress
domain: character-lifecycle
source: rules-review-229 (carried from rules-review-222 M1)
created_by: slave-collector (plan-20260301-152500)
created_at: 2026-03-01
---

# refactoring-114: Rename capturedSpecies to ownedSpecies for PTU accuracy

## Summary

The `capturedSpecies` field on the HumanCharacter model tracks species the trainer has obtained for XP purposes (PTU p.461: "catches, hatches, or evolves a Pokemon species they did not previously own"). The field name only covers the "catches" case and does not reflect the full PTU scope of hatch and evolve.

Currently, only the capture flow populates this field. When hatch and evolve flows are wired (P1), the naming mismatch will be more confusing.

## Affected Files

- `app/prisma/schema.prisma` — `capturedSpecies` column
- `app/utils/trainerExperience.ts` — `isNewSpecies()` function
- `app/composables/useTrainerXp.ts` — references capturedSpecies
- `app/server/api/characters/[id]/xp.post.ts` — processes capturedSpecies

## Suggested Fix

1. Rename `capturedSpecies` → `ownedSpecies` in Prisma schema
2. Create a migration
3. Update all references across utilities, composables, and API endpoints
4. Wire `isNewSpecies()` into hatch and evolve flows (P1 scope)

## Impact

- Naming/semantic correctness
- No behavioral change for P0 (capture-only is currently correct)
- Sets up clean naming for P1 when hatch+evolve are wired

## Resolution Log

- **Commit:** 7a9bb41c — `refactor: rename capturedSpecies to ownedSpecies in Prisma schema`
  - `app/prisma/schema.prisma` — renamed field to `ownedSpecies` with `@map("capturedSpecies")` to preserve DB column
- **Commit:** e3c7772a — `refactor: rename capturedSpecies to ownedSpecies across TypeScript source`
  - `app/types/character.ts` — updated HumanCharacter interface field
  - `app/utils/trainerExperience.ts` — updated isNewSpecies() parameter name and JSDoc
  - `app/server/api/characters/[id]/xp-history.get.ts` — updated Prisma select and response field
  - `app/server/api/characters/[id].put.ts` — updated PUT handler field
  - `app/server/utils/serializers.ts` — updated both serializeCharacter and serializeCharacterSummary
  - `app/server/api/capture/attempt.post.ts` — updated capture species XP flow
  - `app/server/api/pokemon/[id]/evolve.post.ts` — updated evolution species XP flow
  - `app/tests/unit/api/trainerXp.test.ts` — updated test factory
- **Commit:** c6ae2dbe — `docs: update capturedSpecies references to ownedSpecies in CLAUDE.md and app-surface`
  - `app/prisma/CLAUDE.md` — updated JSON field table
  - `.claude/skills/references/app-surface.md` — updated endpoint descriptions
- **Approach:** Used `@map("capturedSpecies")` in Prisma schema to rename the Prisma field while preserving the SQLite column name, avoiding a destructive migration. All 10 source files updated. Artifact docs (designs, reviews, resolved tickets) left as historical record.
