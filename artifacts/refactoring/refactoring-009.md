---
ticket_id: refactoring-009
priority: P2
categories:
  - PTU-INCORRECT
affected_files:
  - app/constants/statusConditions.ts
  - app/types/combat.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
estimated_scope: medium
status: resolved
created_at: 2026-02-16T22:00:00
origin: rules-review-005
---

## Summary

The codebase includes three status conditions — `Encored`, `Taunted`, `Tormented` — that do not exist in PTU 1.05. In the tabletop rules, the moves Encore, Taunt, and Torment inflict existing volatile conditions (Confused/Suppressed/Enraged), not unique conditions named after the move. These phantom conditions appear in the type system, UI, condition lists, and capture rate calculations. A decision is needed: remove them or keep them as intentional app extensions.

## Findings

### Finding 1: PTU-INCORRECT — Three non-PTU conditions in volatile list

- **Metric:** 3 conditions in `VOLATILE_CONDITIONS` that don't exist in PTU 1.05
- **Threshold:** Any condition not defined in the rulebook
- **Impact:** Currently low — these conditions are classified as Volatile, so breather cures them and capture rate gives +5, which is correct *if* they're treated as Volatile equivalents. The risk is:
  1. A GM applies "Taunted" via the UI when PTU says "Enraged" — the mechanical effect should be identical but the name is misleading
  2. If move effects are ever automated, applying "Taunted" instead of "Enraged" would be incorrect
  3. LLM agents referencing PTU rules won't find these conditions in the rulebook
- **Evidence:**
  - **Taunt** → "The target becomes Enraged." (`core/10-indices-and-reference.md` line 4357)
  - **Torment** → "The target becomes Suppressed." (`core/10-indices-and-reference.md` line 4388)
  - **Encore** → Roll 1d6: 1-2 Confused, 3-4 Suppressed, 5-6 Enraged (`core/10-indices-and-reference.md` lines 7923-7926)

### Affected locations (6 files)

| File | Line(s) | Usage |
|------|---------|-------|
| `constants/statusConditions.ts` | 12 | Canonical `VOLATILE_CONDITIONS` array |
| `types/combat.ts` | 7 | `StatusCondition` union type definition |
| `utils/captureRate.ts` | 22-23 | Local volatile conditions list (capture rate +5) |
| `composables/useCapture.ts` | 147 | Local volatile conditions list (capture rate +5) |
| `server/services/combatant.service.ts` | 232 | Condition validation list |
| `components/encounter/StatusConditionsModal.vue` | 51 | UI condition picker |

## Decision Required

**Option A: Remove Encored/Taunted/Tormented (recommended)**
- Remove from all 6 files
- Remove from `StatusCondition` union type
- If any Pokemon in the database has these conditions, migrate them to the PTU equivalent (Enraged for Taunted, Suppressed for Tormented, Confused for Encored — though Encore is random)
- Pro: Matches PTU 1.05 exactly, no phantom conditions
- Con: If a GM has manually applied these via the UI, they vanish on migration

**Option B: Keep as app extensions**
- Document them as "app-specific conditions inspired by move names"
- Add comments in `statusConditions.ts` explaining the mapping
- Pro: No migration needed, no breaking change
- Con: Perpetuates non-PTU terminology, confuses LLM agents and rule lookups

## Suggested Refactoring (Option A)

1. Remove `'Encored'`, `'Taunted'`, `'Tormented'` from `VOLATILE_CONDITIONS` in `constants/statusConditions.ts`
2. Remove from `StatusCondition` union in `types/combat.ts`
3. Remove from local lists in `captureRate.ts` and `useCapture.ts`
4. Remove from validation list in `combatant.service.ts`
5. Remove from UI picker in `StatusConditionsModal.vue`
6. Add a Prisma migration or startup script to convert any existing `Taunted` → `Enraged`, `Tormented` → `Suppressed`, `Encored` → `Enraged` (most common Encore outcome) in stored `statusConditions` JSON

Estimated commits: 1-2

## Related Lessons

- rules-review-005: Full PTU evidence for Taunt/Torment/Encore move effects
- rules-review-002: Previously listed these as volatile without questioning their existence

## Resolution Log
- Commits: 3fc41eb
- Decision: Option A (remove) — per user direction
- Files changed:
  - `app/types/combat.ts` — removed `'Encored' | 'Taunted' | 'Tormented'` from `StatusCondition` union
  - `app/constants/statusConditions.ts` — removed from `VOLATILE_CONDITIONS` array
  - `app/server/services/combatant.service.ts` — removed from `VALID_STATUS_CONDITIONS` array
  - `app/components/encounter/StatusConditionsModal.vue` — removed from `AVAILABLE_STATUSES` UI picker
- Files auto-fixed (import from constants): `app/utils/captureRate.ts`, `app/composables/useCapture.ts`
- New files created: `app/prisma/migrate-phantom-conditions.ts` — one-time DB migration script (maps Taunted→Enraged, Tormented→Suppressed, Encored→Enraged)
- DB migration result: 0 records affected (no phantom conditions existed in database)
- Tests passing: 507/508 (1 pre-existing failure in settings.test.ts unrelated to this change)
