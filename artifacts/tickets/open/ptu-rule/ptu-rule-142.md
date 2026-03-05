---
id: ptu-rule-142
title: Implement Permafrost Burn/Poison status tick damage reduction
priority: P4
severity: MEDIUM
status: open
domain: combat
source: rules-review-ptu-rule-133 MED-002
created_by: slave-collector (plan-1772711294)
created_at: 2026-03-05
affected_files:
  - app/server/services/status-automation.service.ts
---

# ptu-rule-142: Implement Permafrost Burn/Poison status tick damage reduction

## Summary

The Permafrost ability text says: "subtract 5 from the amount of Hit Points lost due to an effect such as Sandstorm or the Burn Status condition." ptu-rule-133 implemented the weather path (Hail/Sandstorm damage reduction) but the status tick path (Burn, Poison) remains unimplemented.

## Required Implementation

In `status-automation.service.ts`, when calculating Burn/Poison tick damage, check if the combatant has the Permafrost ability and reduce tick damage by 5 (minimum 1).

## Impact

MEDIUM — Missing PTU rule implementation. Permafrost holders take full status tick damage when they should receive a 5HP reduction.
