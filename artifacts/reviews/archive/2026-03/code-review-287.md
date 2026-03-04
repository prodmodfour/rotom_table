---
review_id: code-review-287
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - b3f7f063
  - e9efa594
  - c026b06a
  - 7782598c
  - 5580b955
  - 6ecac9b8
  - 30fd3bf2
files_reviewed:
  - app/types/combat.ts
  - app/server/services/healing-item.service.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/composables/useHealingItems.ts
  - app/stores/encounter.ts
  - app/components/encounter/UseItemModal.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-03-02T22:45:00Z
follows_up: null
---

## Review Scope

Feature-020 P2: Healing Item System combat integration. This tier adds Standard Action enforcement for item use, self-use as Full-Round Action, target action forfeit with Medic Training exception, adjacency checking on the VTT grid, and inventory consumption with GM override. 7 commits across 7 files. P0 (code-review-271) and P1 (code-review-284) were previously APPROVED.

Decrees checked: decree-017 (effective max HP healing cap — not directly violated), decree-029 (rest healing minimum — applies to rest, not items; correct exclusion), decree-041 (Awakening at $200 — catalog unchanged in P2). No decree violations found.

## Issues

### CRITICAL

**C1: UseItemModal.vue exceeds 800-line limit (971 lines)**

File: `app/components/encounter/UseItemModal.vue` — 971 lines.

The project enforces an 800-line maximum per file. UseItemModal grew from ~350 lines (P0) to 971 lines with P2's additions (action cost display, range status, inventory quantities, GM mode toggle, disabled state logic, extensive SCSS). This is a clear violation of the file size rule.

**Fix:** Extract the SCSS into a separate `UseItemModal.scss` file (roughly 350 lines of scoped styles), or extract the P2-specific computed properties (range status, action availability, inventory resolution, disabled state logic) into a dedicated composable like `useItemModalState.ts`. Either approach should bring the component under 800 lines.

### HIGH

**H1: Missing turn validation — no check that it is the user's turn**

File: `app/server/api/encounters/[id]/use-item.post.ts`

The design spec Section J explicitly specifies turn validation:

> "The user must be the current turn's combatant, OR the user must be a combatant with a held action"

The implementation validates action availability (standardActionUsed, shiftActionUsed) but never checks that it is actually the user's turn. Any combatant could use an item at any time as long as their turnState flags happen to be unset. This is a correctness gap: a combatant who hasn't taken their turn yet would have fresh turnState flags and could use items before their turn arrives.

**Fix:** Add turn validation after loading the encounter:

```typescript
const currentTurnId = record.turnOrder?.[record.currentTurnIndex]
const isUsersTurn = currentTurnId === body.userId
const hasHeldAction = user.holdAction?.isHolding === true

if (!isUsersTurn && !hasHeldAction) {
  throw createError({
    statusCode: 400,
    message: 'Can only use items on your own turn (or with a held action)'
  })
}
```

Note: `record.turnOrder` and `record.currentTurnIndex` are available from `loadEncounter`. Verify the return shape includes these fields and parse turnOrder from JSON if needed.

**H2: Duplicate trainer lookup in inventory flow — fragile and wasteful**

File: `app/server/api/encounters/[id]/use-item.post.ts`, lines 119-146 and 189-226

The trainer is resolved twice with identical logic: once for the inventory check (lines 121-123) and again for inventory deduction (lines 190-192). The first lookup throws on failure; the second silently skips (`if (trainer) {`). This creates two problems:

1. **Redundant computation** — the same `findTrainerForPokemon` call runs twice on the same data.
2. **Silent skip on second lookup** — if the first lookup succeeds but the second somehow fails (logic should be impossible, but the pattern is fragile), inventory deduction is silently skipped while the item was still applied and actions consumed.

**Fix:** Hoist the trainer resolution to a single variable before the inventory check block, and reuse it for deduction:

```typescript
// Resolve trainer once, before validation
const itemTrainer = skipInventory ? null : (
  user.type === 'human' ? user : findTrainerForPokemon(combatants, user)
)

if (!skipInventory && !itemTrainer) {
  throw createError({ statusCode: 400, message: 'Cannot determine which trainer owns the item' })
}

// ... validation uses itemTrainer ...
// ... deduction uses itemTrainer (guaranteed non-null when !skipInventory) ...
```

### MEDIUM

**M1: app-surface.md not updated with P2 service functions**

File: `.claude/skills/references/app-surface.md`, line 294

The healing-item.service.ts entry in app-surface.md still reads:
> `validateItemApplication, applyHealingItem, getEntityDisplayName`

P2 added two new exported functions: `checkItemRange` and `findTrainerForPokemon`. These are public service API and should be listed. Past reviews (code-review-278 H1, addressed in P1 fix cycle at `976d9bc6`) established the precedent that P-tier additions update app-surface.md.

**Fix:** Update the app-surface.md line for healing-item.service.ts to include the new exports:
> `validateItemApplication, applyHealingItem, getEntityDisplayName, checkItemRange, findTrainerForPokemon`

**M2: Inventory item matching uses `name` string comparison — fragile with display names**

File: `app/server/api/encounters/[id]/use-item.post.ts`, line 135 and line 198

Inventory items are matched by `inv.name === body.itemName`, where `body.itemName` is a key in `HEALING_ITEM_CATALOG` (e.g., `"Potion"`, `"Super Potion"`). The `InventoryItem.name` field is a free-text string set by the user or import process. If the inventory item name doesn't exactly match the catalog key (e.g., `"potion"` vs `"Potion"`, or `"Super potion"` with different casing), the lookup silently fails and the item appears out of stock.

This is a known coupling between catalog keys and inventory names. The current system works as long as inventory items are added with exact catalog key names. However, this coupling is undocumented and there is no normalization.

**Fix:** Add a comment in the endpoint documenting this coupling, and consider a case-insensitive comparison:

```typescript
const inventoryItem = trainerInventory.find(
  inv => inv.name.toLowerCase() === body.itemName.toLowerCase()
)
```

Or at minimum, document the convention that inventory item names must exactly match HEALING_ITEM_CATALOG keys.

## What Looks Good

1. **Immutable turnState updates** — All turnState mutations use spread syntax (`{ ...user.turnState, ... }`) rather than direct property assignment. This respects the immutability pattern required for reactive state in the encounter combatants array.

2. **Forfeit flag preservation across round boundaries** — Both `resetCombatantsForNewRound` and `resetResolvingTrainerTurnState` in `next-turn.post.ts` correctly preserve `forfeitStandardAction` and `forfeitShiftAction` flags when resetting turn state. This handles the edge case where a combatant receives an item late in the round and their forfeit must persist into the next round. Well-thought-out.

3. **Adjacency uses `ptuDistanceTokensBBox`** — The implementation correctly uses the token bounding box distance function (per decree-002) rather than the simpler `ptuDiagonalDistance`. This properly handles multi-cell tokens (large Pokemon) where adjacency is measured from the nearest occupied cell. The design spec mentioned this as an edge case, and the implementation handles it correctly.

4. **Self-use skips adjacency and forfeit** — Self-use correctly returns `adjacent: true, distance: 0` in `checkItemRange` and skips the forfeit flags (`!isSelfUse && !hasMedicTraining`). Per PTU p.276, self-use is a Full-Round Action with no forfeit, which is exactly what the code does.

5. **Medic Training edge check** — The `.toLowerCase().includes('medic training')` check is appropriately fuzzy to handle variations in how edge names might be stored (e.g., "Medic Training [Novice]" or "medic training"). The check correctly exempts only the target's forfeit, not the user's action cost, per PTU p.276.

6. **Inventory deduction after success** — The code correctly deducts inventory only after `applyHealingItem` succeeds, preventing inventory loss on failed applications. Items with quantity 0 are filtered out.

7. **DB sync of inventory** — The inventory change is persisted to the `humanCharacter` table via `prisma.humanCharacter.update`, ensuring the inventory deduction survives server restarts. The combatant entity is also updated in-memory for the encounter state save.

8. **GM Mode skip** — `skipInventory` cleanly bypasses both the inventory check and deduction, with the flag passed through composable -> store -> endpoint. The UI correctly shows all items regardless of stock when GM mode is active.

9. **Forfeit consumption at turn start** — The forfeit flags are consumed in `next-turn.post.ts` at the correct point (after advancing to the new combatant but before returning the response), and the flags are cleared after consumption. This ensures the forfeit applies exactly once.

10. **WebSocket broadcast includes P2 fields** — The `item_used` broadcast event includes `actionCost`, `targetForfeitsActions`, `inventoryConsumed`, and `remainingQuantity`, giving the Group view enough data to display meaningful action economy information.

## Verdict

**CHANGES_REQUIRED** — 1 critical (file size violation), 2 high (missing turn validation, duplicate trainer lookup), 2 medium (app-surface.md update, name matching documentation).

The core P2 logic (action economy, forfeit mechanics, adjacency, inventory) is correct and well-implemented. The PTU rules are faithfully translated. However, the missing turn validation (H1) is a real correctness gap that must be addressed before approval — without it, items can be used out of turn. The file size violation (C1) is a hard project rule.

## Required Changes

1. **C1:** Reduce UseItemModal.vue below 800 lines. Extract SCSS or extract computed logic to a composable.
2. **H1:** Add turn validation in use-item.post.ts — verify the user is the current turn combatant or has a held action.
3. **H2:** Consolidate the duplicate trainer lookup into a single variable reused for both validation and deduction.
4. **M1:** Update app-surface.md to include `checkItemRange` and `findTrainerForPokemon` in the healing-item.service.ts entry.
5. **M2:** Add a case-insensitive inventory name comparison or document the exact-match convention with a code comment.
