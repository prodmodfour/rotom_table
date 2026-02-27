---
review_id: code-review-169
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-005, ptu-rule-081
domain: pokemon-lifecycle, combat
commits_reviewed:
  - c039a0b
  - 9b302a7
  - b20370c
  - 73dbdea
files_reviewed:
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/utils/equipmentBonuses.ts
  - app/tests/e2e/artifacts/tickets/ux/ux-005.md
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-081.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-26T06:32:00Z
follows_up: (none -- first review)
---

## Review Scope

Two P4 bug fixes reviewed together:

1. **ux-005** (pokemon-lifecycle): Pokemon at full HP appearing damaged after level-up. Two commits: implementation (`c039a0b`) and ticket resolution log (`9b302a7`). Files: `xp-distribute.post.ts`, `add-experience.post.ts`.

2. **ptu-rule-081** (combat): Multiple Focus item stat bonuses stacking in violation of PTU p.295. Two commits: implementation (`b20370c`) and ticket resolution log (`73dbdea`). File: `equipmentBonuses.ts`.

Both fixes are small, targeted, and well-documented.

## Issues

### MEDIUM

**M1: `Object.values()` iteration order makes "first Focus wins" non-deterministic (ptu-rule-081)**

`computeEquipmentBonuses()` iterates `Object.values(equipment)` and applies the first `statBonus` it encounters. JavaScript `Object.values()` returns properties in insertion order for string keys, which means the "winning" Focus depends on the order the slots were added to the `EquipmentSlots` object -- not on any deterministic slot priority (e.g., always preferring accessory over head).

In practice this is extremely unlikely to matter because:
- The equipment catalog defines all Focus items as `slot: 'accessory'` (5 variants, all accessory).
- The `EquipmentSlots` type has 6 named slots. A character would need custom Focus items in non-accessory slots to trigger this.
- Even if triggered, the behavior is stable per-character (same JSON parse order on every call).

**Verdict on M1:** Not blocking. The current catalog makes multi-Focus impossible (all Focus items share the accessory slot), and the `focusApplied` guard correctly prevents double-counting if custom items are ever introduced. The "which Focus wins" question is only relevant if the GM crafts Focus items for different slots, and silent first-wins is reasonable behavior. If this becomes a real scenario in the future, a deterministic slot priority or UI warning would be appropriate -- but that is future work, not a defect in this fix.

## What Looks Good

### ux-005

1. **Correct condition**: `wasAtFullHp = pokemon.currentHp >= pokemon.maxHp` uses `>=` rather than `===`, which handles the edge case where `currentHp` somehow exceeds `maxHp` (e.g., from a manual GM edit or previous bug). This is more defensive and correct.

2. **Both code paths covered**: The developer identified and patched both XP endpoints (`xp-distribute.post.ts` for combat XP, `add-experience.post.ts` for manual/training XP). The resolution log explicitly confirms a duplicate code path search was performed. I verified this independently -- these are the only two endpoints that write level-up HP changes.

3. **Conditional application**: The fix only triggers when `maxHpIncrease > 0` (i.e., an actual level-up occurred). XP grants that don't cause a level-up skip the HP logic entirely, preserving existing behavior.

4. **No mutation issues**: The Prisma update uses spread syntax to conditionally include `currentHp`, not direct mutation. The data object is constructed immutably.

5. **`currentHp` added to select**: Both endpoints now fetch `currentHp` alongside `maxHp` in the Prisma `select` clause, which is required for the comparison. The diff correctly shows this addition.

6. **Pattern consistency**: Both endpoints use identical logic (`wasAtFullHp`, `newMaxHp`, conditional spread), making maintenance straightforward.

### ptu-rule-081

1. **Minimal change**: A single boolean flag (`focusApplied`) gates the `statBonus` branch. No structural refactoring, no new abstractions -- appropriate for a P4 edge case fix.

2. **Pure function preserved**: `computeEquipmentBonuses()` remains a pure function with no side effects. The `focusApplied` flag is local to the function scope.

3. **Rule citation**: The PTU p.295 quote is included directly in the code comment, making the intent clear for future maintainers.

4. **Single source of truth**: I verified that `computeEquipmentBonuses()` is the sole computation point for equipment bonuses. It is called from `equipment.put.ts`, `combatant.service.ts`, `calculate-damage.post.ts`, `useMoveCalculation.ts`, `PlayerCharacterSheet.vue`, and `HumanEquipmentTab.vue` -- all consumers benefit from this fix without any changes.

5. **Spread copy on conditionalDR**: Line 58 (`conditionalDR.push({ ...item.conditionalDR })`) correctly copies the object rather than pushing a reference, maintaining immutability within the loop.

### Both fixes

- Commit granularity is correct: one commit for the code fix, one for the ticket resolution log.
- Commit messages follow conventional format (`fix:`, `docs:`).
- Resolution logs in ticket files document the approach, files changed, and duplicate code path checks.

## Verdict

**APPROVED**

Both fixes are correct, minimal, well-documented, and address the exact issues described in their tickets. The ux-005 fix covers both XP code paths with consistent logic. The ptu-rule-081 fix enforces the single-Focus rule at the correct abstraction layer (computation, not storage).

M1 is acknowledged but non-blocking -- the current equipment catalog makes the scenario impossible, and the guard behaves reasonably even if custom Focus items are introduced later.

## Required Changes

None.
