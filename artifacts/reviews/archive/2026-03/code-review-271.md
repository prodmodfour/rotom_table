---
review_id: code-review-271
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-020
domain: healing
commits_reviewed:
  - 327239ed
  - 67b4b170
  - 6229e6ba
  - f2147e4c
  - e9f42b61
files_reviewed:
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/services/healing-item.service.ts
  - app/components/encounter/UseItemModal.vue
  - app/composables/useHealingItems.ts
  - app/constants/healingItems.ts
  - app/components/encounter/CombatantCard.vue
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T11:15:00Z
follows_up: code-review-267
---

## Review Scope

Re-review of feature-020 P0 (Healing Item System) fix cycle. code-review-267 found 3 HIGH + 4 MEDIUM issues. The developer addressed all 7 issues across 5 commits. This review verifies each fix individually and checks for regressions.

### Decree Compliance

- **decree-017** (injury cap is universal): COMPLIANT. The UseItemModal target dropdown now shows `getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0)` instead of raw `maxHp`. The service's `validateItemApplication` and `applyHealingItem` both use `getEffectiveMaxHp` for HP cap calculations. Per decree-017, the injury cap applies to all healing sources including items.
- **decree-029** (rest healing minimum 1 HP, not items): COMPLIANT. No minimum floor is applied to item healing. This was already correct in the original implementation and remains unchanged through the fix cycle.

---

## Issue Resolution Verification

### H1: Double validation in endpoint + service -- RESOLVED

**Commit:** `327239ed`
**Original issue:** `use-item.post.ts` called `validateItemApplication()` at line 74, then called `applyHealingItem()` at line 81 which internally calls `validateItemApplication()` again at line 88 of the service.

**Verification:** The endpoint no longer imports `validateItemApplication` (import statement at line 17-18 now only brings `applyHealingItem` and `getEntityDisplayName`). Lines 74-78 (the explicit validation call and error throw) are removed. The endpoint now calls `applyHealingItem` directly at line 75 and checks `itemResult.success` at line 77. The service still performs validation internally (line 88 of service), which is the correct single-responsibility pattern.

**Status:** Correctly fixed. Validation runs exactly once per request via the service layer.

---

### H2: Duplicate getCombatantName in UseItemModal -- RESOLVED

**Commit:** `67b4b170`
**Original issue:** `UseItemModal.vue` had a local `getCombatantName` function (lines 189-195) that duplicated the logic in `useCombatantDisplay` composable.

**Verification:** The local function definition is completely removed. Line 130 now reads `const { getCombatantName } = useCombatantDisplay()`, using the shared composable that 8+ other components use. The unused type imports (`Pokemon`, `HumanCharacter`) that only served the local function were also removed -- the import at line 110 now only brings `Combatant` and `StatusCondition`. The `getCombatantName` from `useCombatantDisplay` handles the same `pokemon.nickname || pokemon.species` / `human.name` logic with an additional null-safety check (`if (!combatant?.entity) return 'Unknown'`), making it strictly more robust than the removed local version.

**Status:** Correctly fixed. DRY principle restored.

---

### H3: Dead getApplicableItems stub in constants -- RESOLVED

**Commit:** `6229e6ba`
**Original issue:** `healingItems.ts` had a `getApplicableItems` function (lines 195-203) that accepted a structured parameter object but returned all items unfiltered (no-op stub).

**Verification:** Grep confirms `getApplicableItems` no longer exists in `app/constants/healingItems.ts`. The only references to `getApplicableItems` are in the composable (`useHealingItems.ts` line 24, 91) and the component (`UseItemModal.vue` line 181), where the real implementation lives. The constants file now correctly exports only: `HEALING_ITEM_CATALOG`, `HealingItemDef`, `HealingItemCategory`, `getRestorativeItems`, `getCureItems`, `ITEM_CATEGORY_LABELS`.

**Status:** Correctly fixed. Dead code removed.

---

### M1: Target dropdown shows maxHp instead of effective max HP -- RESOLVED

**Commit:** `67b4b170`
**Original issue:** `UseItemModal.vue` line 26 showed `c.entity.maxHp` (raw max HP) in the target dropdown.

**Verification:** Line 26 now reads:
```vue
{{ getCombatantName(c) }} ({{ c.entity.currentHp }}/{{ getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0) }} HP)
```
The `getEffectiveMaxHp` is imported from `~/utils/restHealing` at line 109. This correctly shows the injury-reduced maximum. A Pokemon with 50 maxHp and 3 injuries will display `35` instead of `50`, matching what the healing system actually caps at (per decree-017).

**Status:** Correctly fixed. UI now matches the healing ceiling.

---

### M2: Convoluted display name ternary in validateItemApplication -- RESOLVED

**Commit:** `6229e6ba`
**Original issue:** `healing-item.service.ts` line 58 had a deeply nested ternary: `${entity.currentHp >= 0 ? (target.type === 'pokemon' ? getPokemonDisplayName(...) : ...) : 'Target'}`.

**Verification:** Line 58 now reads:
```typescript
return `${getEntityDisplayName(target)} is already at full HP`
```
This uses the `getEntityDisplayName` function defined at lines 142-147 of the same file, which cleanly handles both Pokemon (nickname/species) and HumanCharacter (name) with appropriate fallbacks. The semantically meaningless `currentHp >= 0` branching is eliminated.

**Status:** Correctly fixed. Readable and uses existing utility.

---

### M3: app-surface.md not updated -- RESOLVED

**Commit:** `e9f42b61`
**Original issue:** New endpoint, service, composable, component, and constants were not documented in `app-surface.md`.

**Verification:** `.claude/skills/references/app-surface.md` now includes:
1. **Endpoint** (line 157): `POST /api/encounters/:id/use-item` with P0/P1/P2 scope notes
2. **System paragraph** (line 159): Comprehensive description covering `constants/healingItems.ts`, `server/services/healing-item.service.ts`, `composables/useHealingItems.ts`, `components/encounter/UseItemModal.vue`, `CombatantCard.vue` integration, store action, and WebSocket event
3. **Service table entry** (line 283): `server/services/healing-item.service.ts` with function listing

The documentation correctly reflects the post-fix state (e.g., mentions `getRestorativeItems, getCureItems, ITEM_CATEGORY_LABELS` for constants -- `getApplicableItems` is correctly not listed there since it was removed).

**Status:** Correctly fixed. All new surface area documented.

---

### M4: Hardcoded 3px gap in CombatantCard -- RESOLVED

**Commit:** `f2147e4c`
**Original issue:** `CombatantCard.vue` line 816 had `gap: 3px` instead of using the SCSS spacing scale.

**Verification:** Line 818 now reads `gap: $spacing-xs;` (`$spacing-xs` = 4px, the smallest value in the project's spacing scale). This matches the pattern used by all other spacing values in the file and across the project.

**Status:** Correctly fixed. Design system consistency restored.

---

## What Looks Good

1. **All 7 issues fully addressed.** No partial fixes, no shortcuts, no "addressed differently." Each fix matches the recommendation from code-review-267 precisely.

2. **Commit granularity is appropriate.** Five commits for seven issues, grouping related fixes logically: H1 alone (endpoint-only change), H2+M1 together (both in UseItemModal, related to display), H3+M2 together (both dead/convoluted code cleanup), M4 alone (single-line SCSS fix), M3 alone (docs update). Each commit message clearly references which review issues it addresses.

3. **No regressions introduced.** The fix commits are strictly subtractive or replacement -- code was removed or simplified, not added. No new logic paths were introduced. Import cleanup was thorough (removed `validateItemApplication` from endpoint import, removed `Pokemon`/`HumanCharacter` from modal import).

4. **Decree compliance maintained.** The effective max HP display (M1 fix) directly enforces decree-017 visibility in the UI. The service-layer validation and application logic remain unchanged and continue to respect the injury cap universally.

5. **Pre-existing CombatantCard size (868 lines) is tracked.** This exceeds the 800-line limit but predates the fix cycle (868 lines before commit `327239ed`). Ticket `refactoring-108` already tracks this. The fix commits did not increase the line count.

---

## Verdict

**APPROVED**

All 7 issues from code-review-267 are verified as resolved. No new issues were introduced by the fix commits. Decree compliance is confirmed. The fix cycle is clean and can proceed.

---

## Required Changes

None.
