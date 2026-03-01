---
decree_id: decree-040
status: active
domain: combat
topic: flanking-penalty-after-evasion-cap
title: "Flanking -2 evasion penalty applies after the evasion cap, not before"
ruled_at: 2026-03-01T22:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-039
implementation_tickets: []
tags: [combat, flanking, evasion, evasion-cap, accuracy, penalty-ordering]
---

# decree-040: Flanking -2 evasion penalty applies after the evasion cap, not before

## The Ambiguity

PTU p.232 states flanked combatants "take a -2 penalty to their Evasion." The evasion cap is 9. Two valid interpretations exist for the order of operations: apply the penalty before capping (reducing the pre-cap value) or after capping (reducing the already-capped value).

Source: decree-need-039, surfaced by rules-review-230 MED-2 during feature-014 P0 review.

## Options Considered

### Option A: Penalty before cap (less impactful)
Apply the -2 penalty to the raw evasion value, then cap at 9. Example: evasion 11 - 2 = 9, capped at 9 = **9**. This means targets with raw evasion >= 11 are completely immune to the flanking penalty's accuracy benefit. Pros: stricter reading of penalty-then-cap ordering. Cons: eliminates flanking's tactical value against high-evasion targets.

### Option B: Penalty after cap (current implementation)
Cap evasion at 9, then apply the -2 penalty. Example: evasion 11, capped at 9, then 9 - 2 = **7**. Flanking always reduces the effective evasion by 2 regardless of the raw value. Pros: flanking remains tactically meaningful at all evasion levels. Cons: penalty can push evasion below the level implied by the raw stat.

## Ruling

**The true master decrees: the flanking -2 evasion penalty applies AFTER the evasion cap of 9, ensuring flanking always provides a meaningful accuracy benefit.**

The penalty is applied post-cap in `useMoveCalculation.ts`. This means:
- `effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty`
- A flanked target with raw evasion 11 has effective evasion 7 (capped to 9, then -2)
- A flanked target with raw evasion 5 has effective evasion 3 (no cap, then -2)

This preserves the tactical reward of positioning two attackers on opposite sides of a target — if flanking had no effect at high evasion, the mechanic would feel broken against strong opponents where it matters most.

## Precedent

Conditional combat penalties (flanking, status conditions, terrain effects) that modify evasion apply AFTER the evasion cap, not before. The cap represents the baseline maximum; penalties reduce from that baseline. This principle should extend to any future evasion-modifying mechanics.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: `app/composables/useMoveCalculation.ts` (already correctly implemented)
- Skills affected: combat reviewers should cite this decree when reviewing evasion-related accuracy calculations
