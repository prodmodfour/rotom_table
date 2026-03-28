# 2026-03-28 — Context Gather: R1.1 Damage Pipeline + R1.2 Energy System

## R1.1 — Damage Pipeline: What Exists

### dealDamage (`utilities/damage.ts`)

Implements the 9-step formula per `damage-formula-step-order.md`:

| Step | Description | Implementation Status |
|------|-------------|----------------------|
| 1 | Initial DB from move | Done — `params.db` |
| 2 | Five/Double-Strike | Skipped — handler loops externally (correct) |
| 3 | DB modifiers + STAB | Done — `dbModifiers[]` + auto-STAB from `ctx.user.types` |
| 4 | Crit doubles dice | Done — nat 20 = crit, doubles `diceTotal` only |
| 5 | Roll damage | Done — pre-rolled via `resolution.damageRolls`, set damage fallback |
| 6 | Add attacker's stat | Done — `effectiveStat(ctx.user, 'atk'/'spatk')` with stage multipliers |
| 7 | Subtract defender's stat | Done — `effectiveStat(targetLens, 'def'/'spdef')`, floor 1 |
| 8 | Type effectiveness | Done — multiplier from chart, floor 1 for non-immune, 0 for immune |
| 9 | Apply to HP | Done — negative `hpDelta` + `damage-dealt` event |

Also: `defenderStat` override (Psyshock), `bonusDamage` (Gyro Ball), `target` override. 11 tests.

### dealTickDamage

Separate pathway for flat HP-fraction damage. No attack stat, no DB, no crit. Optionally typed for effectiveness. 5 tests.

### rollAccuracy (`utilities/combat.ts`)

Nat 1 always misses, nat 20 always hits. Computes three evasion types, picks highest, compares against `ac + evasion - accuracyCS`.

### Gaps Found

**1. Evasion uses raw stats, not effective stats**

Current: `Math.floor(ctx.target.stats.def / 5)` — uses base stat.

Per `evasion-and-accuracy-system.md`: `floor((stageModified(stat) + statBonus) / 5)`. Evasion should be derived from the stage-modified stat. A target with +6 Def CS should have higher Physical Evasion.

**2. rollAccuracy has no damage class parameter**

Per `one-evasion-per-accuracy-check.md`: Physical Evasion applies only to attacks targeting Defense. Special Evasion applies only to attacks targeting Sp.Defense. Speed Evasion applies to any attack. The current code always picks the highest of all three — it can't enforce the class constraint because it doesn't know the move's damage class.

**3. Evasion cap is 6, should be 9 for threshold**

Per `evasion-and-accuracy-system.md` and `flanking-penalty-post-cap.md`: stat-based evasion caps at 6, but effect-based bonuses can stack above. The threshold formula caps total evasion at 9: `threshold = moveAC + min(9, totalEvasion) - accuracyCS`. The effect-based bonuses are Ring 2+ content, but the cap should be 9 in the formula now.

**4. Fatigue penalty not applied to accuracy or evasion**

Per `fatigue-levels.md`: each fatigue level causes −2 to attack rolls and −2 to Evasions. The current `rollAccuracy` doesn't account for fatigue at all. Since fatigue is part of R1.2 (energy depletion), this is a cross-dependency.

**5. `resistanceModifier` documented but not implemented**

The `effect-utility-catalog.md` documents a `resistanceModifier` param on `dealDamage` for Light Screen (-1 step). No `damage-resistance-tiers.md` vault note exists. This is R2 content (Light Screen / screen effects) — not needed for R1.

## R1.2 — Energy System: What Exists

### Implemented

| Component | Location | Status |
|-----------|----------|--------|
| Energy formula | `constants.ts:computeEnergy` | Done — `max(3, floor(2 * sqrt(Stamina)))` |
| Max energy derivation | `stat.ts:maxEnergy` | Done — 3 tests |
| `HasEnergy` sub-interface | `types/lens.ts` | Done — `energyCurrent: number` |
| `energyCurrent` in StateDelta | `types/delta.ts` | Done — additive field |
| `manageResource` utility | `combat.ts` | Done — can modify energy, fatigue, mettle, tempHp |
| `MoveDefinition.energyCost` | `types/effect-contract.ts` | Done — every move carries cost |
| `fatigueLevel` in lens + delta | `lens.ts`, `delta.ts` | Done — exists in both |

### Not Yet Implemented

| Feature | PTR Source | Description |
|---------|-----------|-------------|
| Energy validation | `move-energy-system.md` | Check if combatant has enough energy before move use |
| Energy deduction | `move-energy-system.md` | Deduct cost after successful execution |
| Zero-energy fatigue | `zero-energy-causes-fatigue.md` | Reaching 0 energy → +1 fatigue |
| Overdraft | `energy-overdraft.md` | Spending more than available → +3 fatigue, energy floors at 0 |
| Energy regeneration | `energy-regain-rate.md` | +1 energy at turn start (base rate, trait-modifiable) |
| Fatigue penalties | `fatigue-levels.md` | −2 atk rolls, −2 evasion, −2 movement per level |
| Fatigue cap | `fatigue-causes-unconsciousness.md` | 5 levels = unconscious |
| Energy for extra movement | `energy-for-extra-movement.md` | 5 energy for additional movement (deferred to R1.3+) |

## Cross-Dependencies Between R1.1 and R1.2

1. **Fatigue → accuracy**: Fatigue penalties modify attack rolls (R1.2 fatigue feeds into R1.1 accuracy).
2. **Fatigue → evasion**: Fatigue penalties modify evasion values (R1.2 fatigue feeds into R1.1 defense).
3. **Energy validation → move resolution**: Energy check happens before the move handler runs (R1.2 gates R1.4 move resolution).
4. **Energy deduction → damage pipeline**: Energy is deducted after successful move execution, not inside `dealDamage` (correct separation — the execution layer deducts, the handler deals damage).

## What Applies from SE Vault

The damage pipeline follows [[chain-of-responsibility-pattern]] — each step processes and passes forward. Energy validation/deduction should follow [[single-responsibility-principle]] — separate functions for validation vs. deduction vs. fatigue triggers. The `manageResource` utility already exists as the [[strategy-pattern]] for resource changes; energy-specific operations should compose on top of it rather than bypass it.

## Deferred to Later Rings

- `resistanceModifier` / damage resistance tiers — R2 (Light Screen, screen effects)
- Equipment stat bonuses on evasion — R2 (equipment system)
- Flanking penalties on evasion — R3B (spatial system)
- Trait-modified energy regeneration rate — R3A (full trait system)
- Energy for extra movement — R1.3 (turn management + movement)
