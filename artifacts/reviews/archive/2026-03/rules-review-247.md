---
review_id: rules-review-247
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-020
domain: healing
commits_reviewed:
  - 327239ed
  - 67b4b170
  - 6229e6ba
  - f2147e4c
  - e9f42b61
mechanics_verified:
  - healing-item-catalog-values
  - hp-restoration-amounts
  - injury-capped-effective-max-hp
  - item-healing-no-minimum
  - fainted-target-validation
  - target-refusal-mechanic
  - full-hp-validation
  - effective-max-hp-display
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Basic-Restoratives
  - core/09-gear-and-items.md#Using-Items
  - core/07-combat.md#Dealing-with-Injuries
reviewed_at: 2026-03-02T11:15:00Z
follows_up: rules-review-243
---

## Context

Re-review of feature-020 P0 (Healing Item System) fix cycle. The previous rules review (rules-review-243) found 0 PTU rule issues and was APPROVED. The previous code review (code-review-267) found 3 HIGH + 4 MEDIUM code quality issues. Five fix commits addressed all 7 issues. This review verifies: (1) no PTU rule regressions were introduced by the fixes, (2) all mechanics verified in rules-review-243 remain correct, (3) the M1 fix (effective max HP display) correctly implements decree-017 in the UI.

## Fix Verification (All 7 Issues from code-review-267)

### H1: Double validation removed -- RESOLVED

**Commit:** 327239ed
**Change:** Removed the explicit `validateItemApplication()` call from `use-item.post.ts` lines 74-78 and the `validateItemApplication` import.
**Rules impact:** None. `applyHealingItem()` at line 88 of `healing-item.service.ts` still calls `validateItemApplication()` internally before applying effects. The validation chain is intact -- fainted check, revive check, full-HP check all still execute exactly once per request.

### H2: Duplicate getCombatantName replaced -- RESOLVED

**Commit:** 67b4b170
**Change:** Removed the local `getCombatantName` function (lines 189-195) from `UseItemModal.vue`. Replaced with `const { getCombatantName } = useCombatantDisplay()` at line 130. Removed unused `Pokemon` and `HumanCharacter` type imports.
**Rules impact:** None. Display-only change. The shared `useCombatantDisplay` composable returns `pokemon.nickname || pokemon.species` for Pokemon and `human.name` for Humans -- identical behavior to the deleted local function.

### H3: Dead getApplicableItems stub deleted -- RESOLVED

**Commit:** 6229e6ba
**Change:** Removed the no-op `getApplicableItems` function from `app/constants/healingItems.ts`. No callers existed.
**Rules impact:** None. The real filtering logic in `useHealingItems.getApplicableItems()` (composable, line 24) is unaffected. It correctly filters by category and checks fainted status and effective max HP before showing items.

### M1: Target dropdown now shows effective max HP -- RESOLVED

**Commit:** 67b4b170
**Change:** Template line 26 changed from `c.entity.maxHp` to `getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0)`.
**Rules impact:** POSITIVE. This is a decree-017 compliance improvement. The target dropdown now correctly shows the injury-reduced effective max HP ceiling, matching what the healing pipeline actually caps at. A Pokemon with 50 maxHp and 3 injuries now shows "(30/35 HP)" instead of the misleading "(30/50 HP)".

**Verification:** `getEffectiveMaxHp` from `~/utils/restHealing` (line 20-23): `Math.floor(maxHp * (10 - effectiveInjuries) / 10)`. This matches PTU p.250: "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th." Per decree-017, the injury cap is universal and applies to all healing display contexts.

### M2: Convoluted ternary simplified -- RESOLVED

**Commit:** 6229e6ba
**Change:** `healing-item.service.ts` line 58 changed from the nested ternary chain `${entity.currentHp >= 0 ? (target.type === 'pokemon' ? ... : ...) : 'Target'}` to `${getEntityDisplayName(target)}`.
**Rules impact:** None. Display-only change. `getEntityDisplayName` (line 142-147 of same file) returns `pokemon.nickname || pokemon.species || 'Pokemon'` for Pokemon and `human.name || 'Character'` for Humans. The fallback strings ('Pokemon', 'Character') are slightly more informative than the old 'Target' fallback, but this is purely cosmetic.

### M3: app-surface.md updated -- RESOLVED

**Commit:** e9f42b61
**Change:** Added the use-item endpoint, healing item system paragraph (constants, service, composable, modal, CombatantCard integration, store action, WebSocket event), and service table entry.
**Rules impact:** None. Documentation only.

### M4: Hardcoded 3px gap replaced -- RESOLVED

**Commit:** f2147e4c
**Change:** `CombatantCard.vue` line 818 changed from `gap: 3px` to `gap: $spacing-xs`.
**Rules impact:** None. Styling only.

## Mechanics Re-Verified (Post-Fix)

### 1. Healing Item Catalog Values (PTU p.276)

- **Rule:** "Potion: Heals 20 Hit Points. Super Potion: Heals 35 Hit Points. Hyper Potion: Heals 70 Hit Points." (`core/09-gear-and-items.md#Basic-Restoratives`)
- **Implementation:** `app/constants/healingItems.ts` -- all 14 catalog entries unchanged by fix commits.
- **Status:** CORRECT -- No regression. Values match PTU 1.05 exactly (confirmed against rules-review-243 table).

### 2. HP Restoration Pipeline

- **Rule:** Items heal their exact PTU amount, capped at injury-reduced effective max HP.
- **Implementation:** `healing-item.service.ts` line 96-98: `applyHealingToEntity(target, { amount: item.hpAmount })`. The `applyHealingToEntity` in `combatant.service.ts` line 234-236: `Math.min(effectiveMax, previousHp + options.amount)` where `effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)`.
- **Status:** CORRECT -- No regression. The H1 fix (removing double validation) does not touch the healing pipeline. The healing flow is: validate -> apply -> cap at effective max.

### 3. Injury-Capped Effective Max HP (decree-017)

- **Rule:** Per decree-017: "The injury cap on healing is universal and cannot be bypassed by any healing source."
- **Implementation:** All three healing paths (hpAmount, healToFull, healToPercent) in `healing-item.service.ts` use `getEffectiveMaxHp`. The UI now also displays effective max HP in the target dropdown (M1 fix).
- **Status:** CORRECT -- No regression. Decree-017 compliance is now improved by the M1 display fix.

### 4. No Minimum Healing for Items (decree-029 scope)

- **Rule:** Per decree-029: "Rest healing has a minimum of 1 HP." This does NOT apply to items.
- **Implementation:** `applyHealingToEntity` (combatant.service.ts line 232-248) applies no `Math.max(1, ...)` floor. Items heal exact amounts.
- **Status:** CORRECT -- No regression.

### 5. Fainted Target Validation

- **Rule:** Fainted Pokemon cannot receive normal items; Revive items require fainted targets.
- **Implementation:** `validateItemApplication` (healing-item.service.ts lines 44-51): Revive requires fainted, non-revive rejects fainted (except Full Restore curesAllStatus).
- **Status:** CORRECT -- No regression. The M2 simplification of the display name ternary is at line 58, well after the fainted validation logic at lines 44-51.

### 6. Target Refusal

- **Rule:** "The target of these items may refuse to stay still and be healed; in that case, the item is not used." (`core/09-gear-and-items.md`, line 341-342)
- **Implementation:** `use-item.post.ts` lines 57-66: `targetAccepts === false` returns early without modifying encounter state.
- **Status:** CORRECT -- No regression. The H1 fix removed validation lines 74-78, which are after the refusal check at line 57.

### 7. Full HP Validation

- **Rule:** Cannot use a healing item on a target already at effective max HP.
- **Implementation:** `validateItemApplication` line 57: `entity.currentHp >= effectiveMax` using `getEffectiveMaxHp`. Error message now uses `getEntityDisplayName(target)` (M2 fix).
- **Status:** CORRECT -- No regression.

### 8. Effective Max HP Display (NEW -- M1 fix verification)

- **Rule:** Per decree-017, the injury cap is universal. Display contexts should show effective max HP to avoid misleading the GM.
- **Implementation:** `UseItemModal.vue` line 26: `getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0)` imported from `~/utils/restHealing`.
- **Status:** CORRECT -- New compliance. The UI now accurately reflects the injury-reduced ceiling that the healing pipeline enforces. A 3-injury Pokemon with 50 maxHp shows "/35 HP" in the dropdown, matching the actual healing cap.

## Decree Compliance

- **decree-017** (Pokemon Center heals to effective max HP, respecting injury cap): COMPLIANT. All healing paths cap at `getEffectiveMaxHp`. UI display now also shows effective max HP (M1 fix improvement).
- **decree-029** (Rest healing min 1 HP, does NOT apply to items): COMPLIANT. No minimum floor applied to item healing.
- **decree-016** (Extended rest clears only Drained AP): NOT APPLICABLE to item healing.
- **decree-019** (New Day is pure counter reset): NOT APPLICABLE to item healing.

## New Issues Introduced by Fixes

None. All 5 fix commits are narrowly scoped and do not alter game logic:
- H1 removes redundant pre-validation (service still validates internally).
- H2 swaps a local function for the shared composable (identical behavior).
- H3 deletes dead code (no callers).
- M1 adds `getEffectiveMaxHp` to a display-only template expression.
- M2 replaces a complex ternary with a clean function call (same output).
- M3 updates documentation.
- M4 swaps a hardcoded pixel value for a SCSS variable.

**Note (informational, not an issue):** The H2 fix removed `Pokemon` and `HumanCharacter` type imports but left `StatusCondition` imported in `UseItemModal.vue` line 110. `StatusCondition` is not used anywhere in the component. This is a trivial unused import, not a rules concern -- flagging for the code reviewer (code-review-271) to note.

## Summary

All 7 issues from code-review-267 are fully resolved. The fix commits are surgical -- each addresses exactly the identified issue without touching game logic. All 8 mechanics verified in the original rules-review-243 remain correct after the fix cycle. The M1 fix (effective max HP display) is a decree-017 compliance improvement. No new PTU rule issues were introduced.

## Rulings

- **decree-017 display compliance confirmed.** The M1 fix correctly extends decree-017's injury cap principle to the UI display layer. The target dropdown now shows `getEffectiveMaxHp` values, matching what the healing pipeline enforces internally.
- **No minimum healing floor for items confirmed.** Per decree-029's explicit scope limitation, item healing continues to use exact PTU amounts with no `Math.max(1, ...)` floor. This was not affected by any fix commit.
- **Catalog values unchanged.** All 14 items in `HEALING_ITEM_CATALOG` remain at their PTU 1.05 values. The H3 fix (deleted dead stub) does not affect the catalog data.

## Verdict

**APPROVED** -- All 7 issues from code-review-267 are resolved. No PTU rule regressions introduced. All healing mechanics remain correct per PTU 1.05 and active decrees. Decree-017 compliance improved by M1 display fix.

## Required Changes

None.
