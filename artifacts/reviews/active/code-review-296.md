---
review_id: code-review-296
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-004
domain: combat
commits_reviewed:
  - aa177b62
  - 6fcf6570
  - 1d026c95
  - 80bc0b1e
  - 3aa28fc1
  - 345f2071
  - dcdc0148
  - eabcaa82
  - 61c2712d
  - 1e6dec2f
  - 323be9be
  - eb7aee5e
  - f7b11ab5
  - 594292c7
  - 11b21343
  - 629a5722
  - f58f4a08
files_reviewed:
  - app/components/vtt/VTTMountedToken.vue
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/encounter/MountControls.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/GroupCombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/stores/encounter.ts
  - app/composables/useGridMovement.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useWebSocket.ts
  - app/utils/mountingRules.ts
  - app/server/services/mounting.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/position.post.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/dismount.post.ts
  - app/server/routes/ws.ts
  - app/pages/gm/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-03-03T12:45:00Z
follows_up: code-review-289
---

## Review Scope

P1 implementation of feature-004 (Pokemon Mounting / Rider System), covering 5 sections across 17 commits:

- **Section E: VTT Linked Token Movement** -- VTTMountedToken.vue, GridCanvas integration, position.post.ts linked movement, useGridMovement mount speed
- **Section F: Dismount Check on Damage/Push** -- damage.post.ts dismount trigger, mountingRules.ts check functions, useEncounterActions GM alert
- **Section G: Mounted Prowess Edge Effect** -- hasMountedProwess in mountingRules.ts, +3 bonus in buildDismountCheckInfo, auto-succeed in MountControls
- **Section H: Intercept Bonus** -- isEasyIntercept utility (display-only per spec), badges on VTTMountedToken and MountControls
- **Section I: UI Mount Indicators** -- MountControls panel, CombatantCard/GroupCombatantCard/PlayerCombatantCard mount indicators, mount_change WebSocket event

Decree compliance verified: decree-003 (passable tokens, no stacking), decree-004 (real HP damage after temp HP for dismount threshold).

## Issues

### HIGH-1: VTTToken mount badge and elevation badge overlap at same position

**File:** `app/components/vtt/VTTToken.vue`, lines 406-430

Both `.vtt-token__elevation-badge` and `.vtt-token__mount-badge` are positioned at `position: absolute; top: 2px; right: 2px`. When a mount token has elevation > 0 (e.g., a Flying mount at Z1+), both badges render on top of each other, making both unreadable.

The template shows the mount badge only when `isMountedMount` is true (line 61), and the elevation badge only when `elevation > 0` (line 56). These conditions are not mutually exclusive -- a mounted Pokemon can have elevation.

**Fix:** Offset the mount badge. When both are present, stack them vertically. Options:
- Move mount badge to `top: 2px; right: 18px` (left of elevation badge)
- Use a conditional: if elevation badge is present, shift mount badge down to `top: 16px; right: 2px`
- Use flexbox on a shared badge container

### HIGH-2: Movement modifiers applied twice for mounted combatants in getSpeed

**File:** `app/composables/useGridMovement.ts`, lines 241-256 and 183-201

In `getSpeed()` (line 247), when a combatant has a `mountState`, the code applies `applyMovementModifiers(mountCombatant, remaining)` where `remaining` is the raw `movementRemaining` value. This is correct.

However, in `getMaxPossibleSpeed()` (line 193), the same logic runs: `applyMovementModifiers(mountCombatant, remaining)`. Both functions are called during movement validation -- `getMaxPossibleSpeed` sets the exploration budget for flood-fill pathfinding, and `getSpeed` is used for the final validity check.

The issue: `movementRemaining` is a raw distance budget that decrements as the mount moves. The mount's movement modifiers (Slowed, Speed CS, Sprint) should be applied once when the movement budget is first set at round start (in `resetMountMovement`), not re-applied on every movement query. Currently, `resetMountMovement` in `mounting.service.ts` (line 334) sets `movementRemaining` to the raw `getOverlandSpeed(mount)` without applying modifiers. Then `getSpeed`/`getMaxPossibleSpeed` applies modifiers to this already-partial budget.

This means: if a mount is Slowed, its Overland 6 is set as `movementRemaining: 6` at round start, then `getSpeed` halves it to 3. This is correct on the first query. But after the mount moves 2m, `movementRemaining` is 4, and `getSpeed` halves it to 2 -- the mount effectively loses speed exponentially as it moves.

**Fix:** Either:
(a) Apply movement modifiers in `resetMountMovement` to set the correct budget at round start and use `movementRemaining` directly without re-applying modifiers in `getSpeed`/`getMaxPossibleSpeed`, OR
(b) Keep `movementRemaining` as raw distance remaining, but do NOT apply `applyMovementModifiers` in `getSpeed`/`getMaxPossibleSpeed` for mounted combatants since the budget was already set correctly.

The simplest fix is (b): return `remaining` directly from the mount branch in `getSpeed`/`getMaxPossibleSpeed` without the `applyMovementModifiers` call, and apply modifiers once in `resetMountMovement`. This also requires updating `resetMountMovement` to call `applyMovementModifiers`.

### MEDIUM-1: MountControls mount capacity check is inverted

**File:** `app/components/encounter/MountControls.vue`, line 212

```typescript
if (c.mountState && !c.mountState.isMounted) continue
```

This line skips Pokemon that are currently serving as mounts (`isMounted === false` with a `partnerId`). However, it also skips any combatant with `mountState` where `isMounted` is false -- which is the correct state for a mount. The issue is that the condition `c.mountState && !c.mountState.isMounted` matches ALL mount combatants, including those that have capacity for additional riders (Mountable 2+).

The server-side `validateMountPreconditions` in `mounting.service.ts` (lines 89-96) properly checks capacity via `countCurrentRiders(mountId, combatants)` vs `getMountCapacity(mount)`. The client-side MountControls skips the Pokemon entirely if it has any rider, even if it has capacity for more.

For the common case (Mountable 1), this works correctly. But for Mountable 2+ Pokemon, the MountControls panel will not offer them as options once they have one rider, even though they could carry more.

**Fix:** Replace the simple `mountState` check with a capacity check:

```typescript
// Replace line 212:
if (c.mountState && !c.mountState.isMounted) continue
// With:
if (c.mountState && !c.mountState.isMounted) {
  const capacity = getMountCapacity(c)
  const currentRiders = countCurrentRiders(c.id, encounter.combatants)
  if (currentRiders >= capacity) continue
}
```

Import `getMountCapacity` and `countCurrentRiders` (already available from `mountingRules`).

### MEDIUM-2: Dismount check skipped when the fainted combatant is part of a mounted pair

**File:** `app/server/api/encounters/[id]/damage.post.ts`, lines 123-128

```typescript
if (combatant.mountState && !faintedFromAnySource) {
  if (triggersDismountCheck(damageResult.hpDamage, entity.maxHp)) {
    dismountCheck = buildDismountCheckInfo(combatant, 'damage', combatants)
  }
}
```

The dismount check is correctly skipped when the combatant faints (the auto-dismount handles that). However, the check uses `damageResult.hpDamage` which is the damage to real HP after temp HP absorption (per decree-004). This is correct.

The issue is ordering: the dismount check runs at line 123, but `heavilyInjuredHpLoss` is calculated at lines 66-78 and `faintedFromAnySource` is computed at line 114. The `faintedFromAnySource` check at line 124 correctly includes fainting from heavily injured penalty. However, the dismount check does not account for the _additional_ HP lost from heavily injured penalty when evaluating whether the total damage threshold was met.

Per PTU p.218, the dismount threshold is "damage equal or greater to 1/4th of the target's Max Hit Points." The heavily injured penalty is additional HP loss from an attack (PTU p.250: "takes Damage from an attack, they lose Hit Points equal to the number of Injuries"). This penalty HP loss is part of the damage event but is not added to `hpDamage`.

In practice, a mounted combatant with 5+ injuries taking 10 damage could: (1) lose 10 HP from the attack, (2) lose 5 HP from heavily injured penalty. Total damage event: 15 HP. If maxHp is 60, the threshold is 15. The dismount check should trigger (15 >= 15), but `hpDamage` is only 10, so it would not trigger (10 < 15).

**Fix:** Add the heavily injured penalty to the dismount check threshold evaluation:

```typescript
const totalDamageEvent = damageResult.hpDamage + heavilyInjuredHpLoss
if (combatant.mountState && !faintedFromAnySource) {
  if (triggersDismountCheck(totalDamageEvent, entity.maxHp)) {
    dismountCheck = buildDismountCheckInfo(combatant, 'damage', combatants)
  }
}
```

This also requires moving the dismount check block after the heavily injured calculation (which it already is, it just doesn't use the result).

### MEDIUM-3: GroupCombatantCard and PlayerCombatantCard mount indicators lack partner name

**Files:** `app/components/encounter/GroupCombatantCard.vue` (lines 125-133), `app/components/encounter/PlayerCombatantCard.vue` (lines 129-134)

Both components show generic text "Mounted" or "Carrying rider" without identifying the partner. Compare with CombatantCard (lines 394-407) which shows "Mounted on Arcanine" or "Carrying Red" by looking up the partner via `encounterStore.getMountPartner()`.

The GroupCombatantCard has a comment acknowledging this limitation (line 129: "we derive the partner name from the partner ID") but then doesn't actually do it.

For group/player views, knowing which Pokemon a trainer is mounted on (or which trainer a Pokemon is carrying) provides important tactical context.

**Fix:** Import `useEncounterStore` and use `getMountPartner()` to resolve the partner name, matching the pattern used in CombatantCard. The encounter store is already available in these views since they receive encounter data via WebSocket.

## What Looks Good

1. **Clean component architecture.** VTTMountedToken cleanly wraps VTTToken for the mount, renders the rider as a 60% overlay, and forwards all necessary props. The separation allows independent selection of mount and rider.

2. **Correct rider token filtering in GridCanvas.** The `mountedRiderIds` computed set correctly prevents double-rendering of rider tokens. Riders are only rendered by VTTMountedToken, not independently.

3. **Linked position movement is solid.** Both the client-side (`useEncounterActions.ts` handleTokenMove, lines 264-297) and server-side (`position.post.ts`, lines 82-120) correctly update both partner positions and sync `movementRemaining` on both mount states. The immutable spread pattern prevents direct mutation.

4. **Dismount check trigger is decree-compliant.** Per decree-004, the dismount threshold correctly uses `damageResult.hpDamage` (real HP after temp HP absorption), not total incoming damage. The `triggersDismountCheck` function uses `Math.floor(maxHp / 4)` which correctly handles integer division.

5. **Mounted Prowess edge integration is thorough.** The edge is checked via string matching on `edges` array, the auto-succeed is surfaced in mount API response and MountControls UI, and the +3 remain-mounted bonus is included in dismount check info.

6. **WebSocket mount_change event is well-structured.** The server WS handler relays mount_change to all encounter viewers. The client handler correctly notes that encounter state is updated via the companion encounter_update broadcast.

7. **Mount state synchronization in encounter store.** The `updateFromWebSocket` method (line 834) explicitly syncs `mountState` on each combatant, ensuring group/player views stay current.

8. **Good error handling in MountControls.** Both `handleMount` and `handleDismount` catch errors and show descriptive alerts with fallback messages.

9. **Mounting service validation is comprehensive.** The `validateMountPreconditions` function checks 10 preconditions including type, adjacency, capacity, side, status conditions, and existing mount state.

10. **Correct faint auto-dismount with position placement.** `clearMountOnFaint` properly handles both rider-faint (clear both states) and mount-faint (place rider adjacent using `findDismountPosition`).

11. **Commit granularity is good.** 17 commits across 14 source files is appropriate for this scope. Each commit is a single logical change.

## Verdict

**CHANGES_REQUIRED**

Two HIGH issues must be fixed before approval:
- HIGH-1: Badge overlap will cause visual corruption on elevated mounts
- HIGH-2: Movement modifiers double-applied to mounted combatants causes exponential speed loss during movement

Three MEDIUM issues should be fixed now while the developer is in this code:
- MEDIUM-1: Mount capacity check prevents Mountable 2+ from accepting additional riders in UI
- MEDIUM-2: Dismount check threshold should include heavily injured penalty HP loss
- MEDIUM-3: Group/player mount indicators should show partner name for tactical context

## Required Changes

1. **HIGH-1:** Offset the mount badge position in VTTToken to avoid collision with the elevation badge. Both are currently at `top: 2px; right: 2px`.

2. **HIGH-2:** Remove `applyMovementModifiers` call from the mounted-combatant branch in `getSpeed()` and `getMaxPossibleSpeed()`. Apply movement modifiers once in `resetMountMovement` instead, so the `movementRemaining` budget is correct at round start and decrements linearly.

3. **MEDIUM-1:** In MountControls `canMountOptions`, replace the blanket `mountState` skip with a capacity check using `getMountCapacity` and `countCurrentRiders`.

4. **MEDIUM-2:** In `damage.post.ts`, include `heavilyInjuredHpLoss` in the dismount check threshold evaluation.

5. **MEDIUM-3:** In GroupCombatantCard and PlayerCombatantCard, resolve partner name via encounter store, matching CombatantCard's pattern.
