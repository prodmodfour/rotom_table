---
ticket_id: decree-need-049
title: "Does Sprint consume the Shift Action in addition to the Standard Action?"
domain: combat
topic: sprint-shift-action-consumption
severity: MEDIUM
priority: P3
source: rules-review-ptu-rule-121 (M1)
created_by: game-logic-reviewer
created_at: 2026-03-05
status: addressed
decree_id: decree-050
tags: [combat, sprint, action-economy, maneuver]
---

## The Ambiguity

PTU p.245 lists Sprint as:
> Maneuver: Sprint / Action: Standard / Class: Status / Range: Self / Effect: Increase your Movement Speeds by 50% for the rest of your turn.

Sprint is listed as "Action: Standard" -- NOT as a Full Action. PTU p.227 explicitly defines Full Actions as consuming "both your Standard Action and Shift Action" and lists three: Take a Breather, Coup de Grace, and Intercept. Sprint is not among them.

However, the current implementation (`sprint.post.ts`) sets both `standardActionUsed: true` AND `shiftActionUsed: true`. The rationale in the code comment is: "Sprint uses the Standard Action, and the Sprint movement IS the shift."

## Options

### Option A: Sprint consumes Standard Action only (strict RAW)
Sprint costs only the Standard Action. The combatant still has their Shift Action available to move at +50% speed. This gives Sprint more flexibility -- the combatant can choose whether to use their shift to move or for another shift-eligible action.

### Option B: Sprint consumes Standard + Shift Actions (current implementation)
Sprint effectively works like a Full Action, consuming both Standard and Shift. The reasoning is that Sprint's purpose is enhanced movement, and the +50% movement IS the shift. This is simpler for the UI and prevents odd situations where a combatant sprints and then also takes a separate shift.

## Context

- The `breather.post.ts` endpoint follows the same pattern (Standard + Shift), but Take a Breather is explicitly a Full Action per RAW.
- The `combatManeuvers.ts` constant lists Sprint as `actionType: 'standard'`.
- The client-side `useEncounterActions.ts` groups Sprint under the standard-action maneuvers (line 199) but also calls the server endpoint which sets both actions.
- Errata (`errata-2.md`) does not modify Sprint's action cost.

## Impact

If Option A is chosen: Remove `shiftActionUsed: true` from `sprint.post.ts` line 47. The combatant would still have a Shift Action available after sprinting.

If Option B is confirmed: Add a code comment citing the decree. No code change needed.
