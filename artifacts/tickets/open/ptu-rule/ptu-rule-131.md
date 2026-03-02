---
ticket_id: ptu-rule-131
category: PTU-INCORRECT
severity: MEDIUM
priority: P3
domain: capture
title: "Poke Ball accuracy roll does not apply Accuracy/Evasion stage modifiers"
source: code-review-281 M2
created_by: slave-collector (plan-20260302-150500)
created_at: 2026-03-02
---

## Summary

`rollAccuracyCheck()` in `app/composables/useCapture.ts` returns `total: roll` (raw d20) with a TODO comment "Add trainer's accuracy modifiers if needed." PTU p.236 states accuracy rolls are modified by "the user's Accuracy" and by evasion. For Poke Ball throws (AC 6 Status Attack), the target's Speed Evasion and the thrower's Accuracy combat stages should apply.

## Context

This is a pre-existing gap identified during the bug-043 review (AC 6 enforcement fix). The bug-043 fix correctly scoped to just enforcing the AC 6 threshold. The modifier application is a separate concern.

## PTU Reference

- PTU p.236: "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects."
- PTU p.214: Poke Ball throws are "AC6 Status Attack Roll"
- rules-review-257 observation: Poke Ball throws are NOT Moves, so Pokemon evasion rules may not apply. Community convention treats AC 6 as a flat check. This is debatable.

## Affected Files

- `app/composables/useCapture.ts` — `rollAccuracyCheck()` function
- `app/server/api/capture/attempt.post.ts` — server-side AC 6 validation mirrors the same logic

## Suggested Fix

1. Determine whether Accuracy/Evasion modifiers apply to Poke Ball throws (may need a decree ruling)
2. If yes: modify `rollAccuracyCheck()` to accept accuracy/evasion stage parameters and apply them to the total
3. Update server-side validation to match

## Impact

Low — the raw d20 vs AC 6 is a reasonable default. Modifiers would only matter for edge cases with extreme combat stage shifts. Most tables treat Poke Ball throws as flat AC 6 checks.
