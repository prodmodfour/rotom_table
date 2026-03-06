---
id: ptu-rule-151
title: "Heavily Injured standard action trigger not implemented"
priority: P1
severity: HIGH
status: in-progress
domain: healing
source: healing-audit.md (session 121, R016 supplemental approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

The Heavily Injured status has a secondary trigger: "taking a Standard Action during combat" should prompt a save vs fainting. Currently only the "takes Damage" trigger is implemented.

## Impact

Heavily Injured Pokemon can freely take Standard Actions without risk of fainting, which is a significant rules gap in combat.

## Resolution Log

### PTU Rule Clarification

PTU p.250: "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."

The mechanic is HP loss (not a save check). Two triggers: (1) taking damage, (2) taking a Standard Action. Only trigger (1) was implemented inline at action time. Trigger (2) was partially implemented as a deferred check in next-turn.post.ts but not applied immediately when the action occurs.

### Implementation

Added immediate Heavily Injured standard-action penalty to all endpoints that consume a Standard Action. The penalty is applied at the moment the action is taken (not deferred to turn end), enabling immediate faint/death resolution.

Added `heavilyInjuredPenaltyApplied` flag to `TurnState` to prevent double-application between inline penalty and the existing next-turn.post.ts deferred check.

### Commits

- `06471ba8` — Add `heavilyInjuredPenaltyApplied` flag to TurnState (`app/types/combat.ts`)
- `e7b54944` — Guard next-turn deferred check against double-application (`app/server/api/encounters/[id]/next-turn.post.ts`)
- `3bbd2605` — Apply penalty to actor in move endpoint (`app/server/api/encounters/[id]/move.post.ts`)
- `5e48f8d4` — Apply penalty in sprint endpoint (`app/server/api/encounters/[id]/sprint.post.ts`)
- `29c075a6` — Apply penalty in breather endpoint (`app/server/api/encounters/[id]/breather.post.ts`)
- `fc82f938` — Apply penalty in action endpoint (`app/server/api/encounters/[id]/action.post.ts`)
- `1f5956b0` — Apply penalty in use-item endpoint (`app/server/api/encounters/[id]/use-item.post.ts`)
- `18933878` — Apply penalty in living-weapon engage endpoint (`app/server/api/encounters/[id]/living-weapon/engage.post.ts`)
- `797b7741` — Apply penalty in mount endpoint (`app/server/api/encounters/[id]/mount.post.ts`)
- `06a2c4de` — Apply penalty in recall endpoint (`app/server/api/encounters/[id]/recall.post.ts`)
- `88b8785f` — Apply penalty in release endpoint (`app/server/api/encounters/[id]/release.post.ts`)

### D2 Fix Cycle (code-review-351)

- `517b0140` — Add heavily injured penalty to standard switch path (`app/server/api/encounters/[id]/switch.post.ts`)
- `eccfdf82` — Await actor penalty DB sync in move endpoint (`app/server/api/encounters/[id]/move.post.ts`)
- `782d7be7` — Update refactoring-145 to include switch.post.ts

### Files Changed

- `app/types/combat.ts` — Added `heavilyInjuredPenaltyApplied` to TurnState
- `app/server/api/encounters/[id]/next-turn.post.ts` — Guard deferred check with flag
- `app/server/api/encounters/[id]/move.post.ts` — Inline penalty on actor; fix unawaited DB sync
- `app/server/api/encounters/[id]/sprint.post.ts` — Inline penalty
- `app/server/api/encounters/[id]/breather.post.ts` — Inline penalty
- `app/server/api/encounters/[id]/action.post.ts` — Inline penalty (standard only)
- `app/server/api/encounters/[id]/use-item.post.ts` — Inline penalty on user
- `app/server/api/encounters/[id]/living-weapon/engage.post.ts` — Inline penalty on initiator
- `app/server/api/encounters/[id]/mount.post.ts` — Inline penalty on rider (standard cost only)
- `app/server/api/encounters/[id]/recall.post.ts` — Inline penalty on trainer (2-Pokemon recall only)
- `app/server/api/encounters/[id]/release.post.ts` — Inline penalty on trainer (2-Pokemon release only)
- `app/server/api/encounters/[id]/switch.post.ts` — Inline penalty on standard switch initiator
