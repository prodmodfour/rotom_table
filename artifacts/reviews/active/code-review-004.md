---
review_id: code-review-004
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: design-testability-001
follows_up: code-review-003
domain: combat
commits_reviewed:
  - 01150bf
  - 2dd0d67
  - 20253c3
  - 2b1a69e
  - e3a424e
  - b41d4a5
files_reviewed:
  - app/utils/damageCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/services/combatant.service.ts
  - app/tests/e2e/scenarios/combat/combat-critical-hit-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-damage-and-faint-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-injury-massive-damage-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-minimum-damage-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-multi-target-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-struggle-attack-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-type-effectiveness-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-capture-variant-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-faint-replacement-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-healing-recovery-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts
  - app/tests/e2e/artifacts/designs/design-testability-001.md
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
scenarios_to_rerun:
  - combat-workflow-wild-encounter-001
  - combat-workflow-capture-variant-001
  - combat-workflow-faint-replacement-001
  - combat-workflow-healing-recovery-001
  - combat-injury-massive-damage-001
  - combat-damage-and-faint-001
  - combat-critical-hit-001
  - combat-type-effectiveness-001
reviewed_at: 2026-02-16T20:00:00
---

## Review Scope

Implementation of design-testability-001 P1 (evasion recalculation) and P2 (HP marker injury detection). 6 commits, 16 files changed, ~352 insertions/95 deletions. This follows up on code-review-003 which approved P0.

- **P1** (01150bf, 2dd0d67): Pure evasion/accuracy functions in `damageCalculation.ts` + endpoint integration in `calculate-damage.post.ts`
- **P2** (20253c3, 2b1a69e, e3a424e): `countMarkersCrossed()` and extended `calculateDamage()` in `combatant.service.ts` + 11 test file updates
- **Docs** (b41d4a5): Design spec implementation log + app-surface.md update

## Issues

### CRITICAL

(none)

### HIGH

1. **Evasion calculation ignores bonus evasion from moves/effects** — `damageCalculation.ts:114-117`, `calculate-damage.post.ts:188-194`

   PTU 07-combat.md:648-653 explicitly states:
   > "Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top. [...] Much like Combat Stages; it has a minimum of -6 and a max of +6. Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy of an enemy's Moves."

   The `stageModifiers.evasion` field already exists on combatants (it's in `VALID_STATS` in `combatant.service.ts:298`). The stages API can set it. But the evasion calculation completely ignores it.

   **Current (wrong):**
   ```typescript
   export function calculateEvasion(baseStat: number, combatStage: number = 0): number {
     const modifiedStat = applyStageModifier(baseStat, combatStage)
     return Math.min(6, Math.floor(modifiedStat / 5))
   }
   ```

   **Required (correct per PTU):**
   ```typescript
   export function calculateEvasion(baseStat: number, combatStage: number = 0, evasionBonus: number = 0): number {
     const statEvasion = Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))
     // Bonus evasion stacks on top, combined floor at 0 (negative evasion erases but doesn't go below 0)
     return Math.max(0, statEvasion + evasionBonus)
   }
   ```

   **Endpoint fix** (`calculate-damage.post.ts`):
   ```typescript
   const evasionBonus = targetStages?.evasion ?? 0
   const physicalEvasion = calculateEvasion(targetEvasion.defenseBase, targetEvasion.defenseStage, evasionBonus)
   const specialEvasion = calculateEvasion(targetEvasion.spDefBase, targetEvasion.spDefStage, evasionBonus)
   const speedEvasion = calculateEvasion(targetEvasion.speedBase, targetEvasion.speedStage, evasionBonus)
   ```

   The +9 total cap is already applied downstream (`effectiveEvasion = Math.min(9, applicableEvasion)`), so that part is fine. The fix is ~5 lines.

   This matters because tests that exercise evasion with bonus stages will produce wrong results. The `combat-workflow-stage-buffs-001` scenario already tests evasion-from-stages — if anyone adds an evasion bonus test, it will silently pass with incorrect values.

### MEDIUM

(none)

## Verification Summary

### P1 — Evasion & Accuracy

**Pure functions (damageCalculation.ts:114-133)**

- `calculateEvasion(baseStat, combatStage)` → `min(6, floor(stageModifiedStat / 5))`. Verified against PTU 07-combat.md:594-615, 644-647. The per-stat +6 cap matches "up to a maximum of +6 at 30 Defense."
- `calculateAccuracyThreshold(moveAC, accuracyStage, evasion)` → `max(1, moveAC + min(9, evasion) - accuracyStage)`. The +9 total cap matches PTU 07-combat.md:657 ("you may only raise a Move's Accuracy Check by a max of +9"). The `min(1)` floor is correct — nat 1/20 rules handled by caller per PTU 07-combat.md:746-748.
- `AccuracyCalcResult` interface reports all three evasion types (physical, special, speed), applicable evasion by damage class, effective evasion with +9 cap, and final threshold. Clean separation of concerns.

**Endpoint integration (calculate-damage.post.ts:86-206)**

- `getEntityEvasionStats()` correctly extracts defense/spDef/speed base stats + stage modifiers for both Pokemon and HumanCharacter entities. Matches the pattern of existing `getEntityStats()`.
- `accuracyStage` correctly extracted from attacker's `stageModifiers.accuracy` (not target's).
- Physical moves → Physical Evasion, Special moves → Special Evasion. Speed evasion reported but not automatically applied — matches PTU rule "you may only add ONE of the three evasions to any one check" (07-combat.md:642-643). Client/test can use speed evasion when appropriate.
- `EntityDamageStats` and `EntityEvasionStats` interfaces extracted from inline return types — cleaner code.

**HIGH #1 applies here:** The evasion calculation is missing bonus evasion from `stageModifiers.evasion`. See Issues section above for the full fix. The design spec omitted this, but the PTU rules are explicit — "these extra Changes in Evasion apply to all types of Evasion, and stack on top." The worker should fix both the pure function and the endpoint before this can be approved.

### P2 — HP Marker Injuries

**`countMarkersCrossed()` (combatant.service.ts:40-66)**

- Generates markers at 50%, 0%, -50%, -100%, and every -50% lower. Matches PTU 07-combat.md:1849-1852 exactly.
- Uses `realMaxHp` (not injury-reduced) per PTU 07-combat.md:1872-1876.
- Condition `previousHp > threshold && newHp <= threshold` correctly implements "reaching" a marker — avoids double-counting when already at the marker.
- Edge case guards: `fiftyPercent <= 0` early return (prevents infinite loop for maxHp 0-1), `markers.length > 20` safety cap.
- Verified against the PTU book example (07-combat.md:1853-1856): "Max HP to -150% = 6 injuries" — `countMarkersCrossed(100, -150, 100)` returns 5 markers ([50, 0, -50, -100, -150]) + 1 massive = 6. ✓

**`calculateDamage()` integration (combatant.service.ts:75-130)**

- `unclampedHp = currentHp - hpDamage` used for marker detection. `newHp = Math.max(0, unclampedHp)` for storage. Clean separation — avoids cascading UI changes from negative HP. Matches design spec's recommended "Option A."
- `massiveDamageInjury` preserved as boolean (unchanged threshold: `hpDamage >= maxHp / 2`).
- `totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries` — additive, matching PTU rules.
- `injuryGained = totalNewInjuries > 0` — semantic change from P0 (was massive-damage-only). All downstream consumers verified compatible:
  - `damage.post.ts:48-50`: passes `newInjuries` and `injuryGained` to `syncDamageToDatabase()`. Both fields maintain correct semantics (cumulative count, boolean any-injury).
  - `entity-update.service.ts:96`: `lastInjuryTime: injuryGained ? new Date() : undefined`. Now correctly updates on marker injuries too.
  - `damage.post.ts:74`: `...damageResult` spread includes new fields (`massiveDamageInjury`, `markerInjuries`, `markersCrossed`, `totalNewInjuries`) in API response automatically.

**`DamageResult` interface extension** — new fields are purely additive. Existing consumers destructure only `newInjuries`, `injuryGained`, `fainted`, `newHp`, `newTempHp`. No breakage.

### Test Updates (11 files)

**Injury count corrections** — all mathematically verified:

| Test | Pokemon | MaxHP | Damage | From HP | Massive? | Markers Crossed | Expected Injuries |
|------|---------|-------|--------|---------|----------|-----------------|-------------------|
| critical-hit-001 | Charmander | 32 | 27 | 32 | Yes (27≥16) | 50% (16) | 2 |
| damage-and-faint-001 hit 1 | Charmander | 32 | 20 | 32 | Yes (20≥16) | 50% (16) | 2 |
| damage-and-faint-001 hit 2 | Charmander | 32 | 20 | 12 | Yes (20≥16) | 0% (0) | 2 new → 4 total |
| injury-massive-damage-001 | Charmander | 32 | 17 | 32 | Yes (17≥16) | 50% (16) | 2 |
| type-effectiveness-001 (×2) | Charmander | 32 | 22 | 32 | Yes (22≥16) | 50% (16) | 2 |
| faint-replacement-001 | Caterpie | 33 | 18 | 33 | Yes (18≥16.5) | 50% (16) | 2 |
| healing-recovery-001 | Bulbasaur | 40 | 25 | 40 | Yes (25≥20) | 50% (20) | 2 |
| wild-encounter-001 | Oddish | dynamic | dynamic | full | conditional | conditional | conditional (0 or 2) |
| capture-variant-001 | Rattata | dynamic | dynamic | full | conditional | conditional | conditional (0 or 2) |

Key invariant verified: from full HP, massive damage ALWAYS also crosses the 50% marker. Proof: if `damage ≥ maxHp/2`, then `newHp = maxHp - damage ≤ maxHp/2`. And `marker = floor(maxHp * 0.5) ≤ maxHp/2`. So `newHp ≤ marker`. Combined with `previousHp = maxHp > marker`, the marker is always crossed. Conversely, if `damage < maxHp/2`, then `newHp > maxHp/2 ≥ marker`, so the marker is NOT crossed. This means the conditional tests correctly assert either 0 or 2 injuries — never 1 from full HP.

**Pre-existing undefined variable fixes (3 files):**

- `combat-injury-massive-damage-001.spec.ts`: `expectedHp` → `CHARMANDER_MAX_HP - KARATE_CHOP_DAMAGE`. Variable was never defined in file. ✓
- `combat-minimum-damage-001.spec.ts`: `expectedHp` → `GEODUDE_MAX_HP - EXPECTED_FINAL_DAMAGE`. Same bug. ✓
- `combat-multi-target-001.spec.ts`: `expectedMachopHp` → `MACHOP_MAX_HP - MACHOP_DAMAGE`. Same bug. ✓

These were pre-existing `ReferenceError`s that would crash at runtime. Fixing them alongside the P2 update is appropriate.

**Capture variant rewrite (176 lines changed):**

The `combat-workflow-capture-variant-001.spec.ts` was substantially rewritten beyond just injury updates. This implements correction-005 (pre-approved pipeline correction). Changes include:
- Wild-spawn preserved (instead of explicit creation from correction-004)
- Dynamic stat querying via `getPokemon()` after spawn
- Pre-computed expected damage from actual stats
- Trainer level 30 + `accuracyRoll: 20` to guarantee capture
- Conditional injury assertions based on dynamic threshold

The rewrite is correct and improves test reliability for non-deterministic wild-spawn stats. Damage formulas verified: Phase 1 (Rattata STAB Tackle: DB7 set=17, raw=`17+rattataATK-7`), Phase 2 (Squirtle STAB Water Gun: DB8 set=19, raw=`19+5-rattataSpDef`). Both neutral effectiveness (Normal vs Water = ×1, Water vs Normal = ×1). ✓

### Healing Recovery Secondary Effect

`combat-workflow-healing-recovery-001.spec.ts` Phase 6 changed from "heal Bulbasaur injury (1 → 0)" to "(2 → 1)". This is correct: Bulbasaur now starts with 2 injuries (massive + marker) instead of 1, so healing 1 injury leaves 1 remaining. ✓

### Docs

- Design spec implementation log updated with P1 and P2 commit hashes, modified files, and behavior summaries. ✓
- `app-surface.md` updated to mention dynamic evasion and accuracy threshold in the calculate-damage endpoint description. ✓

## What Looks Good

- **P1 follows the established pure-function pattern** — `calculateEvasion()` and `calculateAccuracyThreshold()` are clean, stateless functions with PTU rule citations. The endpoint integration cleanly separates stat extraction (`getEntityEvasionStats`), evasion computation, and response building.

- **P2 `countMarkersCrossed()` is well-designed** — the while loop with descending thresholds handles arbitrary negative HP depths, the safety guards prevent edge-case infinite loops, and the `previousHp > threshold` condition correctly avoids re-counting markers you've already passed.

- **Unclamped HP approach is clean** — using `unclampedHp` internally for marker detection while storing `newHp = Math.max(0, ...)` avoids introducing a new field on the combatant schema AND avoids negative HP in the UI. Matches design spec's recommended Option A without the schema change.

- **Test injury count corrections are exhaustive** — all 11 affected test files updated. Each change has a clear comment explaining the math (e.g., "massive damage (1) + crosses 50% marker at 16 (1) = 2 injuries"). The conditional assertions in dynamic tests (wild-encounter, capture-variant) correctly handle the 0-or-2 invariant.

- **No API contract breakage** — new `DamageResult` fields are additive. Existing consumers (`damage.post.ts`, `move.post.ts`, `entity-update.service.ts`) use only `newInjuries` and `injuryGained`, both of which maintain correct semantics. The `...damageResult` spread automatically exposes new fields.

- **Commit granularity is correct** — 6 focused commits: P1 pure functions, P1 endpoint, P2 service, P2 tests (×2), P2 docs. Each produces a working state.

## Fix Log

### HIGH #1 — Evasion bonus from stageModifiers.evasion

- **Commit:** efc4b67
- **Files changed:**
  - `app/utils/damageCalculation.ts` — added `evasionBonus` param to `calculateEvasion()`, stacks on stat evasion with floor at 0
  - `app/server/api/encounters/[id]/calculate-damage.post.ts` — extract `targetStages.evasion` and pass to all three evasion calls
  - `app/composables/useCombat.ts` — same fix in local `calculateEvasion` + wrapper functions (duplicate code path)
  - `app/composables/useMoveCalculation.ts` — pass `stages.evasion` to `calculatePhysicalEvasion`/`calculateSpecialEvasion`
- **Tests:** All 48 tests across 8 specs pass (combat-workflow-wild-encounter-001, combat-workflow-capture-variant-001, combat-workflow-faint-replacement-001, combat-workflow-healing-recovery-001, combat-injury-massive-damage-001, combat-damage-and-faint-001, combat-critical-hit-001, combat-type-effectiveness-001)

## Verdict

CHANGES_REQUIRED — P2 is clean and approved. P1 has one HIGH issue: the evasion calculation ignores `stageModifiers.evasion` bonus from moves/effects. PTU rules explicitly state these stack on top of stat-based evasion. The fix is ~5 lines across 2 files. Fix, then this proceeds to Game Logic Reviewer.

## Scenarios to Re-run

All 8 specs with modified injury expectations should be re-run to confirm the updated assertions pass:

- `combat-workflow-wild-encounter-001` (dynamic injury conditional)
- `combat-workflow-capture-variant-001` (dynamic injury + rewritten per correction-005)
- `combat-workflow-faint-replacement-001` (injury count 1→2)
- `combat-workflow-healing-recovery-001` (injury count 1→2, heal result 0→1)
- `combat-injury-massive-damage-001` (injury count 1→2)
- `combat-damage-and-faint-001` (injury counts 1→2, 2→4)
- `combat-critical-hit-001` (injury count 1→2)
- `combat-type-effectiveness-001` (injury count 1→2, ×2 tests)
