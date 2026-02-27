---
cap_id: combat-C091
name: useMoveCalculation
type: composable-function
domain: combat
---

### combat-C091: useMoveCalculation
- **cap_id**: combat-C091
- **name**: Move Calculation Composable
- **type**: composable-function
- **location**: `app/composables/useMoveCalculation.ts`
- **game_concept**: Full move UI logic
- **description**: STAB, accuracy with dynamic evasion (auto-selects best), d20 roll with nat 1/20, damage with DB chart, per-target damage with equipment DR (including Helmet crit DR) and Focus bonuses, type effectiveness, range/LoS filtering, target selection.
- **inputs**: Reactive refs (move, actor, targets)
- **outputs**: Full combat state + actions
- **accessible_from**: gm
