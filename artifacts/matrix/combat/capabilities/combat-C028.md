---
cap_id: combat-C028
name: Calculate Damage (Read-Only)
type: api-endpoint
domain: combat
---

### combat-C028: Calculate Damage (Read-Only)
- **cap_id**: combat-C028
- **name**: Calculate Damage Preview
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/calculate-damage.post.ts`
- **game_concept**: PTU 9-step damage formula preview
- **description**: Full PTU damage calculation: STAB, type effectiveness, combat stages, critical hits, equipment DR (auto-computes for humans including Helmet conditional DR on crits), Focus stat bonuses. Also computes dynamic evasion and accuracy threshold. Read-only.
- **inputs**: `{ attackerId, targetId, moveName, isCritical?, damageReduction? }`
- **outputs**: DamageCalcResult + AccuracyCalcResult
- **accessible_from**: gm
