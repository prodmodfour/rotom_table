---
id: decree-need-032
title: "Cursed tick: fires when prevented from Standard Action, or only on actual use?"
priority: P1
severity: MEDIUM
domain: combat
source: design-status-automation-001/spec-p0.md (decision D1)
created_by: slave-collector (plan-20260228-173500)
---

# decree-need-032: Cursed Tick — Prevented Action Trigger

## Ambiguity

PTU Cursed text says: "If a Cursed Target takes a Standard Action, they lose 1/4th of their Max HP."

Burn and Poison explicitly say "takes a Standard Action **or is prevented from taking one**." The Cursed text does NOT include the "or is prevented" clause.

## Interpretations

1. **Strict reading (design-status-automation-001 default):** Cursed ONLY ticks when the combatant actually uses a Standard Action. If they're Frozen/Asleep and can't act, no Cursed tick.
2. **Broad reading:** "Takes a Standard Action" includes the turn where they would have taken one but were prevented. Cursed ticks every turn regardless.

## Impact

If interpretation 2 is correct, Cursed damage output is significantly higher since it fires even on skipped turns (Frozen, Sleep, Paralysis skip). This changes the balance of Curse as a combat debuff.

## Blocking

Blocks implementation of Cursed tick damage in feature-010 (Status Condition Automation Engine, P0 tier).
