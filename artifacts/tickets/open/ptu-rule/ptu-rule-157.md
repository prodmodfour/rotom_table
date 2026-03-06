---
id: ptu-rule-157
title: "switch.post.ts missing inline Heavily Injured standard-action penalty"
priority: P2
severity: HIGH
status: open
domain: combat
source: rules-review-316
created_by: game-logic-reviewer
created_at: 2026-03-06
---

## Summary

The `switch.post.ts` endpoint performs standard Pokemon switches which cost a Standard Action (PTU p.229). The ptu-rule-151 implementation added inline Heavily Injured standard-action penalties to 9 Standard Action endpoints, but `switch.post.ts` was missed.

## Current Behavior

When a Heavily Injured trainer performs a standard switch:
1. `markActionUsed(updatedInitiator, 'standard')` sets `standardActionUsed: true`
2. `heavilyInjuredPenaltyApplied` is NOT set
3. The deferred check in `next-turn.post.ts` fires at turn end and applies the penalty

The penalty IS applied, but at turn end instead of immediately when the switch occurs.

## Expected Behavior

The penalty should be applied immediately when the Standard Action is consumed (same as all other Standard Action endpoints modified by ptu-rule-151), with `heavilyInjuredPenaltyApplied: true` set to prevent the deferred check from double-applying.

## Impact

Timing inconsistency: a Heavily Injured trainer at exactly `injuries` HP should faint immediately on switching, not survive to potentially take more actions before turn end. The faint timing can affect whether tick damage, weather damage, or other turn-end effects are processed.

## PTU Reference

PTU p.250: "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat... they lose Hit Points equal to the number of Injuries they currently have."

PTU p.229: "A full Pokemon Switch requires a Standard Action."

## Files to Modify

- `app/server/api/encounters/[id]/switch.post.ts` -- Add inline penalty block after `markActionUsed(updatedInitiator, 'standard')` for the standard switch case (lines 307-314), following the same pattern as the other 9 endpoints.
