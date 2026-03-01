---
ticket_id: ptu-rule-132
category: ptu-rule
priority: P3
severity: MEDIUM
status: resolved
source: rules-review-233 HIGH-1
created_by: slave-collector (plan-20260301-184039)
created_at: 2026-03-01
---

# ptu-rule-132: Evolution species XP not hooked into capturedSpecies tracking

## Summary

PTU Core p.461 states: "Whenever a Trainer catches, **hatches, or evolves** a Pokemon species they did not previously own, they gain +1 Experience." The P1 implementation of feature-009 only hooks the capture flow (`attempt.post.ts`). The evolution endpoint (`app/server/api/pokemon/[id]/evolve.post.ts`) does not check `capturedSpecies` or call `applyTrainerXp()` when evolving into a new species.

## Affected Files

- `app/server/api/pokemon/[id]/evolve.post.ts` — needs `capturedSpecies` check + `applyTrainerXp(+1)` on new species
- `app/utils/trainerExperience.ts` — `isNewSpecies()` utility already exists and is reusable

## Suggested Fix

After a successful evolution in `evolve.post.ts`:
1. Load the owning trainer's `capturedSpecies` list
2. Call `isNewSpecies(evolvedSpeciesName, capturedSpecies)`
3. If new, call `applyTrainerXp(currentXp, currentLevel, 1)` and update the character
4. Append the normalized species name to `capturedSpecies`

The `capturedSpecies` field and `isNewSpecies()` utility are already built for this. This is a hookup-only change.

## Impact

The app under-awards trainer XP when a Pokemon evolves into a species the trainer hasn't previously owned. The data model supports the fix — only the wiring is missing. Hatching XP is separately deferred until the breeding/hatching system exists.

## Resolution Log

- **Commit:** c0dc34bd — `feat: hook evolution species XP into capturedSpecies tracking`
- **Files changed:** `app/server/api/pokemon/[id]/evolve.post.ts`
- **Approach:** Added species XP logic after successful evolution, following the exact pattern from `attempt.post.ts` lines 120-155. Imports `applyTrainerXp` and `isNewSpecies` from `trainerExperience.ts`. Loads owning trainer's `capturedSpecies`, checks if evolved species is new, awards +1 XP, appends normalized species name, broadcasts `character_update` on level-up. Returns `speciesXp` in response data.
- **Review fix (code-review-263 M2):** Commit 883a1cbd — Updated `.claude/skills/references/app-surface.md` to document species XP behavior on the evolve endpoint.
