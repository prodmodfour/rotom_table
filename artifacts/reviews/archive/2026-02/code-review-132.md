---
review_id: code-review-132
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-045
domain: equipment
commits_reviewed:
  - 49a45e7
  - dc177e9
  - 8c69c64
  - 0a2f936
  - dc3b0e3
files_reviewed:
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/character/EquipmentCatalogBrowser.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/constants/equipment.ts
  - app/composables/useWebSocket.ts
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-045.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-22T22:15:00Z
follows_up: code-review-127
---

## Review Scope

Re-review of 5 fix commits (49a45e7..dc3b0e3) addressing 4 issues raised in code-review-127 (ptu-rule-045 P2 CHANGES_REQUIRED). The original review flagged C1 (malformed WebSocket broadcast destroying character data), H1 (duplicated constants), H2 (app-surface.md not updated), and M1 (missing max on DR/Evasion inputs).

---

## Issue Resolution Verification

### C1 (CRITICAL): WebSocket broadcast sends full character data -- RESOLVED

**Original issue:** `emitCharacterUpdate()` in HumanEquipmentTab.vue sent `{ id, equipment }` as a `character_update` event. The `useWebSocket` handler at line 94-101 casts the received data to `HumanCharacter` and replaces the entire store entry with it, destroying all other fields (name, stats, HP, etc.) for connected clients. Additionally, `useWebSocket()` was called inside a regular function (not setup context), leaking connections since `onMounted`/`onUnmounted` hooks would not register.

**Fix applied (49a45e7):** The developer chose Option A from the review (recommended). The `emitCharacterUpdate()` function was removed entirely from HumanEquipmentTab.vue. A new `equipment-changed-in-encounter` emit was added to the child component's emit interface. All three call sites (equipItem, unequipSlot, onCatalogEquipped) now emit this event when `isInEncounter` is true.

**Parent handling verified:**

- **CharacterModal.vue (lines 314-321):** Calls `useWebSocket()` at the component's top-level setup scope (correct lifecycle context). The handler spreads the full `humanData.value` (which is `props.character` cast as `HumanCharacter`) with the updated equipment: `{ ...humanData.value, equipment }`. This produces a complete `HumanCharacter` object.

- **gm/characters/[id].vue (lines 294-302):** Same pattern. `useWebSocket()` called at setup scope. Guard `if (!character.value) return` prevents sending if character is null. Spreads full `character.value` with updated equipment: `{ ...character.value, equipment }`. Also a complete `HumanCharacter` object.

**Verified against `useWebSocket.ts` handler (lines 86-101):** The `character_update` handler calls `isPokemon(message.data)` which checks `'species' in message.data`. A spread `HumanCharacter` will not have `species`, so it correctly enters the human branch and replaces the store entry with the full object. All fields preserved.

**WebSocket lifecycle issue also resolved:** Both parent components call `useWebSocket()` at the top level of `<script setup>`, which is the Vue setup context. The `onMounted()` and `onUnmounted()` hooks in the composable will register correctly, and the connection lifecycle is properly managed by the parent component.

**Verdict: Fix is correct and complete.**

---

### H1 (HIGH): STAT_LABELS and SLOT_LABELS extracted to shared constants -- RESOLVED

**Original issue:** `STAT_LABELS` and `SLOT_LABELS` (and `SLOT_ICONS`) were duplicated between HumanEquipmentTab.vue and EquipmentCatalogBrowser.vue.

**Fix applied (dc177e9):** `STAT_LABELS` and `SLOT_LABELS` extracted to `constants/equipment.ts` (lines 133-153). Both components now import from the shared file:
- HumanEquipmentTab.vue line 156: `import { EQUIPMENT_CATALOG, EQUIPMENT_SLOTS, SLOT_LABELS, STAT_LABELS } from '~/constants/equipment'`
- EquipmentCatalogBrowser.vue line 102: `import { EQUIPMENT_CATALOG, EQUIPMENT_SLOTS, SLOT_LABELS, STAT_LABELS } from '~/constants/equipment'`

The local `STAT_LABELS` and `SLOT_LABELS` definitions were removed from both components. Values in the shared file match the previously duplicated values exactly (verified character-by-character: "Main Hand", "Off-Hand", "Sp. Atk", "Sp. Def", etc.).

HumanEquipmentTab.vue also refactored `slotDefinitions` from a hardcoded array to a derived computation using `EQUIPMENT_SLOTS.map()` with `SLOT_LABELS` and a local `SLOT_ICONS` (line 191-195). This is cleaner and guarantees slot ordering matches the canonical `EQUIPMENT_SLOTS` array.

**Verdict: Fix is correct.**

---

### H2 (HIGH): app-surface.md updated -- RESOLVED

**Original issue:** `app-surface.md` did not mention Equipment in the tab list for `gm/characters/:id`, and the two new components were not documented.

**Fix applied (0a2f936):**
1. Route description updated from "Stats, Classes, Skills, Pokemon, Healing, Notes tabs" to "Stats, Classes, Skills, Equipment, Pokemon, Healing, Notes tabs" (line 21).
2. New paragraph added after the Characters API section (line 64): documents `HumanEquipmentTab.vue`, `EquipmentCatalogBrowser.vue`, `constants/equipment.ts`, and `utils/equipmentBonuses.ts` with brief purpose descriptions.

**Verdict: Fix is correct and thorough.**

---

### M1 (MEDIUM): max=100 added to DR and Evasion inputs -- RESOLVED

**Original issue:** DR and Evasion number inputs in the custom item form had `min="0"` but no `max`, while the API Zod schema validates max 100.

**Fix applied (8c69c64):**
- DR input (line 65): `min="0" max="100"` -- matches API
- Evasion input (line 69): `min="0" max="100"` -- matches API
- Speed CS input (line 73): `min="-6" max="0"` -- already correct, unchanged

**Verdict: Fix is correct.**

---

## Issues

### MEDIUM

#### M1: SLOT_ICONS still duplicated between HumanEquipmentTab and EquipmentCatalogBrowser

The original code-review-127 H1 issue explicitly called out three duplicated structures: `STAT_LABELS`, `SLOT_LABELS`, and `SLOT_ICONS`. The fix extracted `STAT_LABELS` and `SLOT_LABELS` but left `SLOT_ICONS` duplicated in both components:

- HumanEquipmentTab.vue lines 182-189: `const SLOT_ICONS: Record<EquipmentSlot, any> = { ... }`
- EquipmentCatalogBrowser.vue lines 118-125: `const SLOT_ICONS: Record<EquipmentSlot, any> = { ... }`

Both contain identical mappings (head->PhBaseballCap, body->PhTShirt, mainHand->PhSword, offHand->PhHandPalm, feet->PhSneakerMove, accessory->PhRing).

This is a partial resolution of H1. The reason for not extracting `SLOT_ICONS` is likely that icon components are Vue component imports and exporting them from a `.ts` constants file introduces a dependency on `@phosphor-icons/vue` in what is otherwise a pure data file. This is a reasonable tradeoff -- the icons are tightly coupled to the UI layer, not to game data. However, the original review explicitly listed all three and the fix log claims H1 is resolved. The duplication is real but the impact is low (icons rarely change, and both files already import the same icon set).

This does not block approval. If the icons ever need to change (e.g., switching from Phosphor to a different icon library), both files would need updating, but this is a low-probability maintenance concern.

---

## What Looks Good

1. **C1 fix architecture is clean and correct.** Moving the WebSocket responsibility to the parent is the right structural choice. The child component emits a domain event (`equipment-changed-in-encounter`) and the parent -- which owns the full character data and the WebSocket lifecycle -- handles the broadcast. This follows the Single Responsibility Principle.

2. **No data shape regression.** The spread pattern `{ ...humanData.value, equipment }` in both parent components produces a complete `HumanCharacter` with only the `equipment` field overridden. Verified against the `useWebSocket.ts` handler: the `isPokemon` check (looking for `species` in data) will correctly route to the human branch, and the full object replaces the store entry without data loss.

3. **WebSocket lifecycle is now correct.** `useWebSocket()` is called in Vue setup context in both CharacterModal.vue and gm/characters/[id].vue, so `onMounted`/`onUnmounted` hooks register properly. No more leaked connections.

4. **gm/characters/[id].vue has a null guard.** The `onEquipmentChangedInEncounter` handler at line 296-301 includes `if (!character.value) return`, which is appropriate since `character` is a `ref<HumanCharacter | null>` loaded asynchronously. CharacterModal.vue does not need this guard because `humanData` is derived from `props.character` which is always defined when the modal is rendered.

5. **Shared constants are well-documented.** The extracted `SLOT_LABELS` and `STAT_LABELS` in `constants/equipment.ts` include JSDoc comments explaining their purpose (lines 133, 143).

6. **slotDefinitions refactored to derive from EQUIPMENT_SLOTS.** Instead of maintaining a separate hardcoded array, `slotDefinitions` is now computed from `EQUIPMENT_SLOTS.map()`. This ensures slot ordering is always consistent with the canonical source of truth.

7. **Commit granularity is appropriate.** Five commits, each addressing a single concern: WS fix, constant extraction, input validation, app-surface docs, and ticket fix log. Each commit produces a working state.

8. **Ticket fix log (dc3b0e3) is thorough.** Documents all four fixes with commit hashes, making the audit trail clear.

---

## Verdict

**APPROVED**

All four issues from code-review-127 are resolved:

- **C1 (CRITICAL):** WebSocket broadcast moved to parent components where full character data is available. The malformed partial object is no longer sent. WebSocket lifecycle is properly managed in setup context. This was the blocking issue and it is fully fixed.
- **H1 (HIGH):** `STAT_LABELS` and `SLOT_LABELS` extracted to shared `constants/equipment.ts`. `SLOT_ICONS` remains duplicated (M1 above) but this is a reasonable tradeoff given that icon components are UI-layer concerns.
- **H2 (HIGH):** `app-surface.md` updated with Equipment tab and new component documentation.
- **M1 (MEDIUM):** `max="100"` added to DR and Evasion inputs, matching API Zod validation.

The one remaining medium issue (SLOT_ICONS duplication) is a partial omission from the H1 fix but does not introduce correctness, performance, or maintainability risks that would justify blocking.
