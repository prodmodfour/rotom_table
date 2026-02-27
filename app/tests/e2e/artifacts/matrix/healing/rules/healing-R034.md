---
rule_id: healing-R034
name: Extended Rest — Daily Move Recovery
category: workflow
scope: core
domain: healing
---

## healing-R034: Extended Rest — Daily Move Recovery

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **Dependencies:** healing-R004
- **Errata:** false

## Notes
This rule has a subtle condition: the move must not have been used since the previous day, not merely since the last Extended Rest. This means using a Daily move, taking an Extended Rest the same day, then using it again is not permitted — the Move only refreshes on a new day boundary via Extended Rest.
