---
ticket_id: ptu-rule-098
ticket_type: ptu-rule
priority: P1
status: in-progress
domain: combat
source: decree-005
affected_files:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/constants/statusConditions.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
created_at: 2026-02-26
---

# ptu-rule-098: Auto-apply status condition combat stages with source tracking

## Problem

Status conditions with inherent CS effects (Burn: -2 Def, Paralysis: -4 Speed, Poison: -2 SpDef) require manual GM adjustment. Per decree-005, these should be auto-applied with source tracking.

## Required Changes

1. **Data model**: Add source tracking to combat stage changes. Each combatant's stages should track `{ stat, value, source }` entries alongside the current integer values.
2. **Status endpoint**: When adding Burn/Paralysis/Poison, automatically apply the corresponding CS change tagged with the condition name as source.
3. **Status cure**: When removing a status condition, reverse only the CS changes tagged with that condition's source.
4. **Take a Breather**: After resetting all stages to 0, re-apply CS changes from any active status conditions (Burn/Paralysis/Poison that weren't cured by the breather).
5. **Stage limits**: Ensure sourced CS changes respect the -6/+6 bounds.

## PTU Reference

- p.246: Burn (-2 Def CS), Paralysis (-4 Speed CS), Poison (-2 SpDef CS)
- p.235: Combat Stages range -6 to +6

## Acceptance Criteria

- Adding Burn auto-applies -2 Def CS with source "Burn"
- Adding Paralysis auto-applies -4 Speed CS with source "Paralysis"
- Adding Poison auto-applies -2 SpDef CS with source "Poison"
- Curing a condition reverses only its sourced CS changes
- Take a Breather resets stages then re-applies active condition-sourced stages
- Manual CS adjustments are unaffected by source tracking

## Resolution Log

### Implementation (branch: slave/3-dev-status-cs-tracking-20260226-154130)

**Commits:**
- `0208235` feat: add StageSource type and stageSources field to Combatant
- `8a94b21` feat: add STATUS_CS_EFFECTS constant and getStatusCsEffect lookup
- `30f2751` feat: add source-tracked CS auto-application for status conditions
- `70509be` feat: sync auto-CS stage changes to DB in status endpoint
- `da00d41` feat: re-apply surviving status CS effects after Take a Breather
- `b72f199` fix: reverse status-sourced CS effects when combatant faints
- `e60fee7` feat: auto-apply CS effects for pre-existing conditions on combat entry
- `aa94947` fix: include Badly Poisoned in STATUS_CS_EFFECTS mapping

**Files changed:**
- `app/types/combat.ts` — Added `StageSource` interface (stat, value, source)
- `app/types/encounter.ts` — Added optional `stageSources` array to `Combatant` interface
- `app/constants/statusConditions.ts` — Added `STATUS_CS_EFFECTS` mapping and `getStatusCsEffect()` lookup
- `app/server/services/combatant.service.ts` — Added `applyStatusCsEffects()`, `reverseStatusCsEffects()`, `reapplyActiveStatusCsEffects()`; Updated `updateStatusConditions()` for auto-CS; Updated `applyDamageToEntity()` for faint CS reversal; Updated `buildCombatantFromEntity()` for combat-entry CS application
- `app/server/api/encounters/[id]/status.post.ts` — Syncs both status and stage changes to DB; Returns stageChanges in response
- `app/server/api/encounters/[id]/breather.post.ts` — Calls `reapplyActiveStatusCsEffects()` after stage reset; Improved move log notes

**Design decisions:**
- `stageSources` lives on Combatant (not entity) because it's combat-session state
- Source tracking records the *actual* delta applied (respecting -6/+6 bounds), not the nominal value
- Reversal uses tracked delta, not nominal value, ensuring exactness even near bounds
- Badly Poisoned treated as poison variant with same -2 SpDef CS per PTU rules
- WebSocket sync handled by existing `encounter_update` broadcast (full state push)

### Fix Cycle (branch: slave/3-dev-combat-cs-fix-20260226)

Addresses code-review-184 + rules-review-161 CHANGES_REQUIRED.

**Commits:**
- `7ad0acd` fix: sync stageModifiers to entity DB when combatant faints
- `0f7ae02` refactor: use ZERO_EVASION_CONDITIONS constant for evasion checks
- `02a8094` fix: reset stageModifiers to defaults in buildCombatantFromEntity

**Fixes applied:**
- H1: Faint path now syncs reversed stageModifiers to entity DB via `syncStagesToDatabase()` in both `damage.post.ts` and `move.post.ts`
- M1: Both `useMoveCalculation.ts` and `calculate-damage.post.ts` now import and use `ZERO_EVASION_CONDITIONS` constant instead of inline string comparisons
- HIGH-1: `buildCombatantFromEntity` now resets stageModifiers to zero defaults before calling `reapplyActiveStatusCsEffects`, preventing double-application of status CS on combat re-entry
