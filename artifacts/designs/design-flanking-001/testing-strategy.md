# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/utils/flankingGeometry.test.ts`

**getOccupiedCells:**
- Returns single cell for 1x1 token
- Returns 4 cells for 2x2 token at correct positions
- Returns 9 cells for 3x3 token
- Returns 16 cells for 4x4 token

**getAdjacentCells:**
- Returns 8 cells for a 1x1 token in open space
- Returns 12 cells for a 2x2 token in open space
- Does not include occupied cells in result
- Returns fewer cells when token is at grid edge (not validated here -- consumer handles bounds)

**areAdjacent (1x1 tokens):**
- Two tokens 1 cell apart cardinally are adjacent
- Two tokens 1 cell apart diagonally are adjacent
- Two tokens 2+ cells apart are NOT adjacent
- Two tokens on the same cell are NOT adjacent (overlap, not adjacency)
- Token at (0,0) and (1,1) are adjacent (diagonal)
- Token at (0,0) and (2,0) are NOT adjacent

**areAdjacent (multi-tile tokens):**
- 2x2 token at (0,0) is adjacent to 1x1 token at (2,0) (cell (1,0) neighbors (2,0))
- 2x2 token at (0,0) is NOT adjacent to 1x1 token at (3,0)
- Two 2x2 tokens at (0,0) and (3,0) are NOT adjacent (gap of 1 column)
- Two 2x2 tokens at (0,0) and (2,0) ARE adjacent (cell (1,0) neighbors (2,0))

**checkFlanking (1x1 targets):**
- No foes adjacent -> not flanked
- One foe adjacent -> not flanked (need 2)
- Two foes adjacent but also adjacent to each other -> NOT flanked
  - Example: target at (2,2), foe A at (1,2), foe B at (1,3) -- A and B are adjacent
- Two foes adjacent to target but NOT adjacent to each other -> FLANKED
  - Example: target at (2,2), foe A at (1,2), foe B at (3,2) -- opposite sides
  - Example: target at (2,2), foe A at (1,1), foe B at (3,3) -- opposite diagonals
- Three foes, all adjacent to each other (cluster) -> NOT flanked
  - Example: target at (2,2), foes at (1,1), (1,2), (2,1) -- all mutually adjacent
- Three foes, two adjacent to each other but one isolated -> FLANKED
  - Example: target at (2,2), foes at (1,2), (1,3), (3,2) -- (3,2) not adjacent to (1,2) or (1,3)
- Foe on same side as target (not enemy) -> excluded from flanking
- Fainted foe (HP <= 0) -> excluded from flanking (filtered before geometry)

**FLANKING_FOES_REQUIRED:**
- Size 1 requires 2 foes
- Size 2 requires 3 foes
- Size 3 requires 4 foes
- Size 4 requires 5 foes

### `app/tests/unit/composables/useFlankingDetection.test.ts`

**flankingMap computation:**
- Empty encounter -> empty flanking map
- Single combatant -> not flanked (no foes)
- Two combatants on same side -> neither flanked (allies don't flank)
- Two enemies adjacent to a player, enemies not adjacent to each other -> player FLANKED
- Two enemies adjacent to a player, enemies adjacent to each other -> player NOT FLANKED
- Flanked combatant has correct flankerIds
- Dead combatant is excluded from flanking map
- Fainted combatant (HP=0) is excluded from flanking map
- Combatant without position is excluded from flanking map

**isTargetFlanked:**
- Returns true for flanked combatant ID
- Returns false for non-flanked combatant ID
- Returns false for non-existent combatant ID

**getFlankingPenalty:**
- Returns 2 for flanked combatant
- Returns 0 for non-flanked combatant

**Side hostility:**
- Players can be flanked by enemies
- Allies can be flanked by enemies
- Enemies can be flanked by players
- Enemies can be flanked by allies
- Players cannot be flanked by allies (same team)
- Enemies cannot be flanked by enemies (same side)

### `app/tests/unit/composables/useMoveCalculation-flanking.test.ts`

**Accuracy threshold with flanking:**
- Flanked target: threshold reduced by 2 compared to unflanked
- Unflanked target: threshold unchanged
- Flanking + rough terrain: both penalties applied (flanking -2 evasion, rough +2 threshold)
- Flanking with getFlankingPenalty not provided: threshold unchanged (backward compat)
- Flanking does not affect status moves (no accuracy check)
- Flanking penalty is capped at 0 (evasion cannot go below 0)

## Unit Tests (P1)

### `app/tests/unit/utils/flankingGeometry-multiTile.test.ts`

**checkFlankingMultiTile:**
- 2x2 target with 2 foes -> NOT flanked (needs 3)
- 2x2 target with 3 non-adjacent foes -> FLANKED
- 2x2 target with 3 foes, all mutually adjacent -> NOT flanked
- 3x3 target with 3 foes -> NOT flanked (needs 4)
- 3x3 target with 4 non-adjacent foes -> FLANKED
- 4x4 target with 5 non-adjacent foes -> FLANKED

**countAdjacentAttackerCells:**
- 1x1 attacker adjacent to 1x1 target: returns 1
- 2x2 attacker with 1 cell adjacent to 1x1 target: returns 1
- 2x2 attacker with 2 cells adjacent to 1x1 target: returns 2
- 2x2 attacker with all 4 cells adjacent to 2x2 target: returns 4
- 2x2 attacker not adjacent to target: returns 0

**Multi-tile attacker counting in flanking:**
- 2x2 attacker (3 cells adjacent) + 1x1 attacker (1 cell adjacent) around 2x2 target
  - Effective foe count: 4 (3+1), required: 3 -> enough foes
  - But must still pass non-adjacency check between the two attackers
- Single 2x2 attacker with 4 adjacent cells around 1x1 target
  - Effective foe count: 4, but only 1 combatant -> NOT flanked (self-flank prevention)

**findIndependentSet:**
- Empty graph: returns empty set
- Two disconnected vertices: returns both
- Two connected vertices: returns one
- Triangle (all connected): returns one
- 4 vertices in a path (A-B-C-D): returns {A, C} or {B, D} (size 2)
- 4 vertices, 2 pairs connected: returns 2 (one from each pair)
- Target size achievable: stops early when target reached

## Unit Tests (P2)

### `app/tests/unit/composables/useFlankingDetection-auto.test.ts`

**Flanking change detection:**
- Watcher fires `onFlankingChanged` with (id, true) when combatant becomes flanked
- Watcher fires `onFlankingChanged` with (id, false) when flanking ends
- Moving a flanker away triggers unflanking event
- Moving a flanker into position triggers flanking event
- Adding a new enemy combatant triggers recalculation
- Removing a combatant triggers recalculation

### `app/tests/unit/server/calculate-damage-flanking.test.ts`

**Server-side flanking detection:**
- Flanked target gets -2 evasion penalty in accuracy calculation
- Non-flanked target has normal evasion
- Target without position (no VTT grid) has no flanking penalty
- Dead foes do not contribute to flanking on server side

### Component Tests (P2)

**CombatantCard flanking badge:**
- Displays "Flanked" badge when `isFlanked` prop is true
- Does not display badge when `isFlanked` prop is false or undefined
- Badge has correct CSS class `flanking-badge`
- Badge is positioned in the status area

## Integration Tests

### Full Flanking Detection Flow (P0)

1. Create encounter with 3 combatants on VTT grid:
   - Player at (5, 5) -- 1x1
   - Enemy A at (4, 5) -- 1x1 (adjacent to player, left side)
   - Enemy B at (6, 5) -- 1x1 (adjacent to player, right side)
2. Enemy A and Enemy B are NOT adjacent to each other (distance 2)
3. Verify Player is Flanked (flanking map shows isFlanked: true)
4. Verify accuracy threshold against Player is reduced by 2
5. Move Enemy B to (4, 4) -- now adjacent to both Player AND Enemy A
6. Verify Player is NOT Flanked (Enemy A and B are adjacent to each other)

### Diagonal Flanking (P0)

1. Player at (5, 5)
2. Enemy A at (4, 4) (diagonal NW)
3. Enemy B at (6, 6) (diagonal SE)
4. A and B: |dx|=2, |dy|=2 -> NOT adjacent
5. Verify Player is Flanked
6. Move Enemy B to (5, 4) (N of player)
7. A at (4,4), B at (5,4): |dx|=1, |dy|=0 -> adjacent
8. Verify Player is NOT Flanked

### Multi-Tile Target (P1)

1. Large Pokemon (2x2) at (5, 5) on enemies side
2. Player A at (4, 4) (adjacent to NW corner)
3. Player B at (7, 7) (adjacent to SE corner)
4. Player C at (4, 7) (adjacent to SW corner)
5. A-B: |dx|=3, |dy|=3 -> NOT adjacent
6. A-C: |dx|=0, |dy|=3 -> NOT adjacent
7. B-C: |dx|=3, |dy|=0 -> NOT adjacent
8. Independent set {A, B, C} has size 3 >= required 3 -> FLANKED

### Side Hostility (P0)

1. Player at (5, 5)
2. Ally at (4, 5) -- same team, does not flank
3. Enemy at (6, 5) -- opposite team
4. Verify Player is NOT Flanked (only 1 enemy adjacent, need 2)
5. Add Enemy B at (4, 5) -- wait, Ally occupies that. Use (5, 4)
6. Enemy at (6, 5), Enemy B at (5, 4): check non-adjacency
7. (6,5) and (5,4): |dx|=1, |dy|=1 -> adjacent -> NOT flanked
8. Move Enemy B to (5, 6): (6,5) and (5,6): |dx|=1, |dy|=1 -> adjacent -> NOT flanked
9. Move Enemy B to (4, 5): (6,5) and (4,5): |dx|=2, |dy|=0 -> NOT adjacent -> FLANKED

### WebSocket Sync (P2)

1. GM client detects flanking change
2. `flanking_update` event broadcast via WebSocket
3. Group View receives event and updates grid with flanking indicator
4. Moving token on GM view triggers new `flanking_update` broadcast

## Manual Testing Checklist

### P0 Happy Path
- [ ] Place two enemies on opposite sides of a player token (cardinal)
- [ ] Verify dashed orange border appears on the player token
- [ ] Verify accuracy threshold in MoveTargetModal is reduced by 2
- [ ] Move one enemy next to the other enemy
- [ ] Verify flanking indicator disappears
- [ ] Verify accuracy threshold returns to normal

### P0 Edge Cases
- [ ] Fainted enemy does not contribute to flanking
- [ ] Enemy on same diagonal corners flanks the target
- [ ] Two enemies adjacent to each other (side by side) do NOT flank
- [ ] Three enemies surrounding target, but all adjacent to each other -> no flanking
- [ ] Removing a flanking enemy removes the flanking indicator

### P1 Multi-Tile
- [ ] 2x2 target requires 3 non-adjacent foes to be flanked
- [ ] 2x2 attacker with multiple adjacent cells counts correctly
- [ ] Single large attacker cannot self-flank

### P2 Automation
- [ ] "Flanked" badge appears on CombatantCard
- [ ] Group View shows flanking indicator via WebSocket
- [ ] Moving a token auto-updates flanking state without page refresh
- [ ] Server-side accuracy calculation includes flanking penalty

---
