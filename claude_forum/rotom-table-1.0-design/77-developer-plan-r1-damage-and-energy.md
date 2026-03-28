# 2026-03-28 — Plan: R1.1 Damage Pipeline + R1.2 Energy System

## Scope

Fix the damage pipeline gaps found in context gather, then build the energy/fatigue system that gates move legality. All work is in `@rotom/engine` — no UI, no server.

---

## Part 1: R1.1 — Damage Pipeline Fixes

### 1A. Fix `rollAccuracy` — damage class awareness + stage-modified evasion

**Current:** `rollAccuracy(ctx, { ac })` — picks highest of three raw-stat-derived evasions, no class constraint.

**Change:** Add `damageClass` param. Constrain which evasions apply per `one-evasion-per-accuracy-check.md`:
- Physical → Physical Evasion (Def) or Speed Evasion (Spd)
- Special → Special Evasion (SpDef) or Speed Evasion (Spd)
- Status → Speed Evasion only (status moves don't target a defense stat)

Derive evasion from `effectiveStat` (stage-modified) per `evasion-and-accuracy-system.md`: `floor(effectiveStat(lens, stat) / 5)`, capped at 6 per stat, then take the best applicable one. Cap total evasion at 9 in the threshold formula.

**Signature change:**
```typescript
export interface RollAccuracyParams {
  ac: number
  damageClass: DamageClass  // NEW — determines which evasions apply
}
```

**Formula:** `hit = roll + accuracyCS - fatiguePenalty >= ac + min(9, bestApplicableEvasion - fatiguePenalty)`

Wait — fatigue applies to both sides. Per `fatigue-levels.md`: −2 per level to attack rolls AND −2 per level to evasions. So:
- Attacker: `roll + accuracyCS - (attackerFatigue * 2)`
- Defender: `evasion - (defenderFatigue * 2)` (floor 0)

**SE principle:** [[single-responsibility-principle]] — `rollAccuracy` is the single place that resolves accuracy. Adding class awareness here rather than in every handler prevents [[shotgun-surgery-smell]].

**Affected callers:** All 30 move handlers that call `rollAccuracy`. Each already knows its damage class (it's in the `MoveDefinition`). The handler can pass it through. Since the handler already has `dealDamage` with `class: 'physical'/'special'`, the value is available.

### 1B. Update all move handler `rollAccuracy` calls

Every handler that calls `rollAccuracy` must now pass `damageClass`. This is mechanical — the class is already known in each handler's `dealDamage` call. For status moves with AC checks (Will-O-Wisp AC 5, Toxic AC 4, Quash AC 2, etc.), pass `'status'`.

### 1C. Tests for accuracy fixes

- Stage-modified evasion: target with +2 Def CS should have higher Physical Evasion
- Class constraint: physical move should not benefit from high SpDef evasion
- Speed evasion universality: speed evasion applies to any class
- Evasion cap at 9 (once effect bonuses exist, but structure the formula now)
- Fatigue penalty on attacker accuracy
- Fatigue penalty on defender evasion

---

## Part 2: R1.2 — Energy System

### 2A. `validateEnergyCost` — move legality check

A pure function that checks whether a move can be used given current energy.

```typescript
export interface EnergyCostValidation {
  canUse: boolean
  requiresOverdraft: boolean
  energyCost: number
  currentEnergy: number
}

export function validateEnergyCost(
  lens: HasEnergy,
  energyCost: number,
): EnergyCostValidation
```

Returns `canUse: true` always (per `energy-overdraft.md`, you can always spend more than you have — it just costs fatigue). `requiresOverdraft: true` when `currentEnergy < energyCost`.

**SE principle:** [[single-responsibility-principle]] — validation is separate from deduction. The caller (move execution layer, R1.4) decides whether to show an overdraft warning.

### 2B. `deductEnergy` — energy cost deduction with fatigue triggers

```typescript
export interface DeductEnergyResult {
  energyDelta: number       // negative
  fatigueDelta: number      // 0, 1, or 3
  newEnergy: number         // floor 0
  events: CombatEvent[]
}

export function deductEnergy(
  lens: HasEnergy & HasIdentity,
  energyCost: number,
  maxEnergy: number,
): DeductEnergyResult
```

Logic per PTR rules:
1. If `energyCurrent - energyCost < 0` and `energyCurrent > 0`: overdraft. Energy → 0. Fatigue +3.
2. If `energyCurrent - energyCost === 0`: reached zero. Energy → 0. Fatigue +1.
3. If `energyCurrent - energyCost > 0`: normal deduction. No fatigue.
4. If `energyCurrent === 0` already (second overdraft in a row): Energy stays 0. Fatigue +3.

Wait, re-reading the rules:
- `zero-energy-causes-fatigue.md`: "Whenever a character's Energy drops **to** 0, they gain 1 level of Fatigue."
- `energy-overdraft.md`: "A character can spend more Energy than they currently have. Doing so causes 3 levels of Fatigue. Energy cannot go below 0."

So the triggers are:
- **Overdraft** (spending more than you have): +3 fatigue, energy → 0
- **Reaching zero** (spending exactly to 0, no overdraft): +1 fatigue, energy → 0
- If already at 0 and use another move: that's an overdraft → +3 fatigue

These are mutually exclusive per use:
- `cost > current` → overdraft → +3 fatigue
- `cost === current` → reach zero → +1 fatigue
- `cost < current` → normal → 0 fatigue

Actually, wait. If cost > current, the energy drops TO 0 (since floor is 0). Does the "drops to 0" trigger stack with the overdraft trigger? Let me re-read. The overdraft note says overdrafting "causes 3 levels of Fatigue" — it doesn't say "in addition to the drop-to-zero fatigue." The zero-energy note says "whenever Energy drops to 0" — the overdraft also drops energy to 0. But applying both would be 4 fatigue, which seems punishing.

I think the intent is: overdraft replaces the zero-energy trigger. Overdraft is the worse penalty (3 vs 1) because you're going beyond your limits. But this is ambiguous — I'll note it and default to **overdraft is 3, not 3+1**.

**SE principle:** This is a pure function (no context dependency) — easy to unit test with specific scenarios.

### 2C. `regenerateEnergy` — turn-start energy recovery

```typescript
export function regenerateEnergy(
  lens: HasEnergy & HasIdentity,
  maxEnergy: number,
  bonusRegen?: number,  // from traits, default 0
): { energyDelta: number; events: CombatEvent[] }
```

Per `energy-regain-rate.md`: base rate +1 per turn. Capped at `maxEnergy`. The `bonusRegen` param enables trait-modified regen without hardcoding traits.

### 2D. Fatigue penalties

Fatigue applies three penalties per `fatigue-levels.md`:
- −2 attack rolls per level (integrated into `rollAccuracy` in 1A)
- −2 evasion per level (integrated into `rollAccuracy` in 1A)
- −2 movement per level (deferred to R1.3 — movement system)

Unconsciousness at 5 levels: a check function.

```typescript
export function isUnconscious(lens: HasStatus): boolean {
  return lens.fatigueLevel >= 5
}
```

### 2E. Tests for energy system

- `validateEnergyCost`: normal use, exactly-zero, overdraft
- `deductEnergy`: normal deduction (no fatigue), reach-zero (+1), overdraft (+3), already-at-zero overdraft (+3), energy floors at 0
- `regenerateEnergy`: base +1, capped at max, with bonus regen
- `isUnconscious`: below 5, at 5, above 5
- Integration: fatigue from energy depletion feeds into accuracy penalties (covered in 1C)

---

## File Changes

| File | Change |
|------|--------|
| `utilities/combat.ts` | Fix `rollAccuracy` — add `damageClass`, use `effectiveStat` for evasion, add fatigue penalties |
| `handlers/moves.ts` | Update all `rollAccuracy` calls to pass `damageClass` |
| `utilities/energy.ts` | **NEW** — `validateEnergyCost`, `deductEnergy`, `regenerateEnergy`, `isUnconscious` |
| `utilities/index.ts` | Export new energy utilities |
| `tests/combat.test.ts` | New accuracy tests (stage evasion, class constraint, fatigue) |
| `tests/energy.test.ts` | **NEW** — energy validation, deduction, regeneration, fatigue tests |
| `tests/handlers.test.ts` | Update handler tests for new `damageClass` param |

---

## Open Question

**Overdraft + zero-energy fatigue stacking:** When overdrafting, is it 3 fatigue (overdraft replaces zero trigger) or 4 fatigue (overdraft + zero-trigger stack)? I'm defaulting to 3 (overdraft subsumes zero-trigger) because:
1. The zero-energy note says "drops to 0" — overdraft also drops to 0, but the overdraft note specifically defines its own penalty
2. 4 fatigue from a single move use seems excessively punishing
3. The notes are written as separate rules describing separate situations, not stacking conditions

This needs Ashraf's confirmation.
