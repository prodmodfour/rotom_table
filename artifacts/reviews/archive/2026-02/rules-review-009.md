---
review_id: rules-review-009
target: refactoring-003
ticket_type: refactoring
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-16
trigger: developer-fix-review
commits_reviewed:
  - 14a54f4  # add entity builder functions to combatant.service.ts
  - 1da293d  # replace inline entity transformation in combatants.post.ts
  - 162feff  # replace inline HumanCharacter transformation in from-scene.post.ts
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/from-scene.post.ts
ptu_references:
  - "core/07-combat.md lines 586-615 (Evasion from Stats)"
  - "core/07-combat.md lines 54-80 (Initiative)"
  - "core/02-character-creation.md lines 309-314 (Trainer HP, Evasion formula)"
---

## Summary

Refactoring-003 extracted inline entity transformation and combatant construction into three typed service functions. The refactoring preserves all PTU game logic identically, and the included bug fix (HumanCharacter `maxHp`) is a legitimate PTU correction.

## Mechanics Verified

### 1. Evasion Formula

- **Rule:** PTU p.310-314: "To calculate these Evasion values, divide the related Combat Stat by 5 and round down." Physical Evasion from Defense, Special Evasion from Special Defense, Speed Evasion from Speed.
- **Implementation:** `Math.floor((stats.defense || 0) / 5)` (and equivalents for SpDef, Speed) in `buildCombatantFromEntity()` (combatant.service.ts:555-557)
- **Status:** CORRECT
- **Notes:** Formula matches rulebook exactly. The `|| 0` guard handles null/undefined stats defensively — harmless, no PTU impact.

### 2. Evasion Stat Source

- **Rule:** PTU p.586-615: Evasion uses the Pokemon/Trainer's actual stat values. Combat stages can increase evasion from "artificially increased defense score."
- **Implementation:** Pokemon uses `currentStats` (calculated stats: base + level-up + nature). Human uses `stats` (trainer's stat block). Both are the correct calculated stats for initial evasion at encounter creation.
- **Status:** CORRECT
- **Notes:** `currentStats` on Pokemon is the calculated stat (not base stat). Combat stages are stored separately in `stageModifiers` and applied dynamically during combat — not baked into `currentStats`. At combatant creation time, stages are 0, so initial evasion without stage application is correct.

### 3. Initiative

- **Rule:** PTU p.54-80: "A Pokemon or Trainer's Initiative is simply their Speed Stat, though Items, Features, Moves, and other effects may modify this."
- **Implementation:** `stats.speed + initiativeBonus` in `buildCombatantFromEntity()` (combatant.service.ts:534)
- **Status:** CORRECT
- **Notes:** Speed stat + optional bonus matches PTU exactly. Default bonus is 0. For Pokemon: `currentStats.speed`. For Human: `stats.speed`. Both correct.

### 4. HumanCharacter maxHp Bug Fix

- **Rule:** PTU p.309: "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10"
- **Implementation (old):** `maxHp: entity.hp` — used the base HP **stat** (e.g., 8), not the calculated max HP
- **Implementation (new):** `maxHp: record.maxHp` — uses the pre-calculated max HP from DB (e.g., for a L5 trainer with HP stat 8: `(5*2) + (8*3) + 10 = 44`)
- **Status:** CORRECT — this is a legitimate CRITICAL bug fix
- **Severity of original bug:** CRITICAL — using the base HP stat as max HP would cause trainers to appear to have far less health than they should, breaking damage thresholds, healing caps, and injury calculations.

### 5. Turn State Defaults

- **Rule:** PTU p.54-80: Each round, combatants get 1 Standard Action, 1 Shift Action, and 1 Swift Action.
- **Implementation:** `turnState: { hasActed: false, standardActionUsed: false, shiftActionUsed: false, swiftActionUsed: false, canBeCommanded: true, isHolding: false }` in `buildCombatantFromEntity()` (combatant.service.ts:546-553)
- **Status:** CORRECT
- **Notes:** Fresh combatant starts with all actions available. Matches PTU action economy.

### 6. Entity Field Mapping (Pokemon)

- **Rule:** Pokemon entity must preserve all stat blocks (base and calculated), status conditions, injuries, temporary HP, and combat-relevant fields from the database record.
- **Implementation:** `buildPokemonEntityFromRecord()` maps all 31 fields of the `Pokemon` interface. Cross-referenced field-by-field against `types/character.ts:96-146`.
- **Status:** CORRECT
- **Notes:** `baseStats` correctly maps `record.baseHp/baseAttack/...` (species data). `currentStats` correctly maps `record.currentHp/currentAttack/...` (calculated stats). `injuries` and `temporaryHp` now included (previously omitted in the inline code — needed by damage/healing pipeline).

### 7. Entity Field Mapping (HumanCharacter)

- **Rule:** HumanCharacter entity must preserve stats, HP, status conditions, injuries, and combat-relevant fields from the database record.
- **Implementation:** `buildHumanEntityFromRecord()` maps all 32 fields of the `HumanCharacter` interface. Cross-referenced field-by-field against `types/character.ts:149-200`.
- **Status:** CORRECT
- **Notes:** `stats.hp` correctly maps to `record.hp` (the trainer's HP stat, not current HP). `maxHp` correctly maps to `record.maxHp` (the calculated maximum). `pokemonIds` hardcoded to `[]` because the builder doesn't load relations — this matches the old inline behavior and is acceptable since the combat system doesn't need the team roster on the entity.

## Pre-Existing Observation (Not Introduced by This Refactoring)

### Evasion Cap at +6 Missing

- **Rule:** PTU p.310-314: "You may never have more than +6 in a [given evasion]." and "up to a maximum of +6 at 30 Defense."
- **Implementation:** `Math.floor(stat / 5)` with no `Math.min(..., 6)` cap. A Pokemon with 35+ Defense would get Physical Evasion 7+.
- **Impact:** MEDIUM — affects Pokemon/trainers with any defensive stat above 30 (common at higher levels).
- **Old code:** Same behavior — `Math.floor((stats.defense || 0) / 5)` with no cap in both `combatants.post.ts` and `from-scene.post.ts`.
- **Other locations:** Also missing in `pokemon-generator.service.ts:301` and `encounter-templates/[id]/load.post.ts:116`.
- **Recommendation:** Track separately. Not a regression from this refactoring — the old inline code also lacked the cap.

## Lesson Check

Reviewed `game-logic-reviewer.lessons.md` Lesson 1 (audit condition taxonomies against enumerated lists). This refactoring does not modify status condition classification — no taxonomy changes, no condition arrays touched. Lesson not directly applicable but confirmed checked.

## Summary

- Mechanics checked: 7
- Correct: 7
- Incorrect: 0
- Needs review: 0
- Pre-existing observations: 1 (evasion cap — not introduced by these commits)

## Verdict: APPROVED

All PTU game logic in the refactored code is correct. The evasion formula, stat sources, initiative calculation, turn state defaults, and entity field mappings all match PTU 1.05 rules. The HumanCharacter `maxHp` bug fix is a legitimate CRITICAL correction that aligns the code with the Trainer HP formula. No PTU regressions introduced.
