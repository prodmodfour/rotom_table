---
type: test-integrity-audit
scope: combat, capture
spec_files_reviewed: 30
genuine_assertions: 356
tautological_assertions: 84
structural_assertions: 116
---

# Test Integrity Audit — Combat & Capture E2E Scenarios

## Executive Summary

Of ~556 assertions across 30 spec files, **84 (15%) are tautological** — they pre-compute damage client-side and pass the result to the server, then assert the server echoed it back or did trivial subtraction. The server's `POST /api/encounters/:id/damage` endpoint receives a final damage number and applies it to HP; it does NOT compute damage from game rules (STAB, type effectiveness, combat stages, DB-to-set-damage conversion, etc.).

The tautological assertions are concentrated in **damage application tests**. They CLAIM to verify PTU damage formulas but ACTUALLY verify HP tracking and state persistence. The tests are not wrong — they just test less than their comments and scenario docs suggest.

**The capture rate tests are exemplary.** All 7 capture files send parameters to the server and assert server-computed capture rates. The `/api/capture/rate` endpoint does genuine computation (level modifier, HP tier, evolution stage, status conditions, injury/shiny modifiers). These are the gold standard for how the damage tests should work.

---

## The Core Pattern

### How damage flows in these tests

```
Test code (client-side):
  1. Comments document PTU formula: "Tackle: SetDmg(13) + ATK(5) - DEF(4) = 14"
  2. Hardcodes: const calculatedDamage = 14
  3. Calls: applyDamage(request, encounterId, combatantId, 14)

Server (what actually runs):
  4. Receives: { combatantId, damage: 14 }
  5. Computes: newHp = max(0, currentHp - 14)
  6. Computes: fainted = newHp <= 0
  7. Computes: injuryGained = damage >= maxHp / 2
  8. Returns: { finalDamage: 14, hpDamage: 14, newHp: 18, fainted: false, ... }

Test asserts:
  9. finalDamage === 14      ← TAUTOLOGICAL (echo of input)
  10. hpDamage === 14         ← TAUTOLOGICAL (echo, no temp HP)
  11. newHp === 18            ← TAUTOLOGICAL (32 - 14, test pre-knew both values)
  12. fainted === false       ← GENUINE (server logic)
  13. injuryGained === false  ← GENUINE (server logic: 14 < 32/2)
```

The PTU damage formula (step 1) is never executed by any code. It exists only in test comments. If the formula comment said "= 99" and the test passed 99 to `applyDamage`, the test would still pass — the server doesn't validate that 99 is the correct Tackle damage.

### What the server DOES compute (genuine)

- **HP formula**: `level + (baseHp * 3) + 10` — tested whenever maxHp is asserted
- **Faint detection**: HP <= 0 triggers Fainted status
- **Injury detection**: damage >= maxHp / 2 triggers massive damage injury
- **HP floor**: HP cannot go below 0
- **Temp HP absorption**: damage splits between temp HP and real HP
- **Combat stages**: clamping at [-6, +6], additive stacking
- **Status conditions**: add/remove/dedup, volatile vs persistent
- **Take a Breather**: stage reset, volatile cure, Tripped+Vulnerable
- **Initiative/turns**: speed-based ordering, round progression
- **Healing**: cap at maxHp, faint removal, injury healing
- **Capture rate**: full PTU formula with all modifiers
- **Encounter lifecycle**: create/start/serve/end/unserve state machine

---

## Per-File Classification

### Combat Files (23 files)

| File | G | T | S | Primary tautological pattern |
|------|---|---|---|------------------------------|
| combat-basic-physical-001 | 5 | 4 | 4 | Damage echo + HP subtraction |
| combat-basic-special-001 | 6 | 6 | 4 | Damage echo + client-side evasion math |
| combat-combat-stages-001 | 20 | 3 | 12 | Stage change echo (non-clamped) |
| combat-critical-hit-001 | 7 | 8 | 3 | Damage echo (both normal and crit) |
| combat-damage-and-faint-001 | 15 | 5 | 4 | Damage echo |
| combat-encounter-lifecycle-001 | 10 | 0 | 3 | (none) |
| combat-healing-001 | 18 | 3 | 4 | Damage echo before healing |
| combat-initiative-order-001 | 8 | 0 | 6 | (none) |
| combat-injury-massive-damage-001 | 6 | 4 | 2 | Damage echo + client threshold math |
| combat-minimum-damage-001 | 6 | 3 | 1 | Damage echo (1 dmg passed in) |
| combat-multi-target-001 | 6 | 6 | 3 | Damage echo x2 targets |
| combat-stab-001 | 5 | 7 | 3 | Damage echo (STAB and non-STAB) |
| combat-status-conditions-001 | 25 | 0 | 8 | (none) |
| combat-struggle-attack-001 | 4 | 5 | 1 | Damage echo + client const comparison |
| combat-take-a-breather-001 | 35 | 0 | 8 | (none) |
| combat-temporary-hp-001 | 10 | 3 | 4 | Damage echo (2nd hit, no temp HP) |
| combat-turn-progression-001 | 12 | 0 | 3 | (none) |
| combat-type-effectiveness-001 | 9 | 6 | 2 | Damage echo (SE and neutral) |
| combat-type-immunity-001 | 8 | 7 | 3 | Damage echo (0 and 20 passed in) |
| combat-workflow-capture-variant-001 | 9 | 2 | 3 | Damage echo in combat phases |
| combat-workflow-faint-replacement-001 | 15 | 3 | 5 | Damage echo in attack phases |
| combat-workflow-healing-recovery-001 | 16 | 2 | 9 | Damage echo before healing |
| combat-workflow-stage-buffs-001 | 14 | 1 | 2 | Damage echo in phase 4 |
| combat-workflow-status-chain-001 | 18 | 0 | 5 | (none) |
| combat-workflow-template-setup-001 | 12 | 0 | 5 | (none) |
| combat-workflow-wild-encounter-001 | 12 | 3 | 3 | Damage echo (dynamic but still pre-computed) |
| **Combat subtotal** | **281** | **81** | **100** | |

### Capture Files (7 files)

| File | G | T | S | Primary tautological pattern |
|------|---|---|---|------------------------------|
| capture-mechanic-attempt-roll-001 | 15 | 0 | 8 | (none) |
| capture-mechanic-cannot-capture-fainted-001 | 5 | 0 | 2 | (none) |
| capture-mechanic-hp-modifier-001 | 12 | 0 | 0 | (none) |
| capture-mechanic-status-modifiers-001 | 12 | 0 | 0 | (none) |
| capture-mechanic-worked-examples-001 | 9 | 0 | 0 | (none) |
| capture-workflow-multi-attempt-001 | 12 | 2 | 3 | Damage echo (weakening phase) |
| capture-workflow-standard-capture-001 | 10 | 1 | 3 | Damage echo (weakening phase) |
| **Capture subtotal** | **75** | **3** | **16** | |

### Totals

| Category | Count | Percentage |
|----------|-------|------------|
| GENUINE | 356 | 64% |
| TAUTOLOGICAL | 84 | 15% |
| STRUCTURAL | 116 | 21% |
| **Total** | **556** | **100%** |

---

## Detailed Tautological Findings

### Pattern 1: Damage echo — `finalDamage === input` (all damage files)

**What tests CLAIM to verify:** PTU damage formulas (set damage from DB, ATK/SpATK vs DEF/SpDEF, STAB, type effectiveness, combat stage multipliers, critical hit doubling, minimum damage rule)

**What tests ACTUALLY verify:** The server correctly echoes the damage value it received and subtracts it from current HP.

**What server endpoint WOULD need to return for a genuine test:** A `POST /api/encounters/:id/calculate-damage` endpoint that accepts:
```json
{
  "attackerId": "...",
  "targetId": "...",
  "moveId": "Tackle",
  "isCritical": false
}
```
And returns the computed damage value, which the test would then assert.

**Affected files (17 of 30):**
- combat-basic-physical-001 (line 92-98: `applyDamage(..., 14)` then asserts `finalDamage === 14`)
- combat-basic-special-001 (line 102-110: `applyDamage(..., 15)` then asserts `finalDamage === 15`)
- combat-critical-hit-001 (lines 85, 118: hardcoded 14 and 27)
- combat-damage-and-faint-001 (lines 90, 103: hardcoded 20 twice)
- combat-injury-massive-damage-001 (line 89: `KARATE_CHOP_DAMAGE = 17` hardcoded)
- combat-minimum-damage-001 (line 107: `EXPECTED_FINAL_DAMAGE = 1` hardcoded)
- combat-multi-target-001 (lines 121, 130: `CHARMANDER_DAMAGE = 51`, `MACHOP_DAMAGE = 33`)
- combat-stab-001 (lines 87, 120, 146-150: 17, 12, 12+5)
- combat-struggle-attack-001 (line 103: `STRUGGLE_DAMAGE = 12` hardcoded)
- combat-temporary-hp-001 (lines 94, 115: 15 and 8)
- combat-type-effectiveness-001 (lines 85, 119, 145: 22, 15, 22)
- combat-type-immunity-001 (lines 86, 173: 0 and 20)
- combat-workflow-capture-variant-001 (lines 84, 94: 16, 20)
- combat-workflow-faint-replacement-001 (lines 112, 123, 144, 175: 18, 12, 18, 17)
- combat-workflow-healing-recovery-001 (lines 117, 123, 171: 25, 50, 20)
- combat-workflow-stage-buffs-001 (line 128: 24)
- combat-workflow-wild-encounter-001 (lines 128, 145, 158: dynamic but pre-computed client-side)

### Pattern 2: Client-side PTU math assertions (3 files)

**What tests CLAIM to verify:** Server-computed evasion, accuracy thresholds, or damage formula relationships

**What tests ACTUALLY verify:** Client-side arithmetic on values fetched from the server. The server returns raw stats; the test does the formula math and asserts its own computation.

**Examples:**

`combat-basic-physical-001.spec.ts:85-86`:
```typescript
const expectedPhysicalEvasion = Math.floor(currentDefense / 5)
expect(expectedPhysicalEvasion).toBe(0)
```
The server returned `currentDefense = 4` (genuine). The test then computes `floor(4/5) = 0` and asserts its own math. No server evasion endpoint exists.

`combat-basic-special-001.spec.ts:85-96`:
```typescript
const specialEvasion = Math.floor(spDef / 5)
expect(specialEvasion).toBe(1)
const accuracyThreshold = 2 + specialEvasion
expect(accuracyThreshold).toBe(3)
```
Same pattern: fetch stat from server, compute locally, assert local computation.

`combat-struggle-attack-001.spec.ts:99-100`:
```typescript
expect(STRUGGLE_DAMAGE).toBe(12)
expect(STRUGGLE_DAMAGE).not.toBe(DAMAGE_IF_STAB_WERE_APPLIED)
```
Asserts hardcoded constants against each other. No server involvement at all.

`combat-injury-massive-damage-001.spec.ts:86`:
```typescript
expect(KARATE_CHOP_DAMAGE).toBeGreaterThanOrEqual(MASSIVE_DAMAGE_THRESHOLD)
```
Compares two test-defined constants. Pure client-side math.

### Pattern 3: Wild encounter dynamic pre-computation (1 file)

`combat-workflow-wild-encounter-001.spec.ts:85-87`:
```typescript
emberDamage = Math.floor(Math.max(1, 15 + 7 - oddishSpDef) * 1.5)
acidDamage = Math.max(1, 15 + oddishSpAtk - 5)
```
This file reads Oddish stats from the server (genuine), then pre-computes damage client-side using the PTU formula, and passes the result to `applyDamage()`. It's the most sophisticated variant of the tautological pattern — the stats are dynamic, but the damage computation is still client-side.

---

## Files With Zero Tautological Assertions (Model Tests)

These 8 files are 100% genuine + structural and represent the testing gold standard:

1. **combat-encounter-lifecycle-001** — tests the encounter state machine
2. **combat-initiative-order-001** — tests speed-based turn ordering
3. **combat-status-conditions-001** — tests status add/remove/dedup
4. **combat-take-a-breather-001** — tests breather mechanics end-to-end
5. **combat-turn-progression-001** — tests turn cycling and round increment
6. **combat-workflow-status-chain-001** — tests volatile vs persistent status
7. **combat-workflow-template-setup-001** — tests template save/load lifecycle
8. **capture-mechanic-hp-modifier-001** — tests capture rate HP tiers
9. **capture-mechanic-status-modifiers-001** — tests capture rate status modifiers
10. **capture-mechanic-worked-examples-001** — tests PTU book examples
11. **capture-mechanic-attempt-roll-001** — tests capture roll mechanics
12. **capture-mechanic-cannot-capture-fainted-001** — tests fainted rejection

The capture rate tests in particular are exemplary: they send input parameters and assert the server's computed output. This is exactly the pattern the damage tests should follow.

---

## Structural Note: The `applyDamage` Helper

Both `combat-helpers.ts:87-99` and `capture-helpers.ts:111-123` define `applyDamage()` identically — it sends a `{ combatantId, damage }` payload. The `damage` parameter is always a test-hardcoded number, never a server-returned calculation.

The `executeMove` helper (`combat-helpers.ts:143-159`) is similar: it accepts an optional `damage` parameter that the test pre-computes, and a `targetDamages` map for multi-target moves.

Neither helper asks the server to compute damage from move data.

---

## Recommendations

### 1. Server-side damage calculation endpoint (HIGH value)

Create `POST /api/encounters/:id/calculate-damage`:
```json
// Request
{
  "attackerId": "combatant-uuid",
  "targetId": "combatant-uuid",
  "moveId": "Tackle",           // or move DB entry ID
  "isCritical": false,
  "isSTAB": true                // or auto-detect from types
}

// Response
{
  "baseDamage": 13,             // set damage from DB lookup
  "attackStat": 5,              // modified by combat stages
  "defenseStat": 4,             // modified by combat stages
  "rawDamage": 14,              // baseDamage + atk - def (min 1)
  "typeEffectiveness": 1.0,     // multiplier
  "critMultiplier": 1,          // 1 or 2
  "finalDamage": 14,            // after all multipliers, floored
  "breakdown": { ... }
}
```

Then tests could:
```typescript
const calc = await calculateDamage(request, encounterId, {
  attackerId: bulbasaurCombatantId,
  targetId: charmanderCombatantId,
  moveId: 'Tackle',
  isCritical: false
})
expect(calc.finalDamage).toBe(14)  // NOW this is GENUINE
expect(calc.typeEffectiveness).toBe(1.0)
expect(calc.attackStat).toBe(5)

// Then apply the server-computed damage
await applyDamage(request, encounterId, charmanderCombatantId, calc.finalDamage)
```

### 2. Immediate low-cost improvement

Even without a new endpoint, the existing tests could be improved by removing the damage formula claims from test names/comments. If the test passes `applyDamage(..., 14)`, the test name should be "apply 14 damage reduces HP correctly" not "Tackle: SetDmg 13 + ATK 5 - DEF 4 = 14". The formula comment is documentation, not a tested assertion.

### 3. Priority ranking

The tautological assertions are not _wrong_ — they test real server behavior (HP tracking, state persistence). The issue is that they test _less than claimed_. Fixing this is a quality improvement, not a bug fix. Priority:

- **P1**: Build the `calculate-damage` endpoint. This unlocks genuine formula testing.
- **P2**: Convert the 17 affected spec files to use calculate-then-apply pattern.
- **P3**: Rename test titles to accurately reflect what's being tested.
