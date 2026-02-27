---
id: ptu-rule-088
title: Significance tier presets misaligned with PTU values
priority: P3
severity: MEDIUM
status: open
domain: encounter-tables
source: encounter-tables-audit.md (R008)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-088: Significance tier presets misaligned with PTU values

## Summary

PTU defines three significance tiers: insignificant (x1-x1.5), everyday (x2-x3), significant (x4-x5+). The app defines five tiers and splits the PTU "significant" tier into three sub-tiers. The app's "Significant" preset uses x3.0-x4.0 (default x3.5), but PTU's "significant" is x4-x5+. This makes "Significant" encounters 12-30% weaker than PTU intends. The app's "significant" range also overlaps with PTU's "everyday" at x3.0.

## Affected Files

- Significance tier constants (wherever presets are defined)

## PTU Rule Reference

Chapter 11 — encounter significance tiers: insignificant x1-x1.5, everyday x2-x3, significant x4-x5+.

## Suggested Fix

Either (a) realign the three core presets to match PTU values (keep climactic/legendary as optional extended tiers), or (b) add PTU reference ranges in preset descriptions so GMs know the canonical values.

## Impact

GMs selecting "Significant" get weaker encounters than PTU intends (x3.5 default vs x4-x5 PTU).
