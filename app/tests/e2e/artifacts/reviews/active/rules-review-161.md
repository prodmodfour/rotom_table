---
review_id: rules-review-161
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - status-condition-cs-auto-apply
  - status-cs-source-tracking
  - take-a-breather-cs-reapply
  - faint-cs-reversal
  - combat-entry-cs-auto-apply
  - zero-evasion-conditions
  - legendary-capture-rate-modifier
  - badly-poisoned-cs-effect
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 3
ptu_refs:
  - core/07-combat.md#Burned (p.246)
  - core/07-combat.md#Paralysis (p.247)
  - core/07-combat.md#Poisoned (p.246-247)
  - core/07-combat.md#Frozen (p.246)
  - core/07-combat.md#Sleep (p.247)
  - core/07-combat.md#Vulnerable (p.248)
  - core/07-combat.md#Take-a-Breather (p.245)
  - core/05-pokemon.md#Capturing-Pokemon (p.214)
  - decree-005
  - decree-013
  - decree-014
  - decree-015
reviewed_at: 2026-02-26T20:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Burn CS Auto-Application (ptu-rule-098)
- **Rule:** "The target's Defense Stat is lowered by 2 Combat Stages for the duration of the Burn." (`core/07-combat.md` p.246)
- **Implementation:** `STATUS_CS_EFFECTS` in `app/constants/statusConditions.ts` maps `'Burned'` to `{ stat: 'defense', value: -2 }`. Applied via `applyStatusCsEffects()` in `app/server/services/combatant.service.ts:344-373`.
- **Status:** CORRECT -- Value and stat match PTU exactly. Stage bounds (-6/+6) are enforced. Source tracking records actual delta applied.

### 2. Paralysis CS Auto-Application (ptu-rule-098)
- **Rule:** "The Target's Speed Stat is lowered by 4 Combat Stages." (`core/07-combat.md` p.247)
- **Implementation:** `STATUS_CS_EFFECTS` maps `'Paralyzed'` to `{ stat: 'speed', value: -4 }`.
- **Status:** CORRECT -- Value and stat match PTU exactly.

### 3. Poison CS Auto-Application (ptu-rule-098)
- **Rule:** "The target's Special Defense Value is lowered by 2 Combat Stages for the duration of the poison." (`core/07-combat.md` p.246-247)
- **Implementation:** `STATUS_CS_EFFECTS` maps `'Poisoned'` to `{ stat: 'specialDefense', value: -2 }`.
- **Status:** CORRECT -- Value and stat match PTU exactly.

### 4. Badly Poisoned CS Effect (ptu-rule-098, commit 29f4b3f)
- **Rule:** "When Badly Poisoned, the afflicted instead loses 5 Hit Points" (`core/07-combat.md` p.246). The "instead" refers ONLY to the tick damage mechanic, NOT to the CS penalty. Badly Poisoned is a variant of Poisoned; the -2 SpDef CS is inherent to the Poisoned condition that Badly Poisoned modifies.
- **Implementation:** `STATUS_CS_EFFECTS` maps `'Badly Poisoned'` to `{ stat: 'specialDefense', value: -2 }`.
- **Status:** CORRECT -- Badly Poisoned retains the Poison CS penalty. The "instead" only modifies tick damage (5 flat instead of 1/10 max HP).

### 5. Source-Tracked CS Reversal on Cure (ptu-rule-098)
- **Rule:** Per decree-005: "When Burn is cured, reverse only the Burn-sourced stages."
- **Implementation:** `reverseStatusCsEffects()` in `combatant.service.ts:381-403` finds `stageSources` entries matching the condition, reverses only the actual delta that was applied (not the nominal value), and removes the source entries. Respects -6/+6 bounds on reversal.
- **Status:** CORRECT -- Source tracking ensures independent manual CS adjustments are preserved during cure reversal. The actual-delta tracking (line 372: records `actualDelta` not `value`) handles edge cases where the stage was already near a bound.

### 6. Take a Breather CS Re-Application (ptu-rule-098, commit 8cb6524)
- **Rule:** PTU p.245: "set their Combat Stages back to their default level." Per decree-005: "Source-tagged stages survive Take a Breather (which resets non-sourced stages, then re-applies condition-sourced ones)."
- **Implementation:** `breather.post.ts:91` resets stages to defaults, then line 119 calls `reapplyActiveStatusCsEffects()` which clears `stageSources` and re-applies CS effects from surviving active conditions.
- **Execution flow:** (1) Stages reset to 0 (or equipment defaults). (2) Volatile conditions + Slowed + Stuck cured. (3) `entity.statusConditions` now contains only surviving conditions (persistent: Burn/Paralysis/Poison). (4) `reapplyActiveStatusCsEffects` reads surviving conditions and re-applies their CS effects fresh.
- **Status:** CORRECT -- Order of operations is right: cure first, then re-apply. Only surviving conditions get re-applied. Heavy Armor speed default CS is also preserved.

### 7. Faint CS Reversal (ptu-rule-098, commit 1375585)
- **Rule:** PTU p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- **Implementation:** `applyDamageToEntity()` in `combatant.service.ts:158-173` on faint: iterates persistent+volatile conditions being cleared, calls `reverseStatusCsEffects()` for each, then sets `entity.statusConditions` to `['Fainted', ...survivingOtherConditions]`.
- **Status:** CORRECT -- CS effects are properly reversed before the conditions are removed from the array. Only persistent and volatile conditions are cleared per PTU rules; "other" conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) are preserved.

### 8. Combat Entry CS Auto-Application (ptu-rule-098, commit 3effd78)
- **Rule:** Per decree-005: "these CS effects are inherent properties of the conditions." A Burned Pokemon entering combat should start with -2 Def CS.
- **Implementation:** `buildCombatantFromEntity()` in `combatant.service.ts:755-757` calls `reapplyActiveStatusCsEffects()` after constructing the combatant.
- **Status:** NEEDS REVIEW -- See HIGH-1 below. Risk of double-application if DB-persisted `stageModifiers` already include status-sourced CS from a previous encounter.

### 9. Vulnerable Zero Evasion (ptu-rule-084)
- **Rule:** "A Vulnerable Pokemon or Trainer cannot apply Evasion of any sort against attacks." (`core/07-combat.md` p.248)
- **Implementation:** Client: `useMoveCalculation.ts:348-353` checks `entity.statusConditions` for 'Vulnerable' and returns `{ physical: 0, special: 0, speed: 0 }`. Server: `calculate-damage.post.ts:222-226` checks `target.entity.statusConditions` for 'Vulnerable'.
- **Status:** CORRECT for statusConditions-based Vulnerable. See MEDIUM-3 for tempConditions gap.

### 10. Frozen Zero Evasion (ptu-rule-084)
- **Rule:** "The target may not act on their turn and receives no bonuses from Evasion." (`core/07-combat.md` p.246)
- **Implementation:** Both client and server check for 'Frozen' in the zero-evasion condition list.
- **Status:** CORRECT -- "receives no bonuses from Evasion" is correctly implemented as evasion = 0.

### 11. Asleep Zero Evasion (ptu-rule-084)
- **Rule:** "Sleeping Trainers and Pokemon receive no bonuses from Evasion." (`core/07-combat.md` p.247)
- **Implementation:** Both client and server check for 'Asleep' (the app's name for the Sleep condition) in the zero-evasion condition list.
- **Status:** CORRECT -- The app models Sleep as 'Asleep' in `StatusCondition` type. The rule text "receive no bonuses from Evasion" means evasion becomes 0, which is correctly implemented.

### 12. ZERO_EVASION_CONDITIONS Constant (ptu-rule-084)
- **Rule:** Vulnerable (p.248), Frozen (p.246), Sleep/Asleep (p.247) all set evasion to 0.
- **Implementation:** `ZERO_EVASION_CONDITIONS` in `app/constants/statusConditions.ts:31-33` contains `['Vulnerable', 'Frozen', 'Asleep']`.
- **Status:** CORRECT -- Complete list. Note: Bad Sleep is correctly excluded since it only affects sleeping targets who already have zero evasion from the Sleep condition.

### 13. Legendary Capture Rate Modifier (ptu-rule-085, commit 112e5ba)
- **Rule:** "Legendary Pokemon subtract 30 from the Pokemon's Capture Rate." (`core/05-pokemon.md` p.214)
- **Implementation:** `isLegendarySpecies()` in `app/constants/legendarySpecies.ts` checks against a hardcoded `LEGENDARY_SPECIES` Set. Used by `rate.post.ts:93` and `attempt.post.ts:56`. `captureRate.ts:106` applies `-30` modifier.
- **Status:** CORRECT -- The -30 modifier matches PTU exactly. Auto-detection from species name avoids manual flagging errors. GM override preserved in `rate.post.ts` via `body.isLegendary ?? isLegendarySpecies(species)`. Per decree-013, using core 1d100 system.

### 14. Capture Rate Status Modifiers (cross-check)
- **Rule:** "Persistent Conditions add +10... Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5." (`core/05-pokemon.md` p.214)
- **Implementation:** `captureRate.ts:116-137` -- Persistent +10, Volatile +5, Stuck +10, Slow +5. Poisoned/Badly Poisoned dedup logic prevents double-counting.
- **Status:** CORRECT -- Per decree-014, Stuck and Slow are in `OTHER_CONDITIONS` (not VOLATILE), so they get only their specific bonuses without the +5 volatile bonus.

## Issues

### HIGH-1: Double-application of status CS effects on combat re-entry
**File:** `app/server/services/combatant.service.ts:755-757` (buildCombatantFromEntity)
**Mechanic:** Status CS auto-application on combat entry
**Description:** When `buildCombatantFromEntity` is called, it reads the entity's `stageModifiers` from the DB (which may already include -2 Def from a previous encounter's Burn auto-application) and then calls `reapplyActiveStatusCsEffects()` which adds the CS effects again on top of the persisted values.

**Scenario:**
1. Pokemon with Burn enters Encounter A. `reapplyActiveStatusCsEffects` sets defense CS to -2. DB synced with defense = -2.
2. Encounter A ends. `end.post.ts` does NOT reset stage modifiers. DB still has defense = -2.
3. Pokemon enters Encounter B. `buildCombatantFromEntity` loads entity with defense CS = -2 from DB. `reapplyActiveStatusCsEffects` applies another -2, resulting in defense CS = -4.

**PTU Rule:** "lowered by 2 Combat Stages" -- should be exactly -2, not cumulative across encounters.

**Fix options:**
(A) Reset `stageModifiers` to defaults before calling `reapplyActiveStatusCsEffects` in `buildCombatantFromEntity`.
(B) In the encounter `end.post.ts`, reset all combatants' `stageModifiers` to defaults and sync to DB.
(C) In `reapplyActiveStatusCsEffects`, reset the relevant stats to 0 before re-applying (it already clears `stageSources`, but doesn't reset the modifier values).

Option (A) is safest and most self-contained: ensures a clean baseline regardless of what the DB contains.

### MEDIUM-1: Legendary species list incomplete for PTU pokedex data
**File:** `app/constants/legendarySpecies.ts`
**Description:** The hardcoded list is missing several mythical/legendary Pokemon that exist in the PTU pokedex data:
- **Meltan** (Gen 8, `books/markdown/pokedexes/gen8/meltan.md`)
- **Melmetal** (Gen 8, `books/markdown/pokedexes/gen8/melmetal.md`)
- **Zarude** (Gen 8, `books/markdown/pokedexes/gen8/zarude.md`)
- **Enamorus** (Hisui, `books/markdown/pokedexes/hisui/enamorus-incarnate.md`, `enamorus-therian.md`) -- Legendary (Force of Nature alongside Tornadus/Thundurus/Landorus)

**Impact:** These Pokemon would not get the -30 capture rate modifier. Meltan/Melmetal and Zarude are mythicals canonically. Enamorus is a canonical Legendary but was added in PLA (post-PTU 1.05). The GM override (`isLegendary` param) provides a workaround.

### MEDIUM-2: Encounter end does not reset combat stages
**File:** `app/server/api/encounters/[id]/end.post.ts`
**Description:** The encounter end handler clears volatile conditions and resets scene-frequency moves, but does NOT reset `stageModifiers` to defaults. PTU combat stages are explicitly combat-scoped -- they have no meaning outside of battle. This is a pre-existing issue (not introduced by these commits) but directly contributes to HIGH-1.

**Impact:** Stage modifiers persist in the DB across encounters, creating stale combat state and causing the double-application bug in HIGH-1.

### MEDIUM-3: Zero-evasion check misses tempConditions-based Vulnerable
**Files:** `app/composables/useMoveCalculation.ts:348-349`, `app/server/api/encounters/[id]/calculate-damage.post.ts:223`
**Description:** Both client and server zero-evasion checks only inspect `entity.statusConditions`, not `combatant.tempConditions`. When Take a Breather applies Vulnerable (stored in `tempConditions`), the evasion check misses it. This is a pre-existing architectural pattern (tempConditions has always been separate), but the new zero-evasion code follows the same gap.

**Impact:** A combatant who just Took a Breather (which applies Vulnerable until end of next turn via tempConditions) would NOT have their evasion zeroed by the new code. PTU p.245: they should "be treated as having 0 Evasion until the end of their next turn."

**Note:** This is not a regression from these commits -- it's a pre-existing gap in how tempConditions are handled throughout the codebase. The new code is consistent with the existing pattern.

## Rulings

1. **Burn -2 Def CS:** CORRECT per PTU p.246 and decree-005.
2. **Paralysis -4 Speed CS:** CORRECT per PTU p.247 and decree-005.
3. **Poison -2 SpDef CS:** CORRECT per PTU p.246-247 and decree-005.
4. **Badly Poisoned -2 SpDef CS:** CORRECT -- the "instead" on p.246 modifies only the tick damage, not the CS penalty. Badly Poisoned inherits the Poison CS effect.
5. **Source tracking with actual delta:** CORRECT -- recording `actualDelta` (not nominal value) handles near-bound edge cases properly.
6. **Take a Breather flow:** CORRECT -- reset stages, cure volatile, re-apply persistent CS effects. Order of operations matches decree-005 specification.
7. **Faint clears persistent+volatile only:** CORRECT per PTU p.248. Other conditions preserved.
8. **Vulnerable/Frozen/Asleep -> evasion 0:** CORRECT per PTU p.246-248.
9. **Bad Sleep NOT in zero-evasion list:** CORRECT -- Bad Sleep modifies Sleep; the Sleep condition already handles evasion.
10. **Legendary -30 capture rate:** CORRECT per PTU p.214.
11. **GM override for legendary:** CORRECT design -- `rate.post.ts` allows `isLegendary` body param to override auto-detection.

## Summary

The implementation of status condition CS auto-tracking (ptu-rule-098) is mechanically correct in its core logic: the right stats get the right CS penalties, source tracking enables clean reversal, and the Take a Breather re-application flow handles the interaction correctly. The zero-evasion conditions (ptu-rule-084) and legendary capture rate modifier (ptu-rule-085) are also correctly implemented against PTU rules.

One HIGH issue exists: double-application of status CS effects on combat re-entry due to persisted stage modifiers not being reset between encounters. The fix is straightforward (reset stages to defaults before re-applying in `buildCombatantFromEntity`). Three MEDIUM issues noted: incomplete legendary species list, encounter end not resetting stages (pre-existing but contributes to HIGH-1), and tempConditions Vulnerable not checked for zero evasion (pre-existing pattern).

## Verdict

**CHANGES_REQUIRED** -- HIGH-1 must be fixed before merging to prevent incorrect CS values when re-entering combat with active status conditions. MEDIUM issues should be addressed but are not blocking.

## Required Changes

1. **HIGH-1 (blocking):** In `buildCombatantFromEntity()`, reset `stageModifiers` to defaults before calling `reapplyActiveStatusCsEffects()`. This ensures a clean baseline regardless of what the DB persisted from a previous encounter. Example fix:
   ```typescript
   // Reset stages to clean defaults before applying status CS effects
   combatantEntity.stageModifiers = createDefaultStageModifiers()
   // Then apply equipment speed default if needed
   if (equipmentSpeedDefaultCS !== 0) {
     combatantEntity.stageModifiers.speed = equipmentSpeedDefaultCS
   }
   // Then auto-apply CS from pre-existing conditions
   reapplyActiveStatusCsEffects(combatant)
   ```

2. **MEDIUM-1 (non-blocking):** Add Meltan, Melmetal, Zarude, and Enamorus to `LEGENDARY_SPECIES` in `legendarySpecies.ts`.

3. **MEDIUM-2 (non-blocking):** Add stage modifier reset to `end.post.ts` to clear combat-scoped state on encounter end. This prevents stale stages from persisting in the DB.

4. **MEDIUM-3 (non-blocking):** File a ticket to unify `tempConditions` and `statusConditions` handling for evasion checks, or extend the zero-evasion check to also inspect `combatant.tempConditions`.
