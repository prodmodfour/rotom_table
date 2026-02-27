---
review_id: code-review-115b
target: ptu-rule-045
trigger: follow-up
follows_up: code-review-115
verdict: APPROVED
reviewed_commits: [4590346, 1626800, aaab058, 9a8f842]
reviewed_files:
  - app/server/services/combatant.service.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/package.json
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/designs/design-equipment-001.md
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

All three issues from code-review-115 (C1, H1, M1) have been resolved correctly. The fixes are minimal, targeted, and introduce no new issues. The fourth commit (9a8f842) updates the design spec to record the fix commits, which is good documentation hygiene.

## C1 Resolution (CRITICAL: buildHumanEntityFromRecord missing equipment)

**Status: RESOLVED**

Commit `4590346` adds a single line to `buildHumanEntityFromRecord()` at line 511 of `app/server/services/combatant.service.ts`:

```typescript
equipment: record.equipment ? JSON.parse(record.equipment) : {},
```

Verified:
1. The line is positioned between `currentAp` and `inventory`, consistent with the field order in the `HumanCharacter` interface (where `equipment` appears before `inventory`).
2. The fallback `{}` matches the `EquipmentSlots` type (all properties are optional, so an empty object is valid).
3. The ternary guard (`record.equipment ?`) handles pre-migration records where the column may be null or empty, consistent with how the serializers handle the same field (`JSON.parse(character.equipment || '{}')`). The slight difference in guard style (truthiness check vs `|| '{}'`) is functionally equivalent since `JSON.parse(null)` would throw but the truthiness check prevents that path.
4. All callers of `buildHumanEntityFromRecord` (encounter loading, scene-to-encounter conversion, combatant addition) now receive a properly typed `equipment` field.

No issues.

## H1 Resolution (HIGH: Zod validation for equipment PUT)

**Status: RESOLVED**

Commit `1626800` replaces the minimal field-presence check with a comprehensive Zod schema in `app/server/api/characters/[id]/equipment.put.ts`.

Verified the following requirements from the original review:

1. **`name` is validated as a string:** `z.string().min(1)` -- rejects non-strings, empty strings, objects, arrays. Closes the prototype pollution vector.

2. **Numeric fields have type and range validation:**
   - `damageReduction`: `z.number().int().min(0).max(100)` -- bounded, integer-only
   - `evasionBonus`: `z.number().int().min(0).max(100)` -- bounded, integer-only
   - `cost`: `z.number().int().min(0)` -- non-negative integer
   - `speedDefaultCS`: `z.number().int().min(-6).max(0)` -- correctly bounded to the PTU-valid range (-6 to 0)

3. **`statBonus.stat` is validated against a known set:** `z.enum(VALID_STAT_BONUS_KEYS)` where `VALID_STAT_BONUS_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion']`. Cross-checked against `keyof Stats | 'accuracy' | 'evasion'` in `app/types/character.ts` -- exact match.

4. **`statBonus.value` is a number:** `z.number().int().min(1).max(100)` -- bounded, positive integer.

5. **`twoHanded` is validated as a boolean:** `z.boolean().optional()`.

6. **No unexpected extra properties:** Schema uses `.strict()`, which rejects unknown keys. Confirmed by runtime test that Zod v4 `.strict()` correctly throws on unrecognized keys.

7. **Validated data is used for persistence (not raw input):** The code builds a `validatedSlots` map from `parseResult.data` (line 109), and the subsequent update loop iterates over `validatedSlots` (line 131), not `rawSlots`. The raw body is never used after the validation gate. This is the correct pattern.

8. **`slot` field validated as enum:** `z.enum(['head', 'body', 'mainHand', 'offHand', 'feet', 'accessory'])` -- matches the `EquipmentSlot` type exactly.

9. **Nested object schemas are complete:**
   - `readiedBonuses`: all three fields validated (`evasionBonus`, `damageReduction`, `appliesSlowed`)
   - `conditionalDR`: both fields validated (`amount`, `condition`)

10. **Error messages are descriptive:** Failed validation returns a 400 with specific field paths and messages (e.g., `damageReduction: Number must be less than or equal to 100`).

11. **Zod added as a production dependency:** `zod@^4.3.6` added to `package.json` (not devDependencies), which is correct since it is used in server API code that runs at runtime.

No issues.

## M1 Resolution (MEDIUM: app-surface.md update)

**Status: RESOLVED**

Commit `aaab058` updates `.claude/skills/references/app-surface.md`:

1. Characters section header updated from "CRUD + healing/rest actions" to "CRUD + healing/rest + equipment actions."
2. Two new endpoint entries added in the correct position (after the base CRUD endpoints, before the rest/healing endpoints):
   - `GET /api/characters/:id/equipment` -- current equipment slots + aggregate bonuses
   - `PUT /api/characters/:id/equipment` -- equip/unequip items (Zod-validated)
3. The "Zod-validated" annotation on the PUT entry is a useful signal for anyone reading the surface map.

No issues.

## New Issues Found

None. The fixes are tightly scoped, introduce no new behavioral changes beyond what was requested, and do not modify any adjacent logic. The design spec update (commit 9a8f842) correctly records all three fix commits with their descriptions and affected files.

## Verdict

**APPROVED**

All three issues from code-review-115 are resolved. C1 (equipment field in entity builder) is correctly implemented with null-safe JSON parsing and empty-object fallback. H1 (Zod validation) is thorough -- every field in the `EquippedItem` interface is covered with appropriate type, range, and enum constraints, `.strict()` blocks unknown properties, and validated data (not raw input) is persisted. M1 (app-surface.md) is updated with both new endpoints. No new issues introduced.
