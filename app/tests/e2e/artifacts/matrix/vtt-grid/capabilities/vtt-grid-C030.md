---
cap_id: vtt-grid-C030
name: vtt-grid-C030
type: —
domain: vtt-grid
---

### vtt-grid-C030
- **name:** usePathfinding composable (NEW)
- **type:** composable-function
- **location:** `app/composables/usePathfinding.ts`
- **game_concept:** A* pathfinding with elevation support
- **description:** Provides A* pathfinding with terrain costs, elevation costs, and PTU diagonal movement rules. getMovementRangeCells: flood-fill algorithm finds all reachable cells within speed budget, accounting for terrain costs (6 types), elevation change costs (1 MP per level), and alternating diagonal costs (1m/2m). Flying Pokemon ignore elevation costs within Sky speed.
- **inputs:** Origin, speed, blocked cells, terrain cost getter, elevation cost getter, terrain elevation getter
- **outputs:** Reachable cell positions, path to target
- **accessible_from:** gm
