---
review_id: rules-review-014
target: refactoring-011
type: refactoring
trigger: developer-fix-review
reviewer: game-logic-reviewer
date: 2026-02-17
verdict: APPROVED
commits_reviewed:
  - 116b63e
files_reviewed:
  - app/server/services/pokemon-generator.service.ts (changed)
  - app/server/services/combatant.service.ts (canonical builder, read-only reference)
ptu_references:
  - "07-combat.md p.227: Initiative is simply their Speed Stat"
  - "07-combat.md p.232: for every 5 points in Defense, +1 Physical Evasion, up to +6 at 30"
  - "07-combat.md p.232: for every 5 points in Special Defense, +1 Special Evasion, up to +6 at 30"
  - "07-combat.md p.232: for every 5 points in Speed, +1 Speed Evasion, up to +6 at 30"
---

## Summary

Rules review of refactoring-011 (combatant builder deduplication). The developer replaced `buildPokemonCombatant()`'s inline combatant construction with a delegation to `buildCombatantFromEntity()` via a new `createdPokemonToEntity()` mapping function. This review verifies that the delegation preserves PTU-correct values for all combat-relevant fields.

## Mechanics Verified

### 1. Initiative

- **Rule:** "a Pokemon or Trainer's Initiative is simply their Speed Stat, though Items, Features, Moves, and other effects may modify this." (07-combat.md p.227)
- **Old code:** `initiative: data.calculatedStats.speed`, `initiativeBonus: 0`
- **New code path:** `entity.currentStats.speed = data.calculatedStats.speed` -> `buildCombatantFromEntity()` reads `stats.speed + initiativeBonus` where `initiativeBonus = options.initiativeBonus ?? 0`
- **Result:** Same value: `data.calculatedStats.speed + 0`
- **Status:** CORRECT

### 2. Physical Evasion

- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." (07-combat.md p.232)
- **Old code:** `Math.floor(data.calculatedStats.defense / 5)`
- **New code path:** `entity.currentStats.defense = data.calculatedStats.defense` -> `Math.floor((stats.defense || 0) / 5)`
- **Result:** Same value. The `|| 0` guard is null safety for the general case; doesn't change value when stat is present.
- **Status:** CORRECT — pre-existing missing +6 cap tracked in refactoring-012

### 3. Special Evasion

- **Rule:** "for every 5 points... in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense." (07-combat.md p.232)
- **Old code:** `Math.floor(data.calculatedStats.specialDefense / 5)`
- **New code path:** `entity.currentStats.specialDefense = data.calculatedStats.specialDefense` -> `Math.floor((stats.specialDefense || 0) / 5)`
- **Result:** Same value.
- **Status:** CORRECT — same pre-existing cap issue (refactoring-012)

### 4. Speed Evasion

- **Rule:** "for every 5 points... in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed." (07-combat.md p.232)
- **Old code:** `Math.floor(data.calculatedStats.speed / 5)`
- **New code path:** `entity.currentStats.speed = data.calculatedStats.speed` -> `Math.floor((stats.speed || 0) / 5)`
- **Result:** Same value.
- **Status:** CORRECT — same pre-existing cap issue (refactoring-012)

### 5. Stat Source for Evasion (Critical Check)

- **Rule:** PTU evasions derive from calculated stats (base + level-up + nature), not base stats.
- **Old code:** Read from `data.calculatedStats` (correct source)
- **New code path:** `createdPokemonToEntity()` maps `entity.currentStats.X = data.calculatedStats.X` -> canonical builder reads `(entity as Pokemon).currentStats.X`
- **Status:** CORRECT — calculated stats preserved through the delegation chain

### 6. HP (Fresh Pokemon)

- **Formula:** `level + (calculatedHP * 3) + 10` (verified in `generatePokemonData()` line 121)
- **Entity mapping:** `currentHp = data.maxHp`, `maxHp = data.maxHp` — fresh Pokemon at full HP
- **Status:** CORRECT

### 7. Combat Stage Initialization

- **All 7 stages** (attack, defense, specialAttack, specialDefense, speed, accuracy, evasion) initialized to 0
- **Status:** CORRECT — fresh combatant has no stage modifications

### 8. Status Conditions / Injuries

- `statusConditions: []`, `injuries: 0` (entity), `injuries: { count: 0, sources: [] }` (combatant, from canonical builder)
- **Status:** CORRECT — fresh combatant

## Pre-Existing Issues

| Issue | Status | Ticket |
|-------|--------|--------|
| Evasion +6 cap missing in `buildCombatantFromEntity()` | Already tracked | refactoring-012 |

No new pre-existing issues discovered. The `currentStats.hp` field maps to `data.maxHp` (hit points) rather than the calculated HP stat — this is consistent with the DB-loaded entity path (`combatant.service.ts:430` maps `currentStats.hp = record.currentHp`) and has no functional impact since no combat calculation reads `currentStats.hp`.

## Issues

None.

## Verdict

**APPROVED** — All 8 mechanics verified. The delegation from `buildPokemonCombatant()` to `buildCombatantFromEntity()` preserves identical PTU values for initiative, all three evasions, HP, stage modifiers, status conditions, and injuries. The stat source chain (`data.calculatedStats` -> `entity.currentStats` -> `stats` in canonical builder) correctly uses calculated stats throughout. No PTU regressions introduced.
