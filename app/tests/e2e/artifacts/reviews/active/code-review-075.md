---
review_id: code-review-075
ticket_ids:
  - ptu-rule-042
  - ptu-rule-043
  - ptu-rule-047
commits_reviewed:
  - 158fc05
  - bae0a39
  - 8653044
  - b412f9d
  - 16de443
  - 43653a1
  - bc8f9e8
  - 9425386
  - efff652
  - 9dd73e2
verdict: REVISE
date: 2026-02-20
reviewer: senior-reviewer
---

# Code Review 075 — PTU Rule Tickets 042, 043, 047

## Scope

10 commits implementing 3 P2 ptu-rule tickets plus 3 bonus P3 bug tickets (bug-020, bug-021, bug-022) that were addressed in the same batch. Total: +999 / -29 lines across 29 files.

## Status Table

| Ticket | Description | Plan | Actual | Status |
|--------|-------------|------|--------|--------|
| ptu-rule-042 | 7 derived trainer stats from skills | Pure utility + 2 display locations | Pure utility + 2 display locations | DONE |
| ptu-rule-043 | 7 level-up automation items | Level-up checker + API + panel | 5 of 7 items implemented, 2 deferred | PARTIAL (acceptable) |
| ptu-rule-047 | Condition clearing on faint/encounter-end | Fix faint handler + add encounter-end clearing | Both fixed | DONE (with bug) |
| bug-020 | Missing Disarm/Dirty Trick maneuvers | Add to constants + wire actions | Done | DONE |
| bug-021 | Capture doesn't consume standard action | Add encounter context to capture | Done | DONE |
| bug-022 | No scene-end AP restoration | Add currentAp field + scene lifecycle hooks | Done | DONE |

## Issues

### CRITICAL

**C1. Fainted condition duplicated on re-faint or double-damage**
`app/server/services/combatant.service.ts:156-161`

`Fainted` is categorized as an `OTHER_CONDITIONS` entry in `statusConditions.ts`, so it survives the Persistent+Volatile filter. But then the code unconditionally prepends `'Fainted'` to the surviving list. If a Fainted entity takes additional damage (which is possible -- PTU allows attacking fainted targets in some edge cases), or if the faint handler fires on an already-fainted entity, the result is `['Fainted', 'Fainted', 'Stuck']`.

```typescript
// Current (buggy):
if (damageResult.fainted) {
  const conditionsToClear = [...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS] as StatusCondition[]
  const survivingConditions = (entity.statusConditions || []).filter(
    (s: StatusCondition) => !conditionsToClear.includes(s)
  )
  entity.statusConditions = ['Fainted', ...survivingConditions]
}
```

```typescript
// Fix: also filter out existing 'Fainted' before prepending
if (damageResult.fainted) {
  const conditionsToClear = [...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS] as StatusCondition[]
  const survivingConditions = (entity.statusConditions || []).filter(
    (s: StatusCondition) => !conditionsToClear.includes(s) && s !== 'Fainted'
  )
  entity.statusConditions = ['Fainted', ...survivingConditions]
}
```

### HIGH

**H1. N+1 query pattern in global new-day endpoint**
`app/server/api/game/new-day.post.ts:19-35`

The previous code used a single `updateMany`. The new code fetches all characters then loops individual updates because `maxAp` depends on level. For a small number of characters this is fine, but the pattern is fragile. If the character count grows, this becomes an N+1.

Consider grouping characters by level and using `updateMany` with `where: { level }` for each group, or using a raw SQL `UPDATE ... SET currentAp = 5 + level / 5` to achieve it in one query. Not blocking since the expected character count in a TTRPG session is <20, but worth a ticket.

**H2. N+1 query pattern in scene activation AP restoration**
`app/server/api/scenes/[id]/activate.post.ts:22-42`

Same pattern: iterates active scenes, then for each scene, fetches characters and loops individual updates. Nested loops with individual DB writes.

Same mitigation strategy applies: group by level or use raw SQL. Same practical assessment: low character count makes this non-blocking.

**H3. Silent error swallowing in capture action consumption**
`app/composables/useCapture.ts:246-253`

When the standard action consumption fails (e.g., network error, encounter already ended), the error is caught and logged with `console.error` but the capture still reports success. The GM would not know the action was not consumed, leading to incorrect turn tracking.

```typescript
// Current:
} catch (actionError: any) {
  console.error('Failed to consume standard action for capture:', actionError)
}
```

This should either: (a) surface a warning to the user via a toast/notification, or (b) throw to fail the overall capture. Option (a) is preferred since the capture itself succeeded in the database.

Also, `console.error` should not be in client composables per project coding standards. Replace with proper error handling.

**H4. Pokemon page is 1384 lines (over 800-line limit)**
`app/pages/gm/pokemon/[id].vue`

This file was already 1242 lines before these changes (pre-existing violation), and these changes added 142 more lines. The level-up panel template + watcher + SCSS adds to an already oversized file. Not caused by this PR, but this PR makes it worse. File a ticket to extract the level-up panel into a component (`components/pokemon/LevelUpPanel.vue`).

### MEDIUM

**M1. Duplicated CSS across two capability display locations**
`app/pages/gm/characters/[id].vue:702-745` and `app/components/character/tabs/HumanStatsTab.vue:200-245`

The `.capabilities-section`, `.section-label`, `.capabilities-grid`, `.capability-block`, and `.capability-value` styles are copy-pasted identically between both files (with one minor difference: `$color-bg-secondary` vs `$color-bg-tertiary` background). Extract into a shared SCSS partial or create a small `TrainerCapabilities.vue` component that both locations use.

**M2. Duplicated template for capabilities display**
`app/pages/gm/characters/[id].vue:148-182` and `app/components/character/tabs/HumanStatsTab.vue:66-102`

Same 35-line template block duplicated. Same fix: extract into a `TrainerCapabilities.vue` component.

**M3. `levelUpLoading` ref is set but never consumed in the template**
`app/pages/gm/pokemon/[id].vue:494`

The `levelUpLoading` ref is toggled in the watcher but no template element displays a loading state. Either add a loading indicator or remove the ref.

**M4. Level-up watcher does not debounce rapid level changes**
`app/pages/gm/pokemon/[id].vue:499-516`

If the GM types a level quickly (e.g., 5 -> 50 by typing "5" then "0"), the watcher fires twice, triggering two API calls. The first (level 5) is wasted. Add a debounce (200-300ms) or use `watchDebounced` from VueUse.

**M5. Missing `targetLevel` integer validation on client side**
`app/pages/gm/pokemon/[id].vue:499-516`

The watcher passes `editData.value.level` directly to the API. If the input has a decimal (e.g., 5.5), the API would reject it, but the client doesn't guard against it. Add `Math.floor()` or `parseInt()` to the level before sending.

## What Looks Good

1. **Pure utility pattern** for both `trainerDerivedStats.ts` and `levelUpCheck.ts` is textbook -- pure functions, typed inputs/outputs, no side effects. Well-documented with PTU page references. Easy to unit test.

2. **Corrected formulas over ticket formulas.** The developer caught that the ticket's original formulas were wrong (e.g., Power is threshold-based, not rank-addition) and verified against the actual PTU Core worked example. This is exactly the right approach.

3. **Faint condition fix is surgically correct** (modulo the duplication bug). Using the established `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS` constants is the right approach, and the filter-then-prepend pattern preserves Other conditions correctly.

4. **Encounter-end volatile clearing** is clean: new `clearVolatileConditions` helper returns a new array (immutable), only syncs entities that actually changed, and correctly preserves Fainted/Persistent/Other conditions.

5. **Level-up API design** is sound: server-side learnset lookup avoids shipping species data to the client. The `checkLevelUp` / `summarizeLevelUps` split allows both per-level detail and combined summary.

6. **Bug-022 AP system** is thorough: `currentAp` field added to schema, serializers, combatant service, character PUT, extended rest, new day (individual + global), heal-injury drain, and both scene lifecycle hooks. Good coverage of all code paths.

7. **Deferred items are explicitly documented** in ptu-rule-043 with clear reasoning (evolution data model not available, wizard requires stat allocation UI). The "evolution check reminder" in the panel is a pragmatic stopgap.

## Recommended Next Steps

1. **Fix C1** -- add `&& s !== 'Fainted'` to the surviving conditions filter in `applyDamageToEntity`. One-line fix.
2. **File ticket** for H4 (extract level-up panel from Pokemon page) and M1/M2 (extract TrainerCapabilities component).
3. **Address H3** -- replace `console.error` with user-facing notification for failed action consumption.
4. **Address M3/M4** -- add debounce and remove or use the loading ref.
5. Run the existing faint-replacement e2e test (`combat-workflow-faint-replacement-001.spec.ts`) to verify C1 fix does not regress existing behavior.
