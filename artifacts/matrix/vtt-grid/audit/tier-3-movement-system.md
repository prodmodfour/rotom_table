## Tier 3: Movement System

### R004 — Movement Via Shift Actions

- **Rule:** "Move a number of squares equal to your Movement Capability."
- **Expected behavior:** Movement validated against speed budget with terrain costs.
- **Actual behavior:** `useGridMovement.ts:303-361` — `isValidMove` checks:
  1. Speed via `getSpeed` (with terrain-awareness and condition modifiers)
  2. Blocked cells (occupied by other tokens)
  3. Bounds checking
  4. Terrain-aware A* pathfinding when terrain exists
  5. Geometric distance when no terrain

  Movement range visualization via `usePathfinding.ts:31-145` — flood-fill finds all reachable cells within speed budget, accounting for terrain costs, elevation costs, and PTU diagonal rules.
- **Classification:** Correct

### R028 — Sprint Maneuver

- **Rule:** "Increase Movement Speeds by 50% for the rest of your turn."
- **Expected behavior:** +50% movement speed applied as a maneuver effect.
- **Actual behavior:** `app/constants/combatManeuvers.ts:29-37` — Sprint defined as Standard action with shortDesc "+50% Movement Speed this turn". `useGridMovement.ts:121-124` — `applyMovementModifiers` checks `tempConditions.includes('Sprint')` and applies `Math.floor(modifiedSpeed * 1.5)`. Correctly applies floor rounding per PTU rounding rule (R021).
- **Classification:** Correct

### R029 — Push Maneuver

- **Rule:** "Opposed Combat/Athletics check. Push target 1m away. AC 4."
- **Expected behavior:** Push maneuver defined with AC 4, melee range, opposed check.
- **Actual behavior:** `combatManeuvers.ts:18-27` — Push: `actionType: 'standard'`, `ac: 4`, `requiresTarget: true`, `shortDesc: 'Push target 1m away (opposed Combat/Athletics)'`. Matches PTU specification.
- **Classification:** Correct

### R030 — Disengage Maneuver

- **Rule:** "Shift 1 Meter. Does not provoke Attack of Opportunity."
- **Expected behavior:** 1m safe shift defined as a maneuver.
- **Actual behavior:** No explicit "Disengage" entry in `combatManeuvers.ts`. However, the AoO system itself is not implemented (R031 is Missing in the matrix), so all movement is effectively disengage-safe. The maneuver concept is implicit in the current system since there's no AoO to avoid.
- **Note:** The matrix says "Disengage maneuver exists in combat maneuvers system" but the constant file does not have a `disengage` entry. The maneuvers list has: push, sprint, trip, grapple, disarm, dirty-trick, intercept-melee, intercept-ranged, take-a-breather. No disengage.
- **Classification:** Incorrect
- **Severity:** LOW — Since AoO is not implemented (R031 is Missing), the absence of Disengage has no practical impact. The maneuver definition is missing but its primary purpose (avoiding AoO) is moot.

---
