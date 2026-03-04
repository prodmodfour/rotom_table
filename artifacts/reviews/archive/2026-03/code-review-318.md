---
review_id: code-review-318
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-004
domain: combat
commits_reviewed:
  - 61bce2ca
  - bac99570
  - fea659c1
  - da1adda2
  - 7344d9aa
  - 9e0c4d7a
  - 9083437b
files_reviewed:
  - app/utils/mountingRules.ts
  - app/server/services/mounting.service.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/components/encounter/MountControls.vue
  - app/stores/encounter.ts
  - app/types/combat.ts
  - app/constants/trainerClasses.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T14:00:00Z
follows_up: code-review-314
---

## Review Scope

Re-review of 7 fix commits addressing code-review-314 (1C+2H+3M) and rules-review-287 (1H+1M) for feature-004 P2 (Pokemon Mounting / Rider System P2). Verified each original issue is properly resolved.

**Decree compliance:**
- decree-003 (tokens passable, enemy rough terrain): No changes to movement system. Compliant.
- decree-004 (massive damage uses real HP after temp HP): No changes to damage pipeline. Compliant.
- decree-040 (flanking -2 after evasion cap): Ride as One evasion override feeds into speedEvasion before cap+flanking. Pipeline ordering preserved. Compliant.

## Issue Resolution Verification

### CRIT-1 RESOLVED: Ride as One speed evasion now flows through accuracy calculations

**Commit:** da1adda2

**Fix:** Added Ride as One evasion override in `calculate-damage.post.ts:332-341`:
```typescript
if (target.mountState && target.mountState.originalSpeedEvasion !== undefined) {
  speedEvasion = Math.max(speedEvasion, target.speedEvasion)
}
```

**Verification:**
- The `originalSpeedEvasion` check is a reliable sentinel -- only set by `applyRideAsOneEvasion()` when the Ride as One feature is active. No false positives possible.
- `Math.max` correctly takes the better of stat-derived and shared evasion. This handles the edge case where combat stages change after mounting (stat-derived could become higher).
- The override is placed after stat-derived evasion computation (line 330) but before the evasion cap (line 348) and flanking penalty (line 353), maintaining correct pipeline ordering per decree-040.
- The `speedEvasion` variable feeds into `applicableEvasion` (line 347) which flows through the full accuracy threshold calculation. Mechanically effective.

### HIGH-1 RESOLVED: Agility Training persists across turns

**Commit:** fea659c1

**Fix:** Moved from `tempConditions` (cleared by `next-turn.post.ts:107` `currentCombatant.tempConditions = []`) to `mountState.agilityTrainingActive` boolean.

**Changes verified:**
- `app/types/combat.ts:54`: Added `agilityTrainingActive?: boolean` to `MountState` interface.
- `app/stores/encounter.ts:1153-1170`: `toggleAgilityTraining()` now sets `mountState.agilityTrainingActive` on both mount and rider combatants. The spread pattern (`mount.mountState = { ...mount.mountState, agilityTrainingActive: newActive }`) is clean and reactive.
- `app/components/encounter/MountControls.vue:416-420`: UI reads `mount.mountState.agilityTrainingActive === true` instead of checking tempConditions.
- **Lifecycle:** Cleared on dismount (mountState set to `undefined` in mounting.service.ts:399/407) and on faint (mounting.service.ts:516/529/548/553). Not cleared at turn end because it lives on mountState, not tempConditions.
- **Consistency:** Flag set on both mount and rider for consistency, so either combatant's turn can check the state.

### HIGH-2 RESOLVED: All 5 dead utility functions wired into integration points

**Commit:** 7344d9aa

**Fix:** All 5 functions from `mountingRules.ts` are now imported and called in `calculate-damage.post.ts`:

| Function | Integration Point | Line |
|----------|------------------|------|
| `calculateRunUpBonus` | `riderModifiers.runUpBonus` | 390-393 |
| `calculateOverrunModifiers` | `riderModifiers.overrun` | 397-404 |
| `isConquerorsMarchEligibleRange` | `riderModifiers.conquerorsMarchEligible` | 408-410 |
| `applyResistStep` | `riderModifiers.leanInReducedEffectiveness` | 425 |
| `isAoERange` | Lean In eligibility check | 419 |

Additionally:
- `calculateRunUpBonus` imported in MountControls.vue:213, used at line 465 (replacing inlined `Math.floor`).
- `calculateOverrunModifiers` imported in MountControls.vue:214, used at lines 468-475 for bonus damage display.
- `hasRunUp` imported in calculate-damage.post.ts:17, used at line 389.

**Architecture:** The rider modifiers are returned as informational annotations in the API response (`riderModifiers` object). The GM applies them manually per the spec's automation level. This is the correct approach -- the functions are integrated at the calculation endpoint where they can inform the GM's damage resolution.

### MED-1 RESOLVED: ConquerorsMarsh renamed to ConquerorsMarch everywhere

**Commit:** bac99570

**Fix:**
- Extracted constant `CONQUERORS_MARCH_CONDITION = 'ConquerorsMarch'` in `app/constants/trainerClasses.ts:206`.
- `app/stores/encounter.ts`: Imports the constant (line 6), uses it in `activateConquerorsMarch` (lines 1187-1188).
- `app/components/encounter/MountControls.vue`: Imports the constant (line 218), uses it in `isConquerorsMarchActive` computed (line 426).
- Global search for `ConquerorsMarsh` returns zero results. Complete elimination confirmed.

**Quality:** Extracting to a named constant prevents future typo recurrence. The constant lives in `trainerClasses.ts` alongside other Rider feature constants, which is the natural home.

### MED-2 RESOLVED: app-surface.md updated with P2 additions

**Commit:** 9e0c4d7a

**Fix:** Two sections of `.claude/skills/references/app-surface.md` updated:
1. **Mounting system paragraph**: Expanded to document `applyRideAsOneEvasion`, `restoreRideAsOneEvasion` in mounting.service.ts; MountState fields `originalSpeedEvasion`, `rideAsOneSwapped`, `agilityTrainingActive`; all 6 new constants in trainerClasses.ts; 5 new store actions; Ride as One wiring in calculate-damage.post.ts; rider modifier annotations; distance tracking; scene-limited feature usage; Cavalier's Reprisal detection.
2. **Mounting utilities paragraph**: Expanded to document all P2 functions (hasRiderClass, hasRiderFeature, hasRunUp, isDashOrPassRange, getFeatureUsesRemaining, isConquerorsMarchEligibleRange, calculateRunUpBonus, calculateOverrunModifiers, applyResistStep, isAoERange) plus P0/P1 functions that were previously undocumented (buildDismountCheckInfo, isEasyIntercept).
3. **Services table**: `mounting.service.ts` entry expanded with `applyRideAsOneEvasion`, `restoreRideAsOneEvasion`.

### MED-3 RESOLVED: Conqueror's March standard action cost via store mutation

**Commit:** bac99570 (store changes), 7344d9aa (component changes)

**Fix:** The direct mutation in MountControls.vue was removed. The `activateConquerorsMarch` store action now takes `(riderId, mountId)` and handles both the temp condition AND the standard action cost:

```typescript
activateConquerorsMarch(riderId: string, mountId: string) {
  // ... set temp condition on mount ...
  const rider = this.encounter.combatants.find(c => c.id === riderId)
  if (rider) {
    rider.turnState = { ...rider.turnState, standardActionUsed: true }
  }
}
```

The component handler (MountControls.vue:543-548) was simplified to:
```typescript
encounterStore.activateConquerorsMarch(rider.id, mount.id)
```

**Quality:** The standard action cost is now managed by the store (single source of truth), not by component-level mutation. The spread pattern preserves other turnState fields.

## What Looks Good

1. **Sentinel pattern for Ride as One detection.** Using `originalSpeedEvasion !== undefined` as the detection condition is elegant -- it piggybacks on existing state without adding another boolean flag. The field is only set when Ride as One is active, making it a zero-cost sentinel.

2. **Consistent immutable update patterns.** All store mutations use spread operators to create new objects rather than mutating in place. The mounting.service.ts functions continue to return new combatant arrays via `.map()`.

3. **Dual-combatant state setting for Agility Training.** Setting `agilityTrainingActive` on both mount and rider ensures either combatant's UI panel can check the state, regardless of whose turn it is.

4. **Clean import organization.** The `calculate-damage.post.ts` import block neatly groups all mountingRules imports in a single destructured import statement.

5. **Informational rider modifiers pattern.** Returning rider feature effects as annotations in the API response (rather than automatically applying them) is the correct approach for the current automation level. It gives the GM full information without overstepping.

6. **Commit granularity is good.** Each commit addresses exactly one issue or a closely related pair. The docs commits are separate from code commits.

## Verdict

**APPROVED**

All 6 issues from code-review-314 and both issues from rules-review-287 are properly resolved. The fixes are well-implemented: the Ride as One evasion wiring uses the correct pipeline ordering, Agility Training persistence uses the right storage mechanism, dead functions are properly integrated, and the code quality is consistent with the existing codebase patterns.

## Required Changes

None.
