---
review_id: code-review-115
target: ptu-rule-045
trigger: design-implementation
verdict: CHANGES_REQUIRED
reviewed_commits: [8adf752, 36d09fa, 246ce03, d92c9da, 9626886, a120134, 951926c]
reviewed_files:
  - app/types/character.ts
  - app/prisma/schema.prisma
  - app/constants/equipment.ts
  - app/utils/equipmentBonuses.ts
  - app/server/api/characters/[id]/equipment.get.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/server/utils/serializers.ts
  - app/server/api/characters/[id].put.ts
  - app/server/services/combatant.service.ts
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

P0 implementation of design-equipment-001 covers all four planned items: data model (A), constants catalog (B), CRUD API (C), and bonuses utility (D). Types exactly match the design spec. Constants catalog values have been verified against PTU 1.05 source (09-gear-and-items.md). The pure utility function is clean and side-effect-free. The API endpoints have good basic validation. However, one critical omission was found, one high-severity input validation gap, and two medium issues.

## Issues

### CRITICAL

**C1: `buildHumanEntityFromRecord()` does not include `equipment` field**

File: `app/server/services/combatant.service.ts` line 475-521

The entity builder that converts Prisma `HumanCharacter` records into the typed `HumanCharacter` interface does NOT parse or include the `equipment` field. The `HumanCharacter` interface defines `equipment: EquipmentSlots` as a required (non-optional) field. This means:

1. Any `HumanCharacter` entity built via `buildHumanEntityFromRecord()` (used by encounter combatant loading, scene-to-encounter conversion, and combatant addition) will be missing its `equipment` property entirely, which violates the interface contract.
2. P1 combat integration will silently see `undefined` for `equipment`, and calls to `computeEquipmentBonuses(human.equipment ?? {})` will always fall back to the empty object, rendering all equipped items invisible during combat.
3. TypeScript may or may not catch this at compile time depending on the `PrismaHumanRecord` inference, but at runtime this is a correctness bug.

The design spec explicitly called this out under "Entity Builder Updates" with a code example for adding `equipment: record.equipment ? JSON.parse(record.equipment) : {}`.

**Fix:** Add `equipment: JSON.parse(record.equipment || '{}'),` to `buildHumanEntityFromRecord()` between the `edges` and `pokemonIds` lines (or after `inventory`).

### HIGH

**H1: PUT endpoint accepts arbitrary JSON values without type validation on item properties**

File: `app/server/api/characters/[id]/equipment.put.ts` lines 36-65

The PUT endpoint validates:
- Slot name is a known equipment slot (good)
- Item has `name` and `slot` fields (good)
- Item's `slot` matches the key (good)

But it does NOT validate:
- That `name` is a string (could be an object or array -- prototype pollution vector)
- That numeric fields (`damageReduction`, `evasionBonus`, `cost`, `speedDefaultCS`) are actually numbers and within sane bounds (e.g., someone could POST `damageReduction: 999999` or `damageReduction: -50`)
- That `statBonus.stat` is a valid stat key (could inject arbitrary keys into the stat bonuses record)
- That `statBonus.value` is a number
- That `twoHanded` is a boolean
- That there are no unexpected extra properties on the item object

Since this JSON is persisted directly to the database and later parsed back into typed objects without re-validation, malformed data could cause runtime errors in `computeEquipmentBonuses()` or downstream P1 combat code.

**Fix:** Add Zod schema validation for the `EquippedItem` shape. At minimum, validate `typeof name === 'string'`, numeric fields are numbers and clamped to reasonable ranges (0-100 for DR/evasion, -6 to 0 for speedDefaultCS), and `statBonus.stat` is from a known set.

### MEDIUM

**M1: `app-surface.md` not updated with new equipment endpoints**

File: `.claude/skills/references/app-surface.md`

The two new API endpoints (`GET /api/characters/:id/equipment`, `PUT /api/characters/:id/equipment`) are not listed in `app-surface.md`. The design also added the `equipment` field to the character serializers and the existing PUT character endpoint. These should be documented.

**M2: Focus catalog items are hardcoded to `accessory` slot, but PTU rules allow Focus in multiple slots**

File: `app/constants/equipment.ts` lines 91-125

Per PTU p.1797-1799: "Focuses are often Accessory-Slot Items, but may be crafted as Head-Slot, Hand or Off-Hand Slot Items as well." The current catalog only lists Focus items with `slot: 'accessory'`. This is acceptable for P0 since the GM can equip custom Focus items via the API with any slot, but the catalog does not surface this flexibility. This is not a blocker -- it should be noted in the design spec or catalog comments for P2 UI work (the equip dropdown for non-accessory slots should allow Focus items).

Additionally, PTU rules state "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." There is no enforcement of this constraint in `computeEquipmentBonuses()` or the PUT endpoint. If a GM equips a custom Focus in `head` and a catalog Focus in `accessory`, both bonuses would stack -- which violates PTU rules. This is low-impact for P0 (only reachable via custom items), but should be tracked for P1.

## New Tickets Filed

None required. M2 (Focus multi-slot and single-Focus constraint) is naturally scoped into P1 combat integration work. The design spec already defers combat-related validation to P1.

## What Looks Good

1. **Types match the design spec exactly.** `EquipmentSlot`, `EquippedItem`, `EquipmentSlots` types in `app/types/character.ts` are a verbatim match to the design, including all optional fields for readied state, conditional DR, and two-handed items.

2. **Constants catalog values verified against PTU source.** Light Armor DR 5 / $8000, Heavy Armor DR 10 + speed CS -1 / $12000, Helmet conditional DR 15 vs crits / $2250, Light Shield +2 evasion (readied: +4/10DR/slowed) / $3000, Heavy Shield +2 evasion (readied: +6/15DR/slowed) / $4500, all Focus variants +5 / $6000 -- all correct per PTU 09-gear-and-items.md.

3. **`computeEquipmentBonuses()` is clean and pure.** No side effects, no DB access, proper immutable copy of `conditionalDR` entries via spread operator, correct `Math.min` for speedDefaultCS aggregation, correct nullish coalescing for stat bonus accumulation.

4. **Immutability patterns followed throughout.** The PUT endpoint uses destructuring rest patterns (`const { [slot]: _removed, ...rest } = updatedEquipment`) for unequip operations and spread for equip operations. No mutations detected.

5. **Two-handed weapon logic is correct and bidirectional.** Equipping a two-handed item in `mainHand` auto-clears `offHand`. Equipping something in `offHand` when `mainHand` has a two-handed item auto-clears `mainHand`. Both directions are covered.

6. **Serializers include fallback for missing equipment.** Both `serializeCharacter` and `serializeCharacterSummary` use `JSON.parse(character.equipment || '{}')` to handle pre-migration characters that might have null/empty equipment fields.

7. **EQUIPMENT_SLOTS constant uses `readonly EquipmentSlot[]`** instead of `readonly string[]` (improvement over design spec), giving better type inference.

8. **File sizes are well within limits.** Largest file is `character.ts` at 262 lines. All new files are under 150 lines.

9. **Commit granularity is good.** Each P0 sub-item got its own commit with a clear, descriptive message.

## Verdict

**CHANGES_REQUIRED**

C1 (missing equipment in `buildHumanEntityFromRecord`) is a critical correctness bug that must be fixed before P0 can be considered complete. Without it, equipment data is orphaned from the encounter/combat pipeline and P1 integration will silently produce zero bonuses.

H1 (input validation) should also be addressed before P0 is closed -- the endpoint currently accepts and persists arbitrary JSON shapes in bonus fields, which could cause runtime errors in the pure utility or downstream combat calculations.

M1 (app-surface.md) should be updated as part of the fix commit.

M2 (Focus multi-slot) can be deferred to P1 as noted.
