---
review_id: code-review-127
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-045
domain: combat
commits_reviewed:
  - 302739e  # feat: add HumanEquipmentTab.vue for character equipment management
  - 09060a1  # feat: register Equipment tab in CharacterModal for human characters
  - 3b508dd  # feat: add Equipment tab to GM character detail page
  - 26ccb0f  # feat: add EquipmentCatalogBrowser modal for browsing PTU equipment
  - 637812c  # feat: wire EquipmentCatalogBrowser into Equipment tab
  - 49968c5  # chore: update design-equipment-001 implementation log and ticket status for P2
files_reviewed:
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/character/EquipmentCatalogBrowser.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/constants/equipment.ts
  - app/utils/equipmentBonuses.ts
  - app/types/character.ts
  - app/types/api.ts
  - app/server/api/characters/[id]/equipment.get.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/composables/useWebSocket.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-02-21T22:30:00Z
follows_up: null
---

## Review Scope

P2 of ptu-rule-045 (Equipment System). This tier adds the Equipment Tab UI and Item Catalog Browser. P0 (data model, constants, CRUD API, bonuses utility) and P1 (combat integration: DR, evasion, Focus, Heavy Armor speed) were previously reviewed and approved.

**New components:**
- `HumanEquipmentTab.vue` (569 lines) -- 6 equipment slots, catalog dropdown, custom item entry, combat bonuses summary
- `EquipmentCatalogBrowser.vue` (435 lines) -- modal catalog browser with slot filter, search, equip button

**Modified components:**
- `CharacterModal.vue` -- added Equipment tab to human character tabs, localEquipment tracking, encounter detection
- `gm/characters/[id].vue` -- added Equipment tab to standalone character page, localEquipment tracking, encounter detection

---

## Issues

### CRITICAL

#### C1: `emitCharacterUpdate()` sends malformed WebSocket event (HumanEquipmentTab.vue:318-330)

The `character_update` WebSocket event type is defined as:
```typescript
| { type: 'character_update'; data: Pokemon | HumanCharacter }
```

But the `emitCharacterUpdate()` function sends a partial object:
```typescript
send({
  type: 'character_update',
  data: { id: props.characterId, equipment: props.equipment }
})
```

This object is neither a `Pokemon` nor a `HumanCharacter`. When the receiving `useWebSocket` handler processes this event, it calls `isPokemon(message.data)` which checks for `'species' in message.data`. That will be false, so it falls into the HumanCharacter branch and does:
```typescript
const index = store.humans.findIndex(h => h.id === human.id)
if (index !== -1) {
  store.humans[index] = human  // <-- replaces full HumanCharacter with { id, equipment }
}
```

This **replaces the entire HumanCharacter object in the library store** with just `{ id, equipment }`, destroying all other character data (name, stats, HP, etc.) for all connected clients. The Group View and any other connected views will display a broken character until the page is refreshed.

Additionally, `useWebSocket()` is a composable that auto-connects a new WebSocket on `onMounted()` and disconnects on `onUnmounted()`. Calling it inside `emitCharacterUpdate()` (which runs as a regular function call, not in setup context) creates a new WebSocket connection every time equipment changes and then immediately leaks it (no component lifecycle manages it). If this function is called outside of Vue setup context, the `onMounted`/`onUnmounted` hooks will not register properly and the behavior is undefined.

**Fix (two options, pick one):**

**Option A (Recommended):** Remove the WebSocket emit from HumanEquipmentTab entirely. Instead, have the parent component (CharacterModal or `gm/characters/[id].vue`) handle the WebSocket broadcast after `onEquipmentChanged` fires. The parent already has access to the full character object and can compose a proper `character_update` event with the full `HumanCharacter` data including the updated equipment.

**Option B:** If keeping it in the child component, accept the full character as a prop (or fetch it fresh from the API after equip) and send the complete `HumanCharacter` object. Also, receive the `send` function as a prop or use a shared singleton rather than calling `useWebSocket()` inside a non-setup function.

---

### HIGH

#### H1: Duplicated lookup maps across HumanEquipmentTab and EquipmentCatalogBrowser

Three data structures are duplicated between the two components:

| Constant | HumanEquipmentTab.vue | EquipmentCatalogBrowser.vue |
|----------|----------------------|---------------------------|
| `STAT_LABELS` | Lines 190-199 | Lines 136-145 |
| Slot labels | `slotDefinitions` array (lines 181-188) | `SLOT_LABELS` record (lines 118-125) |
| Slot icons | `slotDefinitions` array (lines 181-188) | `SLOT_ICONS` record (lines 127-134) |

Per the DRY principle and the project's "many small files" pattern, these should be extracted to a shared constant or utility. `STAT_LABELS` is an obvious candidate for `constants/equipment.ts` (it already exports `EQUIPMENT_CATALOG` and `EQUIPMENT_SLOTS`). Slot labels and icons could go there as well, or into a small `constants/equipmentUI.ts` to keep non-game-logic concerns separate.

**Fix:** Extract `STAT_LABELS`, `SLOT_LABELS`, and `SLOT_ICONS` into a shared constants file and import in both components.

#### H2: `app-surface.md` not updated for new components and tab changes

The `app-surface.md` document was not updated in any of the P2 commits. Two new components were added (`HumanEquipmentTab.vue`, `EquipmentCatalogBrowser.vue`) and the Equipment tab was added to both CharacterModal and the `gm/characters/[id].vue` page. The app-surface description of `gm/characters/:id` still reads:

> Human character sheet -- Stats, Classes, Skills, Pokemon, Healing, Notes tabs

This needs to include "Equipment" in the tab list. The new components should be documented as key components for the equipment system.

**Fix:** Update `app-surface.md` to:
1. Add "Equipment" to the `gm/characters/:id` route description
2. Add `HumanEquipmentTab.vue` and `EquipmentCatalogBrowser.vue` to a key components note under the Characters section

---

### MEDIUM

#### M1: Custom item form allows invalid bonus combinations without guidance

The custom item form (HumanEquipmentTab.vue:49-97) presents DR, Evasion, and Speed CS as free-entry numeric fields with no guidance about reasonable values. The API does validate via Zod (DR: 0-100, Evasion: 0-100, Speed CS: -6 to 0), so no actual data corruption is possible. However, the client-side `min`/`max` attributes on the number inputs only partially match:

- DR input: `min="0"` but no `max` -- API validates max 100
- Evasion input: `min="0"` but no `max` -- API validates max 100
- Speed CS input: `min="-6" max="0"` -- matches API

The mismatch means a user can type DR=999 in the form, submit, and get a server-side 400 error with a Zod validation message shown via `alert()`. This is functional but a poor UX.

**Fix:** Add `max="100"` to the DR and Evasion inputs, matching the API's Zod validation bounds.

#### M2: Select dropdown does not reset visually after equipping an item from catalog

In `onSelectItem()` (HumanEquipmentTab.vue:271-288), after the user selects an item from the dropdown, the code resets the select value programmatically:

```typescript
(event.target as HTMLSelectElement).value = ''
```

This works but is fragile -- it bypasses Vue's reactivity system and directly manipulates the DOM. If the `equipItem()` async call fails and the alert is shown, the dropdown has already been reset to empty. The user cannot see which item they attempted to equip. A more robust pattern would be to use a reactive `ref` for each slot's selected value and reset it only on success.

**Fix:** This is functional but worth noting for future improvement. No immediate fix required if the team accepts the current UX tradeoff.

#### M3: EquipmentCatalogBrowser.vue closes immediately on equip without feedback

When the user clicks "Equip" in the catalog browser, `equipToCharacter()` fires the API call. On success, it emits `equipped` which the parent handles in `onCatalogEquipped()` (HumanEquipmentTab.vue:310-316), which closes the modal immediately:

```typescript
function onCatalogEquipped(equipment: EquipmentSlots) {
  emit('equipment-changed', equipment)
  showCatalog.value = false  // <-- closes modal
  if (props.isInEncounter) {
    emitCharacterUpdate()
  }
}
```

If a GM wants to equip multiple items from the catalog in one session (e.g., body + offHand + accessory), they must reopen the browser each time. This is a UX friction point.

**Fix:** Consider keeping the modal open after equip, showing a brief success toast/indicator on the item, and letting the user close manually when done. Alternatively, add a small "equipped" visual indicator and keep the Equip button active. This is not blocking but worth a follow-up ticket if the team finds the workflow clunky.

---

## What Looks Good

1. **Component architecture is clean.** HumanEquipmentTab handles the slot UI and delegates the catalog browsing to a separate modal component. Props and emits are well-typed. The parent components (CharacterModal and gm/characters/[id].vue) both use the same pattern of local equipment state + handler for reactivity.

2. **Immutability in the parent components.** Both CharacterModal (line 305) and gm/characters/[id].vue (line 285) create shallow copies of equipment from the character prop/ref: `localEquipment.value = { ...(humanData.value.equipment ?? {}) }`. The `onEquipmentChanged` handler replaces the ref entirely rather than mutating.

3. **Custom item form with conditional spread.** The `confirmCustomItem()` function (lines 294-308) correctly uses conditional spread to only include non-zero/non-empty fields, keeping the persisted JSON clean.

4. **Catalog browser filtering is well-implemented.** The two-stage computed pipeline (allGroups -> filteredGroups) with slot filter and search query is clean, performant, and reactive. The grouped-by-slot display with proper slot icons and labels is a solid UX pattern.

5. **Bonus tag display consistency.** Both HumanEquipmentTab (bonuses summary) and EquipmentCatalogBrowser (item bonus tags) use the same color scheme (DR=info/blue, evasion=success/green, speed=warning/yellow, focus=violet, conditional=pink). This maintains visual consistency.

6. **SCSS follows project patterns.** Uses `$spacing-*`, `$color-*`, `$font-size-*`, `$border-radius-*`, `$transition-fast` variables throughout. Modal uses `@include modal-overlay-enhanced` and `@include modal-container-enhanced` mixins. No hardcoded colors or pixel values for spacing.

7. **File sizes are within limits.** HumanEquipmentTab (569 lines including 237 lines of SCSS) and EquipmentCatalogBrowser (435 lines) are both under the 800-line limit.

8. **Encounter detection logic is consistent.** Both CharacterModal (lines 314-319) and gm/characters/[id].vue (lines 294-300) use the same pattern to check if the character is in an active encounter via the encounter store.

9. **Error handling uses alert() for user-facing errors.** While not the most elegant pattern, it is consistent with how other components in this codebase handle API errors (e.g., capture modals, damage application).

10. **Commit granularity is good.** Six commits for P2, each addressing a single logical change: the base tab component, CharacterModal registration, GM detail page registration, catalog browser, wiring, and docs.

---

## Verdict

**CHANGES_REQUIRED**

The C1 issue (malformed WebSocket event that destroys character data in the library store for all connected clients) is a correctness bug that must be fixed before this code can be approved. The `emitCharacterUpdate()` function as written will cause data loss on Group View clients during active encounters.

H1 (duplicated constants) and H2 (app-surface.md not updated) should also be addressed in the same fix pass.

---

## Required Changes

| # | Severity | Issue | Action |
|---|----------|-------|--------|
| C1 | CRITICAL | `emitCharacterUpdate()` sends partial object as `character_update`, destroying character data on receiving clients | Refactor WebSocket emit to parent component where full character data is available, or send complete HumanCharacter object |
| H1 | HIGH | `STAT_LABELS`, `SLOT_LABELS`, `SLOT_ICONS` duplicated in two components | Extract to shared constant file (e.g., `constants/equipment.ts` or `constants/equipmentUI.ts`) |
| H2 | HIGH | `app-surface.md` not updated for new Equipment tab and components | Add Equipment to gm/characters/:id tab list, document new components |
| M1 | MEDIUM | Custom item form missing `max` on DR/Evasion inputs | Add `max="100"` to match API Zod validation |
