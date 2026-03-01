---
review_id: code-review-263
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-132, bug-041
domain: character-lifecycle, combat
commits_reviewed:
  - f78a8962
  - ec07a28e
  - 5862ccd8
files_reviewed:
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/utils/trainerExperience.ts
  - app/server/api/capture/attempt.post.ts
  - app/components/encounter/CombatantCard.vue
  - app/server/services/switching.service.ts
  - artifacts/designs/design-pokemon-switching-001/spec-p1.md
  - artifacts/designs/design-pokemon-switching-001/shared-specs.md
  - artifacts/designs/design-pokemon-switching-001/spec-p0.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-132.md
  - artifacts/tickets/open/bug/bug-041.md
  - app/server/services/evolution.service.ts
  - app/server/utils/websocket.ts
  - .claude/skills/references/app-surface.md
  - decrees/decree-034.md
  - decrees/decree-039.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-01T22:15:00Z
follows_up: null
---

## Review Scope

Three commits from slave-3 (plan-20260301-204809) implementing two small tickets:

1. **ptu-rule-132** (commit f78a8962): Hook evolution species XP into capturedSpecies tracking. PTU Core p.461 says trainers gain +1 XP when evolving into a new species they haven't previously owned. The capture flow already had this; the evolution endpoint did not.

2. **bug-041** (commit ec07a28e): Remove Whirlwind from forced switch references per decree-034. Whirlwind is a push move, not a forced switch.

3. **Ticket status updates** (commit 5862ccd8): Mark both tickets as `in-progress` with fix logs.

Note: Commits `2b4a7623` and `3fee2a90` listed in the task's "Commits to Review" belong to code-review-249 fix cycle (feature-011 switching), not to this review's scope.

## Decree Compliance

- **decree-034** (Roar recall range; Whirlwind is a push): Correctly applied. All "Roar/Whirlwind" forced-switch references in code comments, UI tooltips, and design specs were updated to remove Whirlwind. Whirlwind is correctly retained in `moves.csv` game data (it IS a real move, just not a forced switch). Remaining Whirlwind mentions in `switching.service.ts` and `CombatantCard.vue` are all annotations ("Whirlwind is a push per decree-034"), which is correct documentation.

- **decree-039** (Roar blocked by Trapped): Not in scope for bug-041, but the developer edited the `validateForcedSwitch` JSDoc and left line 570 stating "Trapped check is bypassed for forced switches (the move overrides it)" — this contradicts decree-039. Already tracked by ptu-rule-129 (code fix), but the comment should have been updated while the developer was editing this exact JSDoc block. See M1.

## Issues

### MEDIUM

**M1: validateForcedSwitch JSDoc still claims Trapped is bypassed (contradicts decree-039)**

File: `app/server/services/switching.service.ts`, line 570

The developer updated this JSDoc block to add decree-034 references (lines 565-566) but left line 570 intact:
```
 * - Trapped check is bypassed for forced switches (the move overrides it)
```

And line 602 in the function body:
```
  // NOTE: Trapped check is SKIPPED for forced switches — the move overrides it
```

decree-039 explicitly rules: "Roar's forced recall does NOT override the Trapped condition." While ptu-rule-129 tracks the actual code fix, the developer was already editing this JSDoc. The comment should be updated to avoid misleading future developers who read the comment but not the ticket backlog.

**Fix:** Update line 570 to: `* - Trapped check: currently bypassed, but decree-039 rules Roar does NOT override Trapped (tracked by ptu-rule-129)` and update line 602 similarly.

**M2: app-surface.md not updated to reflect evolution species XP behavior**

File: `.claude/skills/references/app-surface.md`, line 114

The `POST /api/pokemon/:id/evolve` entry does not mention the new species XP behavior. The evolve endpoint now:
- Checks owning trainer's capturedSpecies
- Awards +1 trainer XP for new species
- Updates capturedSpecies list
- Broadcasts character_update on level-up
- Returns `speciesXp` in response data

The capture attempt endpoint's surface entry already documents its species XP behavior. The evolution endpoint should match.

**Fix:** Append to line 114's description: `; awards +1 trainer XP for new species evolution (capturedSpecies check, character_update broadcast on level-up, returns speciesXp in response)`

## What Looks Good

**ptu-rule-132 (Evolution Species XP):**
- Clean reuse of the exact pattern from `attempt.post.ts` lines 120-155. Same imports (`applyTrainerXp`, `isNewSpecies`), same flow (load trainer, parse capturedSpecies, check isNewSpecies, update DB, broadcast on level-up).
- Species name normalization (`toLowerCase().trim()`) matches the capture flow and `isNewSpecies()` internals.
- Immutable pattern for `updatedSpecies` array (`[...existingSpecies, normalizedSpecies]`).
- Proper null-safety: checks `ownerId` exists before querying trainer, checks `trainerRecord` exists before processing.
- Response includes `speciesXp` field only when `ownerId` is present, keeping the API clean for wild Pokemon evolutions.
- `broadcast({ type: 'character_update' })` only fires on level-up, matching capture behavior. No redundancy with `notifyPokemonEvolved` (different event type, different purpose).
- Error handling: species XP logic is inside the existing try/catch, so a failure in the XP award path would be caught and return a 400.

**bug-041 (Whirlwind Removal):**
- Thorough coverage: updated CombatantCard button tooltip, CombatantCard computed property comment, switching.service.ts JSDoc, switching.service.ts inline comment, and all three design spec files (spec-p0, spec-p1, shared-specs).
- Dragon Tail/Circle Throw correctly marked as TBD where previously listed alongside Whirlwind.
- No over-correction: Whirlwind data in `moves.csv` correctly left untouched (it's game data, not a forced-switch reference).
- Design spec updates are accurate and well-worded, with explicit decree-034 citations.

**Commit hygiene:**
- Three well-scoped commits: one for each ticket, one for status updates.
- Conventional commit format with clear descriptions.
- Commit messages cite the PTU rule source and decree numbers.

**Ticket updates:**
- Both tickets updated to `in-progress` with fix logs documenting commit SHAs, files changed, and approach taken. (Note: the ticket fix logs reference SHAs `c0dc34bd` and `4e1254f4` which were likely pre-rebase; the actual merged SHAs are `f78a8962` and `ec07a28e`. This is cosmetic and common in rebased workflows.)

## Verdict

**CHANGES_REQUIRED**

Two MEDIUM issues found. Both are straightforward comment/documentation updates:

1. M1: Update the `validateForcedSwitch` JSDoc and body comment to note decree-039 contradiction (Trapped is not actually bypassed per decree-039; tracked by ptu-rule-129).
2. M2: Update `app-surface.md` to document the evolution endpoint's new species XP behavior.

No correctness bugs, no immutability violations, no security issues. The actual logic implementation is clean and follows established patterns. These are documentation gaps that should be fixed now while the developer has context.

## Required Changes

1. **M1:** In `app/server/services/switching.service.ts`:
   - Line 570: Change `* - Trapped check is bypassed for forced switches (the move overrides it)` to `* - Trapped check: currently bypassed, but decree-039 rules Roar does NOT override Trapped (see ptu-rule-129)`
   - Line 602: Change `// NOTE: Trapped check is SKIPPED for forced switches — the move overrides it` to `// NOTE: Trapped check is currently skipped — decree-039 rules this is incorrect (see ptu-rule-129)`

2. **M2:** In `.claude/skills/references/app-surface.md`, line 114: Append species XP documentation to the evolve endpoint entry: `; awards +1 trainer XP for new species evolution (capturedSpecies check, character_update broadcast on level-up, returns speciesXp in response)`
