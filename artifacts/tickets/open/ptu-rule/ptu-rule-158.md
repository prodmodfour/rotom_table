---
id: ptu-rule-158
title: "pass.post.ts incorrectly triggers Heavily Injured deferred penalty"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: rules-review-316
created_by: game-logic-reviewer
created_at: 2026-03-06
---

## Summary

`pass.post.ts` sets `standardActionUsed: true` (line 34) as bookkeeping to mark all actions consumed when a combatant passes their turn. However, passing is NOT "taking a Standard Action" -- it is forfeiting all actions without using them.

The deferred Heavily Injured check in `next-turn.post.ts:123-125` sees `standardActionUsed === true` and `heavilyInjuredPenaltyApplied !== true`, so it fires the penalty. This causes a Heavily Injured combatant to lose HP when they merely pass, which contradicts the PTU rule.

## Current Behavior

A Heavily Injured combatant that passes their turn loses HP equal to their injury count at turn end (via the deferred check in `next-turn.post.ts`).

## Expected Behavior

Passing should NOT trigger the Heavily Injured standard-action penalty. The combatant chose not to act.

## PTU Reference

PTU p.250: "Whenever a Heavily Injured Trainer or Pokemon **takes a Standard Action** during combat..."

Passing does not take a Standard Action. Per decree-032 precedent: "Cursed tick damage fires only when the combatant actually uses a Standard Action." The same principle applies.

## Pre-existing

This bug existed before ptu-rule-151. The deferred check and the pass endpoint both predate the ptu-rule-151 commits. However, the `heavilyInjuredPenaltyApplied` guard introduced by ptu-rule-151 provides a clean fix mechanism.

## Fix Options

**Option A (simplest):** Have `pass.post.ts` set `heavilyInjuredPenaltyApplied: true` to suppress the deferred check. This is semantically incorrect (the penalty wasn't "applied," it was "not applicable") but prevents the false positive.

**Option B (cleaner):** Introduce a separate flag or modify the deferred check to distinguish between "Standard Action actually used" and "Standard Action marked consumed for bookkeeping." For example, the deferred check could inspect a `standardActionTaken` flag (true only when a real Standard Action is performed) rather than `standardActionUsed`.

**Note:** The same issue applies to the action forfeit case in `next-turn.post.ts:519-524` where `standardActionUsed: true` is set because of item-use forfeit (PTU p.276), not because a Standard Action was taken.

## Files to Modify

- `app/server/api/encounters/[id]/pass.post.ts` -- Suppress false positive
- Possibly `app/server/api/encounters/[id]/next-turn.post.ts` -- Improve deferred check logic
