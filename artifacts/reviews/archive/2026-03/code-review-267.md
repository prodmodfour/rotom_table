---
review_id: code-review-267
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - fa825daf
  - f8ccb3ef
  - 97127519
  - 8c921290
  - 091b016e
  - af435404
  - 166aacdc
  - 1d8ac8aa
files_reviewed:
  - app/constants/healingItems.ts
  - app/server/services/healing-item.service.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/stores/encounter.ts
  - app/composables/useHealingItems.ts
  - app/components/encounter/UseItemModal.vue
  - app/components/encounter/CombatantCard.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 3
  medium: 4
reviewed_at: 2026-03-02T09:15:00Z
follows_up: null
---

## Review Scope

First review of feature-020 P0: Healing Item System. Eight commits implementing Sections A-E of design-healing-items-001/spec-p0.md:
- Section A: PTU healing item catalog constants
- Section B: Apply-item service with validation and HP restoration
- Section C: Use-item API endpoint
- Section D: Encounter store useItem action
- Section E: useHealingItems composable, UseItemModal component, CombatantCard integration

Total: ~1168 lines added across 10 files (7 source files, 3 artifact/doc files).

### Decree Compliance

- **decree-017** (Pokemon Center heals to effective max HP, respecting injury cap): COMPLIANT. The healing-item service delegates to `applyHealingToEntity` which caps at `getEffectiveMaxHp`. The `healToPercent` and `healToFull` paths both calculate against effective max HP. Per decree-017, the injury cap is universal and cannot be bypassed by any healing source.
- **decree-029** (Rest healing has minimum of 1 HP): NOT APPLICABLE. Per the decree note, this applies only to rest healing, not items. Items heal exact PTU amounts. The implementation correctly does not apply a minimum-1-HP floor to item healing.

---

## Issues

### HIGH

#### H1. Double validation in API endpoint and service function

**File:** `app/server/api/encounters/[id]/use-item.post.ts` (line 75) and `app/server/services/healing-item.service.ts` (line 88)

The API endpoint calls `validateItemApplication()` at line 75, then calls `applyHealingItem()` at line 81, which internally calls `validateItemApplication()` again at line 88. This means every successful item use runs full validation twice against the same data. While not a correctness bug, it is a performance and clarity issue -- the redundant validation obscures which layer is responsible for validation.

**Fix:** Either remove the explicit `validateItemApplication` call from the API endpoint (since `applyHealingItem` already calls it internally and returns an error result), or have `applyHealingItem` accept a `skipValidation` flag for when the caller has already validated. The former is cleaner -- just remove lines 74-78 from the endpoint file and let the service handle it. The endpoint should still check for `!itemResult.success` (which it already does at line 83).

---

#### H2. Duplicate `getCombatantName` logic in UseItemModal

**File:** `app/components/encounter/UseItemModal.vue` (lines 189-195)

The `getCombatantName` function is duplicated locally in UseItemModal. The project already has a `useCombatantDisplay` composable (`app/composables/useCombatantDisplay.ts`) that provides `getCombatantName` and is used by at least 8 other components (VTTContainer, InitiativeTracker, PlayerEncounterView, PlayerCombatActions, MoveTargetModal, TargetSelector, PlayerCombatantInfo, etc.).

**Fix:** Replace the local `getCombatantName` function with `const { getCombatantName } = useCombatantDisplay()`. Remove the local function definition at lines 189-195 and the unused `Pokemon`/`HumanCharacter` type imports that only served that function.

---

#### H3. Dead stub function `getApplicableItems` in constants file

**File:** `app/constants/healingItems.ts` (lines 195-203)

The `getApplicableItems` function in the constants file is a no-op stub that ignores all its parameters (prefixed with `_params`) and returns all items unfiltered. The real implementation lives in the `useHealingItems` composable. This stub is confusing because:
1. A caller might import the wrong `getApplicableItems` (constants vs composable) and get silently wrong results.
2. It accepts a structured parameter object but does nothing with it, which is misleading.
3. No code currently calls this stub, making it dead code.

**Fix:** Remove the `getApplicableItems` function from `app/constants/healingItems.ts` entirely. The composable handles this logic correctly. If future P1 code needs a shared pure-function version, it can be added when needed with an actual implementation.

---

### MEDIUM

#### M1. Target dropdown shows `maxHp` instead of effective max HP

**File:** `app/components/encounter/UseItemModal.vue` (line 26)

```vue
{{ getCombatantName(c) }} ({{ c.entity.currentHp }}/{{ c.entity.maxHp }} HP)
```

The target selector dropdown shows `maxHp` (base max HP before injury reduction). For a combatant with injuries, this is misleading -- they cannot actually heal to `maxHp`, only to effective max HP (per decree-017). The GM would see something like "Pikachu (30/50 HP)" when the actual ceiling is 35 (3 injuries). This creates confusion about how much healing is needed.

**Fix:** Import `getEffectiveMaxHp` from `~/utils/restHealing` and display effective max HP:
```vue
{{ getCombatantName(c) }} ({{ c.entity.currentHp }}/{{ getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0) }} HP)
```

---

#### M2. Convoluted display name logic in `validateItemApplication`

**File:** `app/server/services/healing-item.service.ts` (line 58)

```typescript
return `${entity.currentHp >= 0 ? (target.type === 'pokemon' ? getPokemonDisplayName(entity as Pokemon) : (entity as HumanCharacter).name) : 'Target'} is already at full HP`
```

This ternary chain is deeply nested and hard to read. The `entity.currentHp >= 0` condition as a check for whether to show a name makes no semantic sense -- currentHp could be 0 for a fainted entity, but the code would still show the name. The only case where this returns "Target" is when currentHp is negative, which should not occur at this code path (HP is clamped to 0 by damage logic). The `getEntityDisplayName` function defined at lines 142-147 of the same file already provides this exact functionality more cleanly.

**Fix:** Replace the ternary chain with:
```typescript
return `${getEntityDisplayName(target)} is already at full HP`
```

---

#### M3. `app-surface.md` not updated with new endpoint, component, composable, and service

**File:** `.claude/skills/references/app-surface.md`

The implementation adds a new API endpoint (`/api/encounters/[id]/use-item`), a new component (`UseItemModal`), a new composable (`useHealingItems`), a new service (`healing-item.service.ts`), and a new constants file (`healingItems.ts`). None of these are reflected in `app-surface.md`. Per the review checklist: "If new endpoints/components/routes/stores: was `app-surface.md` updated?"

**Fix:** Update `app-surface.md` to include:
- `app/constants/healingItems.ts` in the constants section
- `app/server/services/healing-item.service.ts` in the services section
- `app/server/api/encounters/[id]/use-item.post.ts` in the API endpoints section
- `app/composables/useHealingItems.ts` in the composables section
- `app/components/encounter/UseItemModal.vue` in the components section

---

#### M4. Hardcoded `3px` gap in CombatantCard style

**File:** `app/components/encounter/CombatantCard.vue` (line 816)

```scss
.use-item-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
```

The `gap: 3px` uses a hardcoded pixel value instead of the project's SCSS spacing scale (`$spacing-xs` = 4px is the smallest). All other spacing in this file and across the project uses SCSS variables.

**Fix:** Replace `gap: 3px` with `gap: $spacing-xs` (4px).

---

## What Looks Good

1. **Clean service layer separation.** The healing-item service encapsulates all validation and application logic, following the project's SRP pattern. The API endpoint is thin and delegates correctly.

2. **Correct injury cap behavior.** HP restoration goes through `applyHealingToEntity` which respects the effective max HP cap (decree-017). The `healToPercent` and `healToFull` branches both calculate against `getEffectiveMaxHp`. Items heal exact amounts with no erroneous minimum-1-HP floor (decree-029 exemption for items).

3. **Catalog design is sound.** The `HEALING_ITEM_CATALOG` follows the same `Record<string, Def>` pattern as `EQUIPMENT_CATALOG`. All items from PTU 1.05 p.276 Basic Restoratives table are included. P1 items (cure, revive, combined) are present in the catalog for data completeness but gated at the API level.

4. **P0 category gating is robust.** The API endpoint explicitly restricts to `restorative` category only. Non-restorative items return a clear error message directing the user to P1. This prevents premature use of catalog entries whose effects are not yet implemented.

5. **WebSocket broadcast is present.** The API endpoint broadcasts `item_used` events via `broadcastToEncounter`, matching the design spec and the existing pattern for `move_executed`, `encounter_update`, etc.

6. **Good use of existing infrastructure.** The implementation reuses `loadEncounter`, `findCombatant`, `saveEncounterCombatants`, `buildEncounterResponse`, `syncHealingToDatabase`, `applyHealingToEntity`, and `getEffectiveMaxHp` rather than duplicating logic.

7. **Target refusal is correctly handled.** Per PTU rules, targets can refuse items and the item is not consumed. The API returns early before loading the encounter, and the UI correctly shows a refusal message.

8. **Composable returns readonly refs.** `useHealingItems` wraps `loading` and `error` in `readonly()` before returning, preventing consumers from accidentally mutating internal state.

9. **Commit granularity is appropriate.** Eight commits, one per section (A-E) plus sub-sections and docs. Each commit is a single logical change with a clear conventional commit message.

---

## Verdict

**CHANGES_REQUIRED**

The implementation is architecturally sound and correctly implements the P0 scope. Decree compliance is verified. However, 3 HIGH issues require changes before approval:

- **H1** (double validation) creates redundant work and obscures responsibility.
- **H2** (duplicated `getCombatantName`) violates the DRY principle and ignores the existing `useCombatantDisplay` composable that 8+ other components use.
- **H3** (dead stub `getApplicableItems` in constants) is misleading dead code that could cause silent bugs if imported by mistake.

The 4 MEDIUM issues (M1 target HP display, M2 convoluted ternary, M3 app-surface.md, M4 hardcoded gap) should also be addressed in this cycle since the developer is already in the relevant files.

---

## Required Changes

1. **Remove double validation** (H1): Delete the explicit `validateItemApplication` call from `use-item.post.ts` (lines 74-78) and let `applyHealingItem` handle validation internally.

2. **Use `useCombatantDisplay` composable** (H2): Replace the local `getCombatantName` function in `UseItemModal.vue` with the shared `useCombatantDisplay` composable. Remove unused type imports.

3. **Delete dead `getApplicableItems` stub** (H3): Remove the function from `app/constants/healingItems.ts`.

4. **Show effective max HP in target dropdown** (M1): Use `getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0)` in the target selector display.

5. **Simplify display name in validation error** (M2): Replace the convoluted ternary in `healing-item.service.ts` line 58 with `getEntityDisplayName(target)`.

6. **Update `app-surface.md`** (M3): Add the new endpoint, service, composable, component, and constants file.

7. **Use SCSS variable for gap** (M4): Replace `gap: 3px` with `gap: $spacing-xs` in CombatantCard.
