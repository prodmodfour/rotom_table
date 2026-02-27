## Tier 6: Partial Items

### R003 — Size Category Footprints

- **Rule:** "Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4."
- **Expected behavior:** Multi-tile token rendering for large combatants.
- **Actual behavior:** `VTTToken.vue` (C049) renders all tokens as 1x1 regardless of size. `useGridMovement.ts:196-211` — `getBlockedCells` does iterate over `token.size` for multi-cell occupation, suggesting the data model supports multi-tile tokens. `useRangeParser.ts:163-171` — `getOccupiedCells` correctly iterates over token footprint. `chebyshevDistanceTokens` (lines 181-194) correctly handles multi-cell distance. The backend logic supports multi-tile tokens, but the visual rendering is 1x1 only.
- **Classification:** Correct (for present portion) — The measurement and pathfinding logic correctly handles multi-tile tokens. Only the visual rendering is 1x1.

### R015 — Rough Terrain

- **Rule:** "When targeting through Rough Terrain, -2 Accuracy. Spaces occupied by enemies are Rough Terrain."
- **Expected behavior:** Rough terrain type with accuracy penalty.
- **Actual behavior:** `terrain.ts:23` — `rough: 1` (normal movement cost). Rough terrain type exists and can be painted. However: (1) No -2 accuracy penalty when targeting through rough terrain — accuracy modifications are not implemented. (2) Occupied enemy squares are not auto-marked as rough terrain.
- **Classification:** Approximation
- **Severity:** MEDIUM — Movement cost is correct (rough can be non-slow). Accuracy penalty is the primary purpose of rough terrain and is missing.

### R022 — Stuck Condition (No Movement)

- **Rule:** "Stuck means you cannot Shift at all."
- **Expected behavior:** Stuck status prevents all movement on the grid.
- **Actual behavior:** `useGridMovement.ts:94-98` — `applyMovementModifiers` checks `conditions.includes('Stuck')` and returns 0 (zero speed). This is called by `getSpeed` (line 187) which feeds into `isValidMove` (line 310). A combatant with Stuck status will have speed 0, and `isValidMove` will return `valid: false` since `distance > 0 && distance <= 0` is always false. The movement range visualization (`getMovementRangeCells`) will show no reachable cells since speed=0.
- **Classification:** Correct — Stuck condition IS mechanically enforced. The matrix classification of "Partial" appears outdated. `applyMovementModifiers` was added/updated after the last coverage analysis.

### R024 — Slowed Condition (Half Movement)

- **Rule:** "Slowed: Movement halved (minimum 1)."
- **Expected behavior:** Slowed halves movement range on grid.
- **Actual behavior:** `useGridMovement.ts:100-103` — `applyMovementModifiers` checks `conditions.includes('Slowed')` and applies `Math.floor(modifiedSpeed / 2)`. This is correct. The Slowed condition IS mechanically enforced via `applyMovementModifiers`. Speed is halved and the minimum 1 is enforced by the final line `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` (line 127).
- **Classification:** Correct — Same as R022, the implementation was added/updated after the last coverage analysis. Slowed IS enforced.

### R025 — Tripped Condition (Stand Up Cost)

- **Rule:** "Tripped: Must spend a Shift Action getting up before further actions."
- **Expected behavior:** Tripped consumes shift action to stand.
- **Actual behavior:** Status conditions are tracked on the combatant model. However, Tripped does NOT consume a shift action in the grid system. There is no "stand up" mechanic in grid interaction — the combatant can move normally despite being Tripped. The `applyMovementModifiers` function does not check for Tripped status.
- **Classification:** Approximation
- **Severity:** LOW — Tripped is a status tracked in combat but not enforced as a movement cost. GM must manually enforce.

### R026 — Speed CS Affect Movement

- **Rule:** "Bonus or penalty to all Movement Speeds equal to half your Speed Combat Stage value rounded down. Minimum 2."
- **Expected behavior:** Speed CS modifies movement range; negative CS floor at 2.
- **Actual behavior:** `useGridMovement.ts:105-119` — `applyMovementModifiers`:
  ```
  const speedStage = combatant.entity.stageModifiers?.speed ?? 0
  const clamped = Math.max(-6, Math.min(6, speedStage))
  const stageBonus = Math.trunc(clamped / 2)
  modifiedSpeed = modifiedSpeed + stageBonus
  if (stageBonus < 0) {
    modifiedSpeed = Math.max(modifiedSpeed, 2)
  }
  ```
  Verification: Speed CS +6 → bonus +3. Speed CS -5 → `Math.trunc(-5/2)` = -2. Speed CS +5 → +2. Negative CS has floor of 2. Uses `Math.trunc` for symmetric rounding toward zero, which is correct per PTU (positive rounds down, negative rounds toward zero).

  **This IS implemented.** The matrix classification of "Partial" appears outdated. Speed CS movement modifier IS applied via `applyMovementModifiers`.
- **Classification:** Correct — Speed CS IS applied to movement. The implementation matches PTU exactly.

### R038 — Levitate Maximum Height

- **Rule:** "Maximum height off the ground equals half of Levitate Capability."
- **Expected behavior:** Elevation capped at half Levitate speed.
- **Actual behavior:** `useElevation.ts` (C026) manages per-token elevation with raise/lower helpers. Elevation is freely adjustable without checking Levitate capability limits. No max height enforcement based on Levitate speed.
- **Classification:** Approximation
- **Severity:** LOW — Elevation system exists but doesn't enforce Levitate height caps. GM can manually enforce.

---
