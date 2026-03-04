---
review_id: code-review-235
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-008
domain: trainer-lifecycle
commits_reviewed:
  - 5fe64bc
  - 28c0bcd
  - c668d16
  - 6070eaf
  - 99b106b
  - 55c01d1
  - 087ea29
  - 83fd0aa
  - 576634c
  - 0714016
  - 3f7350a
  - 85c2851
files_reviewed:
  - app/utils/trainerAdvancement.ts
  - app/composables/useTrainerLevelUp.ts
  - app/components/levelup/LevelUpModal.vue
  - app/components/levelup/LevelUpStatSection.vue
  - app/components/levelup/LevelUpSkillSection.vue
  - app/components/levelup/LevelUpSummary.vue
  - app/constants/trainerStats.ts
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/components/create/StatAllocationSection.vue
  - .claude/skills/references/app-surface.md
  - artifacts/designs/design-trainer-level-up-001/spec-p0.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T06:30:00Z
follows_up: code-review-230
---

## Review Scope

Re-review of feature-008 P0 (Trainer Level-Up Milestone Workflow) fix cycle. 12 commits by slave-3 addressing all issues from code-review-230 (C1, H1, H2, M1, M2, M3) and rules-review-206 (HIGH-01) plus decree-037 compliance. This review verifies that every prior issue is resolved and no regressions were introduced.

### Decree Compliance

- **decree-022 (branch class suffix):** P1 scope. P0 does not touch class names. No conflict.
- **decree-026 (Martial Artist not branching):** P1 scope. P0 does not reference Martial Artist. No conflict.
- **decree-027 (Pathetic block creation-only):** P0 correctly does not restrict Pathetic skills during level-up. The `LevelUpSkillSection.vue` (retained for P1) allows Pathetic-to-Untrained via `canRankUpSkill`. Per decree-027, the block applies only during character creation. **Compliant.**
- **decree-037 (skill ranks via edges only):** The `skillRanksGained` field has been completely removed from `TrainerLevelUpInfo`. The `totalSkillRanks` field has been removed from `TrainerAdvancementSummary`. All skill-related state (choices, ranks remaining, rank-up functions) has been removed from `useTrainerLevelUp.ts`. The 'skills' step has been removed from the `LevelUpModal.vue` wizard steps. The `LevelUpSummary.vue` no longer renders skill changes. The spec-p0.md Section E has been updated to document the deferral to P1. The `LevelUpSkillSection.vue` file is retained (not rendered) for reuse when P1 Edge selection integrates skill rank allocation as a sub-step. Grep for `skillRanksGained` across the entire `app/` directory returns zero matches. **Fully compliant.**

---

## Issue Resolution Verification

### C-01 (CRITICAL): Double modal open from watcher re-trigger -- RESOLVED

**Fix commit:** `5fe64bc`

**Verification:** Both `CharacterModal.vue` (lines 344, 348, 360-367) and `gm/characters/[id].vue` (lines 330, 334, 347-354) now implement the `isApplyingLevelUp` guard pattern:

1. `isApplyingLevelUp` ref initialized to `false`
2. Level watcher checks `if (isApplyingLevelUp.value) return` as the first guard
3. `onLevelUpComplete` sets `isApplyingLevelUp.value = true` before applying data
4. After `await nextTick()`, the guard is released: `isApplyingLevelUp.value = false`

The sequence is correct: the flag is set synchronously before the reactive data update, the data update triggers the watcher which bails out on the guard, and the flag is cleared after `nextTick()` ensures Vue has flushed the watcher. The `async` + `await nextTick()` pattern is the correct Vue 3 approach for this.

Both integration points use identical patterns. **Verified fixed in both files.**

### H-01 (HIGH): Evasion preview missing +6 cap -- RESOLVED

**Fix commit:** `28c0bcd`

**Verification:** `LevelUpStatSection.vue` lines 111-113:

```typescript
physical: Math.min(Math.floor(def / 5), 6),
special: Math.min(Math.floor(spDef / 5), 6),
speed: Math.min(Math.floor(spd / 5), 6)
```

All three evasion calculations now include `Math.min(..., 6)`. The comment on line 105 explicitly cites "capped at +6 per PTU Core p.15". **Verified fixed.**

### H-02 (HIGH): currentHp not healed to new max when at full HP -- RESOLVED

**Fix commit:** `c668d16`

**Verification:** `useTrainerLevelUp.ts` lines 153-156:

```typescript
const wasAtFullHp = character.value.currentHp >= (character.value.maxHp ?? 0)
const newCurrentHp = wasAtFullHp
  ? newMaxHp
  : Math.min(character.value.currentHp, newMaxHp)
```

The logic correctly detects "was at full HP" before calculating the new value. If the trainer was at full health, `currentHp` is set to the new `maxHp`. If the trainer was damaged, `currentHp` is clamped to the new max (preventing overflow but not artificially healing). The `>= 0` fallback on `maxHp` handles the null edge case correctly -- if `maxHp` was null (shouldn't happen but defensive), `currentHp >= 0` would be true, defaulting to full heal which is the safer behavior. **Verified fixed.**

### M-01 (MEDIUM): RANK_PROGRESSION duplicated in 3 files -- RESOLVED

**Fix commit:** `576634c`

**Verification:** `RANK_PROGRESSION` is now exported from `app/constants/trainerStats.ts` (line 39). Grep confirms it is imported in `LevelUpSkillSection.vue` (line 82) -- the only remaining consumer in the level-up domain. The `useTrainerLevelUp.ts` composable no longer contains any skill rank logic (removed per decree-037), so it no longer needs the constant. `LevelUpSummary.vue` no longer renders skill changes, so it no longer needs the constant. The original three-file duplication is eliminated.

Note: `useCharacterCreation.ts` (lines 289, 321) still has inline `['Pathetic', 'Untrained', ...]` arrays. This is a pre-existing duplication not in scope for this fix cycle (character creation is a separate domain). Not blocking.

### M-02 (MEDIUM): statDefinitions duplicated in 2+ files -- RESOLVED

**Fix commit:** `576634c`

**Verification:** `STAT_DEFINITIONS` is now exported from `app/constants/trainerStats.ts` (lines 26-33). Grep confirms it is imported by:
- `LevelUpStatSection.vue` (line 77): `import { STAT_DEFINITIONS } from '~/constants/trainerStats'`
- `LevelUpSummary.vue` (line 72): `import { STAT_DEFINITIONS } from '~/constants/trainerStats'`
- `StatAllocationSection.vue` (line 80): `import { ..., STAT_DEFINITIONS } from '~/constants/trainerStats'`

All three consumers now share the single source of truth. The constant uses `as const` for type safety on the `key` field. **Verified fixed.**

### M-03 (MEDIUM): app-surface.md not updated -- RESOLVED

**Fix commit:** `0714016`

**Verification:** `app-surface.md` line 88 now contains a comprehensive entry for the trainer level-up system, covering:
- `utils/trainerAdvancement.ts` with key function names
- `composables/useTrainerLevelUp.ts` with role description
- All 4 `components/levelup/` files with descriptions
- `LevelUpSkillSection.vue` explicitly noted as "disabled per decree-037, retained for P1"
- Integration patterns: level watcher in both views, `isApplyingLevelUp` guard

The entry is thorough and matches the actual implementation. **Verified fixed.**

### rules-review-206 HIGH-01: Automatic skill rank per level -- RESOLVED via decree-037

**Fix commits:** `6070eaf`, `99b106b`, `55c01d1`, `087ea29`, `83fd0aa`

**Verification:**
1. `trainerAdvancement.ts`: No `skillRanksGained` field in `TrainerLevelUpInfo` interface. No `totalSkillRanks` in `TrainerAdvancementSummary`. The doc comment at lines 25-26 explicitly cites decree-037. The `computeTrainerLevelUp` return value contains only: `statPointsGained`, `edgesGained`, `featuresGained`, `bonusSkillEdge`, `skillRankCapUnlocked`, `milestone`, `classChoicePrompt`.
2. `useTrainerLevelUp.ts`: No skill-related state, computed, or actions. Doc comment at lines 12-14 cites decree-037.
3. `LevelUpModal.vue`: Steps array is `['stats', 'summary']`. No 'skills' step. Template does not reference `LevelUpSkillSection`. Comment at line 129 notes P1 will add edges step "which includes Skill Edge rank allocation per decree-037".
4. `LevelUpSummary.vue`: Does not render skill changes. P1 indicators include "bonus Skill Edge(s) to select -- grants skill ranks (P1)" which correctly frames skill ranks as part of Edge selection.
5. `spec-p0.md` Section E: Updated to document the deferral with full decree-037 citation.
6. Codebase grep for `skillRanksGained` in `app/`: Zero matches.

**Fully resolved.**

---

## Additional Checks

### Constants File Quality (`constants/trainerStats.ts`)

The new file at 120 lines is well-structured. It exports:
- `STAT_DEFINITIONS` (shared stat key-to-label mapping)
- `RANK_PROGRESSION` (exported for UI, typed as `readonly string[]`)
- `SKILL_RANK_ORDER` (private, typed as `readonly SkillRankName[]` for cap enforcement)
- Existing functions: `getStatPointsForLevel`, `getMaxSkillRankForLevel`, `isSkillRankAboveCap`, `getExpectedEdgesForLevel`, `getExpectedFeaturesForLevel`

The `RANK_PROGRESSION` and `SKILL_RANK_ORDER` contain identical values but serve different roles (UI display vs. typed internal logic). They are co-located in the same file so drift is unlikely, and they have different type signatures appropriate to their use cases.

### Guard Pattern Robustness

The `isApplyingLevelUp` guard in both integration points uses `async function onLevelUpComplete` with `await nextTick()` before clearing the flag. This is the recommended Vue 3 pattern:
- `isApplyingLevelUp = true` -- synchronous, set before reactive update
- Reactive data update -- triggers watcher synchronously (Vue `watch()` with default flush)
- Watcher fires, sees guard, returns immediately
- `await nextTick()` -- ensures Vue has finished its reactive flush
- `isApplyingLevelUp = false` -- guard released

This is robust against Vue's watcher scheduling. No timing issues identified.

### Immutability

All data updates use spread patterns:
- `editData.value = { ...editData.value, ...updatedData }` (both integration points)
- `editData.value = { ...editData.value, level: oldVal }` (watcher revert)
- `buildUpdatePayload` returns a new object

No mutations detected.

### File Sizes

| File | Lines |
|------|-------|
| `trainerAdvancement.ts` | 356 |
| `useTrainerLevelUp.ts` | 192 |
| `LevelUpModal.vue` | 342 |
| `LevelUpStatSection.vue` | 301 |
| `LevelUpSkillSection.vue` | 382 |
| `LevelUpSummary.vue` | 239 |
| `trainerStats.ts` | 120 |
| `CharacterModal.vue` | 580 |
| `gm/characters/[id].vue` | 765 |

All under the 800-line limit.

### Commit Granularity

12 commits with appropriate separation:
1. Bug fixes first (C1, H1, H2) -- 3 commits, each fixing one issue
2. Decree-037 compliance -- 4 commits progressively removing skill rank functionality from utility, composable, modal, and summary
3. Documentation -- spec update, constants extraction, app-surface update, import reorder, ticket update

Each commit produces a buildable state. The only observation is that commit `3f7350a` ("move STAT_DEFINITIONS import to top of script block") is a trivial import ordering fix that could have been caught in the constants extraction commit (`576634c`). This is cosmetic and not blocking.

---

## What Looks Good

1. **Thorough decree-037 removal.** The skill rank system was cleanly excised from P0 without leaving orphan code. The file `LevelUpSkillSection.vue` is intentionally retained for P1 reuse, properly documented in app-surface.md and the spec. No dangling references in types, composable returns, or templates.

2. **C1 guard pattern is correct.** The `isApplyingLevelUp` + `await nextTick()` pattern is the proper Vue 3 approach. It prevents the exact race condition described in the original review. Implemented identically in both integration points.

3. **H2 full-HP detection is intuitive.** The `wasAtFullHp` check at the composable level (not the component level) ensures consistent behavior regardless of which UI triggers the level-up. The `>= 0` null fallback is defensive but safe.

4. **Constants extraction is clean.** `STAT_DEFINITIONS` and `RANK_PROGRESSION` are now single-source-of-truth. All three consumer files import from `constants/trainerStats.ts`. The `StatAllocationSection.vue` (character creation) was also updated to use the shared constant, reducing cross-domain duplication.

5. **App-surface entry is comprehensive.** The new trainer level-up entry covers all files, key functions, and integration patterns including the guard mechanism. Future skills and reviewers will have full context.

6. **P1 forward-compatibility preserved.** The modal's commented-out steps, the summary's P1 indicators, and the retained `LevelUpSkillSection.vue` all remain ready for P1 Edge/Feature/Class selection. The P1 comment in `LevelUpModal.vue` line 129 correctly notes that skill rank allocation will be a sub-step of Edge selection per decree-037.

---

## Verdict

**APPROVED**

All six issues from code-review-230 (C1, H1, H2, M1, M2, M3) are verified resolved. The rules-review-206 HIGH-01 issue is fully resolved via decree-037 compliance. No new issues found. The implementation is clean, well-documented, and correctly guards against the identified race conditions and rules accuracy bugs.

---

## Required Changes

None. All prior issues resolved. Feature-008 P0 is approved for merge.
