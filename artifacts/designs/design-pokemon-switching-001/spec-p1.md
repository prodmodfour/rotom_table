# P1 Specification: League Mode Restrictions & Fainted Switch

P1 covers League Battle switching restrictions, fainted Pokemon switching as a Shift Action, forced switch exemptions, and batch recall/release.

**Prerequisites:** P0 must be implemented first (switch endpoint, range check, initiative insertion).

---

## G. League Battle Switch Restriction

### PTU Rule (p.229)

> "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon."

### Implementation

The `TurnState.canBeCommanded` field already exists on every combatant (initialized to `true` in `buildCombatantFromEntity` and `resetCombatantsForNewRound`). The switching endpoint sets this to `false` on the newly released Pokemon when conditions are met.

**In `app/server/api/encounters/[id]/switch.post.ts`:**

After building the new combatant (step 4 of P0 execution), apply the League restriction:

```typescript
// After building newCombatant and inserting into turn order:

const isLeagueBattle = encounter.battleType === 'trainer'
const isFaintedSwitch = body.faintedSwitch === true
const isForcedSwitch = body.forced === true

// League restriction: switched Pokemon cannot act this round
// Exceptions: fainted switch, forced switch (Roar, etc.)
if (isLeagueBattle && !isFaintedSwitch && !isForcedSwitch) {
  newCombatant.turnState.canBeCommanded = false
}
```

### Turn Progression Integration

The `next-turn.post.ts` already resets `canBeCommanded` to `true` at the start of each new round (via `resetCombatantsForNewRound`). No change needed for round reset.

During Pokemon phase turn progression, combatants with `canBeCommanded = false` should be auto-skipped. Add a skip check in `next-turn.post.ts`:

```typescript
// In the pokemon phase section of League Battle turn progression:
// After advancing to next Pokemon, skip those that cannot be commanded

if (currentPhase === 'pokemon') {
  currentTurnIndex = skipUncommandablePokemon(
    currentTurnIndex, turnOrder, combatants
  )
}
```

**New helper function in `next-turn.post.ts`:**

```typescript
/**
 * Auto-skip Pokemon that cannot be commanded this round.
 * This occurs when a Pokemon was switched in during a League Battle
 * and the switch was NOT a fainted/forced switch.
 *
 * PTU p.229: "they cannot command the Pokemon that was Released as
 * part of the Switch for the remainder of the Round"
 */
function skipUncommandablePokemon(
  startIndex: number,
  turnOrder: string[],
  combatants: any[]
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const combatant = combatants.find((c: any) => c.id === combatantId)
    if (!combatant) { index++; continue }
    // Skip if cannot be commanded AND not fainted (fainted skip is separate)
    if (combatant.turnState?.canBeCommanded === false && combatant.entity.currentHp > 0) {
      // Mark as having acted (they skip their turn, not just skip in display)
      combatant.hasActed = true
      index++
      continue
    }
    break
  }
  return index
}
```

### League Declaration Integration

When a trainer declares a `switch_pokemon` action during the declaration phase (decree-021), the switch itself is executed during the resolution phase. The `canBeCommanded = false` restriction is applied at resolution execution time, NOT at declaration time. This means:

1. During `trainer_declaration`: trainer declares `switch_pokemon`
2. During `trainer_resolution`: GM executes the switch via the switch endpoint
3. The switch endpoint applies `canBeCommanded = false` on the released Pokemon
4. During `pokemon` phase: the released Pokemon is auto-skipped

### UI Indication

The encounter turn panel should visually indicate when a Pokemon cannot be commanded:
- Show a "Cannot Act (Switched In)" label next to the Pokemon in the initiative order
- Dim the Pokemon's entry in the turn order sidebar
- When the auto-skip happens, briefly show a notification: "[Pokemon] cannot act this round (League switch restriction)"

---

## H. Fainted Pokemon Switch (Shift Action)

### PTU Rule (p.229)

> "Trainers may Switch out Fainted Pokemon as a Shift Action."

A fainted switch is cheaper than a full switch:
- Costs a **Shift Action** (not Standard)
- The trainer still has their Standard Action available for other uses (throw a Poke Ball, use a move, etc.)
- In League Battles, the replacement Pokemon CAN be commanded this round (exemption from Section G)

### Implementation

The P0 switch endpoint already accepts `faintedSwitch: boolean` in the request body. In P1, this flag is enforced:

**Validation changes in `switch.post.ts`:**

```typescript
if (body.faintedSwitch) {
  // Validate: recalled Pokemon must actually be fainted
  const recalledEntity = recalledCombatant.entity
  if (recalledEntity.currentHp > 0) {
    throw createError({
      statusCode: 400,
      message: 'Cannot use fainted switch: Pokemon is not fainted'
    })
  }

  // Validate: trainer must have Shift Action available
  const trainer = findCombatant(combatants, body.trainerId)
  if (trainer.turnState.shiftActionUsed) {
    throw createError({
      statusCode: 400,
      message: 'No Shift Action available for fainted switch'
    })
  }

  // Use Shift Action instead of Standard
  markActionUsed(trainer, 'shift')
} else {
  // Normal switch: validate and use Standard Action (P0 behavior)
  // ...existing P0 validation...
}
```

**Who initiates a fainted switch?**

Unlike a full switch (which can be initiated by either trainer or Pokemon), a fainted switch is always initiated by the **trainer** on their turn. A fainted Pokemon cannot initiate its own switch (it's fainted).

Per the Full Contact example (PTU p.230): "Trainer A recalls the Fainted Sandshrew as a Shift Action, and sends out Hoppip again as a Free Action. Since Sandshrew was fainted, no turn is lost."

This is modeled as:
- The recall of the fainted Pokemon = Shift Action
- The release of the replacement = treated as part of the same action (no additional cost)

The switch endpoint handles this by consuming only the Shift Action when `faintedSwitch = true`.

**Switch Action record:**

```typescript
const switchAction: SwitchAction = {
  // ...
  actionType: 'fainted_switch',
  actionCost: 'shift',
  forced: false
}
```

### Fainted Switch Timing

A fainted switch can be performed on the trainer's turn at any point during the round. It does NOT need to be the trainer's current turn in the initiative order — the trainer can perform it whenever a Pokemon faints (as a reaction, essentially). However, for simplicity in P1, we enforce that it happens on the trainer's turn.

Future consideration (P2 or later): Allow fainted switch as an immediate reaction when a Pokemon faints during any combatant's turn.

---

## I. Forced Switch Exemption

### PTU Rule (p.229)

> "...unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon."

Moves like Roar force the target to switch Pokemon. (Note: Whirlwind is a push, not a forced switch per decree-034. Dragon Tail and Circle Throw forced switch behavior is TBD — no decree yet.) These forced switches:
- Are NOT initiated by the trainer (the opponent forces it)
- Do NOT cost the trainer an action
- In League Battles, the replacement Pokemon CAN be commanded this round

### Implementation

The switch endpoint accepts `forced: boolean` in the request body. When `forced = true`:

```typescript
if (body.forced) {
  // Forced switch: no action cost
  // Do NOT mark any action as used on the trainer
  // In League Battles: canBeCommanded = true (exemption)

  const switchAction: SwitchAction = {
    // ...
    actionType: 'forced_switch',
    actionCost: 'shift', // Recorded as shift for logging, but not actually consumed
    forced: true
  }
}
```

**Forced switch validation differences:**
- No action availability check (forced doesn't cost an action)
- No turn check (can happen on any combatant's turn)
- Range check still applies in Full Contact (the Pokemon must be in recall range; if out of range, the forced switch fails — the move still hits but the switch doesn't happen)

**UI for forced switches:**

When a move with a forced switch effect is executed, the GM clicks a "Force Switch" button on the target trainer. This opens the SwitchPokemonModal in "forced" mode, where:
- The recalled Pokemon is pre-selected (the move target)
- The replacement is random or chosen by the target's player (depending on the move)
- For Roar: random replacement (GM picks)
- For Dragon Tail/Circle Throw: TBD (no decree yet, likely same as Roar)

---

## J. Standard Action to Recall/Release Two at Once

### PTU Rule (p.229)

> "A Trainer may also spend a Standard Action to Recall two Pokemon or Release two Pokemon at once."

This is a batch operation:
- **Batch Recall**: Standard Action to recall two Pokemon simultaneously
- **Batch Release**: Standard Action to release two Pokemon simultaneously
- These are NOT full switches — they are individual recall or release operations

### Implementation

This is handled by the P2 recall/release endpoints (Section L) with a `count` parameter:

```typescript
// POST /api/encounters/:id/recall
{
  trainerId: string
  pokemonCombatantIds: string[]  // 1 for Shift Action, 2 for Standard Action
}

// POST /api/encounters/:id/release
{
  trainerId: string
  pokemonEntityIds: string[]  // 1 for Shift Action, 2 for Standard Action
}
```

**Action cost rules:**
- 1 Pokemon recalled/released = Shift Action
- 2 Pokemon recalled/released simultaneously = Standard Action

**Validation:**
- Cannot recall/release more than 2 at once
- All Pokemon must belong to the trainer
- Released Pokemon must not already be in the encounter
- Range check applies to all recalled Pokemon individually

The batch logic is straightforward: iterate over the array, apply the individual operation for each, then consume the appropriate action type based on count.

In P1, the switch endpoint only handles the common case (recall one + release one). The batch recall/release endpoints are deferred to P2 (Section L) since they are separate actions, not full switches.
