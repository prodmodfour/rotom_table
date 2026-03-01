# P2 Specification: Automation (Auto-Detect, Auto-Apply, UI Indicators)

P2 adds reactive automation: flanking status updates automatically on token movement, the accuracy penalty auto-applies, and flanking state is visible in the CombatantCard and synced via WebSocket.

---

## I. Auto-Detect Flanking on Token Placement/Movement

### Reactive Flanking State

The `useFlankingDetection` composable from P0 already uses `computed()` on the combatants ref, so the flanking map recomputes whenever combatant positions change. P2 formalizes this by adding a watcher that triggers VTT re-renders and broadcasts flanking state changes.

### Modified: `app/composables/useFlankingDetection.ts`

Add a watcher that detects flanking state transitions and emits events:

```typescript
/**
 * Enhanced composable with auto-detection and event emission.
 *
 * Watches the flanking map for changes and emits events when
 * a combatant's flanked status changes (flanked -> unflanked or vice versa).
 */
export function useFlankingDetection(
  combatants: Ref<Combatant[]>,
  options?: {
    onFlankingChanged?: (combatantId: string, isFlanked: boolean, flankerIds: string[]) => void
    render?: () => void
  }
) {
  // ... existing computed properties from P0 ...

  // Track previous flanking state for change detection
  const previousFlankedSet = ref<Set<string>>(new Set())

  watch(flankingMap, (newMap) => {
    const newFlankedSet = new Set<string>()

    for (const [id, status] of Object.entries(newMap)) {
      if (status.isFlanked) {
        newFlankedSet.add(id)
      }
    }

    // Detect transitions
    for (const id of newFlankedSet) {
      if (!previousFlankedSet.value.has(id)) {
        // Newly flanked
        options?.onFlankingChanged?.(id, true, newMap[id].flankerIds)
      }
    }
    for (const id of previousFlankedSet.value) {
      if (!newFlankedSet.has(id)) {
        // No longer flanked
        options?.onFlankingChanged?.(id, false, [])
      }
    }

    previousFlankedSet.value = newFlankedSet

    // Trigger VTT re-render to update visual indicators
    options?.render?.()
  }, { deep: true })

  return {
    flankingMap,
    isTargetFlanked,
    getFlankingStatus,
    getFlankingPenalty,
  }
}
```

### Integration in GridCanvas.vue / VTTContainer.vue

The VTT grid component instantiates `useFlankingDetection` with the encounter's combatants and wires up the render callback:

```typescript
// In GridCanvas.vue or VTTContainer.vue setup:
const encounterStore = useEncounterStore()
const combatants = computed(() => encounterStore.encounter?.combatants ?? [])

const { flankingMap, isTargetFlanked, getFlankingPenalty } = useFlankingDetection(
  combatants,
  {
    onFlankingChanged: (combatantId, isFlanked, flankerIds) => {
      // Broadcast via WebSocket (see section L)
      broadcastFlankingChange(combatantId, isFlanked, flankerIds)
    },
    render: () => renderGrid()
  }
)
```

---

## J. Auto-Apply Flanking Penalty to Accuracy Checks

### Client-Side: `app/composables/useMoveCalculation.ts`

P0 added an optional `getFlankingPenalty` parameter. P2 ensures this is always wired up when the VTT grid is active.

The MoveTargetModal (or equivalent action component) provides the flanking penalty getter from the VTT's flanking detection composable:

```typescript
// In the component that uses useMoveCalculation:
const { getFlankingPenalty } = useFlankingDetection(combatants)

const moveCalc = useMoveCalculation(
  move,
  actor,
  targets,
  allCombatants,
  { getFlankingPenalty }
)
```

### Server-Side: `app/server/api/encounters/[id]/calculate-damage.post.ts`

Add server-side flanking detection for the calculate-damage endpoint. This ensures accuracy checks computed server-side also account for flanking.

```typescript
import { checkFlanking } from '~/utils/flankingGeometry'
import { isEnemySide } from '~/utils/combatSides'

// In the accuracy calculation section:
function getFlankingPenaltyForTarget(
  targetCombatant: Combatant,
  allCombatants: Combatant[]
): number {
  if (!targetCombatant.position) return 0

  const foes = allCombatants
    .filter(c => c.id !== targetCombatant.id)
    .filter(c => c.position != null)
    .filter(c => isEnemySide(targetCombatant.side, c.side))
    .filter(c => {
      const hp = c.entity.currentHp ?? 0
      const isDead = (c.entity.statusConditions ?? []).includes('Dead')
      return hp > 0 && !isDead
    })
    .map(c => ({
      id: c.id,
      position: c.position!,
      size: c.tokenSize || 1,
    }))

  const result = checkFlanking(
    targetCombatant.position,
    targetCombatant.tokenSize || 1,
    foes
  )

  return result.isFlanked ? 2 : 0
}
```

### Modified: `app/utils/evasionCalculation.ts`

Add flanking awareness to the centralized evasion calculation utility:

```typescript
/**
 * Compute target evasions with optional flanking penalty.
 *
 * @param target - The target combatant
 * @param deps - Evasion calculation dependencies
 * @param flankingPenalty - Evasion penalty from flanking (default 0)
 * @returns Evasion values with flanking applied
 */
export function computeTargetEvasions(
  target: Combatant,
  deps: EvasionDependencies,
  flankingPenalty: number = 0
): { physical: number; special: number; speed: number } {
  // ... existing evasion computation ...

  return {
    physical: Math.max(0, physical - flankingPenalty),
    special: Math.max(0, special - flankingPenalty),
    speed: Math.max(0, speed - flankingPenalty),
  }
}
```

---

## K. Flanking Indicator in CombatantCard

### Modified: `app/components/encounter/CombatantCard.vue`

Add a "Flanked" status badge to the combatant card when the combatant is flanked. This provides non-VTT visibility of the flanking state.

```vue
<!-- In CombatantCard template, after status conditions section -->
<div v-if="isFlanked" class="combatant-card__flanking">
  <span class="flanking-badge">Flanked</span>
</div>
```

```typescript
// In CombatantCard script setup:
const props = defineProps<{
  combatant: Combatant
  isCurrent: boolean
  isGm: boolean
  isFlanked?: boolean  // Optional: provided by parent when VTT is active
}>()
```

```scss
// Flanking badge style
.flanking-badge {
  display: inline-block;
  padding: 2px $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-warning;
  background: rgba($color-warning, 0.2);
  border: 1px solid rgba($color-warning, 0.4);
  border-radius: $border-radius-sm;
}

.combatant-card__flanking {
  margin-bottom: $spacing-xs;
}
```

### Parent Integration

The encounter page (GM view) passes the flanking status to each CombatantCard:

```vue
<!-- In GM encounter page combatant list -->
<CombatantCard
  v-for="combatant in sortedCombatants"
  :key="combatant.id"
  :combatant="combatant"
  :is-current="isCurrentTurn(combatant.id)"
  :is-gm="true"
  :is-flanked="isTargetFlanked(combatant.id)"
  @damage="handleDamage"
  <!-- ... other handlers -->
/>
```

---

## L. WebSocket Flanking Sync

### Flanking State Broadcasting

When flanking state changes (detected by the watcher in section I), broadcast the update to all connected clients so the Group View and Player View can display flanking indicators.

### New WebSocket Event: `flanking_update`

**Payload:**
```typescript
{
  type: 'flanking_update',
  encounterId: string,
  flankingMap: FlankingMap  // Full map for simplicity (small payload)
}
```

### Modified: `app/server/routes/ws.ts`

Add `flanking_update` to the relay events. This is a simple relay -- the GM client computes flanking and broadcasts the result.

```typescript
// In the WebSocket message handler, add to relay types:
case 'flanking_update':
  broadcastToEncounter(ws, data.encounterId, data)
  break
```

### Client-Side Broadcast

```typescript
// In the GM VTT component, on flanking change:
const broadcastFlankingChange = (
  combatantId: string,
  isFlanked: boolean,
  flankerIds: string[]
) => {
  const ws = useWebSocket()
  if (ws.connected && encounterStore.encounter) {
    ws.send({
      type: 'flanking_update',
      encounterId: encounterStore.encounter.id,
      flankingMap: flankingMap.value,
    })
  }
}
```

### Group View Reception

The Group View receives `flanking_update` events and uses the flanking map to render indicators on the group VTT grid.

```typescript
// In GroupGridCanvas.vue or group encounter page:
const receivedFlankingMap = ref<FlankingMap>({})

// WebSocket handler:
ws.on('flanking_update', (data) => {
  receivedFlankingMap.value = data.flankingMap
  renderGrid()
})
```

---

## Summary of File Changes (P2)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/composables/useFlankingDetection.ts` | Add watcher for flanking transitions, event callbacks |
| **EDIT** | `app/composables/useMoveCalculation.ts` | Wire up flanking penalty in all VTT contexts |
| **EDIT** | `app/server/api/encounters/[id]/calculate-damage.post.ts` | Server-side flanking detection and penalty |
| **EDIT** | `app/utils/evasionCalculation.ts` | Accept flanking penalty parameter |
| **EDIT** | `app/components/encounter/CombatantCard.vue` | Add `isFlanked` prop and "Flanked" badge |
| **EDIT** | `app/server/routes/ws.ts` | Relay `flanking_update` events |
| **EDIT** | GM encounter page | Pass `isFlanked` to CombatantCard |
| **EDIT** | Group VTT component | Receive and render flanking from WebSocket |
