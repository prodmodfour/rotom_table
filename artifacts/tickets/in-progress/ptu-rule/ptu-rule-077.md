---
ticket_id: ptu-rule-077
priority: P3
status: in-progress
domain: combat
source: rules-review-110 (R110-1)
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Focus (Speed) equipment bonus is not applied to initiative or speed evasion. PTU p.295 says Focus grants "+5 Bonus to a Stat." The current implementation only applies Focus bonuses in the damage calculation context (attack/defense stats). A Focus (Speed) would not add +5 to initiative or speed evasion.

## Expected Behavior (PTU Rules)

Per PTU p.295, Focus grants +5 to a chosen stat. Per PTU p.227, initiative = Speed Stat. A Focus (Speed) should add +5 to initiative calculations and speed evasion, not just damage-context speed references.

## Actual Behavior

`computeEquipmentBonuses()` returns stat bonuses including speed, but `buildCombatantFromEntity()` only applies the speed default CS from Heavy Armor — it does not add Focus (Speed) bonus to initiative or speed evasion.

## Affected Files

- `app/server/services/combatant.service.ts` — `buildCombatantFromEntity()` initiative calculation
- `app/utils/equipmentBonuses.ts` — already returns speed bonus correctly
- `app/composables/useMoveCalculation.ts` — speed evasion calculation

## Impact

Low — Focus (Speed) is a rare equipment choice. The bonus is correctly applied in damage calculations but missing from initiative and evasion contexts.

## Fix Log

### d037f72 — `app/utils/damageCalculation.ts`
Added `statBonus` parameter to `calculateEvasion()`. Focus grants +5 to a stat applied after combat stages but before the /5 evasion derivation. The parameter defaults to 0 for backward compatibility.

### 6154240 — `app/server/services/combatant.service.ts`
Applied Focus stat bonuses to initiative and initial evasion calculations in `buildCombatantFromEntity()`. Focus (Speed) +5 now added to effective speed for initiative. Focus (Defense), Focus (Special Defense), and Focus (Speed) bonuses included in initial evasion values.

### 53e63e1 — `app/composables/useCombat.ts`
Forwarded the new `statBonus` parameter through `calculatePhysicalEvasion`, `calculateSpecialEvasion`, and `calculateSpeedEvasion` wrapper functions.

### 66be646 — `app/composables/useMoveCalculation.ts`
Applied Focus stat bonuses to evasion calculations in `getTargetEvasion()` and `getTargetEvasionLabel()` for human targets during accuracy checks.

### 8495ee8 — `app/server/api/encounters/[id]/calculate-damage.post.ts`
Applied Focus stat bonuses to evasion calculations in the server-side damage calculation endpoint, consistent with client-side fix.

### e55318d — `app/tests/unit/composables/useCombat.test.ts`
Added unit tests verifying statBonus is applied after combat stages but before /5 division, and that all evasion aliases pass statBonus through.
