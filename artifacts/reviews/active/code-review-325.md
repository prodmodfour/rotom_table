---
review_id: code-review-325
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 3319923a
  - eb9d7385
  - d14f4492
  - f6acb5b5
  - a51fe8ac
  - 2d5e1260
  - 06313ff4
files_reviewed:
  - app/server/services/living-weapon.service.ts
  - app/server/services/living-weapon-abilities.service.ts
  - app/server/services/living-weapon-movement.service.ts
  - app/server/services/living-weapon-state.ts
  - app/server/utils/turn-helpers.ts
  - app/server/api/encounters/[id]/position.post.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useGridMovement.ts
  - app/types/encounter.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T13:30:00Z
follows_up: code-review-321
---

## Review Scope

Re-review of 7 fix commits addressing all issues from code-review-321 (1C + 3H + 3M) and rules-review-294 (2H + 3M). The fixes span the Living Weapon service split, movement pool persistence/reset, No Guard client-side accuracy, immutable update patterns, Soulstealer scene frequency, and movement modifier threading.

Also includes commit 06313ff4 (statusTickQueue fix from code-review-322, unrelated to feature-005 but in the reviewed range).

## Issue Resolution Verification

### C1: File size limit -- RESOLVED

`living-weapon.service.ts` was split into three files:
- `living-weapon.service.ts` (555 lines) -- core engage/disengage, equipment overlay, weapon moves, re-exports
- `living-weapon-abilities.service.ts` (225 lines) -- Soulstealer, Weaponize, No Guard, Aegislash
- `living-weapon-movement.service.ts` (159 lines) -- shared pool, position sync, speed calc

Total: 939 lines across 3 files, all individually under 800. Re-exports in the main service file preserve backward compatibility -- all existing imports continue to work. Clean separation by responsibility domain.

### H1: wieldMovementUsed persistence -- RESOLVED

New `wieldMovementUsed` field added to `Combatant` type (`encounter.ts` line 99-102) with JSDoc explaining its purpose. Initialized to `0` on engage (`living-weapon.service.ts` line 253). Cleared on disengage (`living-weapon.service.ts` line 297). Updated in `position.post.ts` lines 143-152 after each movement. `reconstructWieldRelationships` in `living-weapon-state.ts` line 47 now reads `c.wieldMovementUsed ?? 0` instead of hardcoding `0`.

This follows the same pattern as `mountState.movementRemaining` -- the authoritative value lives on the combatant and survives serialization/deserialization cycles.

### H2: Movement pool round reset -- RESOLVED

`resetCombatantsForNewRound` in `turn-helpers.ts` lines 117-121 now resets `wieldMovementUsed` to `0` for any combatant that has the field defined. The implementation is straightforward and mirrors the mount reset pattern. The comment correctly notes that since wield relationships are always reconstructed from combatant flags, resetting the flag is sufficient.

The developer chose to inline the reset rather than importing `resetWieldMovementPools()` from the movement service. This is acceptable -- it avoids a new import into turn-helpers and the logic is trivial (set to 0). The service function `resetWieldMovementPools()` remains available for other call sites that operate on the relationship array directly.

### H3: No Guard client-side accuracy -- RESOLVED

Commit f6acb5b5 adds two functions to `useMoveCalculation.ts`:

1. `hasActiveNoGuard()` (lines 431-442) -- checks for No Guard ability and suppression while wielded. Reads wield relationships from `encounterStore.encounter?.wieldRelationships`. Logic mirrors the server-side `isNoGuardActive()`.

2. `getNoGuardBonus()` (lines 454-469) -- computes the combined bonus: +3 if attacker has active No Guard, +3 if target has active No Guard. Per decree-046, these stack.

`getAccuracyThreshold()` (line 485) now subtracts `noGuardBonus` from the threshold, making the formula: `Math.max(1, moveAC + effectiveEvasion - accuracyStage - flankingPenalty + roughPenalty - noGuardBonus)`.

Server-side `calculate-damage.post.ts` (lines 358-367) also updated: now checks both attacker and target No Guard, computes combined bonus, and subtracts from threshold (line 367). Previously only handled attacker-side. The response includes `noGuardActive` and `targetNoGuard` flags for transparency.

Client and server formulas are now consistent. Verified against decree-046: "+3 bonus to all Attack Rolls for the user, AND +3 bonus to all Attack Rolls against the user."

### M1: Immutable update for wieldRel.movementUsedThisRound -- RESOLVED

`useEncounterActions.ts` lines 316-320 now use an immutable `Array.map()` to update the wield relationship:

```typescript
encounterStore.encounter.wieldRelationships = encounterStore.encounter.wieldRelationships.map(
  (r, i) => i === wieldRelIndex
    ? { ...r, movementUsedThisRound: (r.movementUsedThisRound ?? 0) + distanceMoved }
    : r
)
```

This replaces the previous direct mutation `wieldRel.movementUsedThisRound = ...`. The partner position sync (`partner.position = { ...position }`) still uses direct property assignment, but this matches the mount equivalent at line 294 and is acceptable -- it is a property assignment on a store-held object, not mutation of a passed-in parameter.

### M2: Explicit JSDoc on applySoulstealerHealing -- RESOLVED

`applySoulstealerHealing` in `living-weapon-abilities.service.ts` lines 192-194 now has explicit JSDoc:

> **Mutation note (M2):** This function mutates `combatant.entity` in place, following the same mutation pattern used by `applyDamageToEntity` in `combatant.service.ts` and `damage.post.ts`. The caller is responsible for persisting changes to the database via `syncEntityToDatabase`.

This clearly documents the mutation contract and cites the precedent functions. Acceptable resolution -- the mutation pattern is intentional and consistent with the damage pipeline.

### M3: Soulstealer scene frequency enforcement -- RESOLVED

`checkSoulstealer()` in `living-weapon-abilities.service.ts` lines 168-172 now checks `combatant.featureUsage?.['Soulstealer']`:

```typescript
const usage = attacker.featureUsage?.['Soulstealer']
if (usage && usage.usedThisScene >= usage.maxPerScene) {
  return null
}
```

`applySoulstealerHealing()` lines 200-209 records usage via the same `featureUsage` pattern used by Lean In/Overrun (feature-004 P2):

```typescript
combatant.featureUsage = {
  ...currentUsage,
  Soulstealer: {
    usedThisScene: soulstealerUsage.usedThisScene + 1,
    maxPerScene: 1,
  },
}
```

The `featureUsage` update uses spread operator (immutable at the object level). The `maxPerScene: 1` correctly enforces the Scene x1 frequency.

### rules-review-294 HIGH-001 (Movement pool reset): RESOLVED

Same as H2 above. `resetCombatantsForNewRound` resets `wieldMovementUsed` to 0 at round start.

### rules-review-294 HIGH-002 (Soulstealer scene frequency): RESOLVED

Same as M3 above. `featureUsage` tracking enforces Scene x1.

### rules-review-294 MEDIUM-001 (No Guard client-side): RESOLVED

Same as H3 above. `useMoveCalculation.ts` now checks `hasActiveNoGuard()`.

### rules-review-294 MEDIUM-002 (Movement modifiers on shared pool): RESOLVED

Commit 2d5e1260 threads `applyMovementModifiers()` through both movement speed calculation paths in `useGridMovement.ts`:

1. `getMaxPossibleSpeed()` (lines 160-163): computes `modifiedSpeed = applyMovementModifiers(wielder, baseSpeed, weather)` before subtracting used movement.

2. `getSpeed()` (lines 237-241): same pattern -- applies modifiers to wielder's overland speed before computing remaining pool.

Server-side `getWieldedMovementSpeed()` in `living-weapon-movement.service.ts` (lines 140-143) also applies `applyMovementModifiers(wielder, baseSpeed, weather)` before subtracting used movement. The function imports `applyMovementModifiers` from the shared utility at line 17.

All three paths (client getMaxPossibleSpeed, client getSpeed, server getWieldedMovementSpeed) now consistently apply Slowed, Stuck, Speed CS, Sprint, and weather modifiers to the wielder's base speed before computing the remaining pool.

### rules-review-294 MEDIUM-003 (No Guard decree): RESOLVED

decree-046 was recorded (commit b446c3a6, prior to the reviewed range). It formally adopts the 2016 playtest +3/-3 flat accuracy version. The decree is referenced in:
- `living-weapon-abilities.service.ts` line 50 (JSDoc on `targetHasNoGuard`)
- `useMoveCalculation.ts` line 447 (JSDoc on `getNoGuardBonus`)
- `calculate-damage.post.ts` line 358 (inline comment)

## What Looks Good

1. **Service split is clean and well-organized.** The three files have clear responsibility boundaries: core state management in the main file, ability logic in abilities, movement logic in movement. Re-exports maintain backward compatibility. All imports across the codebase continue to work through the main barrel.

2. **H1 persistence pattern is consistent with mounts.** The `wieldMovementUsed` field on Combatant follows the exact same pattern as `mountState.movementRemaining`: initialized on relationship creation, updated on movement, reset at round start, read during state reconstruction. This consistency makes the codebase more predictable.

3. **No Guard implementation is thorough.** Both attacker and target No Guard are checked on both client and server. The stacking behavior (both can have No Guard) is correctly handled. The decree-046 citation is present at all relevant code sites.

4. **Soulstealer frequency uses established infrastructure.** Rather than inventing a new tracking mechanism, the fix reuses the `featureUsage` pattern already established by feature-004 P2 (Lean In, Overrun). This is the right call -- one pattern for all scene-limited features.

5. **Movement modifier threading is comprehensive.** All three code paths (client getMaxPossibleSpeed, client getSpeed, server getWieldedMovementSpeed) apply the same modifier function with the same arguments. The server-side function correctly accepts the optional `weather` parameter for Thermosensitive interaction.

6. **Commit granularity is appropriate.** 7 commits for 7 distinct issues, each addressing one review finding. Commit messages reference the original issue IDs (C1, H1, H2, H3, M1, rules-MEDIUM-002).

7. **Decree compliance verified.** Per decree-046, the No Guard implementation uses the playtest +3/-3 flat accuracy version. Per decree-043, engagement validation does not check Combat rank. Per decree-001, minimum damage floor is unaffected by these changes. Per decree-044, no phantom Bound condition is introduced.

## Verdict

**APPROVED**

All 7 issues from code-review-321 and all 5 issues from rules-review-294 have been resolved. The fixes are correct, consistent with existing patterns, and well-documented. No new issues introduced.

## Required Changes

None.
