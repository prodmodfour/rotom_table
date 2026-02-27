---
review_id: code-review-003
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: design-testability-001
domain: combat
commits_reviewed:
  - ceecfbc
  - 5299222
  - 3da1a78
  - f0c6f6a
  - e955a5e
  - e03a450
  - 2867642
  - 5dc97c7
  - e7aa6aa
  - 571034e
files_reviewed:
  - app/utils/damageCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-capture-variant-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-faint-replacement-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-healing-recovery-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-stage-buffs-001.spec.ts
  - app/tests/e2e/scenarios/capture/capture-workflow-standard-capture-001.spec.ts
  - app/tests/e2e/scenarios/capture/capture-workflow-multi-attempt-001.spec.ts
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/designs/design-testability-001.md
  - app/server/services/encounter.service.ts
  - app/tests/e2e/scenarios/combat/combat-helpers.ts
verdict: APPROVED
issues_found:
  critical: 1
  high: 0
  medium: 0
scenarios_to_rerun:
  - combat-workflow-wild-encounter-001
reviewed_at: 2026-02-16T16:00:00
---

## Review Scope

Implementation of design-testability-001 P0: server-side damage calculation endpoint. Two groups of work across 10 commits:

- **Group A** (ceecfbc–e03a450): Test refactoring — 7 spec files changed from hardcoded assertions to server-computed value assertions (fetch current HP from server before each damage call, assert `newHp` using server-reported `hpDamage`).
- **Group B** (2867642–571034e): P0 implementation — `damageCalculation.ts` pure utility (298 lines), `calculate-damage.post.ts` thin endpoint (152 lines), docs updates.

Design spec reference: `app/tests/e2e/artifacts/designs/design-testability-001.md`

## Issues

### CRITICAL

1. **`shouldFaint` is undefined — test will crash** — `combat-workflow-wild-encounter-001.spec.ts:167`

   The refactoring (commit e955a5e) removed the variable definition but left a reference:

   ```typescript
   // Lines removed by refactor:
   // const oddishHpAfterR1 = oddishMaxHp - emberDamage
   // const oddishHpAfterR2 = oddishHpAfterR1 - emberDamage
   // const shouldFaint = oddishHpAfterR2 <= 0

   // Line 167 — still references the deleted variable:
   if (shouldFaint) {
     const encounter = await getEncounter(request, encounterId)
     const oddish = findCombatantByEntityId(encounter, oddishPokemonId)
     expect(oddish.entity.statusConditions).toContain('Fainted')
   }
   ```

   This throws `ReferenceError: shouldFaint is not defined` at runtime. TypeScript should also flag this at compile time.

   **Fix:**
   ```typescript
   if (dmg.damageResult.fainted) {
     const encounter = await getEncounter(request, encounterId)
     const oddish = findCombatantByEntityId(encounter, oddishPokemonId)
     expect(oddish.entity.statusConditions).toContain('Fainted')
   }
   ```

   This aligns with line 165 which already checks `dmg.damageResult.fainted`.

### HIGH

(none)

### MEDIUM

(none)

## What Looks Good

- **Pure function utility follows `captureRate.ts` pattern exactly** — typed input (`DamageCalcInput`), typed result with full breakdown (`DamageCalcResult`), zero side effects, zero DB access. Clean separation between formula computation and endpoint wiring.

- **Type chart verified identical** to the existing client-side chart in `useCombat.ts:242-261`. All 18 types present, every non-neutral matchup matches entry by entry. No discrepancies.

- **Endpoint is properly thin** — loads encounter via `loadEncounter`, finds combatants via `findCombatant`, extracts stats by damage class, delegates to pure function. Good validation chain: encounter exists → combatants exist → move exists → move has damageBase > 0 → move is not Status class.

- **`getEntityStats` correctly handles both entity types** — Pokemon uses `currentStats` (calculated stats), HumanCharacter uses `stats`. Defense stats extracted based on move's damage class (Physical → defense, Special → specialDefense). Optional chaining on `stageModifiers` with `?? 0` fallback handles entities that haven't been in combat.

- **`getEffectivenessLabel` uses 2.25 threshold** instead of design spec's 2.0 — correct decision. PTU dual-type Super Effective produces 1.5 × 1.5 = 2.25, so the "Doubly Super Effective" label must cover that value.

- **Test refactoring pattern is sound** — each damage test now: (1) fetches current state from server, (2) applies damage, (3) asserts `newHp` using `Math.max(0, previousHp - serverReportedHpDamage)`. This eliminates tautological "client computes value, sends it, asserts it came back" tests.

- **Commit granularity is correct** — 10 focused commits. Test refactoring: one commit per spec file. Feature: one for utility, one for endpoint, one for docs. Each produces a working intermediate state.

- **Immutability maintained** — types arrays use spread (`[...pokemon.types]`), no mutation of input objects or combatant data.

- **Design spec updated with implementation log** and `app-surface.md` updated with new endpoint documentation. Both required by the pipeline.

## Verdict

APPROVED — CRITICAL #1 fixed in commit 732ee84. The one-line change (`shouldFaint` → `dmg.damageResult.fainted`) is correct and consistent with the existing assertion on line 165. Test suite passes 9/9. Ready for Game Logic Reviewer.

## Required Changes

1. Fix `combat-workflow-wild-encounter-001.spec.ts:167` — replace `if (shouldFaint)` with `if (dmg.damageResult.fainted)`.

## Scenarios to Re-run

- `combat-workflow-wild-encounter-001`: The only file with the bug. Must pass cleanly after fix. The other 6 refactored spec files are unaffected (they don't reference `shouldFaint`).

## Fix Log

- **Commit:** 732ee84 — `fix: replace undefined shouldFaint with dmg.damageResult.fainted`
- **File changed:** `app/tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts` (line 167)
- **Test result:** 9/9 passed (combat-workflow-wild-encounter-001)
