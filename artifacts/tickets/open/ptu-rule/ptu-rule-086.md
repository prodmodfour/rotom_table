---
id: ptu-rule-086
title: Capture modifier sign convention inverted from PTU
priority: P3
severity: MEDIUM
status: open
domain: capture
source: capture-audit.md (capture-R005)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-086: Capture modifier sign convention inverted from PTU

## Summary

The capture roll formula `modifiedRoll = roll - trainerLevel - modifiers` inverts the sign convention used in PTU's Poke Ball chart. PTU lists Great Ball as "-10", meaning subtract 10 from the roll (making capture easier). But the double-negative in the code (`- (-10) = +10`) increases the roll, making capture harder. GMs must mentally negate the PTU values.

## Affected Files

- `app/utils/captureRate.ts` (line 199)

## PTU Rule Reference

Poke Ball modifier chart: Great Ball = -10 (subtract from roll to make capture easier).

## Suggested Fix

Change formula from `roll - trainerLevel - modifiers` to `roll - trainerLevel + modifiers`. This aligns with PTU's sign convention where negative values = easier capture.

## Impact

UX/correctness issue. GMs entering PTU-listed ball modifiers get inverted results. Currently mitigated only by GMs knowing to negate the sign.
