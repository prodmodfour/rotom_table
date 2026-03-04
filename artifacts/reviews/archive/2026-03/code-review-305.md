---
review_id: code-review-305
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-004
domain: combat
commits_reviewed:
  - 5e78402b
  - e2576c85
  - 7994902b
  - bd519560
  - f1f8ba38
  - 0e68ce08
files_reviewed:
  - app/components/vtt/VTTToken.vue
  - app/utils/movementModifiers.ts
  - app/composables/useGridMovement.ts
  - app/server/services/mounting.service.ts
  - app/server/utils/turn-helpers.ts
  - app/components/encounter/MountControls.vue
  - app/server/api/encounters/[id]/damage.post.ts
  - app/components/encounter/GroupCombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/utils/mountingRules.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T18:15:00Z
follows_up: code-review-296
---

## Review Scope

Re-review of the feature-004 P1 fix cycle (6 commits) addressing all 5 issues from code-review-296 (CHANGES_REQUIRED, 0C+2H+3M). Each fix was verified by reading the full source files, not just the diffs.

Decree compliance checked: decree-003 (passable tokens), decree-004 (real HP after temp HP for dismount threshold), decree-040 (flanking after evasion cap -- not applicable to this fix cycle).

## Issue Resolution Verification

### HIGH-1: VTTToken mount badge and elevation badge overlap -- RESOLVED

**Commit:** 5e78402b
**File:** `app/components/vtt/VTTToken.vue`, line 421

The mount badge CSS was changed from `right: 2px` to `right: 18px`, placing it to the left of the elevation badge. Both badges remain at `top: 2px`. The elevation badge is at `right: 2px` with `padding: 1px 4px` and `font-size: 8px`, which occupies roughly 14-16px of width. The mount badge at `right: 18px` provides adequate clearance.

Verified: the `.vtt-token__elevation-badge` (line 406) and `.vtt-token__mount-badge` (line 418) are now at non-overlapping positions. Both conditions (`elevation > 0` and `isMountedMount`) can be true simultaneously without visual collision.

### HIGH-2: Movement modifiers double-applied to mounted combatants -- RESOLVED

**Commit:** e2576c85
**Files:** `app/utils/movementModifiers.ts` (NEW), `app/composables/useGridMovement.ts`, `app/server/services/mounting.service.ts`, `app/server/utils/turn-helpers.ts`

The fix correctly applies the "apply once at budget creation" strategy (option (a) from code-review-296):

1. **New shared utility:** `app/utils/movementModifiers.ts` contains the canonical `applyMovementModifiers()` function, extracted verbatim from `useGridMovement.ts`. The function is a pure, deterministic calculation with correct PTU rule implementation (Stuck=0, Tripped=0, Slowed=half, Speed CS=additive, Sprint=+50%, min floor).

2. **Budget creation sites updated (3 sites):**
   - `mounting.service.ts:161` -- `executeMount()` now computes `applyMovementModifiers(mount, getOverlandSpeed(mount))` when setting initial `movementRemaining`.
   - `mounting.service.ts:346,359` -- `resetMountMovement()` applies modifiers when resetting at round start. Both mount and rider paths compute `applyMovementModifiers(mountPartner, getOverlandSpeed(mountPartner))`.
   - `turn-helpers.ts:115,121` -- `resetCombatantsForNewRound()` inline mount reset applies modifiers identically to `resetMountMovement()`.

3. **Consumer sites simplified (2 sites):**
   - `useGridMovement.ts:139-141` -- `getMaxPossibleSpeed()` returns `combatant.mountState.movementRemaining` directly, no modifier re-application.
   - `useGridMovement.ts:197-198` -- `getSpeed()` returns `combatant.mountState.movementRemaining` directly, no modifier re-application.

4. **Re-export for backward compatibility:** `useGridMovement.ts` line 93 re-exports `applyMovementModifiers` from `~/utils/movementModifiers` so existing non-mounted consumers that import from the composable are unaffected.

The exponential speed loss bug is fully resolved: modifiers are applied once when the budget is set, and the budget decrements linearly as the mount moves.

**Note on code duplication:** `turn-helpers.ts:112-125` duplicates the mount movement reset logic from `mounting.service.ts:340-371` (`resetMountMovement()`) inline rather than calling the exported function. The `resetMountMovement` docstring says "Called by resetCombatantsForNewRound" but this is not the case -- the logic is inlined. This is a pre-existing structural concern (the duplication existed before the fix cycle -- the fix cycle simply updated both copies consistently). Both copies now correctly apply `applyMovementModifiers`. Per Developer L2 lesson ("identify and update all code paths that perform the same operation"), the developer correctly found and updated both paths. The duplication itself is not blocking since both paths are now functionally identical, though a future refactoring ticket to have `resetCombatantsForNewRound` delegate to `resetMountMovement` would be appropriate.

### MEDIUM-1: MountControls blanket skip replaced with capacity check -- RESOLVED

**Commit:** 7994902b
**File:** `app/components/encounter/MountControls.vue`, lines 210-213

The blanket `if (c.mountState && !c.mountState.isMounted) continue` was replaced with:

```typescript
const capacity = getMountCapacity(c)
const currentRiders = countCurrentRiders(c.id, encounter.combatants)
if (currentRiders >= capacity) continue
```

Both `getMountCapacity` and `countCurrentRiders` are imported from `~/utils/mountingRules` (import updated at line 93). Verified the functions:
- `getMountCapacity` (mountingRules.ts:80-86) correctly returns 0 for non-Pokemon, otherwise parses via `parseMountableCapacity`.
- `countCurrentRiders` (mountingRules.ts:92-96) counts combatants with `mountState.isMounted === true` and `partnerId === mountId`.

This correctly allows Mountable 2+ Pokemon to appear in mount options when they have capacity remaining. For Mountable 1 with one rider, `currentRiders (1) >= capacity (1)` skips correctly. For Mountable 2 with one rider, `currentRiders (1) >= capacity (2)` is false, so the Pokemon remains available.

Note: this also handles the edge case where `c` is not a mount at all (no `mountState`) -- `getMountCapacity` returns the parsed capacity value, and `countCurrentRiders` returns 0, so `0 >= capacity` is false for any mountable Pokemon, correctly including unmounted mounts. For non-mountable Pokemon, the earlier `isMountable(c)` guard (line 198) already filters them out.

### MEDIUM-2: Dismount check includes heavily injured HP loss -- RESOLVED

**Commit:** bd519560
**File:** `app/server/api/encounters/[id]/damage.post.ts`, lines 122-128

The fix adds `const totalDamageEvent = damageResult.hpDamage + heavilyInjuredHpLoss` and passes `totalDamageEvent` to `triggersDismountCheck()` instead of bare `damageResult.hpDamage`.

Verified ordering: `heavilyInjuredHpLoss` is computed at lines 66-79 (before the dismount check at line 127). The variable is always defined (initialized to 0 at line 67, only updated if heavily injured penalty applies). The `faintedFromAnySource` guard at line 126 already accounts for fainting from heavily injured penalty (line 114: `damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)`).

The comment at lines 122-123 correctly cites the rationale: "heavily injured penalty is damage from an attack" (PTU p.250). Per decree-004, `damageResult.hpDamage` is already the real HP damage after temp HP absorption. The heavily injured penalty is additional HP loss from the same attack event, so including it in the total damage event for dismount threshold evaluation is correct.

### MEDIUM-3: Group and Player combatant cards show partner name -- RESOLVED

**Commit:** f1f8ba38
**Files:** `app/components/encounter/GroupCombatantCard.vue` (lines 124-137), `app/components/encounter/PlayerCombatantCard.vue` (lines 128-141)

Both cards now:
1. Call `useEncounterStore()` (auto-imported via `@pinia/nuxt`)
2. Use `encounterStore.getMountPartner(props.combatant.id)` to look up the partner combatant
3. Resolve the partner name: for Pokemon, `nickname || species`; for humans, `name`
4. Display "Mounted on {name}" (rider) or "Carrying {name}" (mount)

This exactly mirrors the CombatantCard pattern (lines 382-396). All three cards now show identical mount indicator text format.

The `getMountPartner` getter (encounter.ts:217-221) returns the combatant matching `c.mountState.partnerId`, or null if the partner is not found. The null guard at line 131 (`if (!partner) return ''`) handles the edge case where mount state references a combatant that was removed from the encounter.

Type imports: Both cards already import `Pokemon` and `HumanCharacter` from `~/types` (line 75 in GroupCombatantCard, implicit via existing type usage in PlayerCombatantCard). The type assertions (`as Pokemon`, `as HumanCharacter`) are safe because they branch on `partner.type === 'pokemon'`.

## What Looks Good

1. **Correct extraction strategy for movementModifiers.** Placing the shared function in `~/utils/` (not in a composable or server service) allows both client and server code to import without circular dependencies. The re-export from `useGridMovement.ts` preserves backward compatibility for existing consumers.

2. **All 5 issues addressed with minimal, focused changes.** Each fix commit touches only the files necessary to resolve its specific issue. No over-engineering or unnecessary refactoring.

3. **Immutable patterns maintained.** `mounting.service.ts` uses spread operators for mount state updates. `turn-helpers.ts` uses `{ ...c.mountState, movementRemaining: mountSpeed }` for the inline reset.

4. **Consistent decree-004 compliance in dismount threshold.** The `totalDamageEvent` variable cleanly composes `damageResult.hpDamage` (real HP after temp HP per decree-004) with `heavilyInjuredHpLoss` (additional attack-event HP loss per PTU p.250).

5. **Good commit granularity.** 5 fix commits (one per issue) + 1 docs commit. Each is a single logical change with a clear message referencing the code-review-296 issue number.

## Verdict

**APPROVED**

All 5 issues from code-review-296 are resolved correctly. No new issues introduced by the fix cycle. The movement modifier double-application bug (HIGH-2) is fully eliminated across all three budget-creation sites (executeMount, resetMountMovement, resetCombatantsForNewRound) and both consumer sites (getSpeed, getMaxPossibleSpeed). The badge overlap, capacity check, dismount threshold, and partner name fixes are all clean and correct.

## Required Changes

None.
