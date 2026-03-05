---
decree_id: decree-050
status: active
domain: combat
topic: sprint-action-cost
title: "Sprint consumes only the Standard Action, not the Shift Action"
ruled_at: 2026-03-05T00:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-049
implementation_tickets: [ptu-rule-143]
tags: [combat, sprint, action-economy, maneuver, shift-action]
---

# decree-050: Sprint Consumes Only the Standard Action

## The Ambiguity

The rules-review for ptu-rule-121 (decree-need-049) identified that Sprint is listed in PTU p.245 as "Action: Standard", yet the current implementation consumes both the Standard Action and the Shift Action. PTU p.227 explicitly defines Full Actions (which consume both Standard and Shift) and lists only three: Take a Breather, Coup de Grace, and Intercept. Sprint is not among them.

## Options Considered

### Option A: Standard Action Only (strict RAW)
Sprint costs only the Standard Action per its explicit listing on p.245. The combatant retains their Shift Action for movement (at +50% speed from Sprint) or other shift-eligible actions. More flexible, matches the literal rules text.

### Option B: Standard + Shift (current implementation)
Sprint effectively works like a Full Action, consuming both. The code comment rationale was "the Sprint movement IS the shift." Simpler for the UI, prevents sprint-then-shift scenarios.

## Ruling

**The true master decrees: Sprint consumes only the Standard Action, per strict RAW on PTU p.245.**

Sprint is explicitly listed as a Standard Action, not a Full Action. PTU p.227 is clear about which maneuvers are Full Actions, and Sprint is not one of them. The combatant retains their Shift Action after sprinting, which they may use to move at the boosted +50% speed or for any other shift-eligible action.

## Precedent

When a maneuver's action cost is explicitly stated in PTU, follow the literal text. Do not infer implicit additional action costs based on the maneuver's thematic purpose. Only Full Actions (explicitly listed on p.227) consume both Standard and Shift Actions.

## Implementation Impact

- Tickets created: ptu-rule-143 (remove `shiftActionUsed: true` from sprint.post.ts)
- Files affected: `app/server/api/encounters/[id]/sprint.post.ts`
- Skills affected: Developer, game-logic-reviewer
