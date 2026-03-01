# Testing Strategy: Priority / Interrupt / Attack of Opportunity System

## Overview

This document defines the testing approach for all three tiers of the out-of-turn action system. Due to the complexity of combat state transitions and inter-system interactions, testing is critical to prevent regressions.

## Testing Layers

### Layer 1: Unit Tests (Vitest)

Pure function testing for the core logic. No DOM, no server, no database.

#### P0 Unit Tests

**File:** `app/tests/unit/services/out-of-turn.service.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `detectAoOTriggers` | 12+ | Detection logic for all 5 trigger types |
| `canUseAoO` | 6 | Eligibility: blocking conditions, once-per-round, HP check |
| `resolveAoO` | 4 | Accept/decline resolution, outOfTurnUsage update |
| `getAdjacentEnemies` | 8 | 1x1 tokens, multi-cell tokens, diagonal adjacency |

**File:** `app/tests/unit/utils/adjacency.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `areAdjacent` | 10 | 1x1 adjacent, 1x1 diagonal, 2x2 adjacent, not adjacent, same position |
| `getAdjacentCombatants` | 6 | Multiple adjacents, no adjacents, mixed sides |
| `wasAdjacentBeforeMove` | 8 | Before/after comparison for shift_away detection |

**File:** `app/tests/unit/constants/aooTriggers.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `AOO_TRIGGER_MAP` | 5 | Validate all trigger types have correct checkOn values |
| `AOO_BLOCKING_CONDITIONS` | 3 | Validate conditions list matches PTU p.241 |

##### P0 Detection Test Cases (Detail)

```
shift_away:
  - [x] Adjacent enemy shifts 1 cell away -> triggers AoO
  - [x] Adjacent enemy shifts but stays adjacent -> no trigger
  - [x] Non-adjacent enemy shifts -> no trigger
  - [x] Disengaged combatant shifts away -> no trigger (exemption)
  - [x] Multi-cell token partially shifts away -> trigger if no cells remain adjacent
  - [x] Multiple adjacent enemies -> multiple triggers generated

ranged_attack:
  - [x] Adjacent enemy uses ranged move, targets non-adjacent -> triggers
  - [x] Adjacent enemy uses ranged move, targets adjacent ally -> no trigger
  - [x] Adjacent enemy uses melee move -> no trigger

stand_up:
  - [x] Adjacent enemy clears Tripped -> triggers
  - [x] Non-adjacent enemy clears Tripped -> no trigger

maneuver_other:
  - [x] Adjacent enemy uses Push on another combatant -> triggers
  - [x] Adjacent enemy uses Push on reactor -> no trigger

retrieve_item:
  - [x] Adjacent enemy uses Standard Action to pick up item -> triggers
```

#### P1 Unit Tests

**File:** `app/tests/unit/services/out-of-turn-hold.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `holdAction` | 6 | Valid hold, already acted, already held this round, holdQueue update |
| `releaseHeldAction` | 5 | Release on target init, manual release, round end expiry |
| `checkHoldQueue` | 6 | Initiative match, no match, multiple held combatants |

**File:** `app/tests/unit/services/out-of-turn-priority.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `declarePriority standard` | 5 | Valid, already acted, already used priority, turn insertion |
| `declarePriority limited` | 5 | Valid, action consumption, remainder on normal turn |
| `declarePriority advanced` | 5 | Valid after acting, skipNextRound flag, not-yet-acted |
| `canUsePriority` | 6 | All variant eligibility checks |

**File:** `app/tests/unit/services/out-of-turn-interrupt.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `declareInterrupt` | 4 | Valid, already used interrupt, blocking conditions |
| `canUseInterrupt` | 4 | Eligibility checks |

#### P2 Unit Tests

**File:** `app/tests/unit/services/intercept.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `detectInterceptMelee` | 10 | Within range, out of range, blocking conditions, Loyalty 3, Loyalty 6, cannot-miss moves |
| `detectInterceptRanged` | 8 | Line of attack, within range, AoE exclusion, cannot-miss |
| `resolveInterceptMelee` | 6 | Success (push + swap), failure (partial shift), AoE edge case |
| `resolveInterceptRanged` | 5 | Success (reach square), failure (partial shift) |
| `checkLoyalty` | 5 | Human interceptor, Pokemon Loyalty 2/3/5/6, trainer target vs ally target |

**File:** `app/tests/unit/utils/lineOfAttack.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `getLineOfAttackCells` | 6 | Horizontal, vertical, diagonal, long range |
| `canReachLineOfAttack` | 4 | Within speed, out of speed, partial reach |

**File:** `app/tests/unit/constants/combatManeuvers.test.ts`

| Test Group | Cases | Description |
|-----------|-------|-------------|
| `COMBAT_MANEUVERS` | 3 | Disengage present, correct action type, AoO fields on existing maneuvers |

### Layer 2: API Integration Tests (Vitest with mock Prisma)

Test the API endpoints with mocked database responses.

#### P0 API Tests

**File:** `app/tests/unit/api/aoo-detect.test.ts`

| Test | Description |
|------|-------------|
| Detect AoO on movement trigger | Send shift_away, verify OutOfTurnAction created |
| No AoO when disengaged | Send shift_away with disengaged flag, verify empty |
| No AoO for sleeping combatant | Reactor has Asleep condition, verify filtered out |
| AoO already used this round | Reactor aooUsed=true, verify filtered out |

**File:** `app/tests/unit/api/aoo-resolve.test.ts`

| Test | Description |
|------|-------------|
| Accept AoO | Resolve with accept, verify Struggle Attack logged |
| Decline AoO | Resolve with decline, verify action marked declined |
| Resolve already-resolved action | Verify 400 error |

#### P1 API Tests

**File:** `app/tests/unit/api/hold-action.test.ts`

| Test | Description |
|------|-------------|
| Hold action at init 5 | Verify holdQueue entry, combatant skipped |
| Release held action | Verify turn order insertion |
| Hold when already acted | Verify 400 error |

**File:** `app/tests/unit/api/priority.test.ts`

| Test | Description |
|------|-------------|
| Priority Standard | Verify full turn insertion |
| Priority Limited | Verify only standard action consumed |
| Priority Advanced after acting | Verify skipNextRound flag set |

#### P2 API Tests

**File:** `app/tests/unit/api/intercept.test.ts`

| Test | Description |
|------|-------------|
| Intercept Melee success | Verify position swap, damage redirect |
| Intercept Melee failure | Verify partial shift, original target hit |
| Intercept Ranged success | Verify interceptor at target square |
| Intercept Ranged failure | Verify partial shift |

### Layer 3: Store Tests (Vitest with mocked $fetch)

Test Pinia store actions and getters.

**File:** `app/tests/unit/stores/encounter-oot.test.ts`

| Test | Description |
|------|-------------|
| pendingAoOs getter | Filters pending AoO actions correctly |
| pendingOutOfTurnActions getter | Returns all pending actions |
| detectAoO action | Calls API, updates encounter state |
| resolveAoO action | Calls API, updates encounter state |
| betweenTurns state | Set/clear between turns |

### Layer 4: Component Tests (Vitest with Vue Test Utils)

Lightweight rendering tests for the new UI components.

**File:** `app/tests/unit/components/AoOPrompt.test.ts`

| Test | Description |
|------|-------------|
| Renders when pending AoOs exist | Verify prompt visible |
| Hidden when no pending AoOs | Verify prompt hidden |
| Accept button calls resolveAoO | Click handler test |
| Decline button calls resolveAoO | Click handler test |

**File:** `app/tests/unit/components/HoldActionButton.test.ts`

| Test | Description |
|------|-------------|
| Renders when combatant can hold | Verify button visible |
| Hidden when combatant already acted | Verify button hidden |
| Dialog opens on click | Verify dialog state |

**File:** `app/tests/unit/components/PriorityActionPanel.test.ts`

| Test | Description |
|------|-------------|
| Renders in between-turns state | Verify panel visible |
| Lists eligible combatants | Verify combatant list |
| Proceed button emits event | Click handler test |

## Test Data Factories

### Combat Scenario Builder

Create a reusable test factory for building combat scenarios with positioned tokens:

```typescript
// app/tests/helpers/combatScenarioBuilder.ts

export function buildScenario() {
  return {
    withCombatant(overrides: Partial<Combatant>) { ... },
    withPosition(combatantId: string, pos: GridPosition) { ... },
    withCondition(combatantId: string, condition: StatusCondition) { ... },
    withOutOfTurnUsage(combatantId: string, usage: Partial<OutOfTurnUsage>) { ... },
    build(): { combatants: Combatant[]; encounter: Partial<Encounter> }
  }
}
```

### Grid Position Fixtures

```typescript
// Common position setups for adjacency tests
export const ADJACENT_SETUP = {
  center: { x: 5, y: 5 },
  north: { x: 5, y: 4 },
  south: { x: 5, y: 6 },
  east: { x: 6, y: 5 },
  west: { x: 4, y: 5 },
  northeast: { x: 6, y: 4 },
  notAdjacent: { x: 8, y: 8 }
};
```

## Coverage Targets

| Category | Target | Rationale |
|----------|--------|-----------|
| `out-of-turn.service.ts` | 90%+ | Core logic — must be thoroughly tested |
| `adjacency.ts` | 95%+ | Pure utility — easy to hit high coverage |
| `lineOfAttack.ts` | 95%+ | Pure utility |
| API endpoints | 85%+ | Integration points |
| Store actions | 80%+ | State management |
| UI components | 70%+ | Rendering tests |

## PTU Rules Verification Checklist

After each tier is implemented, verify these PTU rules are correctly enforced:

### P0
- [ ] AoO is Free Action + Interrupt (does not consume turn actions)
- [ ] AoO is a Struggle Attack (physical, normal-type)
- [ ] AoO once per round per combatant
- [ ] AoO blocked by Asleep, Flinched, Paralyzed
- [ ] Disengage exempts from shift_away AoO
- [ ] All 5 trigger types detected correctly

### P1
- [ ] Hold Action: once per round, must not have acted
- [ ] Priority Standard: full turn, hasn't acted, between turns only
- [ ] Priority Limited: only Priority action, rest at normal initiative
- [ ] Priority Advanced: works after acting, forfeits next turn
- [ ] Interrupt: during another's turn, only Interrupt action, once per round

### P2
- [ ] Intercept Melee: Full Action + Interrupt, DC = 3x distance
- [ ] Intercept Melee success: push ally 1m, swap positions, take hit
- [ ] Intercept Melee failure: shift floor(check/3) meters
- [ ] Intercept Ranged: Full Action + Interrupt, shift floor(check/2)
- [ ] Intercept Ranged success: reach target square, take hit
- [ ] Intercept Ranged failure: shift floor(check/2) toward square
- [ ] Pokemon Loyalty 3+: can intercept for Trainer only
- [ ] Pokemon Loyalty 6: can intercept for any ally
- [ ] Cannot intercept cannot-miss moves (Aura Sphere, Swift)
- [ ] Cannot intercept if Asleep/Confused/Enraged/Frozen/Stuck/Paralyzed
- [ ] Can only intercept Priority/Interrupt moves if faster than attacker
- [ ] Disengage: Shift Action, 1m movement, no AoO

## Regression Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| Turn progression (`next-turn.post.ts`) | Hold queue insertion breaks turn order | Extensive unit tests for turn order manipulation |
| League Battle phases | Priority/Hold interactions with 3-phase system | Test all phase transitions with held/priority combatants |
| VTT grid movement | AoO detection slows down movement preview | Performance test: measure AoO detection latency |
| WebSocket sync | New events not propagated correctly | Integration test: verify event broadcast |
| Undo/Redo | New encounter fields not captured in snapshots | Verify snapshot includes pendingActions, holdQueue |
| Combatant reset | New fields not cleared on round/turn change | Unit test resetCombatantsForNewRound with new fields |
