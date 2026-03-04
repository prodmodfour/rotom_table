---
id: ptu-rule-134
title: "Revert Other conditions to clearsOnFaint: false"
priority: P1
severity: high
status: open
domain: combat
source: decree-047
created_by: decree-facilitator
created_at: 2026-03-04
affected_files:
  - app/constants/statusConditions.ts
---

## Summary

Per decree-047, Other category conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) must have `clearsOnFaint: false`. The current code incorrectly sets `clearsOnFaint: true` for all 5, which was an unintended behavioral expansion during refactoring-106.

## Required Implementation

In `app/constants/statusConditions.ts`, change `clearsOnFaint: true` to `clearsOnFaint: false` for:
- Stuck
- Slowed
- Trapped
- Tripped
- Vulnerable

Update the `FAINT_CLEARED_CONDITIONS` derived array comment to note that Other conditions are excluded per decree-047.

## Notes

- This is the interim behavior until source-dependent clearing (refactoring-129) is implemented.
- RAW reference: PTU p.248 — only Persistent and Volatile conditions clear on faint.
