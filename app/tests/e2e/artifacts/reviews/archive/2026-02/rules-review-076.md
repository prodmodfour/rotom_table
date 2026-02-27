---
review_id: rules-review-076
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-073
domain: combat
commits_reviewed:
  - c1d49a7
mechanics_verified:
  - sprint-maneuver-response
  - take-a-breather-response
  - end-encounter-response
  - weather-passthrough
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Sprint (p.241)
  - core/07-combat.md#Take a Breather (p.245)
  - core/07-combat.md#Volatile Afflictions (p.247)
reviewed_at: 2026-02-20T06:00:00Z
---

## Review Scope

Commit `c1d49a7` replaces manual response object construction in three encounter endpoints (`sprint.post.ts`, `breather.post.ts`, `end.post.ts`) with the shared `buildEncounterResponse()` builder from `encounter.service.ts`. This review verifies that no PTU game-mechanic data is lost, corrupted, or changed in behavior by the refactor.

Ticket: ptu-rule-073 (missing weather fields in sprint and breather responses).

## Mechanics Verified

### Sprint Maneuver Response

- **Rule:** "Increase your Movement Speeds by 50% for the rest of your turn." (`core/07-combat.md` p.241)
- **Implementation:** Sprint adds a `Sprint` tempCondition to the combatant, logs the action to moveLog, saves both to the DB, then returns the encounter state. The refactored code passes `combatants` (with the Sprint tempCondition already applied) and `{ moveLog }` (with the Sprint log entry appended) to `buildEncounterResponse()`. The builder serializes these into the response unchanged.
- **Status:** CORRECT
- **Detail:** The old code manually built a `parsed` object with 14 fields. The builder produces 22 fields. All 14 original fields are present with identical values. The 8 new fields (`isServed`, `sceneNumber`, `gridConfig`, `trainerTurnOrder`, `pokemonTurnOrder`, `currentPhase`, `createdAt`, `updatedAt`) are additive data that the client store already handles from other endpoints. The `sprintResult` sidecar is preserved outside `data`, unchanged.

### Take a Breather Response

- **Rule:** "set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions" + "become Tripped and are Vulnerable until the end of their next turn" (`core/07-combat.md` p.245)
- **Implementation:** Breather resets stages, removes temp HP, cures volatile conditions + Slow/Stuck (except Cursed), applies Tripped and Vulnerable as tempConditions, marks actions used, syncs entity to DB, appends move log, then saves combatants + moveLog to DB. The refactored code passes the same mutated `combatants` array and `{ moveLog }` to `buildEncounterResponse()`.
- **Status:** CORRECT
- **Detail:** All breather game-mechanic mutations happen to the `combatants` and `entity` objects before `buildEncounterResponse()` is called. The builder receives the already-modified combatants array and the already-appended moveLog. The breather-specific mechanics (stage reset, temp HP removal, condition curing, Tripped/Vulnerable application, action tracking) are not affected by how the response envelope is constructed. The `breatherResult` sidecar with `stagesReset`, `tempHpRemoved`, `conditionsCured`, `trippedApplied`, `vulnerableApplied` is preserved outside `data`, unchanged.

### End Encounter Response

- **Rule:** "Volatile Afflictions are cured completely at the end of the encounter." (`core/07-combat.md` p.247) and "[Stratagem] Features may only be bound during combat and automatically unbind when combat ends." (Core p.59)
- **Implementation:** End endpoint clears volatile conditions from all combatants, resets scene-frequency moves, unbinds AP for human combatants, deactivates encounter in DB (`isActive: false, isPaused: false`), syncs all changes, then builds the response. The refactored code passes `encounter` (the original DB record loaded before the update) and `updatedCombatants` with explicit overrides `{ isActive: false, isPaused: false }`.
- **Status:** CORRECT
- **Detail:** The old code hard-coded `isActive: false` and `isPaused: false` in the manual `parsed` object because `encounter` was loaded before the deactivation update. The new code correctly passes these as overrides to `buildEncounterResponse()`, which applies them via `options?.isActive ?? record.isActive`. The moveLog falls back to `JSON.parse(record.moveLog)` (no option override), which matches the old behavior -- the end endpoint does not append any new move log entries. The `defeatedEnemies` similarly falls back to `JSON.parse(record.defeatedEnemies)`, matching the old behavior.

### Weather State Passthrough

- **Rule:** Sprint and Take a Breather do not modify weather. Weather is a separate encounter state that persists across maneuver actions.
- **Implementation:** Neither the sprint nor breather endpoint modifies `record.weather`, `record.weatherDuration`, or `record.weatherSource`. The `buildEncounterResponse()` builder reads these directly from the DB record with null-coalescing defaults (`weather ?? null`, `weatherDuration ?? 0`, `weatherSource ?? null`).
- **Status:** CORRECT
- **Detail:** This is the core fix for ptu-rule-073. The old sprint and breather responses omitted weather fields entirely, causing the client-side encounter store to receive `undefined` for `weatherDuration`. The builder always includes these three fields with the correct default coalescing. The end endpoint also correctly passes weather through unchanged (weather state is preserved in the DB record and the builder reads it from there).

### No Game-Mechanic Data Lost

- **Rule:** N/A (structural verification)
- **Implementation:** Field-by-field comparison of old manual `parsed` objects vs `buildEncounterResponse()` output.
- **Status:** CORRECT
- **Detail:** Every field present in the old manual response objects is present in the builder output with identical values and identical derivation logic:
  - `id`, `name`, `battleType` -- direct pass-through, identical
  - `weather`, `weatherDuration`, `weatherSource` -- same null-coalescing, now present in sprint/breather (previously missing)
  - `combatants` -- same array reference passed through
  - `currentRound`, `currentTurnIndex` -- direct from record (or from options for end endpoint overrides)
  - `turnOrder` -- `JSON.parse(record.turnOrder)`, identical
  - `isActive`, `isPaused` -- from record or options override, identical
  - `moveLog` -- from options (sprint/breather) or JSON.parse fallback (end), identical
  - `defeatedEnemies` -- `JSON.parse(record.defeatedEnemies)`, identical

## Summary
- Mechanics checked: 5
- Correct: 5
- Incorrect: 0
- Needs review: 0

## Rulings

No ambiguous rule interpretations in this refactor. The change is purely structural (response construction) and does not alter any game-mechanic computation.

## Verdict
APPROVED -- The refactor correctly replaces manual response construction with `buildEncounterResponse()` across all three endpoints. All PTU game-mechanic data (sprint tempCondition, breather stage/condition/tempHP clearing, end-encounter deactivation and volatile condition curing) is preserved identically. Weather fields are now correctly included in sprint and breather responses, resolving ptu-rule-073. The builder adds 8 additional fields (isServed, sceneNumber, gridConfig, trainerTurnOrder, pokemonTurnOrder, currentPhase, createdAt, updatedAt) that are additive and consistent with other encounter endpoints.

## Required Changes
<!-- Empty -- APPROVED -->
