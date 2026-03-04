---
review_id: code-review-184
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-098+084+085
domain: combat
commits_reviewed:
  - db50fc1
  - 108f6b2
  - 617b45d
  - 7776619
  - 8cb6524
  - 1375585
  - 3effd78
  - 29f4b3f
  - 6604aba
  - 46757fa
  - 112e5ba
  - 96a36ae
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/constants/statusConditions.ts
  - app/constants/legendarySpecies.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/composables/useMoveCalculation.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/services/entity-update.service.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-02-26T16:30:00Z
follows_up: null
---

## Review Scope

Dual review of three PTU rule tickets implemented across two slave branches:

- **ptu-rule-098** (P1): Status condition auto-CS tracking with source-based reversal (Burn -2 Def, Paralysis -4 Speed, Poison -2 SpDef). 9 commits by slave-3. Per decree-005.
- **ptu-rule-084** (P2): Vulnerable/Frozen/Asleep zero evasion. 1 code commit by slave-5.
- **ptu-rule-085** (P2): Legendary auto-detection for -30 capture rate. 1 code commit by slave-5.

12 total commits reviewed. All source files read in full.

## Issues

### HIGH

#### H1: Faint path does not sync stageModifiers to entity DB record

**Files:** `app/server/api/encounters/[id]/damage.post.ts` (lines 44-51), `app/server/api/encounters/[id]/move.post.ts` (lines 85-92)

When a combatant faints, `applyDamageToEntity()` now calls `reverseStatusCsEffects()` for each persistent/volatile condition being cleared. This modifies `entity.stageModifiers` in-memory. However, both `damage.post.ts` and `move.post.ts` sync to the database using `syncDamageToDatabase()`, which syncs HP, tempHp, injuries, statusConditions, and lastInjuryTime -- but **not** stageModifiers.

The encounter's combatants JSON blob (saved via `saveEncounterCombatants`) does contain the corrected stage data, so in-encounter state is consistent. But the entity's own DB row (Pokemon/HumanCharacter table) retains stale stageModifiers with the status-sourced CS changes still applied. If the entity is loaded outside an encounter (character sheet view, next encounter entry via `buildCombatantFromEntity`), it will carry incorrect stage values.

Concrete scenario: A Burned Pokemon (defense CS = -2) faints. `applyDamageToEntity` reverses the burn CS (defense back to 0) and clears the condition. `syncDamageToDatabase` writes statusConditions=["Fainted"] but does NOT write stageModifiers. The Pokemon's DB record still has `{"defense": -2, ...}`. If this Pokemon is later revived and added to a new encounter, `buildCombatantFromEntity` reads stageModifiers from the entity and then `reapplyActiveStatusCsEffects` runs -- but the entity no longer has Burned, so no CS is applied. The defense CS starts at -2 instead of 0.

**Fix:** `syncDamageToDatabase` must include `stageModifiers: combatant.entity.stageModifiers` when `damageResult.fainted` is true. Alternatively, unconditionally pass stageModifiers in the faint branch of both endpoints.

### MEDIUM

#### M1: ZERO_EVASION_CONDITIONS constant defined but unused

**File:** `app/constants/statusConditions.ts` (lines 26-33)

The `ZERO_EVASION_CONDITIONS` constant is exported but never imported or used anywhere. Both `useMoveCalculation.ts` (line 349) and `calculate-damage.post.ts` (line 224-225) use inline string comparisons (`c === 'Vulnerable' || c === 'Frozen' || c === 'Asleep'`) instead of referencing this constant.

The constant exists, which is good for documentation, but the actual check sites don't use it. If a fourth zero-evasion condition is ever added, the constant would be updated but the two check sites would be missed, creating a divergence.

**Fix:** Import and use `ZERO_EVASION_CONDITIONS` in both check sites. The commit message for `46757fa` notes "The inline checks use direct string comparisons to avoid import complexity in the server endpoint" -- the server endpoint already imports from `~/utils/damageCalculation`, so adding one more import from `~/constants/statusConditions` is not meaningfully more complex.

#### M2: Breather move log notes reference stageSources after re-application but label is ambiguous

**File:** `app/server/api/encounters/[id]/breather.post.ts` (line 159)

`buildBreatherNotes` receives `combatant.stageSources || []` at line 159, but this is called AFTER `reapplyActiveStatusCsEffects` at line 119. The notes correctly show what was re-applied. However, the format string `re-applied CS: Burned (-2 defense)` could be confusing to a GM who sees a negative value labeled as "re-applied" -- it reads as if defense was lowered during the breather, which is correct but the phrasing is unclear.

This is a minor UX concern, not a correctness bug. The data is correct. A clearer phrasing might be "persistent CS penalties restored: Burned (-2 defense)" to clarify that these are ongoing penalties, not new ones.

**Fix:** Optional -- improve the phrasing in `buildBreatherNotes` for GM clarity. Low priority.

## What Looks Good

**ptu-rule-098 (Status CS auto-tracking):**
- Clean separation of concerns: constants in `statusConditions.ts`, types in `combat.ts`, logic in `combatant.service.ts`, endpoint integration in `status.post.ts` and `breather.post.ts`.
- Source tracking records the *actual* delta (respecting bounds), not the nominal value. This means reversal is exact even at stage boundaries. Well thought out.
- `reapplyActiveStatusCsEffects` correctly clears all stageSources before re-applying, preventing duplication on breather.
- Immutability patterns used consistently in `applyStatusCsEffects` and `reverseStatusCsEffects` (spread operators for stageModifiers and stageSources arrays).
- `updateStatusConditions` correctly processes removals before additions and only runs CS logic when relevant conditions are involved.
- Faint handling in `applyDamageToEntity` correctly iterates over conditions being cleared and reverses their CS effects before updating the status array.
- Combat entry via `buildCombatantFromEntity` calls `reapplyActiveStatusCsEffects` to handle pre-existing conditions from prior encounters. Per decree-005.
- Badly Poisoned correctly included in `STATUS_CS_EFFECTS` mapping with same -2 SpDef as Poisoned (PTU p.247: "When Badly Poisoned, the afflicted instead loses 5 Hit Points" -- the SpDef penalty is inherited from Poisoned).
- Commit granularity is excellent: 9 logical commits each touching 1-2 files.

**ptu-rule-084 (Zero evasion):**
- Dual-path fix: both client composable (`computeTargetEvasions`) and server endpoint (`calculate-damage.post.ts`) are covered. No path can bypass the zero-evasion check.
- Early return pattern is correct -- returning `{ physical: 0, special: 0, speed: 0 }` before any stat computation.
- PTU rule verified: Frozen "receives no bonuses from Evasion" (p.246), Sleep "receive no bonuses from Evasion" (p.247), Vulnerable "cannot apply Evasion of any sort" (p.248). All three are correctly handled.

**ptu-rule-085 (Legendary detection):**
- `LEGENDARY_SPECIES` is a `ReadonlySet<string>` -- good choice for O(1) lookup with immutability.
- `isLegendarySpecies` has a fast path (direct Set.has) and case-insensitive fallback. Correct approach.
- Rate endpoint accepts `isLegendary` override for GM control (homebrewed legendaries). Attempt endpoint uses auto-detection only (correct -- it looks up the actual Pokemon by ID, so GM override doesn't apply).
- The `captureRate.ts` utility already handled `isLegendary` correctly; the fix properly wires it up at the API layer.
- 96 species covering Gen 1-8 legendaries and mythicals, including edge cases like "Type: Null" and "Ho-Oh" with special characters.
- Ultra Beasts included (Nihilego through Blacephalon) -- this matches the PTU Pokedex treatment where UBs are categorized as Legendary.

**General observations:**
- No files exceed the 800-line limit (largest: `useMoveCalculation.ts` at 796 lines, `combatant.service.ts` at 760 lines -- both within bounds).
- No hardcoded secrets or security issues.
- Error handling is consistent across all modified endpoints.
- The `status.post.ts` endpoint correctly syncs both statusConditions AND stageModifiers to the entity DB record.

## Verdict

**CHANGES_REQUIRED**

H1 is a data consistency bug that will cause incorrect stage values when entities transition between encounters after fainting with status conditions. It must be fixed before merge.

M1 should be fixed in the same pass -- the constant was created for this purpose, and leaving the check sites using inline strings defeats the purpose and creates a future maintenance trap.

M2 is optional polish.

## Required Changes

1. **[H1]** In `damage.post.ts` and `move.post.ts`, add stageModifiers to the DB sync when the combatant faints. Either modify `syncDamageToDatabase` to accept an optional `stageModifiers` parameter, or add an additional `syncStagesToDatabase` call after `syncDamageToDatabase` when `damageResult.fainted` is true.

2. **[M1]** In `useMoveCalculation.ts` `computeTargetEvasions` and `calculate-damage.post.ts`, replace inline string comparisons with an import and usage of `ZERO_EVASION_CONDITIONS` from `~/constants/statusConditions`. Use `.some(c => ZERO_EVASION_CONDITIONS.includes(c as StatusCondition))` or equivalent.
