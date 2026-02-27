---
review_id: rules-review-168
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-098+084+085+110+111+109
domain: combat
commits_reviewed:
  - 0ef3152
  - 4118ccf
  - d8c64ab
  - 6357e0f
  - dff8a31
  - 545b708
mechanics_verified:
  - faint-stage-sync-to-db
  - zero-evasion-constant-usage
  - encounter-end-stage-reset
  - combat-entry-stage-reset
  - temp-conditions-zero-evasion
  - legendary-species-list-completeness
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Combat-Stages (p.235)
  - core/07-combat.md#Take-a-Breather (p.245)
  - core/07-combat.md#Burned (p.246)
  - core/07-combat.md#Frozen (p.246)
  - core/07-combat.md#Paralysis (p.247)
  - core/07-combat.md#Poisoned (p.246-247)
  - core/07-combat.md#Sleep (p.247)
  - core/07-combat.md#Vulnerable (p.248)
  - core/07-combat.md#Fainted (p.248)
  - core/05-pokemon.md#Capturing-Pokemon (p.214)
  - decree-005
  - decree-013
  - decree-014
  - decree-015
reviewed_at: 2026-02-27T12:00:00Z
follows_up: rules-review-161
---

## Previous Review Issues (rules-review-161)

This is a re-review of the fix cycle addressing all issues from rules-review-161 CHANGES_REQUIRED (1 HIGH, 3 MEDIUM).

| Issue | Severity | Fix Commit | Resolution |
|-------|----------|-----------|------------|
| HIGH-1: Double-application of status CS on combat re-entry | HIGH | `6357e0f` | RESOLVED |
| M1: Incomplete legendary species list | MEDIUM | `545b708` | RESOLVED |
| M2: Encounter end does not reset combat stages | MEDIUM | `d8c64ab` | RESOLVED |
| M3: Zero-evasion check misses tempConditions Vulnerable | MEDIUM | `dff8a31` | RESOLVED |

Also verifying code-review-184 fixes that affect PTU correctness:

| Issue | Severity | Fix Commit | Resolution |
|-------|----------|-----------|------------|
| H1: Faint path does not sync stageModifiers to DB | HIGH | `0ef3152` | RESOLVED |
| M1: ZERO_EVASION_CONDITIONS constant unused | MEDIUM | `4118ccf` | RESOLVED |

## Mechanics Verified

### 1. Faint Stage Modifier DB Sync (code-review-184 H1 -> commit `0ef3152`)
- **Rule:** PTU p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." Per decree-005, curing conditions reverses their CS effects.
- **Implementation:** Both `damage.post.ts:53-58` and `move.post.ts:94-98` now call `syncStagesToDatabase(combatant, entity.stageModifiers)` when `damageResult.fainted` is true and `entity.stageModifiers` exists. This persists the reversed stage values to the entity DB record after `applyDamageToEntity()` has reversed the status-sourced CS effects.
- **Status:** CORRECT. The `syncStagesToDatabase` function delegates to `syncEntityToDatabase` which handles both pokemon and humanCharacter table updates. The conditional `if (damageResult.fainted && entity.stageModifiers)` correctly gates the sync to only the faint path where CS reversal occurs. The `applyDamageToEntity` function at lines 158-173 correctly iterates over conditions being cleared (persistent + volatile), calls `reverseStatusCsEffects` for each before removing them from the array, then sets `statusConditions = ['Fainted', ...survivingOtherConditions]`. The DB now receives the post-reversal stage values.

### 2. ZERO_EVASION_CONDITIONS Constant Usage (code-review-184 M1 -> commit `4118ccf`)
- **Rule:** PTU p.246 (Frozen: "receives no bonuses from Evasion"), p.247 (Sleep: "receive no bonuses from Evasion"), p.248 (Vulnerable: "cannot apply Evasion of any sort").
- **Implementation:** `useMoveCalculation.ts` (line 349) now imports and uses `ZERO_EVASION_CONDITIONS.includes(c)` instead of inline string comparisons. `calculate-damage.post.ts` (line 229) similarly uses `(ZERO_EVASION_CONDITIONS as readonly string[]).includes(c)`. Both check sites now reference the single source of truth at `statusConditions.ts:31-33`.
- **Status:** CORRECT. The constant contains exactly `['Vulnerable', 'Frozen', 'Asleep']` which matches the three conditions that PTU specifies as zeroing evasion. Using the constant prevents future divergence if the list ever changes.

### 3. Encounter End Stage Reset (rules-review-161 M2 -> commit `d8c64ab`)
- **Rule:** PTU p.235: "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter." Combat stages are explicitly encounter-scoped.
- **Implementation:** `end.post.ts` now creates `defaultStages = createDefaultStageModifiers()` (all zeros) and applies it to every combatant on encounter end. Lines 67-88 spread `stageModifiers: { ...defaultStages }` into both pokemon and non-pokemon entity updates. Line 87 clears `stageSources: []`. Line 109-112 syncs the reset stages to entity DB records via `syncEntityToDatabase(c, { statusConditions, stageModifiers: { ...defaultStages } })`.
- **Status:** CORRECT. This ensures no stale combat stage values survive in the DB between encounters. The reset applies unconditionally to all combatants (not just those with changed conditions), which is correct because ALL stages are encounter-scoped per PTU p.235. The `stageSources` array is also cleared, preventing orphaned source tracking data. Combined with the defense-in-depth reset in `buildCombatantFromEntity` (commit `6357e0f`), this provides two independent guarantees against the double-application bug.

### 4. Combat Entry Stage Reset (rules-review-161 HIGH-1 -> commit `6357e0f`)
- **Rule:** PTU p.235: Combat stages are encounter-scoped. A Pokemon entering a new encounter starts with default (zero) stages. Per decree-005, status condition CS effects are then re-applied fresh.
- **Implementation:** `buildCombatantFromEntity()` at lines 715-726 now constructs `combatStages` from `createDefaultStageModifiers()` (all zeros), overlays equipment speed default CS if applicable (Heavy Armor -1, PTU p.293), then creates `combatantEntity = { ...entity, stageModifiers: combatStages }`. This replaces the previous behavior of inheriting `entity.stageModifiers` from the DB. Line 758 then calls `reapplyActiveStatusCsEffects(combatant)` to apply CS effects from any active status conditions.
- **Scenario verification (the HIGH-1 bug):**
  1. Burned Pokemon enters Encounter A. `reapplyActiveStatusCsEffects` sets defense CS to -2. DB synced.
  2. Encounter A ends. `end.post.ts` resets stages to defaults. DB synced with defense = 0.
  3. Pokemon enters Encounter B. `buildCombatantFromEntity` starts with default stages (defense = 0, ignoring DB). `reapplyActiveStatusCsEffects` applies -2 for Burn. Result: defense CS = -2. CORRECT.
  4. Even if `end.post.ts` fails to reset (e.g., app crash during encounter), `buildCombatantFromEntity` still starts from defaults, so double-application is impossible.
- **Status:** CORRECT. The defense-in-depth approach (reset at encounter end AND reset at combat entry) guarantees correctness regardless of the DB state. Equipment speed default CS is correctly preserved for Heavy Armor wearers.

### 5. TempConditions Zero-Evasion Check (rules-review-161 M3 -> commit `dff8a31`)
- **Rule:** PTU p.245: Take a Breather makes the combatant "Vulnerable until the end of their next turn." PTU p.248: "A Vulnerable Pokemon or Trainer cannot apply Evasion of any sort against attacks." The Vulnerable condition from Take a Breather is stored in `combatant.tempConditions` (not `entity.statusConditions`), so evasion checks must inspect both.
- **Implementation:** `useMoveCalculation.ts` (lines 351-355) now checks both `entity.statusConditions?.some(...)` and `target.tempConditions?.some(...)` for zero-evasion conditions. `calculate-damage.post.ts` (lines 226-232) similarly checks both `targetConditions` (from entity) and `targetTempConditions` (from combatant) arrays. Both use the `ZERO_EVASION_CONDITIONS` constant.
- **Status:** CORRECT. The breather handler at `breather.post.ts:132-133` pushes 'Vulnerable' into `combatant.tempConditions`. The evasion check in both client and server paths now catches this. The `|| target.tempConditions?.some(...)` pattern correctly short-circuits if the first check already found a zero-evasion condition.

### 6. Legendary Species List Completeness (rules-review-161 M1 -> commit `545b708`)
- **Rule:** PTU p.214: "Legendary Pokemon subtract 30 from the Pokemon's Capture Rate." Per decree-013, using the core 1d100 system.
- **Implementation:** `legendarySpecies.ts` now includes:
  - **Meltan** (Gen 8 section, line 107) -- Mythical Pokemon introduced in Pokemon GO/Let's Go
  - **Melmetal** (Gen 8 section, line 108) -- Meltan's evolution, also Mythical
  - **Zarude** (Gen 8 section, line 114) -- Gen 8 Mythical (Dark/Grass)
  - **Enamorus** (Hisui section, line 122) -- Legendary, fourth Force of Nature alongside Tornadus/Thundurus/Landorus
- **Verification:** All four species have pokedex entries in the PTU data (`books/markdown/pokedexes/gen8/meltan.md`, `gen8/melmetal.md`, `gen8/zarude.md`, `hisui/enamorus-incarnate.md`). Meltan/Melmetal and Zarude are canonical Mythicals. Enamorus is a canonical Legendary added in PLA. While PLA post-dates PTU 1.05, the GM already has the override param (`isLegendary`) as a safety valve, and including these species in auto-detection is the conservative choice.
- **Status:** CORRECT. The list now totals 100 species (96 original + 4 added). The GM override at `rate.post.ts:93` (`body.isLegendary ?? isLegendarySpecies(species)`) still allows manual control for edge cases.

## Cross-Mechanic Interaction Verification

### Status CS + Faint + Encounter End Flow
Traced the full lifecycle for a Burned Pokemon:
1. **Combat entry:** `buildCombatantFromEntity` resets stages to defaults, then `reapplyActiveStatusCsEffects` applies -2 Def CS from Burn. Stage sources recorded. CORRECT.
2. **Take a Breather (mid-combat):** Stages reset to defaults. Volatile conditions + Slow/Stuck cured. `reapplyActiveStatusCsEffects` re-applies -2 Def from Burn (persistent, survives breather). Tripped + Vulnerable added to tempConditions. CORRECT per PTU p.245 and decree-005.
3. **Faint:** `applyDamageToEntity` reverses Burn CS (+2 Def), clears Burn from statusConditions. `syncStagesToDatabase` writes reversed stages to DB. DB now has defense = 0, statusConditions = ['Fainted']. CORRECT per PTU p.248.
4. **Encounter end:** All stages reset to defaults (all zeros). Volatile conditions cleared. Synced to DB. CORRECT per PTU p.235.
5. **New encounter entry:** `buildCombatantFromEntity` starts fresh with default stages. No Burn condition remains (cleared on faint), so no CS applied. CORRECT.

### Status CS + Cure + Re-Apply Flow
For a Paralyzed Pokemon:
1. Paralysis applied: -4 Speed CS. Source recorded: `{ stat: 'speed', value: -4, source: 'Paralyzed' }`.
2. GM manually adjusts Speed CS +2 (unrelated to Paralysis). Speed CS = -2.
3. Paralysis cured: `reverseStatusCsEffects` reverses only the -4 delta, so Speed CS = -2 - (-4) = +2. The manual +2 adjustment is preserved. CORRECT per decree-005.

### Evasion Check Completeness
Verified all paths that compute evasion:
- **Client:** `useMoveCalculation.ts:computeTargetEvasions` -- checks both statusConditions and tempConditions. CORRECT.
- **Server:** `calculate-damage.post.ts:223-232` -- checks both statusConditions and tempConditions. CORRECT.
- **Combatant builder:** `buildCombatantFromEntity` computes initial evasion values (physical, special, speed) from stats. These are static initial values and are NOT used by the damage calculation path (which recomputes dynamically). Zero-evasion conditions are handled at calculation time, not at combatant construction time. CORRECT.

## Decree Compliance

| Decree | Compliance |
|--------|-----------|
| decree-005 (status CS auto-apply) | COMPLIANT. CS effects auto-applied on status add, reversed on cure, re-applied after breather, reversed on faint. Source tracking with actual delta. |
| decree-001 (minimum 1 damage) | NOT IN SCOPE (no damage formula changes in these commits). |
| decree-013 (core 1d100 capture) | COMPLIANT. Capture system uses 1d100 per decree. No changes in these commits. |
| decree-014 (Stuck/Slow separate) | NOT IN SCOPE (capture rate modifiers unchanged). |
| decree-015 (real max HP for capture) | NOT IN SCOPE (capture rate unchanged). |

## Rulings

1. **Faint stage DB sync:** CORRECT. Both `damage.post.ts` and `move.post.ts` now persist reversed stage values to the entity DB record after faint, preventing stale CS data from carrying over.
2. **Encounter end stage reset:** CORRECT per PTU p.235. All combatants' stages reset to defaults. `stageSources` cleared. Synced to DB.
3. **Combat entry stage reset:** CORRECT. `buildCombatantFromEntity` now ignores DB-persisted stages and starts from defaults. Defense-in-depth against stale data.
4. **TempConditions evasion check:** CORRECT per PTU p.245/248. Both client and server evasion checks now inspect `tempConditions` for Vulnerable, catching the Take a Breather case.
5. **Legendary species additions:** CORRECT. Meltan, Melmetal, Zarude, and Enamorus are canonically legendary/mythical. Their inclusion ensures the -30 capture rate modifier is auto-applied per PTU p.214.
6. **ZERO_EVASION_CONDITIONS constant usage:** CORRECT. Single source of truth prevents divergence between check sites.

## Summary

All six fix cycle commits correctly address the issues identified in rules-review-161 and code-review-184. The HIGH-1 double-application bug is definitively resolved through a defense-in-depth approach: encounter end resets stages to DB, AND combat entry starts from defaults regardless of DB state. The three MEDIUM issues (incomplete legendary list, missing encounter end reset, tempConditions evasion gap) are all properly resolved. No new PTU rule correctness issues were found in the fix cycle code.

The core status CS tracking system (ptu-rule-098) remains mechanically correct: Burn -2 Def, Paralysis -4 Speed, Poison -2 SpDef, all with source-tracked actual deltas respecting -6/+6 bounds. The zero-evasion system (ptu-rule-084) now covers all code paths including tempConditions. The legendary capture rate (ptu-rule-085) now auto-detects all canonical legendaries and mythicals from Gen 1-8 plus Hisui.

## Verdict

**APPROVED** -- All issues from rules-review-161 and code-review-184 are resolved. No new PTU rule correctness issues found. The implementation correctly follows PTU 1.05 rules and all applicable decrees.
