# P2: Auto-Cure Conditions, Weather Interactions, Ability Prep

## Scope

Implement automatic condition curing triggered by game events (fire thaw, wake on damage), finalize weather interactions for save checks, and add the foundation for ability-based status interactions (Guts, Marvel Scale, Shed Skin, etc.) that future features can build on.

---

## PTU Rules

### Fire Thaw (PTU p.246)
> "If a Frozen Target is hit by a Damaging Fire, Fighting, Rock, or Steel Attack, they are cured of the Frozen Condition."

### Wake on Damage (PTU p.247)
> "Whenever a Sleeping Pokemon takes Damage or loses life from an Attack, they wake up. This does not include loss of life from passive sources such as Poison or Burns, but active attacks and effects that cause Hit Point loss (such as being hit by the Press Feature, or Super Fang) would wake up their target."

### Bad Sleep Cleanup (PTU p.247)
> "Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep."

### Faint Clears All (PTU p.248)
> "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."

(Already implemented in `applyDamageToEntity()`)

### Weather-Based Save Modifiers (PTU p.246)
> "Save Checks to cure [Frozen] receive a +4 Bonus in Sunny Weather, and a -2 Penalty in Hail."

(Already designed in P1 for the Frozen save check evaluation.)

---

## Design Decisions

### D1: Fire thaw checks happen in the damage application path

When a combatant takes damage from a move, the damage endpoint already knows the move's type. After applying damage, if the target has Frozen and the move type is Fire, Fighting, Rock, or Steel, the server auto-cures Frozen.

This check goes in the move execution flow — specifically in the endpoint that applies move damage to targets. It fires AFTER damage is applied (the target takes the hit AND is thawed).

### D2: Wake on damage checks happen in the damage application path

When a Sleeping combatant takes damage from an **attack** (not passive sources), they wake up. The damage endpoint must distinguish between:
- **Attack damage:** Moves, Struggle Attacks, confusion self-hit, held item damage (wake up)
- **Passive damage:** Burn tick, Poison tick, Badly Poisoned tick, Cursed tick, Bad Sleep tick, weather damage (do NOT wake up)

The tick damage processing in `next-turn.post.ts` (P0) should NOT trigger wake-on-damage. Only the move/damage endpoints should trigger it.

**Implementation:** Add a `source` parameter to the damage application path: `'attack'` vs `'passive'`. Only `'attack'` source triggers wake-on-damage for Sleeping targets.

### D3: Bad Sleep auto-cleanup on Sleep cure

Whenever Sleep is removed (save check, manual cure, wake on damage, faint), Bad Sleep is also removed. This is a simple follow-on check in every code path that removes Sleep.

The `updateStatusConditions()` function in `combatant.service.ts` is the canonical place. When `Asleep` is in the `removeStatuses` array, automatically add `Bad Sleep` to the removal list if the combatant has it.

### D4: Ability interactions are UI-informational only (for now)

Abilities like Guts (+2 Atk CS when Burned), Marvel Scale (+2 Def CS when any persistent status), and Shed Skin (30% chance to cure status each turn) are complex and ability-specific. This tier prepares the infrastructure but does NOT automate ability effects.

**What P2 does:** Adds a `STATUS_INTERACTION_ABILITIES` constant mapping ability names to their effects. The UI can display warnings like "This Pokemon has Guts — consider +2 Atk CS" when a status condition is applied. The GM still applies the ability effects manually.

**Why not automate?** There are dozens of status-interacting abilities with varied triggers, and the app doesn't currently parse ability text into structured data. Automating even the top 5 abilities would require:
1. Structured ability data (currently free-text)
2. Trigger detection (on status apply, on turn start, on damage)
3. Effect execution (CS changes, status cures, stat modifications)

This is a separate feature (candidate for feature-011 or similar).

### D5: Weather damage is out of scope

Weather-based HP loss (Hail: non-Ice lose 1 tick, Sandstorm: non-Rock/Ground/Steel lose 1 tick) is a separate mechanic from status condition automation. It follows a similar pattern (tick damage at turn end) but is triggered by weather, not status conditions. It should be its own feature ticket.

---

## Implementation Plan

### Step 1: Fire Thaw — auto-cure Frozen on fire/fighting/rock/steel hit

**File:** `app/server/api/encounters/[id]/damage.post.ts` (or whichever endpoint applies move damage)

After applying damage to a target, check for fire thaw:

```typescript
import { FROZEN_THAW_TYPES } from '~/constants/statusConditions'

// After damage is applied to each target:
if (target.entity.statusConditions?.includes('Frozen') && moveType) {
  if (FROZEN_THAW_TYPES.includes(moveType)) {
    // Auto-cure Frozen
    const statusResult = updateStatusConditions(target, [], ['Frozen'])
    await syncEntityToDatabase(target, {
      statusConditions: statusResult.current,
      stageModifiers: target.entity.stageModifiers
    })

    // Log and broadcast
    autoCureEvents.push({
      combatantId: target.id,
      combatantName: getCombatantName(target),
      condition: 'Frozen',
      reason: `Hit by ${moveType}-type move`
    })
  }
}
```

**Constant:**
```typescript
// app/constants/statusConditions.ts
export const FROZEN_THAW_TYPES: string[] = ['Fire', 'Fighting', 'Rock', 'Steel']
```

### Step 2: Wake on Damage — auto-cure Sleep when hit by an attack

**File:** `app/server/api/encounters/[id]/damage.post.ts`

After applying damage to a target from an attack source:

```typescript
// After damage is applied to each target (attack damage only, NOT tick/passive):
if (target.entity.statusConditions?.includes('Asleep') && damageSource === 'attack') {
  // Wake up
  const removeStatuses: StatusCondition[] = ['Asleep']

  // Bad Sleep is auto-cured with Sleep
  if (target.entity.statusConditions.includes('Bad Sleep')) {
    removeStatuses.push('Bad Sleep')
  }

  const statusResult = updateStatusConditions(target, [], removeStatuses)
  await syncEntityToDatabase(target, {
    statusConditions: statusResult.current,
    stageModifiers: target.entity.stageModifiers
  })

  autoCureEvents.push({
    combatantId: target.id,
    combatantName: getCombatantName(target),
    condition: 'Asleep',
    reason: 'Took damage from an attack'
  })
}
```

**Key distinction:** The `damageSource` parameter must be threaded through the damage application path. Move damage = `'attack'`. Tick damage from `next-turn.post.ts` = `'passive'`. The confused self-hit from `save-check.post.ts` = `'attack'` (it IS a Struggle Attack, but a sleeping target can't be confused per E1 in P1, so this is academic).

### Step 3: Bad Sleep auto-cleanup in updateStatusConditions

**File:** `app/server/services/combatant.service.ts`

In `updateStatusConditions()`, add an automatic cascading removal:

```typescript
// After removing statuses, check for cascading removals:
// Bad Sleep is automatically cured when Sleep is cured (PTU p.247)
if (actuallyRemoved.includes('Asleep') && currentStatuses.includes('Bad Sleep')) {
  currentStatuses = currentStatuses.filter(s => s !== 'Bad Sleep')
  actuallyRemoved.push('Bad Sleep')
}
```

This centralizes the cleanup so every code path that removes Sleep (save check, manual cure, wake on damage, faint) automatically cleans up Bad Sleep.

### Step 4: Add auto-cure WebSocket broadcast

When a condition is auto-cured (fire thaw, wake on damage), broadcast the `condition_auto_cure` event:

```typescript
// In the damage endpoint, after processing auto-cures:
for (const cure of autoCureEvents) {
  broadcastToEncounter(encounterId, {
    type: 'condition_auto_cure',
    data: cure
  })
}
```

### Step 5: Add move log entries for auto-cures

```typescript
moveLog.push({
  id: uuidv4(),
  timestamp: new Date(),
  round: currentRound,
  actorId: cure.combatantId,
  actorName: cure.combatantName,
  moveName: `${cure.condition} Auto-Cured`,
  damageClass: 'Status',
  targets: [],
  notes: cure.reason
})
```

### Step 6: Weather interaction constants

**File:** `app/constants/statusConditions.ts`

```typescript
/**
 * Weather modifiers for status condition save checks.
 * Key: weather name. Value: { condition, modifier }
 * Modifier is added to the save check roll (positive = easier to save).
 */
export const WEATHER_SAVE_MODIFIERS: ReadonlyArray<{
  weather: string
  condition: StatusCondition
  modifier: number
  description: string
}> = [
  { weather: 'Sunny', condition: 'Frozen', modifier: 4, description: '+4 to Frozen save in Sunny weather' },
  { weather: 'Sun', condition: 'Frozen', modifier: 4, description: '+4 to Frozen save in Sunny weather' },
  { weather: 'Hail', condition: 'Frozen', modifier: -2, description: '-2 to Frozen save in Hail' }
] as const
```

### Step 7: Ability interaction reference constants (informational)

**File:** `app/constants/statusConditions.ts`

```typescript
/**
 * Abilities that interact with status conditions.
 * Used for UI informational display only — not automated.
 *
 * Future feature can consume this to automate ability effects.
 */
export const STATUS_INTERACTION_ABILITIES: ReadonlyArray<{
  ability: string
  trigger: 'on_status_apply' | 'on_turn_start' | 'while_status_active'
  conditions: StatusCondition[] | 'any_persistent'
  effect: string
}> = [
  {
    ability: 'Guts',
    trigger: 'while_status_active',
    conditions: 'any_persistent',
    effect: '+2 Attack CS while afflicted with a Persistent status'
  },
  {
    ability: 'Marvel Scale',
    trigger: 'while_status_active',
    conditions: 'any_persistent',
    effect: '+2 Defense CS while afflicted with a Persistent status'
  },
  {
    ability: 'Shed Skin',
    trigger: 'on_turn_start',
    conditions: 'any_persistent',
    effect: '30% chance to cure one Persistent status at turn start'
  },
  {
    ability: 'Natural Cure',
    trigger: 'on_status_apply',
    conditions: 'any_persistent',
    effect: 'Cure all Persistent statuses when recalled to Poke Ball'
  },
  {
    ability: 'Synchronize',
    trigger: 'on_status_apply',
    conditions: ['Burned', 'Paralyzed', 'Poisoned'],
    effect: 'When afflicted with Burn/Paralysis/Poison, the attacker receives the same condition'
  },
  {
    ability: 'Magic Guard',
    trigger: 'while_status_active',
    conditions: ['Burned', 'Poisoned', 'Badly Poisoned'],
    effect: 'Immune to indirect damage (no Burn/Poison tick damage)'
  },
  {
    ability: 'Poison Heal',
    trigger: 'while_status_active',
    conditions: ['Poisoned', 'Badly Poisoned'],
    effect: 'Heals 1 tick HP instead of taking Poison damage'
  },
  {
    ability: 'Quick Feet',
    trigger: 'while_status_active',
    conditions: 'any_persistent',
    effect: '+2 Speed CS while afflicted with a Persistent status'
  },
  {
    ability: 'Flare Boost',
    trigger: 'while_status_active',
    conditions: ['Burned'],
    effect: '+2 Special Attack CS while Burned'
  },
  {
    ability: 'Toxic Boost',
    trigger: 'while_status_active',
    conditions: ['Poisoned', 'Badly Poisoned'],
    effect: '+2 Attack CS while Poisoned'
  }
] as const
```

### Step 8: UI helper — ability warning on status application

**File:** `app/composables/useStatusAbilityWarning.ts` (new)

A composable that checks a combatant's abilities against the `STATUS_INTERACTION_ABILITIES` list and returns informational warnings.

```typescript
export function useStatusAbilityWarning() {
  /**
   * Check if a combatant has abilities that interact with a status condition.
   * Returns human-readable warning strings for the GM.
   */
  function getAbilityWarnings(combatant: Combatant, condition: StatusCondition): string[] {
    const abilities: string[] = combatant.type === 'pokemon'
      ? (combatant.entity as Pokemon).abilities.map(a => a.name)
      : []

    return STATUS_INTERACTION_ABILITIES
      .filter(entry => {
        if (!abilities.includes(entry.ability)) return false
        if (entry.conditions === 'any_persistent') {
          return PERSISTENT_CONDITIONS.includes(condition)
        }
        return entry.conditions.includes(condition)
      })
      .map(entry => `${entry.ability}: ${entry.effect}`)
  }

  return { getAbilityWarnings }
}
```

---

## Edge Cases

### E1: Fire thaw from ally attacks
A player intentionally hits their own Frozen Pokemon with a weak Fire move to thaw them. The thaw check should fire regardless of which side the attacker is on.

### E2: Multi-target move with mixed statuses
A Fire-type AoE hits 3 targets: one is Frozen (thaw), one is Asleep (wake up), one is healthy (nothing). Each target is processed independently.

### E3: Wake on damage does NOT trigger from confused self-hit (when asleep)
Per P1 edge case E1, a Sleeping combatant cannot be Confused (Sleep suppresses Confusion checks). So this case cannot arise in practice.

### E4: Damage kills and triggers faint-clear before auto-cure
If the damage faints the target, `applyDamageToEntity()` already clears all Persistent/Volatile conditions. The fire thaw / wake on damage check should verify the condition still exists after damage application. If the target fainted, the condition is already cleared — no need to double-process.

### E5: Confusion self-hit does NOT wake from Sleep
The confused self-hit is an Attack, but per E3 above, Sleep suppresses Confusion. This case is impossible. If somehow both are active, the self-hit IS an attack and would normally wake the target — but the save check ordering in P1 already handles this by skipping Confusion when asleep.

### E6: Auto-cure during League Battle resolution
Fire thaw and wake on damage can happen during any phase — they trigger on damage application, which can happen during trainer resolution or pokemon phases. No special handling needed.

### E7: Magic Guard blocks tick damage
When a combatant has Magic Guard, Burn/Poison tick damage should be skipped. This is listed in the ability reference constants but NOT automated in P2. The GM must manually account for this. Future ability automation can check for Magic Guard in `getTickDamageEntries()`.

### E8: Poison Heal reverses Poison tick
When a combatant has Poison Heal, they heal 1 tick instead of taking Poison damage. This is NOT automated in P2. The GM must manually account for this. Listed in ability reference for future automation.

---

## Acceptance Criteria

- [ ] Frozen combatant hit by Fire/Fighting/Rock/Steel move is auto-cured
- [ ] Sleeping combatant hit by an attack wakes up
- [ ] Sleeping combatant does NOT wake from Burn/Poison/Badly Poisoned tick damage
- [ ] Bad Sleep auto-removed whenever Sleep is cured (any code path)
- [ ] Auto-cure events logged to moveLog
- [ ] Auto-cure events broadcast via WebSocket
- [ ] `FROZEN_THAW_TYPES` constant exported from statusConditions.ts
- [ ] `WEATHER_SAVE_MODIFIERS` constant exported from statusConditions.ts
- [ ] `STATUS_INTERACTION_ABILITIES` constant exported for UI reference
- [ ] Ability warnings displayed when applying status to Pokemon with relevant abilities
- [ ] Auto-cure skipped if target faints from the triggering damage (faint-clear handles it)
- [ ] Fire thaw works regardless of attacker's side (ally thaw strategy)
