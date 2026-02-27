---
review_id: code-review-070
review_type: code
reviewer: senior-reviewer
trigger: follow-up
follows_up: code-review-065
target_report: bug-026
domain: combat
commits_reviewed:
  - 9f36bfa
files_reviewed:
  - app/server/api/encounter-templates/[id]/load.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-20T14:00:00Z
---

## Review Scope

Follow-up review of bug-026 fix (commit `9f36bfa`). The previous review (code-review-065) required two changes:
1. Move `statusConditions: []` from combatant level into entity object (after `stageModifiers`)
2. Add `entityId` to combatant, using the same UUID generated for the entity's `id`

## Verification of Required Changes

### 1. `statusConditions` moved to entity -- CONFIRMED

`load.post.ts:106`: `statusConditions: []` now sits inside the entity object, immediately after the `stageModifiers` block (lines 102-105). This matches the canonical structure: `Combatant` type (`app/types/encounter.ts:17-56`) has no `statusConditions` field, while `HumanCharacter` (`app/types/character.ts`) does.

Confirmed `statusConditions` is NOT present at the combatant level -- the old line 119 (`statusConditions: []`) was removed from the combatant object.

Cross-reference with `buildCombatantFromEntity` in `combatant.service.ts:544-580`: the canonical builder does not set `statusConditions` on the combatant wrapper either. Status conditions live on the entity. Consistent.

### 2. `entityId` added to combatant -- CONFIRMED

`load.post.ts:86`: `const entityId = uuidv4()` extracts the UUID into a shared variable.
`load.post.ts:91`: `entityId,` is set on the combatant.
`load.post.ts:96`: `id: entityId,` is set on the entity.

Both point to the same UUID. This matches the canonical `buildCombatantFromEntity` pattern (`combatant.service.ts:556-557`) where `entityId` is passed in and the entity already has a matching `id`.

The old comment "Human combatants: keep inline-only (no entityId, no DB sync)" has been updated to "Human combatants: inline-only (no DB sync), but still need entityId per Combatant type" (line 79). This correctly documents the design: no database record exists for the human, but the combatant still needs the `entityId` field to satisfy the type contract and enable downstream code (entity-update broadcasts, move logging, combatant lookup).

## Structural Comparison with Canonical Builder

Comparing the human combatant object at `load.post.ts:88-125` against `buildCombatantFromEntity` (`combatant.service.ts:544-580`):

| Field | Template Load | Canonical Builder | Match? |
|---|---|---|---|
| `id` | `uuidv4()` | `uuidv4()` | Yes |
| `type` | `tc.type` | `entityType` | Yes |
| `entityId` | `entityId` (shared UUID) | `entityId` (param) | Yes |
| `side` | `tc.side` | `side` | Yes |
| `initiative` | `baseSpeed` | `stats.speed + bonus` | Yes (bonus defaults to 0) |
| `initiativeBonus` | `0` | `options.initiativeBonus ?? 0` | Yes |
| `hasActed` | `false` | `false` | Yes |
| `actionsRemaining` | `2` | `2` | Yes |
| `shiftActionsRemaining` | `1` | `1` | Yes |
| `turnState` | Full object | Full object | Yes |
| `injuries` | `{ count: 0, sources: [] }` | `{ count: 0, sources: [] }` | Yes |
| `physicalEvasion` | `initialEvasion(baseDefense)` | `initialEvasion(stats.defense)` | Yes |
| `specialEvasion` | `initialEvasion(baseSpDef)` | `initialEvasion(stats.specialDefense)` | Yes |
| `speedEvasion` | `initialEvasion(baseSpeed)` | `initialEvasion(stats.speed)` | Yes |
| `position` | `tc.position` | `position` | Yes |
| `tokenSize` | `tc.tokenSize \|\| 1` | `tokenSize (default 1)` | Yes |
| `entity.statusConditions` | `[]` | On entity via record parse | Yes |
| `entity.stageModifiers` | Full zeroed object | On entity via record parse | Yes |

All combatant-level fields now align with the canonical builder. The entity-level fields (`statusConditions`, `stageModifiers`, `injuries`, `temporaryHp`, `currentHp`, `maxHp`) are all present and correctly typed.

## What Looks Good

- The `entityId` extraction into a shared `const` is clean -- single source of truth for both the combatant's `entityId` and the entity's `id`.
- The comment update accurately reflects the design intent.
- The diff is focused: only the one file changed, and only the lines that needed to move/be added were touched.
- No unnecessary refactoring or scope creep.

## Verdict

APPROVED -- Both required changes from code-review-065 are implemented correctly. `statusConditions` is now on the entity where it belongs, and `entityId` links combatant to entity using a shared UUID. The human combatant structure now fully matches the canonical `buildCombatantFromEntity` output.
