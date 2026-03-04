---
review_id: code-review-065
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-026
domain: combat
commits_reviewed:
  - 70ee060
files_reviewed:
  - app/server/api/encounter-templates/[id]/load.post.ts
  - app/server/api/encounter-templates/from-encounter.post.ts
  - app/server/services/combatant.service.ts
  - app/types/encounter.ts
  - app/types/combat.ts
  - app/types/character.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 0
scenarios_to_rerun:
  - encounter-templates
reviewed_at: 2026-02-20T12:00:00Z
---

## Review Scope

Review of bug-026 fix: template load used wrong field names and data shapes for human combatants (`injuries`, `combatStages`/`stageModifiers`, `tempHp`/`temporaryHp`). Commit `70ee060` aligns these with the `Combatant` and `HumanCharacter` type definitions.

## Issues

### CRITICAL

None.

### HIGH

1. **`statusConditions: []` is on the combatant, not the entity** -- `load.post.ts:119`

   The `Combatant` type (`app/types/encounter.ts:17-56`) has no `statusConditions` field. Status conditions belong on the entity (`HumanCharacter.statusConditions` at `app/types/character.ts:184`). The template load puts `statusConditions: []` at the combatant level but does not set it on the entity.

   The template save (`from-encounter.post.ts:64-70`) does not include `statusConditions` in `entityData` for human combatants:
   ```typescript
   {
     name: c.entity.name ?? 'Unknown',
     characterType: c.entity.characterType ?? 'npc',
     level: c.entity.level ?? 1,
     stats: c.entity.stats ?? { ... },
     trainerClasses: c.entity.trainerClasses ?? '[]'
   }
   ```

   So the `...tc.entityData` spread on the entity (line 96) will NOT contain `statusConditions`. Downstream code that reads `combatant.entity.statusConditions` (e.g., `combatant.service.ts:254`) will get `undefined` instead of `[]`, which may cause filter/includes calls to throw.

   **Current code:**
   ```typescript
   entity: tc.entityData ? {
     id: uuidv4(),
     ...tc.entityData,
     currentHp: maxHp,
     maxHp: maxHp,
     temporaryHp: 0,
     injuries: 0,
     stageModifiers: { ... }
   } : null,
   // ... combatant level:
   statusConditions: [],  // <-- wrong location
   ```

   **Fix:** Move `statusConditions: []` inside the entity object (after `stageModifiers`), and remove it from the combatant level:
   ```typescript
   entity: tc.entityData ? {
     id: uuidv4(),
     ...tc.entityData,
     currentHp: maxHp,
     maxHp: maxHp,
     temporaryHp: 0,
     injuries: 0,
     stageModifiers: { ... },
     statusConditions: []
   } : null,
   ```

   This matches the canonical `parseHumanCharacter` output in `combatant.service.ts:488-491` where `statusConditions` is on the entity.

2. **Missing `entityId` on template-loaded human combatants** -- `load.post.ts:88-124`

   The `Combatant` type requires `entityId: string` (non-optional, `encounter.ts:20`). The template-loaded human combatant does not set `entityId`. The canonical `buildCombatantFromEntity` always sets it (`combatant.service.ts:557`).

   The file header comment says "Human combatants remain inline-only (no entityId, no DB sync)" -- but the type still requires it. Any downstream code accessing `combatant.entityId` on a template-loaded human will get `undefined` and may fail silently or throw.

   **Fix:** Set `entityId` to the same generated UUID as the entity's `id`:
   ```typescript
   const entityId = uuidv4()
   // ...
   entity: tc.entityData ? {
     id: entityId,
     ...tc.entityData,
     // ...
   } : null,
   entityId,
   ```

   This ensures the combatant<->entity link is consistent even without a DB record. The `entityId` field is used in combatant lookup, move logging, and entity-update broadcasts.

### MEDIUM

None.

## What Looks Good

- All three original issues from the ticket are correctly fixed:
  - `injuries` at entity level changed from `{ count: 0, max: 5 }` to `0` (plain number per `HumanCharacter` type).
  - `injuries` at combatant level changed from `{ count: 0, max: 5 }` to `{ count: 0, sources: [] }` (matches `InjuryState`).
  - `combatStages` removed from combatant, `stageModifiers` added to entity (correct location per `HumanCharacter` type).
  - `tempHp` renamed to `temporaryHp` on entity.
- Bonus fixes are correct and match the canonical `buildCombatantFromEntity`:
  - `actionsRemaining: 2` and `shiftActionsRemaining: 1` added.
  - `canBeCommanded: true` and `isHolding: false` added to `turnState`.
- The developer searched the codebase for duplicate occurrences (`combatStages`, `tempHp: 0`, `injuries.*count.*max`) and confirmed this was the only instance.
- The commit message is well-structured with per-field change documentation.

## Verdict

CHANGES_REQUIRED -- Two remaining type alignment issues: `statusConditions` is placed on the combatant instead of the entity, and `entityId` is missing from the combatant. Both are straightforward fixes in the same file.

## Required Changes

1. Move `statusConditions: []` from the combatant level (line 119) into the entity object (after `stageModifiers`).
2. Add `entityId` to the combatant, using the same UUID generated for the entity's `id`. Extract the `uuidv4()` call for entity `id` into a variable and reference it in both places.

## Scenarios to Re-run

- encounter-templates: Template load creates human combatants that are used in combat; the field fixes affect how they interact with damage, status, and entity-update flows.
