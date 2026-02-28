---
id: decree-need-034
title: "Forced switch (Roar/Whirlwind): does 8m recall beam range apply?"
priority: P2
severity: LOW
domain: combat
source: design-pokemon-switching-001/spec-p1.md (Section I)
created_by: slave-collector (plan-20260228-173500)
---

# decree-need-034: Forced Switch and Recall Range

## Ambiguity

The switching design says forced switches (Roar, Whirlwind) still require the trainer to be within 8m recall range in Full Contact mode. If out of range, "the move still hits but the switch doesn't happen."

PTU Roar/Whirlwind descriptions do not mention recall range. The move text simply says the target is forced to switch out.

## Interpretations

1. **Range applies (design default):** Forced switches respect the 8m recall beam range. If the trainer is too far, the move hits but the switch fails.
2. **Range bypassed:** The MOVE forces the return, not the trainer's Poke Ball. The game mechanic overrides the physical constraint.

## Impact

Edge case for Full Contact battles on large VTT maps. Affects whether Roar/Whirlwind can always force a switch or if positioning can counter it.

## Blocking

Blocks implementation of forced switch in feature-011 (Pokemon Switching Workflow, P1 tier).
