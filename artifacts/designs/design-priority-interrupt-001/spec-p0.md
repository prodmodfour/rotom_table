# P0 Spec: Core AoO Trigger Detection + Out-of-Turn Action Resolution

## Scope

P0 delivers the foundational infrastructure: the out-of-turn action engine, AoO trigger detection, and the GM-facing resolution UI. This tier makes it possible for the system to detect when an AoO opportunity arises and let the GM accept or decline it.

### Matrix Rules Covered

| Rule | Title | Coverage |
|------|-------|----------|
| R110 | Attack of Opportunity | Full — trigger detection, eligibility, resolution |
| R031 (vtt-grid) | AoO Movement Trigger | Full — grid movement shift_away detection |

### Dependencies

- shared-specs.md types and interfaces
- Existing: `useGridMovement.ts`, `useGridInteraction.ts`, `next-turn.post.ts`, `combatManeuvers.ts`

---

## Section A: AoO Trigger Detection Service

### A1: Core Detection Function

**File:** `app/server/services/out-of-turn.service.ts` (new)

```typescript
interface AoODetectionParams {
  /** The combatant performing the triggering action */
  actor: Combatant;
  /** Type of trigger to check */
  triggerType: AoOTrigger;
  /** All combatants in the encounter */
  combatants: Combatant[];
  /** Current round number */
  round: number;
  /** For shift_away: the position BEFORE the shift */
  previousPosition?: GridPosition;
  /** For maneuver_other: the target(s) of the maneuver */
  maneuverTargetIds?: string[];
  /** For ranged_attack: whether any target is adjacent to the attacker */
  hasAdjacentTarget?: boolean;
}

/**
 * Detect all valid AoO opportunities triggered by a specific action.
 * Returns one OutOfTurnAction per eligible reactor.
 *
 * PTU p.241 rules:
 * - Only adjacent enemies can trigger AoO
 * - Reactor must not be Sleeping, Flinched, or Paralyzed
 * - Reactor must not have used AoO this round already
 * - The triggering action must match the AoO trigger conditions
 */
export function detectAoOTriggers(params: AoODetectionParams): OutOfTurnAction[]
```

**Logic flow:**
1. Find all enemies adjacent to `params.actor` (using adjacency utility).
2. For each adjacent enemy, check:
   - `canUseAoO(enemy)` — not incapacitated, hasn't used AoO this round.
   - Trigger-specific conditions (see A2).
3. Create an `OutOfTurnAction` for each eligible reactor.

### A2: Trigger-Specific Conditions

Each trigger type has unique validation:

#### `shift_away` (R031 — VTT Grid)
- **Check:** The actor was adjacent to the reactor BEFORE the shift AND is no longer adjacent AFTER the shift.
- **Uses:** `wasAdjacentBeforeMove()` from `app/utils/adjacency.ts`.
- **Exempt if:** Actor used Disengage maneuver this turn (`combatant.disengaged === true`).

#### `ranged_attack`
- **Check:** The actor is using a move with a range > Melee, AND none of the targets are adjacent to the actor.
- **Input:** `hasAdjacentTarget` flag computed before calling detection.

#### `stand_up`
- **Check:** The actor just cleared the Tripped condition.
- **Triggered in:** Status change handler.

#### `maneuver_other`
- **Check:** The actor used Push, Grapple, Disarm, Trip, or Dirty Trick AND the reactor is NOT the target.
- **Input:** `maneuverTargetIds` excludes the reactor from targets.

#### `retrieve_item`
- **Check:** The actor used a Standard Action to pick up or retrieve an item.
- **Triggered in:** Item use action handler.

### A3: Eligibility Check

```typescript
/**
 * Check if a combatant can use an AoO right now.
 *
 * PTU p.241: "Attacks of Opportunity cannot be made by Sleeping,
 * Flinched, or Paralyzed targets."
 * Also: "You may use Attack of Opportunity only once per round."
 */
export function canUseAoO(combatant: Combatant): { allowed: boolean; reason?: string } {
  // 1. HP > 0
  // 2. Not in AOO_BLOCKING_CONDITIONS
  // 3. outOfTurnUsage.aooUsed === false
  // 4. Has a position on the grid (for adjacency checks)
}
```

---

## Section B: Out-of-Turn Action Resolution Flow

### B1: GM Prompt Workflow

When an AoO is triggered, the system does NOT automatically execute it. Instead:

1. **Detection** — The trigger detection function identifies eligible reactors.
2. **Prompt** — Each eligible reactor generates a pending `OutOfTurnAction` stored on the encounter.
3. **GM Decision** — The GM sees a prompt in the encounter UI and can:
   - **Accept** — The AoO is executed (Struggle Attack against trigger).
   - **Decline** — The AoO is dismissed.
4. **Resolution** — If accepted, the Struggle Attack is processed. The reactor's `outOfTurnUsage.aooUsed` is set to `true`.

### B2: Pause-and-Resume Model

AoO detection happens mid-action (e.g., during a token move on the VTT). The system must:

1. **Detect AoO triggers** before finalizing the action.
2. If triggers exist:
   - Store the pending actions on the encounter (`pendingOutOfTurnActions`).
   - Broadcast `aoo_triggered` WebSocket event.
   - The GM UI shows the AoO prompt overlay.
3. The triggering action is NOT cancelled — it proceeds regardless of AoO acceptance/decline.
4. If the AoO is accepted, the Struggle Attack is resolved as a separate action (does not consume the reactor's turn actions).

This is a "notification + optional reaction" model, not a "pause combat" model. The GM can accept or decline at their own pace.

### B3: Server Endpoints

#### `POST /api/encounters/:id/aoo-detect` (new)

Called when a potentially triggering action occurs. Returns any detected AoO opportunities.

```typescript
// Request body:
{
  actorId: string;
  triggerType: AoOTrigger;
  previousPosition?: GridPosition; // For movement triggers
  maneuverTargetIds?: string[];    // For maneuver triggers
  hasAdjacentTarget?: boolean;     // For ranged attack triggers
}

// Response:
{
  success: true;
  data: {
    triggeredActions: OutOfTurnAction[];
    encounter: Encounter; // Updated with pending actions
  }
}
```

#### `POST /api/encounters/:id/aoo-resolve` (new)

Called when the GM accepts or declines a pending AoO.

```typescript
// Request body:
{
  actionId: string;       // OutOfTurnAction.id
  resolution: 'accept' | 'decline';
  // If accepted, the Struggle Attack details:
  damageRoll?: number;    // GM provides the damage
}

// Response:
{
  success: true;
  data: {
    encounter: Encounter;
    resolution: 'accept' | 'decline';
    // If accepted:
    struggleAttack?: {
      actorId: string;
      targetId: string;
      damage: number;
      hit: boolean;
    }
  }
}
```

---

## Section C: VTT Grid Integration (R031)

### C1: Movement-Based AoO Detection

**Integration point:** When a token is moved on the VTT grid, before the move is finalized, check for shift_away AoO triggers.

**File:** `app/composables/useGridMovement.ts` — add AoO detection to `isValidMove` return type.

The movement composable itself does NOT call the server. Instead, it provides a utility function that the parent component uses to detect potential AoO triggers on the client side, then the parent calls the server endpoint.

```typescript
// New function in useGridMovement:

/**
 * Check which adjacent enemies would get an AoO opportunity
 * if a combatant moves from `from` to `to`.
 *
 * Returns combatant IDs of enemies who were adjacent at `from`
 * and are no longer adjacent at `to` (shift_away trigger).
 *
 * This is a CLIENT-SIDE preview. The actual trigger detection
 * and resolution happens server-side via /api/encounters/:id/aoo-detect.
 */
const getAoOTriggersForMove = (
  combatantId: string,
  from: GridPosition,
  to: GridPosition
): string[] => {
  // 1. Get all adjacent enemies at `from` position
  // 2. Get all adjacent enemies at `to` position
  // 3. Return enemies in set A but NOT in set B
  //    (they were adjacent before but not after = shift_away)
}
```

### C2: Visual Indicators

When a combatant is being moved (during move preview):
- Adjacent enemies who would get an AoO are highlighted with a warning indicator.
- The movement preview line shows a small icon (Phosphor `WarningCircle`) near the enemies.
- After the move is confirmed, if AoO triggers exist, the GM prompt appears.

### C3: Disengage Flag

When a combatant uses the Disengage maneuver:
1. Set `combatant.disengaged = true` (valid for this turn only).
2. Their next shift (1m only per Disengage rules) does NOT trigger shift_away AoO.
3. `disengaged` is cleared at end of turn / round reset.

**Integration:** The Disengage maneuver already exists in `COMBAT_MANEUVERS` as a concept, but currently has no functional implementation. P0 adds the `disengaged` flag and skips AoO detection when the flag is set.

Note: The full Disengage maneuver UI (selecting it as a maneuver) is P2 scope. P0 only provides the server-side flag and AoO exemption logic. The GM can manually set the flag via a maneuver action.

---

## Section D: Round Reset

### D1: Reset on New Round

In `resetCombatantsForNewRound()` (in `next-turn.post.ts`), add:

```typescript
c.outOfTurnUsage = {
  aooUsed: false,
  priorityUsed: false,
  interruptUsed: false
};
c.disengaged = false;
```

### D2: Reset on Turn End

At the end of each combatant's turn (in the `next-turn.post.ts` turn-end section), clear:
- `c.disengaged = false` (Disengage only lasts for the current turn's shift)

### D3: Clear Pending Actions

Pending out-of-turn actions that have not been resolved by the time the round ends are marked as `expired`. This prevents stale prompts from persisting across rounds.

---

## Section E: UI Components (GM View)

### E1: AoO Prompt Overlay

**File:** `app/components/encounter/AoOPrompt.vue` (new)

A modal/overlay that appears when AoO opportunities are detected. Shows:
- The triggering combatant's name and what they did.
- Each eligible reactor with an "Accept AoO" / "Decline" button pair.
- The reactor's current status (HP, conditions) for GM reference.

```vue
<template>
  <div v-if="pendingAoOs.length > 0" class="aoo-prompt-overlay">
    <div class="aoo-prompt-header">
      <PhWarningCircle :size="24" />
      <span>Attack of Opportunity</span>
    </div>
    <div v-for="action in pendingAoOs" :key="action.id" class="aoo-action">
      <div class="aoo-trigger-desc">
        {{ getTriggerActorName(action) }} {{ action.triggerDescription }}
      </div>
      <div class="aoo-reactor">
        <span class="reactor-name">{{ getReactorName(action) }}</span>
        <span class="reactor-hp">{{ getReactorHp(action) }}</span>
      </div>
      <div class="aoo-buttons">
        <button class="btn btn-accept" @click="resolveAoO(action.id, 'accept')">
          <PhSword :size="16" /> Accept AoO
        </button>
        <button class="btn btn-decline" @click="resolveAoO(action.id, 'decline')">
          <PhX :size="16" /> Decline
        </button>
      </div>
    </div>
  </div>
</template>
```

### E2: Movement Preview Warning

**File:** Modification to `app/components/vtt/VTTGrid.vue` or rendering composable.

When the GM drags a token and the preview shows an AoO trigger:
- A small warning badge appears near each enemy that would get an AoO.
- The movement cost line shows "(AoO!)" text.

### E3: Turn Panel Integration

The existing turn panel (showing current combatant, initiative order) needs a small addition:
- When a combatant has `outOfTurnUsage.aooUsed === true`, show a small "AoO used" indicator.
- When pending AoO actions exist, show a notification badge on the encounter panel.

---

## Section F: Encounter Store Updates

### F1: New State Fields

In `app/stores/encounter.ts`, add getters:

```typescript
/** Pending AoO actions awaiting GM resolution */
pendingAoOs: (state): OutOfTurnAction[] => {
  return (state.encounter?.pendingOutOfTurnActions ?? [])
    .filter(a => a.category === 'aoo' && a.status === 'pending')
},

/** All pending out-of-turn actions */
pendingOutOfTurnActions: (state): OutOfTurnAction[] => {
  return (state.encounter?.pendingOutOfTurnActions ?? [])
    .filter(a => a.status === 'pending')
},
```

### F2: New Actions

```typescript
/** Detect AoO triggers for a given action */
async detectAoO(
  actorId: string,
  triggerType: AoOTrigger,
  context?: { previousPosition?: GridPosition; maneuverTargetIds?: string[]; hasAdjacentTarget?: boolean }
)

/** Resolve a pending AoO (accept or decline) */
async resolveAoO(actionId: string, resolution: 'accept' | 'decline', damageRoll?: number)
```

### F3: WebSocket Integration

Update `updateFromWebSocket()` to handle:
- `pendingOutOfTurnActions` field on incoming encounter data.
- New event types: `aoo_triggered`, `aoo_resolved`.

---

## Section G: Move Log Integration

When an AoO is executed (accepted), add a `MoveLogEntry`:

```typescript
{
  id: uuidv4(),
  timestamp: new Date(),
  round: encounter.currentRound,
  actorId: reactor.id,
  actorName: reactorName,
  moveName: 'Attack of Opportunity',
  damageClass: 'Physical', // Struggle is always Physical
  actionType: 'free',
  targets: [{
    id: trigger.id,
    name: triggerName,
    hit: hitResult,
    damage: damageAmount,
    injury: injuryResult
  }],
  notes: `Triggered by: ${action.triggerDescription}`
}
```

---

## Section H: Edge Cases

### H1: Multiple Reactors
Multiple adjacent enemies can each get an AoO from the same trigger. Each is presented as a separate pending action. The GM resolves each independently. PTU does not limit the NUMBER of different combatants who can AoO the same trigger — only that each combatant can AoO once per round.

### H2: Trigger During AoO
An AoO Struggle Attack does NOT itself trigger further AoOs. AoO is a reaction, not a triggering action.

### H3: Fainted Reactor
If a reactor faints between trigger detection and resolution (e.g., from another effect), the pending action is auto-declined.

### H4: Multi-Cell Tokens
Adjacency for multi-cell tokens (Large, Huge, Gigantic) checks all cells of both tokens. A 2x2 token shifting away from a 1x1 enemy triggers AoO if any of the 4 cells were adjacent to the enemy's cell and none of the new 4 cells are.

### H5: No Grid Mode
If the encounter is running without a VTT grid (no positions), the shift_away trigger cannot be auto-detected. The GM can manually trigger AoO through the action panel. Other trigger types (ranged_attack, stand_up, maneuver_other, retrieve_item) work without grid positions since they are action-based, not position-based.

### H6: Existing Encounter Migration
Encounters created before this feature have no `pendingOutOfTurnActions` or `holdQueue` fields. The `buildEncounterResponse()` function defaults these to `[]` when missing. No migration script needed — JSON parsing handles missing fields gracefully.

---

## Files Changed (P0)

### New Files
| File | Description |
|------|-------------|
| `app/server/services/out-of-turn.service.ts` | Core out-of-turn action logic |
| `app/server/api/encounters/[id]/aoo-detect.post.ts` | AoO trigger detection endpoint |
| `app/server/api/encounters/[id]/aoo-resolve.post.ts` | AoO resolution endpoint |
| `app/utils/adjacency.ts` | Grid adjacency utilities |
| `app/constants/aooTriggers.ts` | AoO trigger type constants |
| `app/components/encounter/AoOPrompt.vue` | GM-facing AoO prompt overlay |

### Modified Files
| File | Changes |
|------|---------|
| `app/types/combat.ts` | Add OutOfTurnAction, AoOTrigger, etc. types |
| `app/types/encounter.ts` | Add pendingOutOfTurnActions, holdQueue to Encounter; outOfTurnUsage to Combatant |
| `app/stores/encounter.ts` | Add pendingAoOs getter, detectAoO/resolveAoO actions |
| `app/server/api/encounters/[id]/next-turn.post.ts` | Reset outOfTurnUsage on round change; clear disengaged on turn end |
| `app/server/routes/ws.ts` | Add aoo_triggered, aoo_resolved event handlers |
| `app/composables/useGridMovement.ts` | Add getAoOTriggersForMove() preview function |
| `app/prisma/schema.prisma` | Add pendingActions, holdQueue columns to Encounter |
| `app/server/services/encounter.service.ts` | Update buildEncounterResponse for new fields |

### Estimated Commit Count: 6-8

1. Add shared types (OutOfTurnAction, AoOTrigger, etc.)
2. Add adjacency utility
3. Add out-of-turn service (detection + eligibility)
4. Add AoO detect/resolve endpoints
5. Integrate AoO detection with grid movement
6. Add AoO prompt UI component
7. Update next-turn reset and WebSocket events
8. Add Prisma schema changes
