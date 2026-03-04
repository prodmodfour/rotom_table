---
review_id: code-review-233
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-012
domain: combat
commits_reviewed:
  - ed23b45
  - 2cd0ad4
  - a1f79bc
  - d450c23
files_reviewed:
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/services/combatant.service.ts
  - app/server/services/entity-builder.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/stores/encounter.ts
  - app/stores/encounterXp.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T09:00:00Z
follows_up: code-review-228
---

## Review Scope

Re-review of feature-012 (Death & Heavily Injured Automation) fix cycle 3. This cycle addressed all three remaining issues from code-review-228 (H1-NEW, M1-NEW, M2-NEW) and the matching rules-review-204 issue (HIGH-001). Four commits total across the fix branch.

### Prior Issues Addressed

| ID | Severity | Source | Status | Notes |
|----|----------|--------|--------|-------|
| H1-NEW | HIGH | code-review-228 | RESOLVED | `damage.post.ts:116` now uses `faintedFromAnySource` instead of `damageResult.fainted` |
| HIGH-001 | HIGH | rules-review-204 | RESOLVED | Same as H1-NEW above |
| M1-NEW | MEDIUM | code-review-228 | RESOLVED | Entity builders extracted to `entity-builder.service.ts`; `combatant.service.ts` dropped from 809 to 686 lines |
| M2-NEW | MEDIUM | code-review-228 | RESOLVED | `app-surface.md` updated with `encounterXp` store and `entity-builder.service.ts` entries |

## Issues

No new issues found.

### Observations (not blocking, filed as context for future work)

**Pre-existing: `encounter.ts` at 808 lines.** The encounter store is currently 808 lines, 8 over the 800-line limit. This is NOT caused by fix cycle 3 -- the file was already 808 lines before this cycle (the `switchPokemon` action from commit 272aa69 pushed it over). Fix cycle 2 brought it down to 758 via XP extraction, but subsequent unrelated work added it back. This will need a separate ticket but is not in scope for this review.

**Pre-existing: `damage.post.ts` uses `.push()` for defeated tracking.** Line 121 mutates `defeatedEnemies` via `.push()`, while `move.post.ts` and `next-turn.post.ts` use immutable spread (`defeatedEnemies = [...defeatedEnemies, { ... }]`). This is not a functional bug (the array is freshly parsed from JSON), but it's an inconsistency with the project's immutability convention. Pre-existing -- not introduced by this fix cycle.

**Pre-existing: `damage.post.ts` name resolution lacks nickname fallback.** Line 119 uses `entity.species` for Pokemon defeated-enemy tracking, while `next-turn.post.ts` and `move.post.ts` (via `getEntityName`) use `nickname || species`. Pre-existing inconsistency.

## What Looks Good

**H1-NEW fix (faintedFromAnySource) -- Correct and minimal.** The one-line change at `damage.post.ts:116` replaces `damageResult.fainted` with the existing `faintedFromAnySource` variable (computed at line 109). This variable correctly captures both direct-damage faint and heavily-injured-penalty faint: `damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)`. The `isDefeated` check now reads `faintedFromAnySource || deathCheck.isDead`, which is consistent with the defeated tracking in `move.post.ts` (line 167/244) and `next-turn.post.ts` (lines 343-348). All three damage paths now correctly track enemies defeated by heavily-injured-penalty faint for XP.

**M1-NEW fix (entity builder extraction) -- Clean separation.**

- `entity-builder.service.ts` (127 lines) is a focused, pure data transformation module. It imports `prisma` only for type derivation (`PrismaPokemonRecord`, `PrismaHumanRecord`), not for DB calls. The two functions (`buildPokemonEntityFromRecord`, `buildHumanEntityFromRecord`) contain no combat logic, no side effects, and no dependencies on other services. Clean SRP separation.

- `combatant.service.ts` dropped from 809 to 686 lines -- well under the 800-line limit. The file header was updated to note that entity builders live in the new module. The remaining code (damage calculation, healing, status conditions, stage modifiers, combatant builder, initiative) is cohesive combat-related logic.

- All three consumer files (`combatants.post.ts`, `switch.post.ts`, `from-scene.post.ts`) had their imports updated to split between `entity-builder.service` (entity builders) and `combatant.service` (combat builder). No stale imports remain -- verified via grep. No functionality changes in any consumer file.

- The Prisma record types (`PrismaPokemonRecord`, `PrismaHumanRecord`) are exported from the new module, which is correct since they are the input types for the builder functions.

**M2-NEW fix (app-surface.md update) -- Accurate.**

- The `encounterXp` store entry was added to the stores table at line 228, correctly positioned between `encounterCombat` and `encounterGrid` (alphabetical within the encounter domain group). The description ("XP calculation/distribution") and API mapping ("encounters (xp-calculate, xp-distribute)") are accurate.

- The `entity-builder.service.ts` entry was added to the server services table at line 249, directly above `combatant.service.ts`. The description ("Prisma record -> typed entity (buildPokemonEntityFromRecord, buildHumanEntityFromRecord)") accurately reflects the module's purpose and exports.

**Commit granularity -- Correct.** Each commit addresses exactly one issue: H1-NEW (ed23b45), M1-NEW (2cd0ad4), M2-NEW (a1f79bc), ticket update (d450c23). Messages are descriptive and use conventional commit format. The refactoring commit correctly includes all five files that changed (the service split plus three consumer import updates).

**Decree compliance verified:**
- Per decree-005: The `applyFaintStatus` function (now at lines 170-186 of the slimmer `combatant.service.ts`) was not modified by this fix cycle and continues to correctly reverse CS effects on faint. The `faintedFromAnySource` variable used in the H1-NEW fix correctly gates `syncStagesToDatabase` (line 110-112), ensuring decree-005 CS reversal is synced to DB for heavily-injured-penalty faints.
- Per decree-001 (minimum 1 damage): Not affected by these changes.
- Per decree-032 (Cursed tick): Not affected by these changes.
- Per decree-033 (fainted switch timing): Not affected by these changes.

**No new decree ambiguities discovered.**

## Verdict

**APPROVED**

All three issues from code-review-228 are fully resolved. The H1-NEW fix correctly addresses the XP tracking gap for heavily-injured-penalty faints in the GM direct damage path. The entity builder extraction is clean, well-bounded, and reduces `combatant.service.ts` to a healthy 686 lines. The app-surface update is accurate. No new issues introduced. The pre-existing observations noted above (encounter.ts at 808 lines, mutation pattern in damage.post.ts, missing nickname fallback in damage.post.ts) are out of scope for this fix cycle and can be addressed separately if warranted.
