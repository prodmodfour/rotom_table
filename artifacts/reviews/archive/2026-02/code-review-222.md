---
review_id: code-review-222
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-120
domain: combat+character-lifecycle
commits_reviewed:
  - b34916d
  - f7b6f84
  - 5c1f8f6
  - 04ece11
  - c648df0
  - 8a6ed18
  - 0dfb08a
files_reviewed:
  - app/types/character.ts
  - app/constants/equipment.ts
  - app/utils/equipmentBonuses.ts
  - app/utils/combatantCapabilities.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/server/api/characters/[id]/equipment.get.ts
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/server/api/encounters/[id]/status.post.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-02-28T19:45:00Z
follows_up: null
---

## Review Scope

First review of ptu-rule-120: Equipment-granted Naturewalk auto-derivation. The implementation adds a `grantedCapabilities` field to `EquippedItem`, a utility to derive capabilities from equipped items, merges equipment-derived Naturewalks into the combatant Naturewalk check, and extends the Naturewalk status immunity check to human combatants.

7 commits, 8 files changed, 79 insertions, 12 deletions. Compact and well-scoped.

### Decree Compliance

- **decree-003**: Naturewalk bypass only applies to painted terrain, not enemy-occupied rough terrain. The implementation delegates to the existing `naturewalkBypassesTerrain` which already respects this. Compliant.
- **decree-010**: Multi-tag terrain system. No terrain data model changes here; the Naturewalk check reads existing terrain cells. Compliant.
- **decree-012**: Server-side enforcement with GM override. The `status.post.ts` change extends the existing Naturewalk immunity check (which already had GM override via `body.override`) to cover human combatants. Per decree-012, this is the correct pattern. Compliant.

## Issues

### HIGH

**H-01: No unit tests for new `getEquipmentGrantedCapabilities` utility or equipment-derived Naturewalk path**

File: `app/utils/equipmentBonuses.ts`, `app/tests/unit/utils/combatantCapabilities.test.ts`

The new `getEquipmentGrantedCapabilities()` function is a pure utility with zero tests. Additionally, `getCombatantNaturewalks` for human combatants was refactored to merge equipment capabilities, but the existing test `makeHumanCombatant` helper does not set an `equipment` field on the entity. The existing human combatant tests only test the manual `capabilities` path (Survivalist class feature), not the equipment-derived path.

Required tests:
1. `getEquipmentGrantedCapabilities` — empty equipment, single item with capabilities, multiple items with capabilities, deduplication, items without capabilities.
2. `getCombatantNaturewalks` for human combatant with equipment-derived Naturewalk (Snow Boots, Jungle Boots).
3. `getCombatantNaturewalks` for human combatant with BOTH manual capabilities AND equipment-derived capabilities (verify merge + deduplication).
4. `findNaturewalkImmuneStatuses` for human combatant with equipment-granted Naturewalk on matching terrain.

The `makeHumanCombatant` helper needs an optional `equipment` parameter on the entity to support these tests.

**Lesson L1 confirmed**: Behavioral change without test coverage.

### MEDIUM

**M-01: Custom item form does not support `grantedCapabilities`**

File: `app/components/character/tabs/HumanEquipmentTab.vue` (lines 304-318)

The custom item form (`confirmCustomItem`) builds an `EquippedItem` with only DR, evasion, speed CS, and description. If a GM creates a custom equipment item that should grant capabilities (e.g., homebrew "Desert Boots" granting Naturewalk (Desert)), they cannot specify it through the custom form. The Zod schema in `equipment.put.ts` accepts `grantedCapabilities`, but the UI form does not expose it.

This is not blocking for the core ticket (which targets catalog items), but it creates a UI gap where the API supports a feature the form does not. File a follow-up ticket with a text input field for comma-separated capabilities on the custom item form.

**M-02: `Dark Vision Goggles` and `Gas Mask` catalog entries also grant capabilities but do not use `grantedCapabilities`**

File: `app/constants/equipment.ts` (lines 45-56)

Dark Vision Goggles grant the "Darkvision Capability" (PTU p.293) and Gas Mask grants immunity to powder/gas moves. Neither uses the new `grantedCapabilities` field -- their effects are only described in the `description` string. While these are not Naturewalk capabilities and thus do not affect combat terrain checks today, the `grantedCapabilities` field was designed to be generic (`string[]`), not Naturewalk-specific. For consistency and future extensibility, these entries should also populate `grantedCapabilities: ['Darkvision']` and `grantedCapabilities: ['Gas Mask Immunity']` (or equivalent), which would also display in the UI bonuses section.

File a follow-up ticket: populate `grantedCapabilities` on all capability-granting catalog items for display consistency.

## What Looks Good

1. **Clean pure utility pattern.** `getEquipmentGrantedCapabilities()` is a pure function with no side effects, matching the existing `computeEquipmentBonuses()` pattern in the same file. Deduplication via `Set` is correct.

2. **Proper merge strategy in `getCombatantNaturewalks`.** Manual capabilities and equipment-derived capabilities are merged, then parsed through the existing `parseNaturewalksFromOtherCaps` function, with final deduplication via `Set`. This correctly handles the case where a Survivalist trainer wearing Snow Boots has overlapping Naturewalk sources.

3. **Defensive coding.** `human.equipment ?? {}` in `combatantCapabilities.ts` handles the case where equipment is undefined (e.g., combatants serialized before equipment was added to the schema). `human.capabilities ?? []` handles missing manual capabilities.

4. **Minimal status.post.ts change.** Removing the `combatant.type === 'pokemon'` guard on the Naturewalk immunity check (line 78 in the diff) is the correct fix. The `findNaturewalkImmuneStatuses` function already handles both entity types, and `getCombatantNaturewalks` was already capable of returning Naturewalks for human combatants (Survivalist class). The only thing gating it was this type check, which was overly restrictive.

5. **Zod schema update.** Adding `grantedCapabilities: z.array(z.string().min(1)).optional()` to the equipment PUT validation ensures custom API payloads with capabilities are validated. The `.strict()` modifier on the schema prevents unknown fields.

6. **API response symmetry.** Both GET and PUT equipment endpoints now return `grantedCapabilities` alongside `aggregateBonuses`, keeping the response shape consistent.

7. **UI display.** The capability tags use `PhTree` icon and a green color scheme (`bonus-tag--capability`), which is visually distinct from other bonus types and semantically appropriate for terrain-related capabilities.

8. **Commit granularity.** 7 commits for 8 files is excellent granularity. Each commit represents a single logical step: type -> catalog -> utility -> validation -> API -> UI -> combat fix.

9. **PTU accuracy.** Snow Boots grant Naturewalk (Tundra) per PTU 09-gear-and-items.md line 1700-1701. Jungle Boots grant Naturewalk (Forest) per line 1713-1714. Both are correctly represented. The Jungle Boots catalog entry is a net-new addition (previously missing from the catalog) which is appropriate for this ticket.

## Verdict

**CHANGES_REQUIRED**

The implementation logic is correct and well-structured. The blocking issue is **H-01**: the new utility function and the refactored human combatant Naturewalk path have no test coverage. The existing test suite for `combatantCapabilities` is thorough but was not extended to cover the new equipment-derived path. This is a behavioral change to a combat-critical function (Naturewalk status immunity) and must have tests before approval.

## Required Changes

1. **H-01**: Add unit tests for `getEquipmentGrantedCapabilities` and the equipment-derived Naturewalk merge path. Extend the `makeHumanCombatant` helper to accept an optional `equipment` field. Add test cases covering: empty equipment, equipment with capabilities, merge of manual + equipment capabilities, and Naturewalk immunity for equipment-granted Naturewalk.

2. **M-01**: File a follow-up ticket for adding `grantedCapabilities` support to the custom item form in `HumanEquipmentTab.vue`.

3. **M-02**: File a follow-up ticket for populating `grantedCapabilities` on Dark Vision Goggles and Gas Mask catalog entries for display consistency.
