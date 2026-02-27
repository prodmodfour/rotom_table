---
last_updated: 2026-02-17T13:00:00
updated_by: retrospective-analyst
---

## Domain: combat

### Tier 2 (Mechanic Validations) — COMPLETE

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 15 mechanic loops (+ 12 sub-loops) | 2026-02-15 |
| Scenarios | complete | 19/19 (6 P0, 8 P1, 5 P2) | 2026-02-15 |
| Verifications | complete | 19/19 PASS | 2026-02-15 |
| Test Runs | complete | 80/80 PASS (19 specs) | 2026-02-15 |
| Results | complete | 19/19 result files | 2026-02-15 |
| Triage | complete | 19/19 PASS — 0 failures to triage | 2026-02-15 |

### Tier 1 (Session Workflows) — COMPLETE

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 6 workflows (+ 1 sub-workflow) | 2026-02-15 |
| Scenarios | complete | 7/7 (6 P0, 1 P1) — capture-variant rewritten with dynamic assertions | 2026-02-16 |
| Verifications | complete | 7/7 PASS | 2026-02-16 |
| Test Runs | complete | 7/7 PASS (55 tests across 7 specs) | 2026-02-16 |
| Results | complete | 7/7 result files | 2026-02-16 |
| Triage | complete | 5 resolved (4 original + correction-005). 0 open failures. | 2026-02-16 |

Workflows: W1 (full wild encounter), W2 (stage buffs + matchups), W3 (faint + replacement), W4 (status chain), W5 (healing + recovery), W6 (template setup). Sub-workflow: W1 capture variant. 3 mechanics remain Tier 2 only (critical hit, struggle, multi-target).

### Tier 1 Test Run Results (Playtester)

**7 PASS, 0 FAIL — 55 tests passed across 7 spec files (serial mode)**

| Spec File | Tests | Status | Duration | Notes |
|-----------|-------|--------|----------|-------|
| combat-workflow-healing-recovery-001.spec.ts | 8/8 | PASS | ~3.6s | — |
| combat-workflow-stage-buffs-001.spec.ts | 7/7 | PASS | ~3.2s | — |
| combat-workflow-capture-variant-001.spec.ts | 7/7 | PASS | ~1.4s | Regenerated per correction-005 (wild-spawn + dynamic query-then-compute). Stable across 3 consecutive runs. |
| combat-workflow-faint-replacement-001.spec.ts | 9/9 | PASS | ~3.7s | Re-run after APP_BUG fix (72df77b) |
| combat-workflow-status-chain-001.spec.ts | 7/7 | PASS | ~3.2s | Re-run after SCENARIO_BUG correction (2a4f84e) |
| combat-workflow-wild-encounter-001.spec.ts | 9/9 | PASS | ~3.6s | Re-run after SCENARIO_BUG correction (2a4f84e) |
| combat-workflow-template-setup-001.spec.ts | 7/7 | PASS | ~3.7s | Re-run after SCENARIO_BUG correction (2a4f84e) |

**Previous Failures (all resolved):**

| # | Scenario | Assertion | Classification | Resolution |
|---|----------|-----------|---------------|------------|
| 1 | faint-replacement-001 | #8 (Burned cleared on faint) | APP_BUG | Fixed: `72df77b` — clear all statuses on faint per PTU p248 |
| 2 | status-chain-001 | #4 (Electric immunity) | SCENARIO_BUG | Fixed: `2a4f84e` — removed immunity assertion (API is GM tool) |
| 3 | wild-encounter-001 | #2 (Oddish HP) | SCENARIO_BUG | Fixed: `2a4f84e` — spec reads stats dynamically after spawn |
| 4 | template-setup-001 | #3 (Charmander HP) | SCENARIO_BUG | Fixed: `2a4f84e` — spec uses >= minimum checks |

### Tier 1 Scenario Summary (Scenario Crafter)

| Scenario ID | Loop | Priority | PTU Assertions | Key Mechanics |
|-------------|------|----------|---------------|---------------|
| combat-workflow-wild-encounter-001 | W1 | P0 | 10 | HP, initiative, STAB, type-eff, injury, faint, lifecycle |
| combat-workflow-stage-buffs-001 | W2 | P0 | 8 | Combat stages, stage multiplier, STAB, type-eff, evasion-from-stages |
| combat-workflow-faint-replacement-001 | W3 | P0 | 10 | Faint, status-clear-on-faint, initiative insertion, replacement |
| combat-workflow-status-chain-001 | W4 | P0 | 9 | Status application, type immunity, Take a Breather, persistent vs volatile |
| combat-workflow-healing-recovery-001 | W5 | P0 | 8 | Heal cap, faint recovery, temp HP, injury healing |
| combat-workflow-template-setup-001 | W6 | P0 | 7 | Template load, initiative, serve to group |
| combat-workflow-capture-variant-001 | W1-sub | P1 | 7 | Wild-spawn, damage (dynamic), STAB, injury (dynamic), capture rate, capture attempt |

**Total: 7 scenarios, 59 PTU assertions**

**Species used:** Growlithe, Oddish, Bulbasaur, Caterpie, Pidgey, Charmander, Eevee, Pikachu, Squirtle, Rattata

**Lessons applied:**
- Lesson 1 (STAB): Every attacker/move pair explicitly checked for type match. Annotated in every damage phase.
- Lesson 2 (Learn levels): Every move verified against pokedex file with citation (e.g., "L6, gen1/growlithe.md").
- Lesson 3 (Type effectiveness): Every type pair checked against chart individually. Dual-type targets show both lookups.

### Results Verification Summary — Tier 2 (Result Verifier)

**CLEAN RUN — 0 failures to triage**

- Results analyzed: 19
- Passed: 19
- Failed: 0

| Category | Count | Reports Generated |
|----------|-------|-------------------|
| APP_BUG | 0 | — |
| SCENARIO_BUG | 0 | — |
| TEST_BUG | 0 | — |
| AMBIGUOUS | 0 | — |

76 assertions across 19 scenarios all confirmed PASS. No retries, no Playwright errors, no self-corrections.

### Results Verification Summary — Tier 1 (Result Verifier)

**4 FAILURES TRIAGED — 1 APP_BUG, 3 SCENARIO_BUG**

- Results analyzed: 7
- Passed: 3
- Failed: 4

| Category | Count | Reports Generated |
|----------|-------|-------------------|
| APP_BUG | 1 | bug-001.md |
| SCENARIO_BUG | 3 | correction-001.md, correction-002.md, correction-003.md |
| TEST_BUG | 0 | — |
| AMBIGUOUS | 0 | — |
| FEATURE_GAP | 0 | — |
| UX_GAP | 0 | — |

### Failure Triage

| # | Scenario | Assertion | Category | Report | Assigned To |
|---|----------|-----------|----------|--------|-------------|
| 1 | combat-workflow-faint-replacement-001 | #8: Burned cleared on faint | APP_BUG | bug-001.md | Developer |
| 2 | combat-workflow-status-chain-001 | #4: Electric immunity blocks Paralysis | SCENARIO_BUG | correction-001.md | Scenario Crafter |
| 3 | combat-workflow-wild-encounter-001 | #2: Oddish HP (random stats) | SCENARIO_BUG | correction-002.md | Scenario Crafter |
| 4 | combat-workflow-template-setup-001 | #3a: Charmander HP (random stats) | SCENARIO_BUG | correction-003.md | Scenario Crafter |

### Passing Results Confirmed

| Scenario | Assertions | Status |
|----------|-----------|--------|
| combat-workflow-healing-recovery-001 | 8/8 | PASS |
| combat-workflow-stage-buffs-001 | 8/8 | PASS |
| combat-workflow-capture-variant-001 | 7/7 | PASS |

### New Failure (2026-02-16 retest)

| # | Scenario | Assertion | Category | Resolution |
|---|----------|-----------|----------|------------|
| 5 | combat-workflow-capture-variant-001 | #2: Rattata HP after 20 damage (expected 9, got 12) | SCENARIO_BUG | Scenario assumes Rattata wild-spawn HP=29 but `generateAndCreatePokemon` uses random stat distribution. correction-004 switched to explicit creation — **superseded by correction-005**: explicit creation removes wild-spawn from the test, defeating its purpose. Recommended fix: keep wild-spawn, query actual stats after spawn, compute expected values dynamically. |

### Recommended Next Steps

4 original failures resolved. 1 SCENARIO_BUG from retest (capture-variant) — correction-004 superseded by correction-005.

1. ~~**Developer:** Fix bug-001~~ — DONE (commit `72df77b`)
2. ~~**Scenario Crafter:** Apply correction-001, -002, -003~~ — DONE (commit `2a4f84e`)
3. ~~**Playtester:** Re-run all 4 failed scenarios~~ — DONE (run 2026-02-15-002, all PASS)
4. ~~**Scenario Crafter:** Apply correction-005~~ — DONE (rewritten with wild-spawn + dynamic assertions)
5. ~~**Scenario Verifier:** Re-verify capture-variant-001 (7 assertions, dynamic formulas)~~ — DONE (PASS: 7/7 assertions correct, 0 setup issues)
6. ~~**Playtester:** Regenerate spec from updated scenario~~ — DONE (run 2026-02-16-002, 7/7 PASS, stable across 3 runs)
7. **Next:** Expand testing to other domains (character-lifecycle, pokemon-lifecycle, etc.)

### Test Run Results (Playtester)

**ALL PASS (80/80 tests across 19 spec files)**

Run: `npx playwright test tests/e2e/scenarios/combat/ --reporter=list`
Duration: ~26s, 6 workers, 0 retries needed

| Spec File | Tests | Status | Duration |
|-----------|-------|--------|----------|
| combat-basic-physical-001.spec.ts | 7 | PASS | ~2s |
| combat-basic-special-001.spec.ts | 7 | PASS | ~2s |
| combat-encounter-lifecycle-001.spec.ts | 7 | PASS | ~4s |
| combat-initiative-order-001.spec.ts | 6 | PASS | ~8s |
| combat-turn-progression-001.spec.ts | 7 | PASS | ~6s |
| combat-damage-and-faint-001.spec.ts | 8 | PASS | ~4s |
| combat-critical-hit-001.spec.ts | 3 | PASS | ~8s |
| combat-stab-001.spec.ts | 3 | PASS | ~8s |
| combat-type-effectiveness-001.spec.ts | 3 | PASS | ~5s |
| combat-type-immunity-001.spec.ts | 3 | PASS | ~6s |
| combat-healing-001.spec.ts | 4 | PASS | ~10s |
| combat-combat-stages-001.spec.ts | 6 | PASS | ~14s |
| combat-status-conditions-001.spec.ts | 6 | PASS | ~13s |
| combat-take-a-breather-001.spec.ts | 5 | PASS | ~14s |
| combat-injury-massive-damage-001.spec.ts | 1 | PASS | ~2s |
| combat-minimum-damage-001.spec.ts | 1 | PASS | ~2s |
| combat-multi-target-001.spec.ts | 1 | PASS | ~3s |
| combat-struggle-attack-001.spec.ts | 1 | PASS | ~2s |
| combat-temporary-hp-001.spec.ts | 1 | PASS | ~2s |

### Test Architecture Notes

- **API-first approach**: Setup, actions, and primary assertions use REST API calls
- **UI verification**: 3 specs include UI assertions (initiative-order, turn-progression, encounter-lifecycle)
- **Parallel-safe**: Tests run with 6 workers; serve-based UI tests converted to API-only to avoid race conditions
- **Field mapping fix**: Pokemon creation API requires `baseSpAtk`/`baseSpDef` (not `baseSpAttack`/`baseSpDefense`)
- **No `specialEvasion` on combatant**: Evasion is computed client-side from `entity.currentStats.specialDefense`

### Verification Results

**PASS (19/19):** All scenarios verified and ready for Playtester

- combat-basic-physical-001 (P0): All 4 assertions correct
- combat-basic-special-001 (P0): All 4 assertions correct (re-verified after correction)
- combat-initiative-order-001 (P0): All 3 assertions correct
- combat-turn-progression-001 (P0): All 4 assertions correct
- combat-damage-and-faint-001 (P0): All 5 assertions correct
- combat-encounter-lifecycle-001 (P0): All 5 assertions correct
- combat-stab-001 (P1): All 4 assertions correct
- combat-type-effectiveness-001 (P1): All 4 assertions correct (re-verified after correction)
- combat-type-immunity-001 (P1): All 3 assertions correct
- combat-critical-hit-001 (P1): All 4 assertions correct
- combat-combat-stages-001 (P1): All 5 assertions correct
- combat-healing-001 (P1): All 4 assertions correct
- combat-status-conditions-001 (P1): All 4 assertions correct
- combat-take-a-breather-001 (P1): All 5 assertions correct
- combat-struggle-attack-001 (P2): All 4 assertions correct
- combat-minimum-damage-001 (P2): All 3 assertions correct (re-verified after correction)
- combat-multi-target-001 (P2): All 4 assertions correct (re-verified after correction)
- combat-temporary-hp-001 (P2): All 3 assertions correct
- combat-injury-massive-damage-001 (P2): All 4 assertions correct

### Re-Verification Summary (4 corrected scenarios)

All 4 previously corrected scenarios now PASS:
1. **combat-basic-special-001:** Psyduck(Water)/Confusion(Psychic) correctly isolates no-STAB case. All 4 assertions independently verified.
2. **combat-type-effectiveness-001:** Squirtle L13 has Water Gun at exact learn level. All 4 assertions independently verified. (Cosmetic note: assertion 2 has confusing inline STAB correction text.)
3. **combat-minimum-damage-001:** Rock-resists-Normal derivation now correct. Full chain: raw(-4) → min 1 → ×0.5 → 0 → final min 1. All 3 assertions independently verified.
4. **combat-multi-target-001:** Geodude L34 has Earthquake at exact learn level. STAB correctly applied (DB 12, set 30). Charmander: 51 damage (fainted). Machop: 33 damage (HP "8/41"). All 4 assertions independently verified.

### Tier 1 Verification Results (Scenario Verifier)

**ALL PASS (7/7) — 57/57 assertions correct**

| Scenario ID | Assertions | Status | Key Checks |
|-------------|-----------|--------|------------|
| combat-workflow-wild-encounter-001 | 10/10 | PASS | HP, initiative, STAB×2, type-eff (Fire vs Grass/Poison), injury, faint, lifecycle |
| combat-workflow-stage-buffs-001 | 8/8 | PASS | Stages (+2/−1 net), multiplier ×1.2, modified stat, evasion recalc |
| combat-workflow-faint-replacement-001 | 10/10 | PASS | STAB/no-STAB contrast, Burn on non-Fire, status-clear-on-faint, replacement initiative |
| combat-workflow-status-chain-001 | 9/9 | PASS | Paralysis immunity (Electric), stacked statuses, Take a Breather, persistent survives end |
| combat-workflow-healing-recovery-001 | 8/8 | PASS | Heal cap, faint recovery, temp HP grant + absorption, injury heal |
| combat-workflow-template-setup-001 | 7/7 | PASS | Template save/load, HP derivation, initiative with ties |
| combat-workflow-capture-variant-001 | 7/7 | PASS | All assertions PTU-correct. Dynamic query-then-compute pattern eliminates flakiness. |

**Species verified (10):** Growlithe, Oddish, Bulbasaur, Caterpie, Pidgey, Charmander, Eevee, Pikachu, Rattata, Squirtle — all base stats, types, and move learn levels confirmed against `books/markdown/pokedexes/gen1/` files.

**Lessons applied from scenario-crafter.lessons.md:**
- Lesson 1 (STAB): 8 attacker/move pairs checked — all correct (including 1 explicit no-STAB: Caterpie/Tackle)
- Lesson 2 (Learn levels): 8 move/level pairs verified — all at or above learn level (Squirtle/Water Gun at exact L13)
- Lesson 3 (Type effectiveness): 10 unique type matchups individually verified against type chart

**Errata:** errata-2.md checked for all 7 scenarios. Only capture mechanic errata applies (scenario 7); scenario's assertion is compatible with revised d20 system.

All 7 scenarios proceed to Playtester.

### Regression Verification — design-testability-001 P0 (Result Verifier)

**NO REGRESSIONS — 55/55 assertions PASS across 7 Tier 1 specs**

**Trigger:** Post-implementation re-run after design-testability-001 P0 landed (commits `5dc97c7`–`732ee84`).

**Changed files and regression surface:**

| Commit | File | Change | Risk | Coverage |
|--------|------|--------|------|----------|
| `84b9f6c` | `combatant.service.ts` | Simplified faint guard in `applyDamageToEntity` — removed redundant `!includes('Fainted')` check | MEDIUM — shared damage path | **Covered** — faint-replacement #7-8, healing-recovery #2, wild-encounter #9 all exercise faint path |
| `b9dfed7` | `move.post.ts` | Replaced inline HP subtraction with `calculateDamage()` + `applyDamageToEntity()` + `syncDamageToDatabase()` | LOW — move endpoint only | **Not directly tested** — Tier 1 specs use `/damage` not `/move`. Shared code (`calculateDamage`, `applyDamageToEntity`) IS covered via `/damage` path |
| `e7aa6aa` | `calculate-damage.post.ts` | New file (152 lines) — read-only endpoint | NONE — additive, no existing code modified | N/A — new endpoint, no regression surface |

**Code path analysis:**

The critical shared function `applyDamageToEntity()` (combatant.service.ts:66-82) is exercised by **every damage-applying test** across 5 of 7 specs:
- `combat-workflow-healing-recovery-001`: assertions 1, 2, 6, 7 (damage + temp HP absorption)
- `combat-workflow-faint-replacement-001`: assertions 3-5, 7-8, 10 (damage, faint, status clear)
- `combat-workflow-wild-encounter-001`: assertions 4-9 (STAB damage, injury, faint)
- `combat-workflow-stage-buffs-001`: assertions 5-6 (stage-modified damage)
- `combat-workflow-capture-variant-001`: assertions 2-4 (damage, injury conditional)

The 1-line faint guard simplification (`84b9f6c`) is specifically stress-tested by:
- faint-replacement-001 #7: Caterpie faints to 0 HP
- faint-replacement-001 #8: Burned status cleared on faint (the exact mechanic this commit touches)
- wild-encounter-001 #9: Oddish faint after second Ember
- healing-recovery-001 #2: Charmander fainted from overkill damage

**Coverage gap (noted, not a regression):**

`move.post.ts` was refactored to use the shared damage pipeline but is not directly tested by Tier 1 workflow specs (they apply set damage via `/damage` rather than executing moves via `/move`). The shared code it now calls IS fully covered. The move endpoint's unique code paths (move lookup, accuracy check, STAB calculation) have separate Tier 2 coverage but were not re-run in this cycle.

**Verdict:** PASS — 0 regressions. The `combatant.service.ts` change is well-covered by faint/damage assertions. The `move.post.ts` refactor shares the same code path exercised through `/damage`. The new `calculate-damage.post.ts` is purely additive.

### Regression Verification — design-testability-001 P1+P2 (Playtester)

**NO REGRESSIONS — 134/134 tests PASS across 26 combat specs (19 Tier 2 + 7 Tier 1)**

**Trigger:** Post-implementation re-run after design-testability-001 P1 (commits 01150bf, 2dd0d67) and P2 (commits 20253c3, e3a424e, 2b1a69e, b41d4a5) landed, plus evasion bonus fix (efc4b67).

**Run command:** `npx playwright test tests/e2e/scenarios/combat/ --reporter=list`
**Duration:** ~15.8s, 6 workers, 0 retries needed

**Changed files and regression surface:**

| Commit | File | Change | Risk |
|--------|------|--------|------|
| `01150bf` | `damageCalculation.ts` | Added `calculateEvasion()`, `calculateAccuracyThreshold()`, `AccuracyCalcResult` | NONE — additive, pure functions |
| `2dd0d67` | `calculate-damage.post.ts` | Added evasion/accuracy section to response | NONE — additive to response |
| `20253c3` | `combatant.service.ts` | Added `countMarkersCrossed()`, extended `calculateDamage()` with HP marker detection | MEDIUM — shared damage path |
| `e3a424e` | 2 combat test files | Updated injury expectations for HP marker crossings | LOW — test-only |
| `2b1a69e` | 11 combat test files | Updated injury count expectations (massive damage + 50% marker = 2 injuries) | LOW — test-only |
| `b41d4a5` | `combatant.service.ts` | P2 refinement | LOW — follows P2 pattern |
| `efc4b67` | `damageCalculation.ts` | Fixed evasion bonus inclusion across all 4 code paths | LOW — calculation fix |

**Tier 2 Results (19 specs, 79 tests):**

| Spec File | Tests | Status |
|-----------|-------|--------|
| combat-basic-physical-001.spec.ts | 7 | PASS |
| combat-basic-special-001.spec.ts | 7 | PASS |
| combat-encounter-lifecycle-001.spec.ts | 7 | PASS |
| combat-initiative-order-001.spec.ts | 6 | PASS |
| combat-turn-progression-001.spec.ts | 7 | PASS |
| combat-damage-and-faint-001.spec.ts | 8 | PASS |
| combat-critical-hit-001.spec.ts | 3 | PASS |
| combat-stab-001.spec.ts | 3 | PASS |
| combat-type-effectiveness-001.spec.ts | 3 | PASS |
| combat-type-immunity-001.spec.ts | 3 | PASS |
| combat-healing-001.spec.ts | 4 | PASS |
| combat-combat-stages-001.spec.ts | 6 | PASS |
| combat-status-conditions-001.spec.ts | 6 | PASS |
| combat-take-a-breather-001.spec.ts | 5 | PASS |
| combat-injury-massive-damage-001.spec.ts | 1 | PASS |
| combat-minimum-damage-001.spec.ts | 1 | PASS |
| combat-multi-target-001.spec.ts | 1 | PASS |
| combat-struggle-attack-001.spec.ts | 1 | PASS |
| combat-temporary-hp-001.spec.ts | 1 | PASS |

**Tier 1 Results (7 specs, 55 tests):**

| Spec File | Tests | Status |
|-----------|-------|--------|
| combat-workflow-wild-encounter-001.spec.ts | 9 | PASS |
| combat-workflow-stage-buffs-001.spec.ts | 7 | PASS |
| combat-workflow-faint-replacement-001.spec.ts | 9 | PASS |
| combat-workflow-status-chain-001.spec.ts | 7 | PASS |
| combat-workflow-healing-recovery-001.spec.ts | 8 | PASS |
| combat-workflow-template-setup-001.spec.ts | 7 | PASS |
| combat-workflow-capture-variant-001.spec.ts | 7 | PASS |

**Verdict:** PASS — 0 regressions across all 26 combat specs. The P1 evasion recalculation, P2 HP marker injury detection, and evasion bonus fix introduced no breakage. All 11 updated injury expectations (from P2 commit 2b1a69e) are confirmed correct. design-testability-001 is fully closed.

### Open Issues

Previously resolved:
- ~~bug-001: APP_BUG — Faint handler doesn't clear statuses~~ FIXED (72df77b)
- ~~correction-001: SCENARIO_BUG — Status-chain assumes type immunity~~ FIXED (2a4f84e)
- ~~correction-002: SCENARIO_BUG — Wild-encounter assumes deterministic stats~~ FIXED (2a4f84e)
- ~~correction-003: SCENARIO_BUG — Template-setup assumes deterministic stats~~ FIXED (2a4f84e)
- ~~correction-004: SCENARIO_BUG — Capture-variant wild-spawn HP non-deterministic~~ SUPERSEDED by correction-005

Open:
- ~~correction-005: SCENARIO_BUG — Capture-variant fix (correction-004) removes wild-spawn from test. Rewrite with dynamic assertions instead.~~ DONE — Scenario rewritten with wild-spawn + query-then-compute pattern. Needs re-verification → re-test → result verification.
- ~~design-testability-001: FEATURE_GAP — Server-side damage calculation endpoint (P0), evasion recalculation (P1), HP marker injuries (P2). Addresses 4 TESTED_TAUTOLOGICAL + 2 NOT_TESTED mechanics from rules-review-test-integrity-001. P0 implemented (commits 5dc97c7–732ee84), code-review-003 APPROVED, rules-review-003 APPROVED. Post-implementation regression check: PASS (55/55 Tier 1 assertions, 0 regressions). P1 implemented (commits 01150bf–2dd0d67), P2 implemented (commits 20253c3–b41d4a5). code-review-004 APPROVED — HIGH #1 (evasion bonus) fixed in efc4b67, verified across all 4 code paths. rules-review-004 APPROVED — 11/11 mechanics correct, 0 issues.~~ **CLOSED** — Full regression verification PASS (134/134 tests, 26 specs, 2026-02-16).

### Reviews

| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-002 | bug-001 | APPROVED | senior-reviewer | 2026-02-16 |
| code-review-003 | design-testability-001 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-002 | bug-001 | APPROVED | game-logic-reviewer | 2026-02-16 |
| rules-review-003 | design-testability-001 | APPROVED | game-logic-reviewer | 2026-02-16 |
| rules-review-test-integrity-001 | test-integrity-audit-001 | CHANGES_REQUIRED | game-logic-reviewer | 2026-02-16 |
| code-review-004 | design-testability-001 (P1+P2) | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-004 | design-testability-001 (P1+P2) | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-005 | refactoring-006 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-005 | refactoring-006 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-006 | refactoring-004 | APPROVED | senior-reviewer | 2026-02-16 |
| code-review-007 | refactoring-002 | APPROVED | senior-reviewer | 2026-02-16 |
| code-review-008 | refactoring-005 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-008 | refactoring-005 | APPROVED | game-logic-reviewer | 2026-02-16 |
| rules-review-006 | refactoring-004 | APPROVED | game-logic-reviewer | 2026-02-16 |
| rules-review-007 | refactoring-002 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-009 | refactoring-003 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-009 | refactoring-003 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-010 | refactoring-008 | CHANGES_REQUIRED | senior-reviewer | 2026-02-16 |
| code-review-011 | refactoring-008 (follow-up) | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-010 | refactoring-008 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-012 | refactoring-001 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-011 | refactoring-001 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-013 | refactoring-010 (plan) | APPROVED | senior-reviewer | 2026-02-16 |
| code-review-014 | refactoring-010 (implementation) | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-012 | refactoring-010 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-015 | refactoring-007 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-013 | refactoring-007 | APPROVED | game-logic-reviewer | 2026-02-16 |
| code-review-016 | refactoring-011 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-014 | refactoring-011 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-017 | refactoring-017 | APPROVED | senior-reviewer | 2026-02-17 |
| code-review-018 | refactoring-015 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-015 | refactoring-017 | APPROVED | game-logic-reviewer | 2026-02-17 |
| rules-review-016 | refactoring-015 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-019 | refactoring-016 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-017 | refactoring-016 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-020 | refactoring-019 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-018 | refactoring-019 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-021 | refactoring-020 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-019 | refactoring-020 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-022 | refactoring-018 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-020 | refactoring-018 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-023 | refactoring-009 | CHANGES_REQUIRED | senior-reviewer | 2026-02-17 |
| code-review-024 | refactoring-009 (follow-up) | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-021 | refactoring-009 | APPROVED | game-logic-reviewer | 2026-02-17 |
| code-review-025 | refactoring-014 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-022 | refactoring-014 | APPROVED | game-logic-reviewer | 2026-02-18 |
| code-review-026 | refactoring-022 | APPROVED | senior-reviewer | 2026-02-17 |
| rules-review-023 | refactoring-022 | APPROVED | game-logic-reviewer | 2026-02-18 |
| code-review-027 | refactoring-012 | APPROVED | senior-reviewer | 2026-02-18 |
| rules-review-024 | refactoring-012 | APPROVED | game-logic-reviewer | 2026-02-18 |
| code-review-028 | refactoring-013 | APPROVED | senior-reviewer | 2026-02-18 |
| rules-review-025 | refactoring-013 | APPROVED | game-logic-reviewer | 2026-02-18 |
| code-review-029 | refactoring-021 | APPROVED | senior-reviewer | 2026-02-18 |
| rules-review-026 | refactoring-021 | APPROVED | game-logic-reviewer | 2026-02-18 |
| code-review-030 | refactoring-025 | APPROVED | senior-reviewer | 2026-02-18 |
| rules-review-027 | refactoring-025 | APPROVED | game-logic-reviewer | 2026-02-18 |
| rules-review-028 | refactoring-023 | APPROVED | game-logic-reviewer | 2026-02-18 |
| code-review-031 | refactoring-023 | APPROVED | senior-reviewer | 2026-02-18 |

### Designs

| Design ID | Gap Report | Scope | Status | Date |
|-----------|-----------|-------|--------|------|
| design-testability-001 | rules-review-test-integrity-001 | PARTIAL | closed | 2026-02-16 |

**design-testability-001:** Server-side damage calculation endpoint + evasion recalculation + HP marker injuries. Converts 17+ tautological test files to genuine server-side tests. Three priority tiers: P0 (damage formula + STAB + type effectiveness + stages + crits), P1 (dynamic evasion), P2 (HP marker injuries). Pattern: `captureRate.ts` → `damageCalculation.ts`.

### Lessons (Retrospective Analyst)

| Metric | Value |
|--------|-------|
| Last analyzed | 2026-02-17T13:00:00 |
| Total lessons | 24 |
| Active | 18 |
| Resolved | 3 (SC L1-L3 → permanent process steps) |
| New this cycle | 6 |
| Updated this cycle | 3 |
| Systemic patterns | 2 (non-deterministic APIs, PTU-without-verification) |

Lessons written for 7 skills:
- scenario-crafter (6 lessons — L4 upgraded to systemic, L6: preserve test purpose)
- developer (4 lessons — L2 upgraded to recurring, L3 NEW: verify PTU formulas against rulebook, L4 NEW: audit pre-existing code)
- playtester (4 lessons — L4 NEW: stay within role boundary)
- scenario-verifier (1 lesson — unchanged)
- game-logic-reviewer (3 lessons — unchanged, self-filed)
- orchestrator (4 lessons — L3 updated with new evidence, L4 NEW: route learnings to correct system)
- senior-reviewer (2 lessons — L2 NEW: don't frame PTU incorrectness as "acknowledged limitation")

See `artifacts/lessons/` for details and `artifacts/lessons/retrospective-summary.md` for cross-cutting analysis.

## Domain: capture

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 2 workflows (+ 1 sub-workflow), 9 mechanic validations (+ 2 sub-loops) | 2026-02-15 |
| Scenarios | complete | 7/7 (1 P0, 4 P1, 2 P2) | 2026-02-15 |
| Verifications | complete | 7/7 PASS (40/40 assertions correct) | 2026-02-15 |
| Test Runs | complete | 39/39 PASS (7 specs, 6 workers) | 2026-02-16 |
| Results | complete | 7 PASS, 0 FAIL | 2026-02-16 |
| Triage | complete | 1 APP_BUG resolved (bug-002.md — evolution stage fix confirmed) | 2026-02-16 |

Workflows: W1 (standard capture), W2 (rate assessment). Sub-workflow: W1 multi-attempt retry. Mechanic validations: M1-M9 (base rate, HP tiers, evolution, status, rarity/injury, attempt roll, crit accuracy, faint prevention, post-capture update, worked examples). 5 FEATURE_GAPs identified (ball modifiers, legendary detection, evolution stage accuracy, capture specialist features, re-capture prevention). 1 UX_GAP (attempt button in combat).

### Test Run Results (Playtester)

**7 PASS, 0 FAIL — 39 tests passed across 7 spec files (parallel, 6 workers, ~2.5s)**

| Spec File | Tests | Status | Duration | Notes |
|-----------|-------|--------|----------|-------|
| capture-mechanic-hp-modifier-001.spec.ts | 6/6 | PASS | ~450ms | All HP tier boundaries correct |
| capture-mechanic-status-modifiers-001.spec.ts | 6/6 | PASS | ~480ms | All status types and stacking correct |
| capture-mechanic-attempt-roll-001.spec.ts | 5/5 | PASS | ~700ms | Response shape, crit detection, relational checks |
| capture-mechanic-cannot-capture-fainted-001.spec.ts | 4/4 | PASS | ~500ms | Rate + attempt rejection, no roll field |
| capture-mechanic-worked-examples-001.spec.ts | 3/3 | PASS | ~135ms | **Re-run 2026-02-16:** All 3 PTU worked examples now correct after evolution stage fix |
| capture-workflow-standard-capture-001.spec.ts | 7/7 | PASS | ~600ms | Full workflow: rate→damage→rate→capture→verify |
| capture-workflow-multi-attempt-001.spec.ts | 7/7 | PASS | ~1300ms | Retry 1: fixed JSON.parse TEST_BUG on statusConditions |

**Previous Failures (all resolved):**

| # | Scenario | Assertion | Classification | Resolution |
|---|----------|-----------|---------------|------------|
| 1 | worked-examples-001 | #1 (Pikachu captureRate: expected 70, got 80) | APP_BUG | Fixed: evolution stage seeder (ec11197, 71b6987, 4515dbb, 7c49daf) |
| 2 | worked-examples-001 | #3 (Hydreigon captureRate: expected -15, got 5) | APP_BUG | Fixed: same root cause — evolutionStage=1 for all species |

### Verification Results (Scenario Verifier)

**ALL PASS (7/7) — 40/40 assertions correct**

| Scenario ID | Assertions | Status | Key Checks |
|-------------|-----------|--------|------------|
| capture-workflow-standard-capture-001 | 8/8 | PASS | Rate=64 at full HP, rate=129 at 1HP+injury, guaranteed capture, ownership transfer |
| capture-workflow-multi-attempt-001 | 9/9 | PASS | Rate=-10 at full HP, +75 swing to 65, retry loop, Paralyzed +10, ownership |
| capture-mechanic-hp-modifier-001 | 6/6 | PASS | All 5 HP tier boundaries (100%,-30; 75%,-15; 50%,0; 25%,+15; 1HP,+30) + 0HP rejection |
| capture-mechanic-status-modifiers-001 | 6/6 | PASS | Persistent +10, Volatile +5, Stuck +10 (separate field), Slow +5 (separate field), stacking |
| capture-mechanic-attempt-roll-001 | 5/5 | PASS | Response shape, trainerLevel subtraction, crit detection +10, relational assertions |
| capture-mechanic-cannot-capture-fainted-001 | 3/3 | PASS | Rate API canBeCaptured=false, attempt API rejection with reason, no roll field |
| capture-mechanic-worked-examples-001 | 3/3 | PASS | PTU Example 1 (Pikachu=70), Example 2 (Caterpie=45), Example 3 (Hydreigon=-15) |

**Species verified (4):** Oddish, Pikachu, Caterpie, Hydreigon — base stats, types, evolution stages confirmed against pokedex files.

**Implementation cross-reference (per Lesson 1):**
- Non-deterministic output: All Pokemon created with explicit base stats (deterministic HP). Capture rolls use relational assertions.
- Enforcement boundary: All assertions target App-enforced calculations (calculateCaptureRate, attemptCapture, attempt.post.ts).
- Massive damage injury: Verified combatant.service.ts calculateDamage confirms `hpDamage >= maxHp/2` rule.
- Fainted rejection response shape: Verified attempt.post.ts early-return produces minimal response without roll fields.

**Errata:** errata-2.md contains a Sept 2015 Playtest d20-based capture system. App implements 1.05 core d100 system — no errata corrections apply.

**Feasibility:** No scenarios exercise gap-annotated workflow steps. All use API directly.

All 7 scenarios proceed to Playtester.

### Scenario Summary (Scenario Crafter)

| Scenario ID | Loop | Priority | PTU Assertions | Key Mechanics |
|-------------|------|----------|---------------|---------------|
| capture-workflow-standard-capture-001 | W1 | P0 | 8 | Rate formula, HP modifier, evolution, injury, attempt roll, trainer level, post-capture ownership |
| capture-workflow-multi-attempt-001 | W1-sub | P1 | 9 | Rate improvement feedback, HP swing, status modifier, injury, retry loop, post-capture |
| capture-mechanic-hp-modifier-001 | M2 | P1 | 6 | All 5 HP tier boundaries + 0 HP rejection |
| capture-mechanic-status-modifiers-001 | M4 | P1 | 6 | Persistent, volatile, stuck, slow, stacking, mixed |
| capture-mechanic-attempt-roll-001 | M6 | P1 | 5 | Response structure, trainer level subtraction, critical accuracy bonus |
| capture-mechanic-cannot-capture-fainted-001 | M7 | P2 | 3 | Rate API rejection, attempt API rejection, no roll made |
| capture-mechanic-worked-examples-001 | M9 | P2 | 3 | 3 PTU worked examples (Pikachu, Caterpie, Hydreigon) |

**Total: 7 scenarios, 40 PTU assertions**

**Species used:** Oddish (workflows + mechanics), Pikachu, Caterpie, Hydreigon (worked examples)

**Skipped (FEATURE_GAP):** Ball modifiers, legendary detection, evolution stage accuracy (non-3-stage), capture specialist features, re-capture prevention. M3 (evolution stage) skipped entirely.

**Skipped (UX_GAP):** W2 (rate assessment UI), capture attempt button in combat UI.

**Skipped (non-testable):** Natural 100 guaranteed capture (1d100 roll is non-deterministic via API; noted in attempt-roll scenario).

**Lessons applied:**
- Lesson 1 (STAB): Not applicable (no move/damage STAB in capture scenarios)
- Lesson 2 (Learn levels): Not applicable (no moves used; damage applied directly)
- Lesson 3 (Type effectiveness): Not applicable (no type damage interactions)
- Lesson 4 (Non-deterministic APIs): All workflow Pokemon created via `POST /api/pokemon` with explicit base stats for deterministic HP. Capture attempt roll is non-deterministic — handled with guaranteed-capture conditions (scenario 1) and retry loops (scenario 2). Annotated in each scenario.
- Lesson 5 (Enforcement boundary): Every assertion annotated as App-enforced or GM-enforced. Status API is GM tool (status applied without type checks). Capture rate/attempt are App-enforced calculations.

### Results Verification Summary (Result Verifier)

**1 FAILURE TRIAGED — 1 APP_BUG (2 assertions, same root cause)**

- Results analyzed: 7
- Passed: 6
- Failed: 1

| Category | Count | Reports Generated |
|----------|-------|-------------------|
| APP_BUG | 1 | bug-002.md |
| SCENARIO_BUG | 0 | — |
| TEST_BUG | 0 | — |
| AMBIGUOUS | 0 | — |
| FEATURE_GAP | 0 | — |
| UX_GAP | 0 | — |

### Failure Triage

| # | Scenario | Assertion | Category | Report | Assigned To |
|---|----------|-----------|----------|--------|-------------|
| 1 | capture-mechanic-worked-examples-001 | #1: Pikachu captureRate (expected 70, got 80) | APP_BUG | bug-002.md | Developer |
| 2 | capture-mechanic-worked-examples-001 | #3: Hydreigon captureRate (expected -15, got 5) | APP_BUG | bug-002.md | Developer |

**Root cause:** Both failures trace to a single bug — SpeciesData seeder stores `evolutionStage=1` for all species (seed.ts regex only captures the first evolution line). Combined with `Math.max(3, evolutionStage)` hardcode in rate.post.ts, every Pokemon gets evolutionModifier=+10 regardless of actual evolution stage. Pikachu (stage 2/3) should get 0, Hydreigon (stage 3/3) should get -10.

### Passing Results Confirmed

| Scenario | Assertions | Status |
|----------|-----------|--------|
| capture-mechanic-attempt-roll-001 | 5/5 | PASS |
| capture-mechanic-cannot-capture-fainted-001 | 3/3 | PASS |
| capture-mechanic-hp-modifier-001 | 6/6 | PASS |
| capture-mechanic-status-modifiers-001 | 6/6 | PASS |
| capture-mechanic-worked-examples-001 | 3/3 | PASS |
| capture-workflow-standard-capture-001 | 8/8 | PASS |
| capture-workflow-multi-attempt-001 | 9/9 | PASS |

**Note:** Bug-002 (evolution stage) has been fixed and confirmed by retest on 2026-02-16. All 7 capture scenarios now PASS.

### Reviews

| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-001 | bug-002 | APPROVED | senior-reviewer | 2026-02-16 |
| rules-review-001 | bug-002 | APPROVED | game-logic-reviewer | 2026-02-16 |

### Recommended Next Steps

1. ~~**Developer:** Fix bug-002~~ — DONE (commits ec11197, 71b6987, 4515dbb, 7c49daf)
2. ~~**Game Logic Reviewer:** Review bug-002 fix for PTU rule correctness~~ — APPROVED (rules-review-001)
3. ~~**Playtester:** Re-run capture-mechanic-worked-examples-001~~ — DONE (2026-02-16, all 3 assertions PASS)
4. **Next domain:** Proceed to character-lifecycle or pokemon-lifecycle

### Open Issues

- ~~bug-002: APP_BUG — SpeciesData stores evolutionStage=1 for all species (HIGH severity)~~ FIXED & VERIFIED (retest 2026-02-16, all 3 worked examples PASS)

## Domain: character-lifecycle

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: pokemon-lifecycle

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: healing

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: encounter-tables

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: scenes

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: vtt-grid

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Code Health

### Last Audit
- **Date:** 2026-02-18T12:00:00
- **Scope:** full codebase
- **Files scanned:** 261
- **Files deep-read:** 20

### Resolved Tickets (001-022)

All 22 tickets from the combat-domain audit (2026-02-16) are resolved. See `refactoring/audit-summary.md` for full history.

### Open Tickets

| Ticket | Priority | File(s) | Categories | Status |
|--------|----------|---------|------------|--------|
| refactoring-023 | P0 | encounter-tables/[id].vue, habitats/[id].vue | EXT-DUPLICATE, LLM-SIZE | resolved |
| refactoring-024 | P0 | pokemon/[id].vue | LLM-SIZE, EXT-GOD, LLM-TYPES, EXT-LAYER | open |
| refactoring-025 | P0 | characters/[id].vue, types/index.ts | LLM-SIZE, LLM-TYPES | resolved |
| refactoring-026 | P1 | pokemon/[id].vue, characters/[id].vue | EXT-DUPLICATE | open |
| refactoring-027 | P1 | encounter-tables.vue | LLM-SIZE, EXT-GOD, EXT-DUPLICATE | open |
| refactoring-028 | P1 | import-csv.post.ts | EXT-GOD, EXT-LAYER, LLM-FUNC | open |
| refactoring-029 | P1 | groupViewTabs.ts, types/index.ts | LLM-TYPES, EXT-COUPLING | open |
| refactoring-030 | P1 | encounter-tables.vue, habitats/[id].vue | EXT-DUPLICATE | open |
| refactoring-031 | P2 | CombatantCard.vue, PlayerCombatantCard.vue, GroupCombatantCard.vue | LLM-TYPES | open |
| refactoring-032 | P2 | 6+ files (sheet pages, table editors) | EXT-DUPLICATE | open |
| refactoring-033 | P2 | TableEditor.vue | DATA-INCORRECT | open |

**Totals:** 2 P0, 5 P1, 3 P2 — 10 tickets open

### Recommended Order
1. refactoring-025 (small — add healing fields to types, eliminate 13 `as any` casts)
2. refactoring-029 (small — move Scene types from store to types/)
3. refactoring-023 (large — deduplicate table editor, ~900 lines removed)
4. refactoring-026 (medium — extract shared HealingTab component)
5. refactoring-030 (small — extract encounter creation workflow)
6. refactoring-024 (large — decompose pokemon/[id].vue God page)
7. refactoring-027 (medium — decompose encounter-tables.vue)
8. refactoring-028 (medium — extract CSV import into service layer)
9. refactoring-031 (small — fix `as any` in encounter components)
10. refactoring-032 (medium — extract shared SCSS partials)
