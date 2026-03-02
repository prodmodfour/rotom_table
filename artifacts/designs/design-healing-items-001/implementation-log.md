# Implementation Log: design-healing-items-001

## P0 Implementation (2026-03-01)

Branch: `slave/2-dev-feature-020-p0-20260301`

### Section A: Healing Item Catalog Constants
- **Commit:** `c0940d17`
- **File:** `app/constants/healingItems.ts` (new)
- HealingItemDef interface with all PTU fields
- Full 14-item catalog (restoratives, cures, combined, revives)
- Helper functions: getRestorativeItems(), getCureItems(), getApplicableItems()
- ITEM_CATEGORY_LABELS for UI display

### Section B: Apply-Item Service
- **Commit:** `10677a83`
- **File:** `app/server/services/healing-item.service.ts` (new)
- validateItemApplication(): checks item exists, target state (fainted, full HP)
- applyHealingItem(): HP restoration via existing applyHealingToEntity (respects decree-017 injury cap)
- getEntityDisplayName(): extracts display name from combatant
- P0 processes hpAmount, healToFull, healToPercent. Status cure/revive stubbed for P1.

### Section C: Apply-Item API Endpoint
- **Commit:** `1f6bc2c4`
- **File:** `app/server/api/encounters/[id]/use-item.post.ts` (new)
- POST with {itemName, userId, targetId, targetAccepts}
- P0 category restriction: only 'restorative' items allowed
- Target refusal returns success without consuming item
- DB sync via syncHealingToDatabase, encounter state save
- WebSocket broadcast: item_used event

### Section D: Encounter Store Action
- **Commit:** `fa366600`
- **File:** `app/stores/encounter.ts` (modified)
- Added useItem() action calling POST /api/encounters/:id/use-item
- Returns itemResult with hpHealed, refused, repulsive flags
- Added StatusCondition to imports

### Section E: Basic GM UI
- **Commit:** `3cbd84e2` - useHealingItems composable
  - **File:** `app/composables/useHealingItems.ts` (new)
  - getApplicableItems() filters by category and target state
  - useItem() delegates to store with loading/error tracking
  - getItemsByCategory() for grouped display
- **Commit:** `4ecf6b19` - UseItemModal component
  - **File:** `app/components/encounter/UseItemModal.vue` (new)
  - Target selector dropdown (all alive combatants)
  - Applicable item list with PhFirstAidKit icons, HP amount, cost, description
  - Apply Item button, Target Refuses button, Cancel
  - Result display (success with HP healed, or refusal warning)
  - Error display for validation failures
- **Commit:** `ca6034d7` - CombatantCard integration
  - **File:** `app/components/encounter/CombatantCard.vue` (modified)
  - Added "Item" button with PhFirstAidKit icon in GM actions area
  - UseItemModal rendered conditionally, closes on item use

### Deviations from Spec
- None. Implementation follows spec-p0.md exactly.

### P1 Readiness
- Catalog includes all P1 items (cures, revives, combined) with data
- Service has validation stubs for non-restorative categories
- API endpoint has P0 category whitelist (easy to expand)
- Composable getApplicableItems has allowedCategories parameter

## P0 Fix Cycle (2026-03-02)

Branch: `slave/2-dev-feature-020-fix-20260302`
Review: code-review-267 CHANGES_REQUIRED (3H + 4M), rules-review-243 APPROVED.

### H1: Remove Double Validation
- **Commit:** `188a1257`
- **File:** `app/server/api/encounters/[id]/use-item.post.ts` (modified)
- Removed explicit validateItemApplication() call — applyHealingItem() validates internally
- Removed unused validateItemApplication import

### H2 + M1: UseItemModal Composable Reuse + Effective Max HP
- **Commit:** `50e5a29d`
- **File:** `app/components/encounter/UseItemModal.vue` (modified)
- Replaced local getCombatantName() with useCombatantDisplay() composable
- Target dropdown now shows effective max HP (injury-reduced, decree-017) instead of raw maxHp
- Removed unused Pokemon/HumanCharacter type imports

### H3 + M2: Dead Stub Removal + Ternary Cleanup
- **Commit:** `c5847923`
- **Files:** `app/constants/healingItems.ts`, `app/server/services/healing-item.service.ts` (modified)
- Deleted getApplicableItems() stub from constants (real logic in composable)
- Replaced convoluted nested ternary with getEntityDisplayName(target) call

### M4: Hardcoded Gap Fix
- **Commit:** `cae215af`
- **File:** `app/components/encounter/CombatantCard.vue` (modified)
- Replaced `gap: 3px` with `gap: $spacing-xs` (4px) for use-item button

### M3: App Surface Documentation
- **Commit:** `976d9bc6`
- **File:** `.claude/skills/references/app-surface.md` (modified)
- Added use-item endpoint to encounters API list
- Added healing item system paragraph (constants, service, composable, modal, store, WebSocket)
- Added healing-item.service.ts to server services table

## P1 Implementation (2026-03-02)

Branch: `slave/4-dev-feature-020-p1-20260302`
Review: code-review-271 APPROVED (0 issues). rules-review-247 APPROVED (0 issues).

### Section F: Status Cure Items
- **Commit:** `71b782aa` — Added Awakening item to catalog (cures Asleep + Bad Sleep, $200)
- **Commit:** `5539eb95` — Core cure logic in healing-item.service.ts:
  - `resolveConditionsToCure()`: resolves which conditions an item cures (specific, all-persistent, all-status modes)
  - Integration with `updateStatusConditions()` for CS reversal (decree-005)
  - `badlyPoisonedRound` reset when Badly Poisoned is cured
  - Updated `validateItemApplication()` for cure items: requires matching curable conditions
- **Commit:** `1e15b3e9` — API endpoint: removed P0 category restriction, syncs stageModifiers to DB

### Section G: Revive Items
- **Commit:** `5539eb95` — Revive logic in `applyReviveItem()`:
  - Explicitly removes Fainted status before setting HP (avoids applyHealingToEntity double-processing)
  - Revive: sets to fixed HP (20), capped at effective max
  - Revival Herb: sets to 50% of effective max HP (floor), minimum 1 HP
  - Validation: revive items require Fainted target; non-fainted returns error

### Section H: Full Restore (Combined Item)
- **Commit:** `5539eb95` — Combined handling in `applyCombinedItem()`:
  - Cures all status conditions first (CS reversal before HP healing)
  - Then heals 80 HP (capped at effective max)
  - Does NOT revive from Fainted — rejects fainted targets
  - Validation: requires either HP below max OR curable conditions

### Section I: Repulsive Items
- **Commit:** `0636470b` — UI repulsive indicators:
  - PhWarning icon + "Repulsive" badge on repulsive items
  - Tooltip: "May decrease Pokemon loyalty with repeated use"
  - Repulsive flag in result display with PhWarning icon
  - No mechanical loyalty effect (deferred)

### Updated Composable
- **Commit:** `7462947d` — `useHealingItems.ts`:
  - `getApplicableItems()` now defaults to all P1 categories
  - Filters restoratives by HP need, cures by matching conditions, combined by HP or condition need, revives by Fainted status

### Updated UseItemModal UI
- **Commit:** `0636470b` — `UseItemModal.vue`:
  - Items grouped into 4 sections: Restoratives, Status Cures, Combined, Revives
  - Category-specific icons (PhFirstAidKit, PhPill, PhStar, PhHeartBreak)
  - Color-coded icon variants per category
  - Fainted indicator in target dropdown
  - Result display shows revive, conditions cured, and repulsive warnings
  - Empty categories are hidden

### Unit Tests
- **Commit:** `b178d013` — `app/tests/unit/services/healing-item.service.test.ts` (new):
  - resolveConditionsToCure: specific conditions, all-persistent, all-status, edge cases
  - validateItemApplication: all categories, fainted/non-fainted, full HP, injury cap
  - applyHealingItem: restoratives, cures with CS reversal, revives, combined items
  - 40+ test cases covering cure resolution, revive HP calculation, Full Restore

### Deviations from Spec
- Added Awakening item (Asleep + Bad Sleep cure, $200) — referenced in spec section F item list but not in catalog P0 entries
- Revival Herb uses `Math.max(1, floor(effectiveMax * 0.5))` to guarantee minimum 1 HP even with extreme injuries
