---
review_id: code-review-240
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - fd299739
  - 4b5e0079
  - f6078c03
  - 350f1292
  - 4341ef07
  - 027982aa
  - f7b522c7
  - b5d5af8e
  - 1a57b6a1
  - c00b1460
  - 4f2eabd6
  - 3971e97b
  - ed906a60
  - ff64a2a7
  - fb01f6a2
files_reviewed:
  - app/utils/evolutionCheck.ts
  - app/server/services/evolution.service.ts
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/server/api/pokemon/[id]/evolution-check.post.ts
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/components/pokemon/EvolutionAbilityStep.vue
  - app/components/pokemon/EvolutionMoveStep.vue
  - app/components/pokemon/EvolutionStatStep.vue
  - app/constants/statusConditions.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/services/combatant.service.ts
  - app/utils/captureRate.ts
  - app/utils/restHealing.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T12:45:00Z
follows_up: code-review-237
---

## Review Scope

Re-review of two work packages after fix cycles:

**1. feature-006 P1 fix cycle (7 commits by slave-1):** Addresses all 6 issues from code-review-237 (C1, H1, H2, M1, M2, M3) and both issues from rules-review-213 (CRITICAL off-by-one in R033 level comparison, MEDIUM ability display index mismatch). 9 files changed, net +136/-95 lines.

**2. refactoring-106 + ptu-rule-128 (8 commits by slave-6):** Implements decree-038 (decouple condition behaviors from categories). Adds `StatusConditionDef` type with per-condition flags, updates 7 consumer files, fixes Sleep persistence through recall and encounter end. 8 files changed, net +341/-57 lines.

Decrees checked:
- decree-035 (nature-adjusted base stats for Base Relations ordering): Not modified by these changes. P0 compliance verified in code-review-231, P1 compliance verified in code-review-237. Still correct.
- decree-036 (stone evolution move learning -- at or below current level): Now correctly implemented with split comparison logic. Verified.
- decree-038 (decouple condition behaviors from categories; Sleep persistence): Fully implemented. Verified.

## Verification of Prior Issues

### code-review-237 Fixes

**C1 (CRITICAL): Level-based evolution move boundary -- FIXED**

File: `app/utils/evolutionCheck.ts`, lines 168-173

The comparison was changed from a single `entry.level > levelCeiling` (equivalent to `<=`) to a split conditional:
```typescript
const meetsLevelCriteria = evolutionMinLevel !== null
  ? entry.level < evolutionMinLevel       // Level-based: strict <
  : entry.level <= currentLevel           // Stone/decree-036: <=
```

This correctly differentiates between level-based evolutions (strict `<` per PTU p.202 "at a Level lower than") and stone evolutions (`<=` per decree-036). The `levelCeiling` variable was removed entirely, eliminating the ambiguity. The JSDoc comments are updated to accurately describe both cases. Verified correct.

**H1 (HIGH): Ability remapping `oldName` tracking -- FIXED**

File: `app/server/services/evolution.service.ts`, line 194 (type), line 238-242 (implementation)

The `AbilityRemapResult.remappedAbilities` type was changed from `Array<{ name: string; effect: string }>` to `Array<{ name: string; effect: string; oldName: string }>`. The `remapAbilities()` function now records `oldName: ability.name` when creating each remapped entry. The `EvolutionAbilityStep.vue` template now uses `ability.oldName` directly instead of the broken `getOldAbilityName(idx)` function, which has been removed. The `currentAbilities` prop was removed from EvolutionAbilityStep, EvolutionConfirmModal, and both callers (Pokemon sheet page and XpDistributionResults).

The `finalAbilities` computed in EvolutionConfirmModal spreads remapped abilities with `{ ...ability }`, which includes `oldName`. The evolve endpoint explicitly picks `name` and `effect` (line 100-103), safely ignoring `oldName`. No data leak. Verified correct.

**H2 (HIGH): Batch `enrichAbilityEffects()` -- FIXED**

File: `app/server/services/evolution.service.ts`, lines 269-288

The sequential loop with N `lookupAbilityEffect()` calls was replaced with a single `prisma.abilityData.findMany({ where: { name: { in: names } } })` batch query, followed by a Map-based lookup. The function handles empty arrays with an early return. The case-insensitive matching on the Map key is correct. No mutation of the input array. Verified correct.

**M1 (MEDIUM): `buildSelectedMoveList` extraction -- FIXED**

File: `app/utils/evolutionCheck.ts`, lines 203-249

The duplicated `selectedMoveList` computed was extracted into a pure function `buildSelectedMoveList()` in the shared utility file. Both `EvolutionConfirmModal.vue` (line 293) and `EvolutionMoveStep.vue` (line 125) now import and call this function with identical parameters. The `MoveDetail` interface was also extracted as `EvolutionMoveDetail` in the shared file, and both components use `type MoveDetail = EvolutionMoveDetail` for local aliases. Clean DRY fix with proper shared type. Verified correct.

**M2 (MEDIUM): `app-surface.md` updated -- FIXED**

File: `.claude/skills/references/app-surface.md`

The surface file now documents:
- evolution-check endpoint P1 additions (ability remap preview, evolution move list with MoveData enrichment, resolution options with effects)
- evolve endpoint P1 additions (abilities array, moves array, capability/skill updates)
- EvolutionConfirmModal updated description (multi-step wizard, 4 steps, delegates to sub-components)
- Evolution utilities updated (getEvolutionMoves with decree-036, buildSelectedMoveList, new types)
- New sub-components listed (EvolutionStatStep, EvolutionAbilityStep, EvolutionMoveStep)
- WebSocket event documented (pokemon_evolved)
- evolution.service.ts updated (remapAbilities, enrichAbilityEffects, full performEvolution signature)

Verified correct.

**M3 (MEDIUM): Ability effect descriptions in resolution dropdown -- FIXED**

Files: `app/components/pokemon/EvolutionAbilityStep.vue` (line 57), `app/server/api/pokemon/[id]/evolution-check.post.ts` (lines 138-157), `app/server/services/evolution.service.ts` (line 199, 249)

The `needsResolution.options` type was changed from `Array<{ name: string }>` to `Array<{ name: string; effect: string }>`. The evolution-check endpoint now enriches resolution options with ability effects via a batch `findMany` query (deduplicated option names across all resolution items). The dropdown template shows `opt.name` followed by a truncated effect: `{{ opt.name }}{{ opt.effect ? ' -- ' + truncateEffect(opt.effect) : '' }}`. The `truncateEffect()` helper caps at 80 characters with ellipsis. Verified correct.

### rules-review-213 Fixes

**CRITICAL: Evolution stat recalculation** -- Same as C1 above. The level comparison fix addresses the rules review's critical finding. Verified correct.

**MEDIUM: decree-036 compliance for stone evolution move learning** -- The stone evolution path (`evolutionMinLevel === null`) correctly uses `entry.level <= currentLevel`, which matches the decree's formula: "newFormMoves WHERE moveLevel <= currentLevel AND NOT IN oldFormLearnset." Verified correct.

### decree-038 Implementation (refactoring-106 + ptu-rule-128)

**StatusConditionDef type and master definitions -- CORRECT**

File: `app/constants/statusConditions.ts` (341 lines)

The `StatusConditionDef` interface introduces three independent boolean flags: `clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint`, plus `category` (for display/grouping only). The `STATUS_CONDITION_DEFS` record maps all 20 status conditions with correct flag values:

- Persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned): `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, `clearsOnFaint: true`. Correct per PTU p.246.
- Volatile conditions (Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed): `clearsOnRecall: true`, `clearsOnEncounterEnd: true`, `clearsOnFaint: true`. Correct per PTU p.247.
- Sleep (Asleep, Bad Sleep): `category: 'volatile'`, `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, `clearsOnFaint: true`. Correctly categorized as volatile per PTU p.247 placement, but with persistence through recall and encounter end per decree-038.
- Other conditions (Fainted, Dead): `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, `clearsOnFaint: false`. Correct.
- Other conditions (Stuck, Slowed, Tripped, Vulnerable): `clearsOnRecall: true`, `clearsOnEncounterEnd: true`, `clearsOnFaint: true`. Correct per PTU p.247.
- Trapped: `clearsOnRecall: false` (prevents recall), `clearsOnEncounterEnd: true`, `clearsOnFaint: true`. Correct per PTU p.247.

Derived arrays (`RECALL_CLEARED_CONDITIONS`, `ENCOUNTER_END_CLEARED_CONDITIONS`, `FAINT_CLEARED_CONDITIONS`) are computed from the per-condition flags, not from category membership. Category-based arrays (`PERSISTENT_CONDITIONS`, `VOLATILE_CONDITIONS`, `OTHER_CONDITIONS`) are preserved for backward compatibility and UI grouping with explicit comments that they are display-only. Verified correct per decree-038.

**Encounter-end cleanup -- CORRECT**

File: `app/server/api/encounters/[id]/end.post.ts`

Now imports `ENCOUNTER_END_CLEARED_CONDITIONS` and uses it in `clearEncounterEndConditions()`. This array is derived from `clearsOnEncounterEnd` flags, so Asleep/Bad Sleep (with `clearsOnEncounterEnd: false`) will survive encounter end. Verified correct.

**Faint cleanup -- CORRECT**

File: `app/server/services/combatant.service.ts`

Now imports `FAINT_CLEARED_CONDITIONS` and uses it in `applyFaintStatus()`. Asleep/Bad Sleep have `clearsOnFaint: true`, so they are correctly cleared on faint. Verified correct per PTU p.248.

**Breather cleanup -- CORRECT**

File: `app/server/api/encounters/[id]/breather.post.ts`

Uses `STATUS_CONDITION_DEFS` to derive volatile conditions for breather cure list, filtered to exclude Cursed (line 28-33). This correctly uses `category === 'volatile'` for the breather mechanic specifically, which is appropriate because Take a Breather's rule text (PTU p.245) explicitly says "cure all Volatile Afflictions." Asleep/Bad Sleep are categorized as volatile, so they ARE cured by breather. This is correct -- decree-038 only changes recall/encounter-end behavior, not breather behavior.

**Capture rate -- CORRECT**

File: `app/utils/captureRate.ts`

Now imports `STATUS_CONDITION_DEFS` and uses `def.category` to determine capture rate modifiers (persistent = +10, volatile = +5). Since capture rate is based on the PTU category description (persistent vs volatile affliction modifiers), using category here is correct. Asleep/Bad Sleep categorized as volatile correctly yields +5. Verified correct.

**Rest healing -- CORRECT**

File: `app/utils/restHealing.ts`

The `getStatusesToClear()` and `clearPersistentStatusConditions()` functions now use `STATUS_CONDITION_DEFS[status].category === 'persistent'` to determine which conditions are cleared by extended rest. PTU Core Ch.9 says extended rest clears persistent conditions. Asleep/Bad Sleep are volatile, so they are NOT cleared by extended rest. This matches PTU rules (Sleep is cured by save checks, damage, items, or Pokemon Center -- not by extended rest). Verified correct.

**Sleep persistence (ptu-rule-128) -- CORRECT**

The combination of `clearsOnRecall: false` and `clearsOnEncounterEnd: false` on Asleep/Bad Sleep means Sleep persists through both recall and encounter end. This matches decree-038 and mainline Pokemon game behavior. Sleep is still cured by: faint (`clearsOnFaint: true`), Take a Breather (volatile category), save checks, damage, items, Pokemon Center. All five cure paths verified.

## What Looks Good

1. **C1 fix is clean and minimal.** The split conditional replaces the ambiguous single-ceiling approach. JSDoc comments are updated. The old `levelCeiling` variable is removed entirely, eliminating any future confusion about which comparison is used.

2. **H1 fix correctly threads `oldName` through the full data flow.** The `remapAbilities()` return type, the service implementation, the UI template, and the prop removal from parent/callers are all consistent. No broken data paths.

3. **H2 batch query is well-implemented.** Empty array guard, case-insensitive map key, single batch query, immutable return. The `lookupAbilityEffect()` function is preserved for any future single-ability lookups.

4. **M1 extraction is a model DRY refactor.** Pure function in shared utils, imported by both consumers, with the shared type (`EvolutionMoveDetail`) co-located. Both components now have identical computed property implementations.

5. **decree-038 architecture is sound.** The `StatusConditionDef` type with independent boolean flags per condition is the right abstraction. Category remains available for display and for mechanics that explicitly reference category (capture rate, breather). Derived arrays for recall/encounter-end/faint are computed from flags, making the system extensible for future conditions without category-behavior coupling.

6. **All files under 800 lines.** Largest: `combatant.service.ts` at 686 lines. No file size concerns.

7. **Immutability maintained.** All functions return new arrays/objects. The one contained mutation in `evolution-check.post.ts` (reassigning `nr.options` on the freshly-created `abilityRemap` object) is scoped to the request handler and does not affect shared state.

8. **Commit granularity is correct.** Each fix is its own commit. decree-038 implementation is broken into 8 logical commits: type addition, then per-consumer refactoring, then the Sleep persistence fix, then ticket updates.

## Verdict

**APPROVED**

All 6 issues from code-review-237 are correctly fixed. Both issues from rules-review-213 are resolved. The C1 CRITICAL (off-by-one in evolution move level filter) is fixed with the correct split comparison. The decree-038 implementation is architecturally sound with correct per-condition behavior flags and proper consumer updates across all 7 files.

No new issues found. The feature-006 P1 evolution system and the decree-038 condition behavior decoupling are both ready to proceed.

## Required Changes

None.
