# Resolution Context Inputs

External values injected into pure effect functions. Effects do not generate random numbers, prompt the player, or query UI state — they receive these as inputs, making them deterministic and testable. Part of the [[game-state-interface]].

## The five input categories

### Accuracy roll

```
accuracyRoll: number  // 1d20 result
```

Injected by the caller before resolution. Used by Thunderbolt (19+ = Paralyze), Rock Slide (17+ = Flinch), Circle Throw (15+ = Trip), and all AC-based moves for hit/miss determination.

### Damage rolls

```
damageRolls: number[]
```

Pre-rolled damage dice. Used by the [[nine-step-damage-formula]] at step 5. Array to support multi-hit moves like Bullet Seed where each hit has its own roll.

### Multi-hit count

```
multiHitCount: number  // 2–5
```

For Five Strike / Double Strike moves. Bullet Seed rolls 2–5 hits, each resolved separately. The count is determined before resolution begins.

### Player decisions

```
playerDecisions: {
  activateBlessing?: BlessingId
  activateMettle?: boolean
  substituteTarget?: EntityId
  ...
}
```

Choices that the player makes during resolution. Safeguard and Light Screen are voluntary activations — the player chooses whether to spend an activation when the trigger occurs. Mettle points can be spent to reroll. These decisions come from the UI interaction layer, not from the effect function.

### Interrupt decisions

```
interruptDecisions: {
  useProtect?: boolean
  useWideGuard?: boolean
  interruptingEntityId?: string
  ...
}
```

Out-of-turn responses. Wide Guard and Protect are Interrupt-keyword effects — they trigger in response to an incoming attack, and the controlling player decides whether to use them. The engine pauses resolution, collects the decision, and injects it.

## Why inputs, not generation

If effects generated their own random numbers, they would be non-deterministic — the same inputs could produce different outputs. This breaks:

- **Testability** — can't assert "Thunderbolt at AC 19 paralyzes" if the roll happens inside the function
- **Replay** — can't reconstruct combat history from a sequence of effect calls
- **Preview** — can't show "this move will deal 15-22 damage" without running the function multiple times

By injecting all external values, the effect function becomes `(gameState, resolutionContext) → StateDelta` — a pure function with deterministic output for every input combination.

## See also

- [[game-state-interface]] — the parent design
- [[state-delta-model]] — effects receive context, produce deltas
- [[nine-step-damage-formula]] — consumes damage rolls and accuracy roll
- [[combat-event-log-schema]] — historical events are also part of the context effects receive
- [[effect-handler-contract]] — resolution context is part of the EffectContext that handlers receive
- [[effect-handler-format]] — handlers read multi-hit count and player decisions from resolution context
