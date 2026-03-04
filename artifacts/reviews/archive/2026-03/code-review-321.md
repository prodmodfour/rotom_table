---
review_id: code-review-321
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - ac823e03
  - cff00ced
  - 55e0da12
  - 14fff144
  - 09b5587c
  - b183b1ad
  - e7fbb5d0
  - 68199a85
  - dbff2600
  - ee9c3b05
  - f56a7fdf
  - 364b7dc7
  - 8163e4b0
  - 9a31b80f
files_reviewed:
  - app/server/services/living-weapon.service.ts
  - app/server/services/living-weapon-state.ts
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/composables/useGridMovement.ts
  - app/composables/useEncounterActions.ts
  - app/server/api/encounters/[id]/position.post.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/living-weapon/disengage.post.ts
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-03-04T12:30:00Z
follows_up: code-review-319
---

## Review Scope

P2 of feature-005 (Living Weapon System): 14 commits implementing Sections J-N from `design-living-weapon-001/spec-p2.md`. Scope covers VTT shared movement pool, No Guard suppression, Aegislash forced Blade Forme, Weaponize ability intercept, and Soulstealer healing. Also includes bug-050 fix (moveKeywords passthrough).

Reviewed against: spec-p2.md, shared-specs.md, decrees 001/043/044.

## Issues

### CRITICAL

**C1: `living-weapon.service.ts` exceeds 800-line file size limit (836 lines)**

File: `app/server/services/living-weapon.service.ts` (836 lines)

The P2 additions (movement pool functions, No Guard, Aegislash stance, Weaponize, Soulstealer) pushed this service from ~533 lines (per services CLAUDE.md) to 836 lines, breaching the 800-line CRITICAL threshold established in project standards. The service now spans 6 distinct responsibility domains (engage/disengage, equipment overlay, weapon moves, movement pool, ability checks, healing).

**Required fix:** Extract P2 functions into a separate file. Natural split: `living-weapon-abilities.service.ts` for Sections K-N (isNoGuardActive, swapAegislashStance, isAegislashBladeForm, canUseWeaponize, checkSoulstealer, applySoulstealerHealing) and `living-weapon-movement.service.ts` for Section J (syncWeaponPosition, handleLinkedMovement, getWieldedMovementSpeed, resetWieldMovementPools). This preserves the pure-function service pattern and keeps each file under 400 lines.

### HIGH

**H1: `reconstructWieldRelationships` always resets `movementUsedThisRound` to 0, losing mid-round movement tracking**

File: `app/server/services/living-weapon-state.ts` line 47

`reconstructWieldRelationships()` hardcodes `movementUsedThisRound: 0` on every call. This function is called by `position.post.ts` (line 118), `calculate-damage.post.ts` (line 187), `engage.post.ts` (line 93), `disengage.post.ts` (line 81), and `damage.post.ts` (line 197). Since `wieldRelationships` are not persisted to the DB as a separate column but reconstructed from combatant flags on every API call, the shared movement pool value is never preserved between API calls.

Impact: The movement pool cap is enforced only on the client side (via `useGridMovement` and `useEncounterActions`). Server-side, every position update reconstructs the relationship with `movementUsedThisRound: 0`, so the server never validates that the round's movement budget was exceeded. If a client sends multiple position updates in a round, each one sees full movement remaining.

**Required fix:** Either (a) persist `movementUsedThisRound` alongside the combatant flags (e.g., as a field on the wielder combatant, similar to how `mountState.movementRemaining` is persisted on the combatant), or (b) store the entire `WieldRelationship` in a DB column on the encounter so reconstruction preserves it. Approach (a) is recommended for consistency with the mount pattern.

**H2: `resetWieldMovementPools` is never called from round advancement logic**

Files: `app/server/utils/turn-helpers.ts` (resetCombatantsForNewRound), `app/server/services/living-weapon.service.ts` (resetWieldMovementPools)

The spec (Section J, "Round Reset") explicitly requires `resetWieldMovementPools` to be called from the round advancement logic. The function exists in the service (line 661) but is never imported or called anywhere. `resetCombatantsForNewRound` in `turn-helpers.ts` handles mount movement reset (lines 120-133) but has no corresponding wield movement pool reset.

Note: This issue compounds H1. Even if `movementUsedThisRound` were persisted, it would never be reset between rounds. Since it is not persisted (always reconstructs as 0), the bug is masked -- but if H1 is fixed without also fixing H2, the movement pool will never reset.

**Required fix:** Add wield movement pool reset to `resetCombatantsForNewRound` in `turn-helpers.ts`, following the same pattern as the mount movement reset at lines 120-133.

**H3: No Guard suppression not applied in client-side accuracy calculation (`useMoveCalculation`)**

File: `app/composables/useMoveCalculation.ts` lines 427-439

The server-side `calculate-damage.post.ts` correctly applies the No Guard -3 AC reduction via `isNoGuardActive()` (line 360-362). However, the client-side accuracy threshold in `useMoveCalculation.ts` at `getAccuracyThreshold()` (line 439) uses `move.value.ac` directly without any No Guard adjustment:

```typescript
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```

This means the GM's damage calculator UI shows a different accuracy threshold than what the server computes. For a wielded Honedge/Doublade with No Guard, the client shows the -3 AC benefit (easier to hit) while the server correctly suppresses it (PTU p.306). The GM will see misleadingly low thresholds.

**Required fix:** Import `isNoGuardActive` and apply the No Guard AC adjustment in `getAccuracyThreshold()`, consistent with the server path. The function needs access to the attacker combatant and wield relationships (already available via `encounterStore`).

### MEDIUM

**M1: Direct mutation of `wieldRel.movementUsedThisRound` in `useEncounterActions.handleTokenMove`**

File: `app/composables/useEncounterActions.ts` line 313

```typescript
wieldRel.movementUsedThisRound = (wieldRel.movementUsedThisRound ?? 0) + distanceMoved
```

This directly mutates the reactive `wieldRelationships` array member instead of creating a new object. The mount equivalent (lines 284-301) follows the same mutation pattern so this is consistent with existing code, but per project SOLID guidelines (immutability violations are CRITICAL), both patterns should use immutable updates. Filing as MEDIUM because it follows established precedent in the same function, but it should be addressed.

**M2: `applySoulstealerHealing` uses in-place mutation while `handleLinkedMovement` and other P2 service functions use immutable patterns**

File: `app/server/services/living-weapon.service.ts` lines 815-836

The function comment says "Mutates the combatant's entity in place (follows existing damage.post.ts mutation pattern)" -- and this is accurate. The damage pipeline does use mutation. However, all other P2 functions in this service (syncWeaponPosition, handleLinkedMovement, swapAegislashStance, etc.) use immutable returns. The inconsistency within the same file makes the contract unclear. At minimum, the JSDoc should explicitly document why this function mutates vs the others, or it should be refactored to return a new entity like the others.

**M3: Soulstealer scene frequency is not enforced -- only annotated for GM**

Files: `app/server/api/encounters/[id]/damage.post.ts` line 211, `move.post.ts`, `aoo-resolve.post.ts`

The spec (Section N) states Soulstealer is "Scene - Free Action" frequency. The implementation comment says "Scene frequency -- tracked via response annotation (GM enforces limit)." This means there is no automated enforcement: the server will happily apply Soulstealer healing every time a target faints, regardless of how many times it has triggered this scene. While the spec acknowledges GM-adjudication for kill detection, it does not designate frequency tracking as GM-manual. The `featureUsage` tracking pattern on Combatant (used by Lean In/Overrun in feature-004 P2) exists and could be reused here.

**Required fix:** Add `featureUsage` tracking for Soulstealer (Scene x1), check before triggering, and increment on use. The infrastructure already exists on Combatant.

## What Looks Good

1. **Type definitions are clean.** `WieldRelationship` in `combat.ts` correctly includes both new P2 fields (`movementUsedThisRound`, `wasInBladeFormeOnEngage`). The optional nature of `wasInBladeFormeOnEngage` is appropriate (only relevant for Aegislash).

2. **Aegislash engage/disengage flow is correct.** The engage endpoint properly checks `isAegislashBladeForm()` before swapping, stores `wasInBladeFormeOnEngage`, and the disengage endpoint correctly reverts only when the Pokemon was NOT in Blade forme before engage. The stat swap in `swapAegislashStance()` correctly swaps Attack<->Defense and SpAtk<->SpDef.

3. **Weaponize intercept implementation is well-structured.** The `intercept-melee.post.ts` endpoint cleanly handles the `isWeaponize` flag: validates `canUseWeaponize`, verifies the target is the wielder, skips normal eligibility/action cost checks, and logs the correct action type ("free" vs "interrupt").

4. **No Guard suppression on server is correct.** `isNoGuardActive()` correctly returns `false` when the Pokemon is wielded, and `calculate-damage.post.ts` applies the -3 AC reduction only when active. The logic follows the spec exactly.

5. **Linked position sync in `position.post.ts` is well-integrated.** Falls through mount check first, then wield check -- correct priority since a Pokemon cannot be both mounted and wielded simultaneously.

6. **Soulstealer is integrated in all three damage paths** (damage.post.ts, move.post.ts, aoo-resolve.post.ts) with consistent patterns.

7. **Bug-050 fix is correct.** `moveKeywords` is now properly passed to `calculateDamage` in `calculate-damage.post.ts` (line 280).

8. **Client-side movement pool integration in `useGridMovement.ts` is thorough.** Both `getSpeed()` and `getMaxPossibleSpeed()` correctly check wield relationships and compute remaining movement from the wielder's speed minus used pool.

9. **Commit granularity is appropriate.** 14 commits for 14 files across 5 sections plus a bug fix is well-scoped -- each commit is a single logical change.

10. **Decree compliance verified.** decree-043 (Combat rank gates move ACCESS not engagement) is respected in engage validation. decree-044 (no phantom Bound condition) is not violated. decree-001 (minimum 1 damage) is unaffected by these changes.

## Verdict

**CHANGES_REQUIRED** -- 1 critical, 3 high, 3 medium issues found.

## Required Changes

Before approval, the developer must:

1. **[C1]** Split `living-weapon.service.ts` into separate files to bring each under 800 lines. Suggested split: extract P2 ability functions and P2 movement functions into `living-weapon-abilities.service.ts` and `living-weapon-movement.service.ts`.

2. **[H1]** Persist `movementUsedThisRound` on the wielder combatant (e.g., as a field alongside `wieldingWeaponId`) so that `reconstructWieldRelationships` can restore it. Update reconstruction to read the persisted value.

3. **[H2]** Call `resetWieldMovementPools` (or equivalent logic) from `resetCombatantsForNewRound` in `turn-helpers.ts`.

4. **[H3]** Add No Guard suppression check to `useMoveCalculation.getAccuracyThreshold()` on the client side.

5. **[M1]** Address the direct mutation of `wieldRel.movementUsedThisRound` in `useEncounterActions.ts` -- use immutable update pattern.

6. **[M2]** Either refactor `applySoulstealerHealing` to return a new entity (matching other P2 functions), or add explicit JSDoc explaining the mutation contract.

7. **[M3]** Add automated scene frequency tracking for Soulstealer using the existing `featureUsage` pattern on Combatant.
