---
review_id: rules-review-110
ticket_id: ptu-rule-045
design_spec: designs/design-equipment-001.md
tier: P1
domain: combat
reviewer: game-logic-reviewer
status: PASS_WITH_NOTES
date: 2026-02-20
commits_reviewed:
  - 61203a8
  - 978f529
  - 6027e57
  - 8f79acb
---

# Rules Review 110: Equipment Combat Integration (P1)

## Scope

P1 combat integration of equipment bonuses: DR from armor, evasion from shields, Focus stat bonuses, Heavy Armor speed penalty, and Take a Breather stage reset behavior.

## PTU Rules Cross-Reference

All page references are to PTU 1.05 `09-gear-and-items.md` unless otherwise noted.

---

## 1. DR from Armor (Feature E)

### PTU Rule (p.293)

- **Light Armor:** "Grants 5 Damage Reduction" — body slot, $8000
- **Heavy Armor:** "Heavy Armor grants +10 Damage Reduction" — body slot, $12000

### Implementation

**Server (`calculate-damage.post.ts`):** When the target is a human combatant, `computeEquipmentBonuses()` is called on their equipment. The resulting `damageReduction` is used as the default DR for the damage formula. Caller-provided `body.damageReduction` overrides equipment DR (for manual GM adjustments).

**Client (`useMoveCalculation.ts`):** `targetDamageCalcs` computes `equipmentDR` from the target's equipment bonuses and subtracts it in the damage formula.

**Pure function (`damageCalculation.ts`):** Unchanged. `damageReduction` is already a supported input parameter that is subtracted in Step 7.

### Verdict: CORRECT

- DR values (5 for Light, 10 for Heavy) match PTU p.293.
- DR is subtracted in Step 7 of the damage formula (after attack stat, alongside defense stat), consistent with the PTU damage formula.
- Caller override preserved for manual GM adjustments.
- Server and client implementations are symmetrical.

---

## 2. Helmet Conditional DR (Feature E)

### PTU Rule (p.293)

- **Helmet:** "The user gains 15 Damage Reduction against Critical Hits." — head slot, $2250

### Implementation

**Server:** After computing base equipment DR, if `body.isCritical` is true, iterates through `conditionalDR` entries and adds any with condition `'Critical Hits only'`. The string matching is exact against the catalog constant.

**Client:** Same pattern — checks `isCriticalHit.value` and iterates through `conditionalDR`.

### Verdict: CORRECT

- 15 DR against critical hits matches PTU p.293.
- Conditional DR stacks on top of armor DR (e.g., Heavy Armor + Helmet = 10 + 15 = 25 DR on a crit).
- The implementation correctly adds conditional DR only when `isCritical` is true.

### Note (Informational)

The client-side `isCriticalHit` computed property only checks `isNat20`. PTU allows extended critical hit ranges from moves, abilities, and items (PTU p.800: "Some Moves or effects may cause increased critical ranges"). If a move has a crit range of 18+, and a roll of 18 lands, the client would not trigger Helmet DR. However, this is a pre-existing limitation of the client-side crit detection system, not introduced by this P1 implementation. The server endpoint accepts `isCritical` as a body parameter, which is correctly flexible.

---

## 3. Shield Evasion Bonus (Feature F)

### PTU Rule (p.294)

- **Light Shield:** "+2 Evasion" (passive), readied: "+4 Evasion and 10 Damage Reduction...but also cause you to become Slowed" — off-hand slot, $3000
- **Heavy Shield:** "+2 Evasion" (passive), readied: "+6 Evasion and 15 Damage Reduction...but also cause you to become Slowed" — off-hand slot, $4500

### Implementation

**Server (`calculate-damage.post.ts`):** Equipment evasion bonus is added to the `evasionBonus` value (which already includes `stageModifiers.evasion` from moves/effects). This total is passed to `calculateEvasion()` for all three evasion types (physical, special, speed). This matches the PTU rule that shield evasion applies to all evasion types ("These extra Changes in Evasion apply to all types of Evasion" — 07-combat.md p.648-653).

**Client (`useMoveCalculation.ts`):** Same pattern in `getTargetEvasion()` and `getTargetEvasionLabel()` — equipment evasion bonus is added to `evasionBonus` before computing evasion values.

**Combatant builder (`combatant.service.ts`):** Equipment evasion bonus added to all three initial evasion values (`physicalEvasion`, `specialEvasion`, `speedEvasion`).

### Verdict: CORRECT

- +2 Evasion for both Light and Heavy Shield matches PTU p.294.
- Evasion bonus correctly applies to all three evasion types per PTU p.648-653.
- Evasion stacks additively with move/effect evasion bonus (correct per PTU: "stack on top").
- The `calculateEvasion()` function already clamps total evasion to min 0 and `calculateAccuracyThreshold()` caps effective evasion at +9.

### Note (Informational — Deferred by Design)

Readied shield state (enhanced bonuses + Slowed) is deferred to a later tier. The design spec explicitly states: "P0/P1 only handle passive (non-readied) shield bonuses." This is acceptable.

---

## 4. Focus Stat Bonuses (Feature G)

### PTU Rule (p.295)

- **Focus:** "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages."

### Implementation

**Pure function (`damageCalculation.ts`):** New `applyStageModifierWithBonus()` helper computes `applyStageModifier(baseStat, stage) + postStageBonus`. New `attackBonus`/`defenseBonus` fields on `DamageCalcInput`.

**Server (`calculate-damage.post.ts`):** For human attackers, looks up the Focus stat bonus for the relevant attack stat (`attack` for Physical, `specialAttack` for Special). For human targets, looks up the defense stat bonus (`defense` for Physical, `specialDefense` for Special). Both are passed as `attackBonus`/`defenseBonus` to the damage formula.

**Client (`useMoveCalculation.ts`):** `attackStatValue` adds Focus bonus after `applyStageModifier()`. `targetDamageCalcs` adds Focus defense bonus after `applyStageModifier()`.

### Verdict: CORRECT

- +5 bonus matches PTU p.295.
- Applied AFTER combat stages, as required by PTU rules.
- The pure function `applyStageModifierWithBonus()` correctly applies `floor(baseStat * stageMultiplier) + postStageBonus`.
- Server and client implementations are symmetrical.

### Note (MEDIUM — Pre-existing, flagged in prior reviews)

PTU p.295 says: "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." The system does not enforce this at the bonus computation level. Since all Focus items are in the accessory slot (one slot = one item), this is naturally enforced for standard catalog items. However, if a GM creates custom Focus items in different slots, bonuses would stack. This was already flagged in code-review-115 and rules-review-105. Not a P1 regression.

### Note (MEDIUM — Focus Speed not applied to initiative or speed evasion)

PTU says Focus grants "+5 Bonus to a Stat." The Focus (Speed) item adds `statBonus: { stat: 'speed', value: 5 }`. However, the P1 implementation only applies Focus stat bonuses in the damage calculation context (attack/defense stats). It does NOT apply Focus (Speed) to:

1. **Initiative** in `buildCombatantFromEntity()`: Initiative uses `stats.speed` (with Heavy Armor CS applied), but does not add Focus Speed bonus.
2. **Speed evasion** in `calculateEvasion()` calls: Speed evasion is computed from the raw speed stat with stage modifier, but does not include Focus Speed.

This is a legitimate gap, but its practical impact is small (most combatants don't equip Focus Speed, and when they do, +5 to speed typically only shifts evasion by +1 at most). The PTU rules do not explicitly address whether Focus affects initiative or evasion calculations, but since they say it applies to "a Stat" and initiative = Speed Stat, a strict reading suggests it should apply.

**Recommendation:** Track as a separate ticket for follow-up. Not a P1 blocker since Focus Attack/Defense/SpAtk/SpDef are the far more common choices.

---

## 5. Heavy Armor Speed Penalty (Feature H)

### PTU Rule (p.293)

- **Heavy Armor:** "Heavy Armor causes the wearer's Speed's Default Combat Stage to be -1."

### Implementation

**Combatant builder (`combatant.service.ts`):**
1. Computes `equipmentSpeedDefaultCS` via `computeEquipmentBonuses()`.
2. If non-zero, applies `applyStageModifier(stats.speed, equipmentSpeedDefaultCS)` to get effective speed for initiative.
3. Sets `entity.stageModifiers.speed = equipmentSpeedDefaultCS` so the combatant enters combat with speed CS at -1.

### Verdict: CORRECT

- Speed default CS of -1 matches PTU p.293.
- Initiative correctly uses the stage-modified speed (CS -1 = 0.9x multiplier).
- The entity's `stageModifiers.speed` is set to -1 at combat start, reflecting the equipment default.

### Structural Note (LOW)

Line 589 mutates `entity.stageModifiers` directly: `entity.stageModifiers = { ...currentStages, speed: equipmentSpeedDefaultCS }`. While the spread operator creates a new object for `stageModifiers`, the `entity` object itself is mutated in-place. This is a pattern the codebase uses in several places for entity updates before persisting to DB, so it's consistent, but it's worth noting per the project's immutability guidelines.

---

## 6. Take a Breather Stage Reset (Feature H)

### PTU Rule (07-combat.md p.245)

- "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their **default level**"

### Implementation

**`breather.post.ts`:**
1. Creates fresh default stages via `createDefaultStageModifiers()` (all zeros).
2. For human combatants, computes equipment bonuses and overrides `defaultStages.speed` with `equipBonuses.speedDefaultCS` if non-zero.
3. Compares current stages against these defaults to determine if a reset occurred.
4. Sets `entity.stageModifiers = defaultStages` for the reset.

### Verdict: CORRECT

- The phrase "default level" in PTU rules means the equipment-modified defaults, not always zero.
- Heavy Armor wearers correctly reset speed CS to -1 instead of 0.
- The `hadStages` detection correctly compares against the equipment-adjusted defaults (using `Object.entries` comparison against `defaultStages`), so a Heavy Armor wearer already at speed CS -1 with all other stages at 0 won't falsely report "stages reset."

### Structural Note (LOW)

Line 64 mutates `defaultStages` directly (`defaultStages.speed = equipBonuses.speedDefaultCS`). Since `defaultStages` is a freshly created local object, this is safe. However, the project coding guidelines prefer immutable patterns. A spread-based approach would be:
```typescript
const defaultStages = equipBonuses.speedDefaultCS !== 0
  ? { ...createDefaultStageModifiers(), speed: equipBonuses.speedDefaultCS }
  : createDefaultStageModifiers()
```

---

## 7. Server-Client Symmetry

Both the server endpoint (`calculate-damage.post.ts`) and client composable (`useMoveCalculation.ts`) implement identical equipment bonus logic:

| Bonus | Server | Client | Match? |
|-------|--------|--------|--------|
| Armor DR | `computeEquipmentBonuses().damageReduction` | Same | YES |
| Helmet crit DR | `conditionalDR` loop on `isCritical` | Same loop on `isCriticalHit` | YES |
| Shield evasion | Added to `evasionBonus` | Added to `evasionBonus` | YES |
| Focus attack | `statBonuses[attack/specialAttack]` | Same | YES |
| Focus defense | `statBonuses[defense/specialDefense]` | Same | YES |

Symmetry is maintained. The server is the authority; the client provides preview calculations.

---

## 8. Pokemon Exclusion

All equipment bonus code is gated behind `type === 'human'` checks:

- Server: `if (target.type === 'human')`, `if (attacker.type === 'human')`
- Client: `if (target.type === 'human')`, `if (actor.value.type === 'human')`
- Builder: `if (entityType === 'human')`
- Breather: `if (combatant.type === 'human')`

Pokemon combatants are correctly unaffected. Equipment is a trainer-only system per PTU rules.

### Verdict: CORRECT

---

## Summary

| Feature | PTU Rule | Implementation | Verdict |
|---------|----------|---------------|---------|
| E: Light Armor DR | 5 DR (p.293) | Correct | PASS |
| E: Heavy Armor DR | 10 DR (p.293) | Correct | PASS |
| E: Helmet conditional DR | 15 DR vs crits (p.293) | Correct | PASS |
| F: Light Shield evasion | +2 Evasion (p.294) | Correct | PASS |
| F: Heavy Shield evasion | +2 Evasion (p.294) | Correct | PASS |
| G: Focus stat bonus | +5 after CS (p.295) | Correct for atk/def | PASS with note |
| H: Heavy Armor speed CS | Default CS -1 (p.293) | Correct | PASS |
| H: Breather reset | Reset to default (p.245) | Correct | PASS |

## Issues Summary

| ID | Severity | Description | Action |
|----|----------|-------------|--------|
| R110-1 | MEDIUM | Focus (Speed) +5 not applied to initiative or speed evasion — PTU says "+5 to a Stat" and initiative = Speed Stat | Track as follow-up ticket |
| R110-2 | LOW | Client `isCriticalHit` only checks nat20, missing extended crit ranges for Helmet DR trigger — pre-existing limitation, not introduced by this P1 | Informational |
| R110-3 | LOW | `breather.post.ts` L64 and `combatant.service.ts` L589 use local mutation patterns | Informational |
| R110-4 | INFORMATIONAL | Focus one-at-a-time rule not enforced at computation level (pre-existing, flagged in code-review-115, rules-review-105) | No action |
| R110-5 | INFORMATIONAL | Shield readied state deferred by design | No action |

## Final Verdict: PASS WITH NOTES

All P1 equipment combat integration features correctly implement PTU 1.05 rules. The DR, evasion, Focus stat bonus, Heavy Armor speed penalty, and Take a Breather reset behaviors all match their PTU rule sources. The one substantive gap (R110-1: Focus Speed not applied to initiative/evasion) should be tracked as a follow-up ticket but does not block the P1 implementation.
