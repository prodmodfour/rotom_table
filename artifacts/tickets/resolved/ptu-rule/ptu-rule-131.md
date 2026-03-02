---
ticket: ptu-rule-131
category: PTU-INCORRECT
priority: P2
severity: MEDIUM
status: open
domain: combat
source: rules-review-227 (carried from rules-review-223 M1)
created_by: slave-collector (plan-20260301-152500)
created_at: 2026-03-01
---

# ptu-rule-131: Expert+ Combat skill not handled for AoO Struggle Attacks

## Summary

PTU p.240 states that Struggle Attack changes at Expert+ Combat skill rank: AC 4 / DB 4 becomes AC 3 / DB 5.

The current AoO implementation hardcodes `AOO_STRUGGLE_ATTACK_AC = 4` and `AOO_STRUGGLE_ATTACK_DAMAGE_BASE = 11` (which corresponds to DB 4 set damage). For reactors with Expert+ Combat skill rank, the values should be AC 3 and damage base corresponding to DB 5 (set damage avg = 14).

The UI also displays "Struggle Attack (AC 4)" without checking the reactor's Combat skill rank.

## Affected Files

- `app/utils/aooTriggers.ts` — hardcoded AC and damage base constants
- `app/server/services/out-of-turn.service.ts` — uses hardcoded constants
- `app/components/encounter/AoOPrompt.vue` — displays hardcoded AC

## Suggested Fix

1. Look up the reactor's Combat skill rank when resolving AoO Struggle Attack
2. If Expert+, use AC 3 / DB 5 (set damage = 14) instead of AC 4 / DB 4 (set damage = 11)
3. Update the AoO prompt display to show the correct AC based on skill rank

## PTU Reference

- PTU Core Rules p.240: Struggle Attack — "If you have Expert Combat or higher, Struggle Attack is AC 3, DB 5"
