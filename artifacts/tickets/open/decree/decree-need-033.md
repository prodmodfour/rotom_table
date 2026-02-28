---
id: decree-need-033
title: "Fainted switch timing: immediate reaction or wait for trainer's turn?"
priority: P1
severity: MEDIUM
domain: combat
source: design-pokemon-switching-001/spec-p1.md (Section H)
created_by: slave-collector (plan-20260228-173500)
---

# decree-need-033: Fainted Switch Timing

## Ambiguity

PTU says: "Trainers may Switch out Fainted Pokemon as a Shift Action." It does not specify WHEN this Shift Action can be taken — immediately upon fainting (as a reaction) or only on the trainer's next turn.

## Interpretations

1. **On-turn-only (design-pokemon-switching-001 P1 default):** The fainted switch happens on the trainer's next turn in initiative. The fainted Pokemon remains on the field until then.
2. **Immediate reaction:** The trainer can switch the fainted Pokemon immediately when it faints, regardless of initiative order. This is essentially a "free reaction" that interrupts normal turn flow.

## Impact

Significant gameplay difference. Immediate switching means no gap in the trainer's team on the field. On-turn-only means there could be rounds where the trainer has fewer active Pokemon than intended.

## Blocking

Blocks implementation of fainted switch in feature-011 (Pokemon Switching Workflow, P1 tier).
