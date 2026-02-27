## Tier 2: Terrain and Movement (VTT Integration)

### R017 — Slow Terrain

- **Rule:** "When Shifting through Slow Terrain, treat every square meter as two square meters instead."
- **Expected behavior:** 2x movement cost for slow terrain.
- **Actual behavior:** `app/stores/terrain.ts:20` — `difficult: 2` (2x movement cost). `useGridMovement.ts` and `usePathfinding.ts` multiply base step cost by terrain cost (`baseCost * terrainMultiplier`, pathfinding.ts:104). Water terrain also has cost 2 (`water: 2`). Ice terrain is handled via the `difficult` type in the VTT terrain painter (the UI maps "ice" to the `difficult` terrain type with 2x cost).
- **Classification:** Correct

### R018 — Rough Terrain

- **Rule:** "Most Rough Terrain is also Slow Terrain. When targeting through Rough Terrain, -2 Accuracy. Spaces occupied by other Trainers or Pokemon are Rough Terrain."
- **Expected behavior:** Rough terrain type with movement cost + accuracy penalty.
- **Actual behavior:** `terrain.ts:23` — `rough: 1` (normal movement cost). The rough terrain type exists and can be painted. However, the -2 accuracy penalty when targeting through rough terrain is NOT implemented — accuracy modifications are a combat-domain concern not handled by the grid. Also, occupied enemy squares are not auto-marked as rough terrain.
- **Note:** The PTU rule says "Most Rough Terrain is also Slow Terrain, but not always." The code sets rough terrain movement cost to 1 (normal), which matches the "not always" case. If a GM wants rough terrain that is ALSO slow, they would need to paint it as `difficult` type instead, losing the rough classification.
- **Classification:** Approximation
- **Severity:** MEDIUM — Rough terrain's movement cost of 1 is valid for some cases but doesn't cover the "most rough is also slow" scenario. No accuracy penalty. No auto-rough for occupied squares.

### R019 — Blocking Terrain

- **Rule:** "Terrain that cannot be Shifted or Targeted through."
- **Expected behavior:** Blocking terrain prevents movement and targeting.
- **Actual behavior:** `terrain.ts:19` — `blocking: Infinity` (impassable). `usePathfinding.ts:88-90` — skips cells where `!isFinite(terrainMultiplier)`. `terrain.ts:87-88` — `isPassable` returns false for `blocking`. Blocking terrain is correctly treated as impassable in both pathfinding and movement validation.
- **Classification:** Correct

---
