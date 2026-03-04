---
review_id: code-review-316
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-005
domain: combat
commits_reviewed:
  - 0ae868a5
  - d2aacfef
  - f37032c7
  - ede47291
  - 507c467c
  - 685212ee
  - ab3e0247
  - 853a5344
  - 119be6b2
  - 8a88e844
  - 923e6445
files_reviewed:
  - app/server/services/living-weapon.service.ts
  - app/server/services/living-weapon-state.ts
  - app/server/services/combatant.service.ts
  - app/composables/useMoveCalculation.ts
  - app/utils/evasionCalculation.ts
  - app/utils/equipmentBonuses.ts
  - app/constants/livingWeapon.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/heal.post.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/living-weapon/disengage.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/types/encounter.ts
  - app/stores/encounter.ts
  - artifacts/designs/design-living-weapon-001/spec-p1.md
  - artifacts/designs/design-living-weapon-001/implementation-log.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-04T09:30:00Z
follows_up: code-review-301
---

## Review Scope

P1 implementation of feature-005 (Living Weapon Equipment Integration), covering:
- E. Equipment Integration: `computeEffectiveEquipment()` overlay, `getEffectiveEquipmentBonuses()` integration
- F. Doublade Dual-Wield Evasion (+2)
- G. Aegislash Shield DR (Light Shield passive/readied)
- H. Fainted Living Weapon -2 Penalty (evasion, shield, move access)
- I. Weapon Moves: `getGrantedWeaponMoves()` / `getEffectiveMoveList()` with Combat skill rank gating

11 commits reviewed across 13 changed files. Prior tier: P0 APPROVED (code-review-301, rules-review-274).

### Decree Compliance

- **decree-043** (skill rank gates move access, not engagement): COMPLIANT. `engageLivingWeapon()` has no rank check. `getGrantedWeaponMoves()` filters by `wielderCombatRank` per decree. Comment at line 463 explicitly cites decree-043.
- **decree-001** (minimum 1 damage at both steps): NOT AFFECTED. P1 does not modify the damage formula steps; it only modifies equipment bonuses feeding into the existing pipeline. Client-side damage calc in `useMoveCalculation.ts` still has dual `Math.max(1, ...)` floors at lines 636-638. Server-side `calculateDamage()` in `damageCalculation.ts` is unchanged.
- **decree-044** (remove phantom Bound condition): NOT AFFECTED. P1 does not touch switching or recall logic.

## Issues

### HIGH

#### HIGH-001: Weapon moves not injected into client-side move list (Section I incomplete)

**File:** `app/components/encounter/GMActionModal.vue` (line 236)

The spec (Section I, "Move Injection Pattern") states: "This is called by the combat composable when rendering the Pokemon's available moves." The `getEffectiveMoveList()` function was correctly implemented in `living-weapon.service.ts` and integrated server-side in `calculate-damage.post.ts` for damage calculations.

However, the client-side move list in `GMActionModal.vue` still reads moves directly from `(props.combatant.entity as Pokemon).moves` without any Living Weapon injection. This means:
1. Weapon moves (Wounding Strike, Double Swipe, Bleed!) will NOT appear in the GM Action Modal when a Living Weapon Pokemon is wielded.
2. The GM cannot select these moves for the Pokemon to use through the normal UI flow.
3. Server-side damage calculation would accept these moves via `getEffectiveMoveList`, but there is no UI path to invoke them.

**Fix required:** Add a client-side equivalent of `getEffectiveMoveList` (or import the existing one from the service) into the component that renders the Pokemon move list. The function already exists and the encounter store already carries `wieldRelationships` -- it just needs to be wired into the UI.

### MEDIUM

#### MEDIUM-001: `useMoveCalculation.ts` exceeds 800-line file size limit

**File:** `app/composables/useMoveCalculation.ts` (806 lines)

The file is now 806 lines, exceeding the 800-line CRITICAL threshold defined in project guidelines. The addition of `getEffectiveEquipBonuses` (22 lines, lines 87-102) pushed it over. Per review philosophy, this should be fixed now since the developer is already in the code.

**Fix required:** Extract `getEffectiveEquipBonuses` into a shared utility or composable. It duplicates logic from `getEffectiveEquipmentBonuses` in `living-weapon.service.ts` and from the equipment overlay in `evasionCalculation.ts`. A single shared client-side function would serve all three call sites, reducing duplication and bringing the file under 800 lines.

#### MEDIUM-002: `app-surface.md` not updated for P1 additions

No new endpoints or components were added in P1, but the following exports were added to existing service/utility files and should be documented:
- `getEffectiveEquipmentBonuses` and `refreshCombatantEquipmentBonuses` and `getGrantedWeaponMoves` and `getEffectiveMoveList` in `living-weapon.service.ts`
- `computeEffectiveEquipment` in `equipmentBonuses.ts`
- Updated signature of `computeTargetEvasions` in `evasionCalculation.ts` (new optional parameter)

The P0 fix cycle updated `app-surface.md` (commit d9b6c420). P1 adds 4 new public exports to existing files. Per project convention, `app-surface.md` should reflect these.

**Fix required:** Update `app-surface.md` to document the new P1 public API surface.

## What Looks Good

### Equipment Overlay Architecture
The `computeEffectiveEquipment()` -> `computeEquipmentBonuses()` pipeline is clean and well-separated. The overlay function creates a new `EquipmentSlots` object (immutable), and the existing bonus computation pipeline handles it without modification. The separation between "what equipment do I have" and "what bonuses does that equipment give" is maintained.

### Fainted Penalty Implementation
The -2 penalty is correctly applied in both `buildLivingWeaponEquippedItem` (Doublade dual-wield: `Math.max(0, 2 - 2) = 0`) and `buildLivingWeaponShield` (Aegislash passive: `Math.max(0, 2 - 2) = 0`, readied disabled). The `canReady: !isFainted` logic correctly prevents readying a fainted shield.

### Faint State Sync Coverage
All three endpoints that can change a wielded Pokemon's faint state are covered:
1. `damage.post.ts` -- on faint
2. `heal.post.ts` -- on faint removal (`faintedRemoved`)
3. `use-item.post.ts` -- on revive (`itemResult.effects?.revived`)

Each correctly reconstructs wield relationships, finds the wielder, and refreshes evasion. The pattern is consistent across all three.

### Code Path Coverage
The implementation log correctly identifies all 5 code paths that compute equipment bonuses and justifies each decision:
1. `buildCombatantFromEntity()` -- correctly excluded (called before wield relationships exist)
2. `calculateCurrentInitiative()` -- updated with optional `wieldRelationships` parameter
3. `calculate-damage.post.ts` -- uses `getEffectiveEquipmentBonuses`
4. `computeTargetEvasions()` / `useMoveCalculation.ts` -- uses effective equipment
5. `breather.post.ts` -- correctly excluded (only checks `speedDefaultCS`, unaffected by Living Weapon)

### Weapon Move Configuration
Species-move mappings match PTU RAW:
- Honedge (Simple): Wounding Strike (Adept)
- Doublade (Simple): Double Swipe (Adept)
- Aegislash (Fine): Wounding Strike (Adept) + Bleed! (Master)

The `meetsSkillRequirement` function uses a clean rank-order comparison. Duplicate prevention via `existingNames` Set is correct.

### Decree-043 Compliance
Skill rank gating is applied exclusively at the move injection layer (`getGrantedWeaponMoves`), not at engagement. The engage endpoint has no rank validation. Comments explicitly cite decree-043 at lines 145-147 of `living-weapon.service.ts` and line 463 of `getGrantedWeaponMoves`.

### Immutability
All state transitions are immutable. `refreshCombatantEquipmentBonuses` returns a new `Combatant` object via spread. `computeEffectiveEquipment` spreads `baseEquipment`. The damage/heal endpoints correctly replace the combatant in the array by index rather than mutating.

### Commit Granularity
13 commits for 11 files changed, each with a clear single purpose. Integration points were committed separately from the core functions. Documentation commit is separate from code changes.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue blocks approval: weapon moves are not injected into the client-side move list, making Section I functionally incomplete for user-facing gameplay. The `getEffectiveMoveList` function exists and works correctly, but there is no UI integration -- the GM cannot see or select weapon moves for a wielded Living Weapon Pokemon.

Two MEDIUM issues should be fixed during this cycle: the 806-line file size violation on `useMoveCalculation.ts`, and the missing `app-surface.md` update.

## Required Changes

1. **HIGH-001:** Wire `getEffectiveMoveList` (or a client-side equivalent) into `GMActionModal.vue` (or whichever component renders the Pokemon move list) so weapon moves appear when a Living Weapon Pokemon is wielded. The encounter store already carries `wieldRelationships` and `combatants` -- the function just needs to be called.

2. **MEDIUM-001:** Extract `getEffectiveEquipBonuses` from `useMoveCalculation.ts` to bring the file under 800 lines. Consider creating a shared client-side utility that all three call sites (`useMoveCalculation.ts`, `evasionCalculation.ts`, and any future consumers) can import.

3. **MEDIUM-002:** Update `.claude/skills/references/app-surface.md` to document the new P1 public exports (`getEffectiveEquipmentBonuses`, `refreshCombatantEquipmentBonuses`, `getGrantedWeaponMoves`, `getEffectiveMoveList`, `computeEffectiveEquipment`, updated `computeTargetEvasions` signature).
