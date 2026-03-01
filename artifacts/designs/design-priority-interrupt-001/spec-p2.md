# P2 Spec: Intercept Melee/Ranged, Disengage Maneuver, Rule Integration

## Scope

P2 implements the concrete Interrupt-based maneuvers (Intercept Melee, Intercept Ranged) and the Disengage maneuver as full GM-actionable combat options. It also integrates with the existing `ptu-rule-095` ticket for Disengage.

### Matrix Rules Covered

| Rule | Title | Coverage |
|------|-------|----------|
| R116 | Intercept Melee | Full — trigger, eligibility, resolution with movement |
| R117 | Intercept Ranged | Full — trigger, eligibility, resolution with movement |
| ptu-rule-095 | Disengage Maneuver | Full — integrated with AoO exemption from P0 |

### Dependencies

- P0: AoO engine, adjacency utility, trigger detection, `disengaged` flag
- P1: Interrupt framework, `OutOfTurnAction` with `'interrupt'` category
- Existing: `COMBAT_MANEUVERS`, `useMoveCalculation.ts`, VTT grid composables

---

## Section A: Intercept Melee (R116)

### A1: PTU Rules (p.242)

**Maneuver: Intercept Melee**
- Action: Full Action, Interrupt
- Trigger: An ally within movement range is hit by an adjacent foe.
- Effect: Make Acrobatics or Athletics check (DC = 3x meters to reach ally). On success: Push ally 1m away, shift to their space, take the hit. On failure: shift meters equal to 1/3 of check result.
- Special: Pokemon need Loyalty 3+ to intercept for their Trainer, Loyalty 6 for any ally.
- Cannot intercept if: Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed.
- Cannot intercept Priority/Interrupt moves unless faster than the attacker.
- Moves that cannot miss (Aura Sphere, Swift) cannot be intercepted.
- AoE: If the push does not remove the ally from AoE, intercept has no effect (but interceptor is still hit).

### A2: Intercept Melee Detection

**When to check:** After an attack hits a target, before damage is applied, check if any ally of the target can Intercept.

**Detection function in `out-of-turn.service.ts`:**

```typescript
interface InterceptMeleeDetectionParams {
  /** The combatant being attacked */
  targetId: string;
  /** The attacker */
  attackerId: string;
  /** The move used */
  move: { name: string; range: string; canMiss: boolean; actionType?: string };
  /** All combatants */
  combatants: Combatant[];
  /** Current round */
  round: number;
}

/**
 * Detect Intercept Melee opportunities when an ally is hit by an adjacent melee attack.
 *
 * Eligible interceptors must:
 * 1. Be allies of the target (same side or friendly sides)
 * 2. Be within their movement range of the target
 * 3. Not be blocked by INTERCEPT_BLOCKING_CONDITIONS
 * 4. Not have used Interrupt this round
 * 5. Have both Standard + Shift actions available (Full Action)
 * 6. The attack must be melee (adjacent attacker)
 * 7. The move must be able to miss (no Aura Sphere/Swift)
 * 8. For Pokemon: meet Loyalty requirements
 */
export function detectInterceptMelee(params: InterceptMeleeDetectionParams): OutOfTurnAction[]
```

### A3: Intercept Melee Resolution

**Endpoint:** `POST /api/encounters/:id/intercept-melee` (new)

```typescript
// Request:
{
  interceptorId: string;  // Who is intercepting
  targetId: string;       // The ally being protected
  attackerId: string;     // The attacker
  actionId: string;       // The pending OutOfTurnAction ID
  skillCheck: number;     // Acrobatics or Athletics check result (GM provides)
}

// Response:
{
  success: true;
  data: {
    encounter: Encounter;
    interceptSuccess: boolean;
    distanceMoved: number;   // Actual meters the interceptor moved
    dcRequired: number;      // 3x meters needed
    interceptorNewPosition?: GridPosition;
    targetNewPosition?: GridPosition; // Pushed 1m away
  }
}
```

**Resolution logic:**

1. Calculate distance from interceptor to target (use grid positions if available).
2. DC = 3 x distance in meters.
3. If `skillCheck >= DC`:
   - **Success:** Push target 1m away from interceptor. Interceptor shifts to target's old position. Interceptor takes the attack instead.
4. If `skillCheck < DC`:
   - **Failure:** Interceptor shifts `floor(skillCheck / 3)` meters toward the target. Attack still hits original target.
5. Consume interceptor's Standard + Shift actions (Full Action).
6. Set `outOfTurnUsage.interruptUsed = true`.
7. Update grid positions.
8. Log to move log.

### A4: VTT Grid Integration

When Intercept Melee is accepted:
- Animate (or immediately move) the interceptor token toward the target.
- If successful, swap positions: interceptor goes to target's cell, target is pushed 1m away.
- The direction of the push is away from the interceptor (toward the nearest empty cell).

**Push direction calculation:**
```typescript
/**
 * Calculate the push direction for Intercept Melee.
 * The ally is pushed 1m directly away from the interceptor.
 * Uses the vector from interceptor to ally to determine direction.
 */
function calculatePushDirection(
  interceptorPos: GridPosition,
  allyPos: GridPosition,
  combatants: Combatant[]
): GridPosition | null // null if no valid push target
```

---

## Section B: Intercept Ranged (R117)

### B1: PTU Rules (p.242)

**Maneuver: Intercept Ranged**
- Action: Full Action, Interrupt
- Trigger: A Ranged X-Target attack passes within your movement range.
- Effect: Select a square within movement range between source and target. Make Acrobatics or Athletics check. Shift meters equal to half the result toward the chosen square. If you reach the square, you take the attack instead. If you fail, you still shift half the result.
- Same special conditions as Intercept Melee (Loyalty, blocking conditions).

### B2: Intercept Ranged Detection

**When to check:** When a ranged single-target attack is declared, before it resolves, check if any ally can intercept.

**Detection function:**

```typescript
interface InterceptRangedDetectionParams {
  /** The target of the ranged attack */
  targetId: string;
  /** The attacker */
  attackerId: string;
  /** The move used */
  move: { name: string; range: string; canMiss: boolean; actionType?: string; targetCount: number };
  /** All combatants */
  combatants: Combatant[];
  /** Current round */
  round: number;
}

/**
 * Detect Intercept Ranged opportunities.
 *
 * The attack must:
 * 1. Be ranged (not melee)
 * 2. Target a single target (X-Target, not AoE)
 * 3. Be able to miss (no Aura Sphere/Swift)
 *
 * Eligible interceptors must:
 * 1. Be allies of the target
 * 2. Have at least one cell on the line between attacker and target within movement range
 * 3. Not be blocked by INTERCEPT_BLOCKING_CONDITIONS
 * 4. Not have used Interrupt this round
 * 5. Have both Standard + Shift actions available (Full Action)
 */
export function detectInterceptRanged(params: InterceptRangedDetectionParams): OutOfTurnAction[]
```

### B3: Line-of-Attack Calculation

For Intercept Ranged, the interceptor must be able to reach a square on the line between attacker and target. This requires a line-drawing algorithm.

```typescript
// app/utils/lineOfAttack.ts (new)

/**
 * Get all grid cells on the line between two positions using Bresenham's algorithm.
 * Used for Intercept Ranged to determine which squares the attack "passes through."
 */
export function getLineOfAttackCells(
  from: GridPosition,
  to: GridPosition
): GridPosition[]

/**
 * Check if a combatant can reach any cell on the line of attack
 * within their movement range.
 */
export function canReachLineOfAttack(
  interceptorPos: GridPosition,
  interceptorSpeed: number,
  attackLine: GridPosition[]
): { canReach: boolean; bestSquare: GridPosition | null; distanceToSquare: number }
```

### B4: Intercept Ranged Resolution

**Endpoint:** `POST /api/encounters/:id/intercept-ranged` (new)

```typescript
// Request:
{
  interceptorId: string;
  targetSquare: GridPosition; // The chosen square on the line of attack
  attackerId: string;
  actionId: string;
  skillCheck: number;
}

// Response:
{
  success: true;
  data: {
    encounter: Encounter;
    interceptSuccess: boolean;
    distanceMoved: number;      // floor(skillCheck / 2)
    interceptorNewPosition?: GridPosition;
    reachedTarget: boolean;     // Whether they reached the target square
  }
}
```

**Resolution logic:**

1. Calculate the distance the interceptor shifts: `floor(skillCheck / 2)` meters.
2. Move the interceptor toward `targetSquare` along the shortest path.
3. If they reach the target square:
   - **Success:** Interceptor takes the attack.
4. If they don't reach:
   - **Failure:** Interceptor still shifts the calculated distance. Original target still takes the attack.
5. Consume Full Action, set `interruptUsed = true`.
6. Update grid positions.
7. Log to move log.

### B5: VTT Grid Visualization

When Intercept Ranged is being considered:
- Draw the line of attack between attacker and target.
- Highlight cells within the interceptor's movement range that lie on the line.
- The GM can click a cell on the line to select the target square for interception.

---

## Section C: Disengage Maneuver (ptu-rule-095)

### C1: PTU Rules (p.241)

**Maneuver: Disengage**
- Action: Shift
- Effect: You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity.

### C2: Implementation

Disengage is simpler than Intercept but integrates directly with the P0 AoO system.

**Current state:** The Disengage maneuver does not exist as an actionable entry in `COMBAT_MANEUVERS`. It needs to be added.

### C3: Add to COMBAT_MANEUVERS

```typescript
// In app/constants/combatManeuvers.ts:
{
  id: 'disengage',
  name: 'Disengage',
  actionType: 'shift' as const,  // New action type for shift-action maneuvers
  actionLabel: 'Shift Action',
  ac: null,
  icon: '/icons/phosphor/arrow-u-down-left.svg',
  shortDesc: 'Shift 1m without provoking Attack of Opportunity.',
  requiresTarget: false
}
```

Note: The `Maneuver` interface needs `actionType` to accept `'shift'` in addition to `'standard' | 'full' | 'interrupt'`. Update the type union.

### C4: Disengage Execution

**Endpoint:** Uses existing maneuver execution flow. When the GM executes the Disengage maneuver:

1. Set `combatant.disengaged = true` on the server.
2. Consume the combatant's Shift Action (`turnState.shiftActionUsed = true`).
3. The combatant can then Shift 1 meter. This shift does NOT trigger AoO (because `disengaged === true` from P0's AoO detection logic).
4. The 1m movement limit is enforced: Disengage only allows 1m of movement, not the combatant's full movement speed.

**Movement restriction:** When `disengaged === true`, the maximum movement for the subsequent shift is clamped to 1m. This can be enforced in the client-side movement validation or the server-side move endpoint.

```typescript
// In useGridMovement or the move endpoint:
const effectiveSpeed = combatant.disengaged
  ? 1  // Disengage limits to 1m
  : getSpeed(combatantId);
```

### C5: Disengage + AoO Integration

The integration was designed in P0 (Section C3). P2 completes the circuit:

1. P0 established that `disengaged === true` exempts from shift_away AoO detection.
2. P2 provides the UI for the GM to execute Disengage and set the flag.
3. The subsequent 1m shift does not trigger AoO.

### C6: UI

Disengage appears in the maneuver list alongside Push, Trip, etc. When selected:
- The maneuver panel shows "Shift 1m — no AoO" description.
- The grid highlights only cells within 1m of the combatant.
- After executing, the combatant can move 1m.

---

## Section D: Intercept Additional Rules

### D1: Loyalty Requirement (Pokemon)

PTU p.242: "Pokemon must have a Loyalty of 3 or greater to make Intercept Melee and Intercept Ranged Maneuvers, and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally."

**Check in detection functions:**
```typescript
function checkLoyalty(interceptor: Combatant, target: Combatant): { allowed: boolean; reason?: string } {
  if (interceptor.type !== 'pokemon') return { allowed: true };
  const pokemon = interceptor.entity as Pokemon;
  const loyalty = pokemon.loyalty ?? 0;

  if (loyalty < 3) return { allowed: false, reason: 'Pokemon needs Loyalty 3+ to Intercept' };
  if (loyalty < 6) {
    // Can only intercept for their Trainer
    const ownerId = pokemon.ownerId;
    if (target.entityId !== ownerId) {
      return { allowed: false, reason: 'Pokemon needs Loyalty 6 to Intercept for non-Trainer allies' };
    }
  }
  return { allowed: true };
}
```

Note: The `Pokemon` type needs a `loyalty` field. If it does not exist yet, this is a minor schema addition (default 0, range 0-6).

### D2: Speed Requirement vs Priority/Interrupt Moves

PTU p.242: "Pokemon and Trainers may only Intercept against Priority and Interrupt Moves if they are faster than the user of those Moves."

```typescript
function canInterceptMove(interceptor: Combatant, attacker: Combatant, move: { actionType?: string }): boolean {
  if (move.actionType === 'priority' || move.actionType === 'interrupt') {
    return interceptor.initiative > attacker.initiative;
  }
  return true;
}
```

### D3: Cannot-Miss Moves

PTU p.242: "Moves that cannot miss (such as Aura Sphere or Swift) cannot be Intercepted."

**Check:** Move data should indicate whether a move can miss. Moves with no AC (accuracy check of "--" or null) are considered cannot-miss. The detection function checks `move.canMiss` before generating an Intercept opportunity.

### D4: AoE Intercept Limitation

PTU p.242: "If the target that was Intercepted was hit by an Area of Effect Move, and the 1 meter push does not remove them from the Area of Effect, the Intercept has no effect since they are still in the area of the attack -- it would cause the Interceptor to be hit by the Move however."

**For Intercept Melee only.** The push must actually move the ally out of the AoE. If the AoE still covers the pushed position, the intercept fails (ally takes the hit), BUT the interceptor is still hit by the move as well.

This is an edge case that requires AoE geometry checking. The system already has burst/cone/line/blast measurement tools in `useMeasurementStore`. Reuse those to check if the pushed position is still within the AoE.

---

## Section E: Updated COMBAT_MANEUVERS Type

The `Maneuver` interface in `combatManeuvers.ts` needs to support the new action types:

```typescript
export interface Maneuver {
  id: string;
  name: string;
  actionType: 'standard' | 'full' | 'interrupt' | 'shift' | 'free';
  actionLabel: string;
  ac: number | null;
  icon: string;
  shortDesc: string;
  requiresTarget: boolean;
  /** Optional: AoO trigger type this maneuver may provoke */
  provokesAoO?: AoOTrigger;
  /** Optional: whether this maneuver is an Interrupt-type maneuver */
  isInterrupt?: boolean;
}
```

Update existing maneuvers with `provokesAoO` where applicable:
- Push, Grapple, Disarm, Trip, Dirty Trick: `provokesAoO: 'maneuver_other'` (only triggers AoO for adjacent enemies NOT targeted by the maneuver).

---

## Section F: Move Log Integration

### F1: Intercept Melee Log

```typescript
{
  moveName: 'Intercept Melee',
  damageClass: 'Status',
  actionType: 'interrupt',
  notes: `${interceptorName} intercepted attack on ${targetName}. DC ${dc}, check ${skillCheck}. ${success ? 'Success — took the hit.' : 'Failed — shifted ' + distanceMoved + 'm.'}`
}
```

### F2: Intercept Ranged Log

```typescript
{
  moveName: 'Intercept Ranged',
  damageClass: 'Status',
  actionType: 'interrupt',
  notes: `${interceptorName} attempted to block ranged attack on ${targetName}. Check ${skillCheck}, moved ${distanceMoved}m. ${success ? 'Success — intercepted.' : 'Failed — did not reach target square.'}`
}
```

### F3: Disengage Log

```typescript
{
  moveName: 'Disengage',
  damageClass: 'Status',
  actionType: 'shift',
  notes: `${combatantName} disengaged — may shift 1m without provoking AoO.`
}
```

---

## Section G: Edge Cases

### G1: Intercept Melee — No Empty Cell for Push
If the 1m push direction has no valid cell (blocked by terrain or grid edge), the ally is pushed to the nearest valid adjacent cell. If no valid cell exists, the push fails but the interceptor still shifts to the ally's position and takes the hit.

### G2: Intercept Ranged — Multiple Line Cells
The GM chooses which cell on the line of attack to target. The UI highlights all valid cells. The system validates that the chosen cell is actually on the line.

### G3: Simultaneous Intercept Opportunities
Only one Intercept can be used per attack. If multiple combatants are eligible, the GM chooses which one acts. The others' opportunities expire.

### G4: Intercept During AoO
An AoO Struggle Attack is a melee attack. Technically, an ally could Intercept an AoO. This is allowed by the rules (AoO is still an attack that hits). However, it requires the interceptor to have not used their Interrupt this round.

### G5: Disengage + Sprint
A combatant cannot Sprint and Disengage in the same turn. Sprint requires a Standard Action and Disengage uses the Shift Action. They are compatible in theory (different actions), but Disengage limits movement to 1m regardless of Sprint bonus.

### G6: Intercept on AoE Moves
For Intercept Melee: The AoE check applies. If the pushed ally is still in the AoE, both ally and interceptor are hit.
For Intercept Ranged: Only applies to "Ranged X-Target" (single target) attacks, NOT AoE. So this edge case only matters for Intercept Melee.

---

## Files Changed (P2)

### New Files
| File | Description |
|------|-------------|
| `app/server/api/encounters/[id]/intercept-melee.post.ts` | Intercept Melee resolution endpoint |
| `app/server/api/encounters/[id]/intercept-ranged.post.ts` | Intercept Ranged resolution endpoint |
| `app/utils/lineOfAttack.ts` | Line-of-attack cell calculation utility |
| `app/components/encounter/InterceptPrompt.vue` | GM prompt for Intercept opportunities |

### Modified Files
| File | Changes |
|------|---------|
| `app/server/services/out-of-turn.service.ts` | Add detectInterceptMelee, detectInterceptRanged, resolveInterceptMelee, resolveInterceptRanged |
| `app/constants/combatManeuvers.ts` | Add Disengage maneuver, update Maneuver interface, add provokesAoO fields |
| `app/composables/useGridMovement.ts` | Clamp movement to 1m when disengaged |
| `app/composables/useMoveCalculation.ts` | Integrate intercept detection before damage application |
| `app/components/vtt/VTTGrid.vue` or rendering composable | Line-of-attack visualization for Intercept Ranged |
| `app/stores/encounter.ts` | Add interceptMelee/interceptRanged actions |

### Estimated Commit Count: 8-10

1. Update Maneuver interface, add Disengage to COMBAT_MANEUVERS
2. Add lineOfAttack utility
3. Add Intercept Melee detection in out-of-turn service
4. Add Intercept Melee endpoint + resolution logic
5. Add Intercept Ranged detection in out-of-turn service
6. Add Intercept Ranged endpoint + resolution logic
7. Implement Disengage maneuver execution (flag + 1m clamp)
8. Add InterceptPrompt UI component
9. Integrate intercept detection with move execution flow
10. Add VTT visualization for line of attack
