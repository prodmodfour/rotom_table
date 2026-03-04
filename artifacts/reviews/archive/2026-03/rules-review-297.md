---
review_id: rules-review-297
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 2d5e1260
  - a51fe8ac
  - f6acb5b5
  - d14f4492
  - eb9d7385
  - 3319923a
  - 06313ff4
mechanics_verified:
  - shared-movement-pool
  - movement-pool-reset
  - movement-modifiers-on-shared-pool
  - no-guard-suppression-client
  - no-guard-decree-046
  - soulstealer-scene-frequency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/10-indices-and-reference.md#Living Weapon (pp.305-306)
  - core/10-indices-and-reference.md#Ability: Soulstealer (p.329)
  - core/10-indices-and-reference.md#Ability: No Guard (p.325)
  - playtest-packet-2016.md#Ability: No Guard (line 525)
reviewed_at: 2026-03-04T13:45:00Z
follows_up: rules-review-294
---

## Re-Review Context

This is a re-review of the feature-005 P2 fix cycle. The previous rules-review-294 found 2 HIGH and 3 MEDIUM issues. The developer addressed all 5 in 7 commits. This review verifies each fix resolves the original issue correctly per PTU rules.

## Mechanics Verified

### HIGH-001: Movement Pool Reset at Round Start

- **Rule:** "the total amount Shifted during the round cannot exceed the Wielder's Movement Speed" (`core/10-indices-and-reference.md`, line 243-247). Per-round cap implies reset each round.
- **Original Issue:** `resetWieldMovementPools()` existed but was never called from round advancement logic.
- **Fix (commits d14f4492 + eb9d7385):** Rather than calling `resetWieldMovementPools()` on the `WieldRelationship` objects (which are reconstructed from combatant flags on each API call), the developer persisted `wieldMovementUsed` directly on the wielder combatant and resets it in `resetCombatantsForNewRound()` at `turn-helpers.ts:117-121`:
  ```typescript
  if (c.wieldMovementUsed !== undefined) {
    c.wieldMovementUsed = 0
  }
  ```
  The `reconstructWieldRelationships()` in `living-weapon-state.ts:47` now reads this persisted value: `movementUsedThisRound: c.wieldMovementUsed ?? 0`. The `position.post.ts:143-152` increments `wieldMovementUsed` on the wielder combatant after each movement.
- **Status:** CORRECT. The reset follows the same pattern as mount `movementRemaining` reset (lines 126-138 of same function). The persisted field on the wielder combatant solves both the round-reset problem and the mid-round reconstruction problem (H1 from code-review-321). The pool resets to 0 at each new round, matching PTU per-round cap semantics.

### HIGH-002: Soulstealer Scene Frequency Enforcement

- **Rule:** "Scene -- Free Action" (`core/10-indices-and-reference.md`, line 2418). Soulstealer triggers at most once per scene.
- **Original Issue:** `checkSoulstealer()` had no frequency check; healing fired on every qualifying faint.
- **Fix (commit 3319923a, in C1 split):** `checkSoulstealer()` in `living-weapon-abilities.service.ts:168-172` now checks `combatant.featureUsage`:
  ```typescript
  const usage = attacker.featureUsage?.['Soulstealer']
  if (usage && usage.usedThisScene >= usage.maxPerScene) {
    return null
  }
  ```
  `applySoulstealerHealing()` at lines 200-209 records usage after healing:
  ```typescript
  combatant.featureUsage = {
    ...currentUsage,
    Soulstealer: {
      usedThisScene: soulstealerUsage.usedThisScene + 1,
      maxPerScene: 1,
    },
  }
  ```
- **Status:** CORRECT. `maxPerScene: 1` correctly enforces the "Scene" frequency (once per scene). The `featureUsage` tracking pattern reuses the existing infrastructure from `encounter.ts:84` (`featureUsage?: Record<string, { usedThisScene: number; maxPerScene: number }>`), originally added for Rider class features. The check occurs before any healing is applied, preventing the second+ trigger entirely.

### MEDIUM-001: No Guard Client-Side Accuracy Check

- **Rule:** Per decree-046, No Guard uses playtest +3/-3 flat accuracy. Suppressed while wielded as Living Weapon (PTU p.306).
- **Original Issue:** `useMoveCalculation.ts` `getAccuracyThreshold()` did not account for No Guard at all.
- **Fix (commit f6acb5b5):** Added `hasActiveNoGuard()` at `useMoveCalculation.ts:431-442` and `getNoGuardBonus()` at lines 454-469:
  ```typescript
  const getNoGuardBonus = (targetId: string): number => {
    let bonus = 0
    if (hasActiveNoGuard(actor.value)) bonus += 3
    const target = targets.value.find(t => t.id === targetId)
    if (target && hasActiveNoGuard(target)) bonus += 3
    return bonus
  }
  ```
  The `getAccuracyThreshold()` at line 485 now subtracts `noGuardBonus`:
  ```typescript
  return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty - noGuardBonus)
  ```
  The suppression check at line 441: `return !wieldRels.some(r => r.weaponId === combatant.id)` correctly returns `false` (No Guard inactive) when the Pokemon is wielded.
- **Status:** CORRECT. The client-side implementation mirrors the server-side logic in `calculate-damage.post.ts:358-364`. Both paths:
  1. Check if attacker has No Guard and it is active (+3 bonus)
  2. Check if target has No Guard and it is active (+3 bonus)
  3. Suppress No Guard when the Pokemon is wielded (found as `weaponId` in wieldRelationships)
  4. Subtract total bonus from accuracy threshold (reducing threshold = easier to hit)
  Per decree-046: "+3 bonus to all Attack Rolls for the user, +3 bonus to all Attack Rolls against the user." Both attacker and target bonuses are correctly implemented and stack if both have active No Guard.

### MEDIUM-002: Movement Modifiers Applied to Shared Pool

- **Rule:** PTU p.306 -- "use the Wielder's Movement Speed to shift." Movement speed is subject to Slowed, Stuck, Speed CS, Sprint per normal rules.
- **Original Issue:** Shared pool used raw `getOverlandSpeed(wielder)` without movement modifiers.
- **Fix (commit 2d5e1260):** Both client-side locations in `useGridMovement.ts` (lines 150-164 and 228-242) and the server-side `getWieldedMovementSpeed()` in `living-weapon-movement.service.ts:140-143` now apply modifiers:
  ```typescript
  // Client (useGridMovement.ts:160-163):
  const modifiedSpeed = applyMovementModifiers(wielder, baseSpeed, weather)
  const remaining = modifiedSpeed - (wieldRel.movementUsedThisRound ?? 0)

  // Server (living-weapon-movement.service.ts:140-143):
  const baseSpeed = getOverlandSpeedUtil(wielder)
  const modifiedSpeed = applyMovementModifiers(wielder, baseSpeed, weather)
  const remaining = modifiedSpeed - (relationship.movementUsedThisRound ?? 0)
  ```
- **Status:** CORRECT. `applyMovementModifiers()` (from `utils/movementModifiers.ts`) applies all relevant modifiers in correct order: Stuck (speed 0), Tripped (speed 0), Slowed (halve), Thermosensitive in Hail (halve), Speed CS (additive, min 2 floor for negative), Sprint (+50%). This matches the mount system pattern and ensures a Slowed/Stuck wielder correctly has reduced/zero movement for the shared pool.

### MEDIUM-003: No Guard Decree

- **Rule:** Pre-existing ambiguity between core (evasion-based, melee-only) and playtest (+3/-3 flat) definitions.
- **Original Issue:** No decree existed to formalize the No Guard definition choice.
- **Fix (commit b446c3a6, preceding the fix cycle):** decree-046 was created at `decrees/decree-046.md`, ruling: "Use the 2016 playtest packet version of No Guard -- +3 bonus to all Attack Rolls for the user, +3 bonus to all Attack Rolls against the user, affecting all attack types."
- **Status:** CORRECT. decree-046 is active, properly formatted, and correctly cited in:
  - `living-weapon-abilities.service.ts:50-51` (server-side)
  - `useMoveCalculation.ts:447-449` (client-side)
  - `calculate-damage.post.ts:358-361` (server-side damage endpoint)

### Decree Compliance Check

- **decree-001** (minimum 1 damage): Not affected by fix cycle. No changes to damage pipeline.
- **decree-043** (Combat Skill Rank gates move access, not engagement): No changes to engagement validation. Compliant.
- **decree-044** (remove phantom Bound condition): No Bound condition references in fix cycle. Compliant.
- **decree-045** (Sun Blanket 1/10th max HP healing): Not relevant to Living Weapon. Compliant.
- **decree-046** (No Guard playtest version): Implementation correctly follows this decree in all three paths (server damage calc, client accuracy calc, abilities service). Fully compliant.

### Additional Verification: C1 Split (Structural, Not Rules)

The C1 split (commit 3319923a) extracted abilities and movement functions into sub-services. Verified that all re-exported functions maintain identical signatures and logic. `living-weapon.service.ts` now re-exports from both sub-services (lines 26-42), preserving backward compatibility for all existing import sites. This is a code quality change with no rules impact, but confirmed that no game logic was altered during extraction.

### Additional Verification: M1 Immutable Update

The M1 fix (commit a51fe8ac) changed `useEncounterActions.ts:316-320` from direct mutation to immutable `.map()` update:
```typescript
encounterStore.encounter.wieldRelationships = encounterStore.encounter.wieldRelationships.map(
  (r, i) => i === wieldRelIndex
    ? { ...r, movementUsedThisRound: (r.movementUsedThisRound ?? 0) + distanceMoved }
    : r
)
```
This is a code quality fix with no rules impact. The movement pool arithmetic (`+= distanceMoved`) is unchanged and correct.

### Additional Verification: M2 JSDoc on Soulstealer Mutation

The `applySoulstealerHealing()` function at `living-weapon-abilities.service.ts:184-191` now has explicit JSDoc documenting the mutation pattern:
> "This function mutates `combatant.entity` in place, following the same mutation pattern used by `applyDamageToEntity` in `combatant.service.ts` and `damage.post.ts`. The caller is responsible for persisting changes to the database via `syncEntityToDatabase`."

This is documentation-only with no rules impact.

## Summary

All 5 issues from rules-review-294 have been correctly resolved:

| Issue | Severity | Resolution | Status |
|-------|----------|------------|--------|
| HIGH-001: Movement pool never resets | HIGH | `wieldMovementUsed` reset in `resetCombatantsForNewRound` | RESOLVED |
| HIGH-002: Soulstealer unlimited triggers | HIGH | `featureUsage` tracking with `maxPerScene: 1` | RESOLVED |
| MEDIUM-001: No Guard client-side gap | MEDIUM | `hasActiveNoGuard()` + `getNoGuardBonus()` in `useMoveCalculation.ts` | RESOLVED |
| MEDIUM-002: Missing movement modifiers | MEDIUM | `applyMovementModifiers()` applied in both client and server paths | RESOLVED |
| MEDIUM-003: No Guard decree needed | MEDIUM | decree-046 created and cited in all relevant files | RESOLVED |

The 7 code-review-321 issues (C1, H1, H2, H3, M1, M2, M3) are all resolved from a game logic perspective as well. The movement pool system now correctly resets per round, persists mid-round state, and applies movement modifiers. No Guard is consistently handled across client and server per decree-046. Soulstealer respects its Scene frequency limit.

## Rulings

1. **Persisting `wieldMovementUsed` on the wielder combatant is the correct approach.** It mirrors the mount pattern (`mountState.movementRemaining`) and survives API call reconstruction cycles.
2. **Reusing `featureUsage` for Soulstealer scene tracking is correct.** The infrastructure was designed for exactly this pattern (scene-limited features with `usedThisScene`/`maxPerScene` counters).
3. **No Guard suppression check via `wieldRelationships.some(r => r.weaponId === combatant.id)` is correct.** A Pokemon found as `weaponId` in any wield relationship is currently wielded, and per PTU p.306, No Guard is suppressed while wielded.
4. **Both attacker and target No Guard bonuses stacking (+6 total) is correct per decree-046.** The playtest text says "+3 bonus to all Attack Rolls [for user]" and "+3 Bonus on Attack Rolls against the user" -- these are independent bonuses that stack when both combatants have active No Guard.

## Verdict

**APPROVED**

All HIGH and MEDIUM issues from rules-review-294 are resolved. The implementation correctly follows PTU rules for shared movement pooling (round reset, modifier application), Soulstealer scene frequency enforcement, and No Guard per decree-046. No new game logic issues found.

## Required Changes

None.
