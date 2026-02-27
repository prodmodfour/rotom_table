# P2 Specification

## C. HP Marker Injury Detection (P2)

### Problem

`combatant.service.ts:calculateDamage()` only detects **massive damage** injuries (single hit >= 50% maxHP). PTU also awards injuries when HP crosses the 50%, 0%, -50%, -100% markers. The server clamps HP to `Math.max(0, ...)`, making negative HP markers unreachable.

### Solution

Extend `combatant.service.ts:calculateDamage()` to detect HP marker crossings. This is a modification to an existing function, not a new endpoint.

#### Changes to `combatant.service.ts`

1. **Remove the HP >= 0 clamp** (line 46) — allow `newHp` to go negative for marker tracking. Introduce a separate `displayHp` field clamped to 0 for UI purposes, or track `effectiveHp` (negative) alongside `currentHp` (clamped). The display field is the simpler approach.

2. **Add HP marker crossing detection:**

```typescript
/**
 * Count HP markers crossed between previousHp and newHp.
 * Markers: 50%, 0%, -50%, -100%, -150%, ...
 * PTU 07-combat.md:1837-1856
 * Uses REAL maxHp (not injury-reduced maxHp) per PTU rules.
 */
export function countMarkersCrossed(
  previousHp: number,
  newHp: number,
  realMaxHp: number
): { count: number; markers: number[] } {
  const markers: number[] = []
  // Generate marker thresholds: 50%, 0%, -50%, -100%, ...
  const fiftyPercent = Math.floor(realMaxHp * 0.5)
  // Start from 50% marker, go down in 50% steps
  let threshold = fiftyPercent
  while (threshold >= newHp) {
    if (previousHp > threshold && newHp <= threshold) {
      markers.push(threshold)
    }
    threshold -= fiftyPercent
    // Safety: don't loop forever if maxHp is 0 or 1
    if (fiftyPercent === 0 || markers.length > 20) break
  }
  return { count: markers.length, markers }
}
```

3. **Integrate into `calculateDamage()`:**

```typescript
// Existing: massive damage check
const massiveDamageInjury = hpDamage >= maxHp / 2 ? 1 : 0

// New: marker crossing check
const { count: markerInjuries, markers } = countMarkersCrossed(currentHp, newHp, maxHp)

// Total injuries from this hit
const totalNewInjuries = massiveDamageInjury + markerInjuries
```

4. **Extend `DamageResult` type:**

```typescript
export interface DamageResult {
  // ... existing fields ...
  injuryGained: boolean          // any injury from this hit
  massiveDamageInjury: boolean   // injury from >= 50% maxHP single hit
  markerInjuries: number         // injuries from crossing HP markers
  markersCrossed: number[]       // which HP thresholds were crossed
  totalNewInjuries: number       // massiveDamage + markers
  newInjuries: number            // previous injuries + totalNewInjuries
}
```

### Negative HP Considerations

PTU allows HP to go negative. The app currently clamps to 0. Two approaches:

**Option A (recommended): Track effective HP separately.**
Add `effectiveHp` to the combatant entity that can go negative. Keep `currentHp` clamped to 0 for UI display. This avoids cascading UI changes while enabling correct injury tracking.

**Option B: Allow negative currentHp.**
Remove the clamp entirely. All UI code that displays HP would need to handle negative values. Higher risk of unexpected visual glitches.

The Developer and Senior Reviewer should decide which approach to take.

### Test Impact

Tests can verify:
- A single hit from full HP to 0 HP gains 2 injuries (massive damage + crossing 50% marker + crossing 0% marker, minus 1 if not massive)
- The example from the rulebook: full HP to -150% = 6 injuries (1 massive + 5 markers)
- Healing past a marker and taking damage past it again awards another injury

---

