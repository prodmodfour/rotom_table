---
review_id: code-review-191
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-098+084+085+110+111+109
domain: combat
commits_reviewed:
  - 0ef3152
  - 4118ccf
  - d8c64ab
  - 6357e0f
  - dff8a31
  - 545b708
files_reviewed:
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/combatant.service.ts
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/constants/legendarySpecies.ts
  - app/constants/statusConditions.ts
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/services/entity-update.service.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-27T12:00:00Z
follows_up: code-review-184
---

## Review Scope

Re-review of fix cycle addressing code-review-184 (1 HIGH, 2 MEDIUM) and rules-review-161 (1 HIGH, 3 MEDIUM). Six code commits on master covering:

- **code-review-184 H1** (faint stageModifiers DB sync) -> commit 0ef3152
- **code-review-184 M1** (ZERO_EVASION_CONDITIONS unused) -> commit 4118ccf
- **code-review-184 M2** (breather log phrasing) -> not addressed (was marked optional)
- **rules-review-161 HIGH-1** (double-CS on re-entry) -> commit 6357e0f
- **rules-review-161 M1** (incomplete legendary list) -> commit 545b708
- **rules-review-161 M2** (encounter end no stage reset) -> commit d8c64ab
- **rules-review-161 M3** (tempConditions Vulnerable) -> commit dff8a31

All 15 source files read in full. All 6 commit diffs verified.

## Prior Issues Resolution

### code-review-184 H1: RESOLVED

**Faint path does not sync stageModifiers to entity DB record.**

Fix (commit 0ef3152): Both `damage.post.ts` and `move.post.ts` now call `syncStagesToDatabase(combatant, entity.stageModifiers)` after `syncDamageToDatabase()` when `damageResult.fainted` is true.

Verification:
- `damage.post.ts:53-58`: Conditional sync guarded by `damageResult.fainted && entity.stageModifiers`. Correct -- only syncs when fainted and stageModifiers exist.
- `move.post.ts:94-98`: Same pattern inside the target loop, pushed to `dbUpdates` array for parallel execution via `Promise.all`. Correct -- the sync is queued alongside the damage sync.
- `syncStagesToDatabase` in `entity-update.service.ts:134-141` delegates to `syncEntityToDatabase` with just `{ stageModifiers }`. Clean, minimal write.
- Both endpoints import `syncStagesToDatabase` from `entity-update.service`. Import verified in diffs.

The DB sync order is correct: `syncDamageToDatabase` writes HP/tempHp/injuries/statusConditions, then `syncStagesToDatabase` writes stageModifiers. Even if run in parallel (as in `move.post.ts` via `dbUpdates`), there is no conflict since they write disjoint columns. In `damage.post.ts`, the `syncStagesToDatabase` call is `await`ed sequentially after `syncDamageToDatabase`, which is also safe.

### code-review-184 M1: RESOLVED

**ZERO_EVASION_CONDITIONS constant defined but unused.**

Fix (commit 4118ccf): Both `useMoveCalculation.ts` and `calculate-damage.post.ts` now import `ZERO_EVASION_CONDITIONS` from `~/constants/statusConditions` and use `.includes(c)` / `(ZERO_EVASION_CONDITIONS as readonly string[]).includes(c)` instead of inline `c === 'Vulnerable' || c === 'Frozen' || c === 'Asleep'`.

Verification:
- `useMoveCalculation.ts:2`: Import `ZERO_EVASION_CONDITIONS` added. Line 352: `ZERO_EVASION_CONDITIONS.includes(c)` replaces triple `===` comparison.
- `calculate-damage.post.ts:10`: Import added. Line 229: `(ZERO_EVASION_CONDITIONS as readonly string[]).includes(c)` replaces inline check.
- The `as readonly string[]` cast on the server side is necessary because `targetConditions` is typed as `string[]`, and `ZERO_EVASION_CONDITIONS` is `StatusCondition[]`. The cast is safe since `StatusCondition` is a string literal union.

### code-review-184 M2: NOT ADDRESSED (acceptable)

**Breather log phrasing ambiguity.** This was explicitly marked "Optional -- improve the phrasing" in code-review-184 and described as "Low priority." The developer chose not to address it. The data is correct; only the GM-facing log text could be clearer. Acceptable.

### rules-review-161 HIGH-1: RESOLVED

**Double-application of status CS effects on combat re-entry.**

Fix (commit 6357e0f): `buildCombatantFromEntity` now always resets `stageModifiers` to `createDefaultStageModifiers()` (all zeros) before calling `reapplyActiveStatusCsEffects`. Equipment speed default CS (Heavy Armor) is applied on top via spread.

Verification:
- Lines 715-726: `combatStages` starts as `createDefaultStageModifiers()` (all zeros), then conditionally spreads `{ speed: equipmentSpeedDefaultCS }` if non-zero. This is then assigned via `stageModifiers: combatStages` in the spread copy of `entity`.
- The spread creates a new object (`{ ...entity, stageModifiers: combatStages }`), avoiding mutation of the input entity. Immutability maintained.
- Line 758: `reapplyActiveStatusCsEffects(combatant)` runs on the combatant with clean stages. No double-application possible regardless of what the DB contained.
- Combined with the encounter-end reset (commit d8c64ab), this is defense-in-depth: both ingress (buildCombatantFromEntity) and egress (end.post.ts) now reset stages.

### rules-review-161 M1: RESOLVED

**Legendary species list incomplete.**

Fix (commit 545b708): Added Meltan, Melmetal (Gen 8 section), Zarude (Gen 8 section), and Enamorus (new Hisui section) to `LEGENDARY_SPECIES` in `legendarySpecies.ts`.

Verification:
- Lines 107-108: Meltan, Melmetal added in Gen 8 section (before Zacian).
- Line 114: Zarude added in Gen 8 section (after Urshifu).
- Lines 121-122: Enamorus added in new "Hisui" section comment.
- All four names match Title Case format consistent with SpeciesData naming.
- Total species count: 100 (was 96). Verified by counting Set entries.

### rules-review-161 M2: RESOLVED

**Encounter end does not reset combat stages.**

Fix (commit d8c64ab): `end.post.ts` now resets all combatants' `stageModifiers` to `createDefaultStageModifiers()` and clears `stageSources: []`.

Verification:
- Line 58: `const defaultStages = createDefaultStageModifiers()` created once.
- Lines 71-83: Both Pokemon and Human branches spread `stageModifiers: { ...defaultStages }` into the updated entity. Spread creates independent copies per combatant.
- Lines 86-87: `stageSources: []` cleared on the combatant wrapper.
- Lines 109-112: DB sync includes `stageModifiers: { ...defaultStages }` for every entity with an `entityId`. This ensures the DB row is clean even if the combatants JSON isn't consulted later.
- The previous optimization (only syncing if conditions changed) was correctly removed -- now all entities are synced unconditionally, which is necessary because stage modifiers always need resetting.

### rules-review-161 M3: RESOLVED

**Zero-evasion check misses tempConditions-based Vulnerable.**

Fix (commit dff8a31): Both client and server evasion checks now inspect `combatant.tempConditions` alongside `entity.statusConditions`.

Verification:
- `useMoveCalculation.ts:351-355`: The `hasZeroEvasionCondition` check chains `entity.statusConditions?.some(...)` with `|| target.tempConditions?.some(...)`. Optional chaining handles undefined tempConditions gracefully.
- `calculate-damage.post.ts:227-232`: Same pattern using `targetTempConditions: string[]` extracted from `target.tempConditions ?? []`. The `?? []` fallback handles undefined.
- Both use `(ZERO_EVASION_CONDITIONS as readonly string[]).includes(c)` for the tempConditions check since `tempConditions` is `string[]` not `StatusCondition[]`. Type cast is safe.

## Issues

### MEDIUM

#### M1: useMoveCalculation.ts exceeds 800-line limit (801 lines)

**File:** `app/composables/useMoveCalculation.ts` (801 lines)

The file was 796 lines before this fix cycle. The two commits (4118ccf: +1 import line, dff8a31: +4 lines for tempConditions check) pushed it to 801 -- one line over the 800-line maximum.

This is not a structural problem introduced by the fix cycle -- the file was already at 99.5% of the limit. The added code (import + tempConditions check) is minimal, correct, and necessary. However, the 800-line limit exists to flag files that should be refactored.

**Fix:** Remove one blank line or consolidate comments to bring it back to 800. Alternatively, extract the `computeTargetEvasions` helper (lines 341-410, ~70 lines) into a separate utility function to reduce this file's size more meaningfully. This is not blocking -- the 1-line overage is trivial -- but should be tracked for the next refactoring pass.

## What Looks Good

**Fix quality:** All six commits are well-scoped, each addressing exactly one issue from the prior reviews. Commit messages are descriptive, reference the specific review issue being fixed, and cite PTU page references and decree numbers. This is excellent commit hygiene.

**Defense-in-depth pattern:** The double-CS-application bug is addressed at two points: encounter exit (d8c64ab) AND combat entry (6357e0f). Either fix alone would prevent the bug, but having both ensures resilience against edge cases where one path is bypassed.

**Immutability:** All fix commits maintain immutability patterns:
- `end.post.ts`: uses spread operators to create new entity objects per combatant.
- `combatant.service.ts`: creates a new `combatStages` object and spreads into a new entity copy.
- `useMoveCalculation.ts` and `calculate-damage.post.ts`: read-only checks with no mutations.
- `damage.post.ts` and `move.post.ts`: call `syncStagesToDatabase` without mutating any in-memory state.

**Consistent dual-path coverage:** Both client (useMoveCalculation) and server (calculate-damage.post) evasion checks were updated in lockstep for both the constant refactor (4118ccf) and the tempConditions extension (dff8a31). No code path can bypass the zero-evasion check.

**DB sync completeness:** The fix cycle ensures stageModifiers are synced to the DB in all relevant scenarios:
- On faint: `syncStagesToDatabase` in damage.post.ts and move.post.ts (0ef3152)
- On encounter end: `syncEntityToDatabase` with stageModifiers in end.post.ts (d8c64ab)
- On status change: already handled in status.post.ts (pre-existing)
- On breather: already handled in breather.post.ts (pre-existing)

**Type safety:** The `as readonly string[]` casts for tempConditions checks are minimal and correct, bridging the `string[]` tempConditions type with the `StatusCondition[]` constant type.

## Verdict

**APPROVED**

All prior review issues (code-review-184 H1/M1, rules-review-161 HIGH-1/M1/M2/M3) are properly resolved. The fixes are correct, well-scoped, and maintain project coding standards. The one new MEDIUM issue (useMoveCalculation.ts at 801 lines) is a 1-line overage from a pre-existing near-limit file and does not block approval. It should be addressed in the next refactoring pass of this composable.

## Required Changes

None. Approved for merge.
