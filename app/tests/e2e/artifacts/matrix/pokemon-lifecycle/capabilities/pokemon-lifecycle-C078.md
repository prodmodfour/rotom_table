---
cap_id: pokemon-lifecycle-C078
name: XpDistributionModal
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C078: XpDistributionModal
- **cap_id**: pokemon-lifecycle-C078
- **name**: Post-Combat XP Distribution Modal
- **type**: component
- **location**: `app/components/encounter/XpDistributionModal.vue`
- **game_concept**: Post-combat XP calculation and per-Pokemon distribution (Core p.460)
- **description**: Two-phase modal (configure -> results). Configure phase: shows defeated enemies with type tags, significance preset selector (or custom), player count (auto-detected from encounter), boss toggle, XP calculation summary. Groups player-side Pokemon by owner. Per-Pokemon XP input with level-up preview. Split Evenly button per player. Over-allocation validation. Apply sends to encounter.distributeXp(). Results phase shows XpDistributionResults + LevelUpNotification. Skip option available.
- **inputs**: encounter prop
- **outputs**: Emits skip, complete, close
- **accessible_from**: gm

---

## WebSocket Events
