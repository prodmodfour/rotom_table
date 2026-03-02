---
title: Replace hardcoded speed=20 in InterceptPrompt.vue getBestTargetSquare
priority: P4
severity: LOW
category: EXT-CORRECTNESS
domain: combat, vtt-grid
source: code-review-279 MED-2
created_by: slave-collector (plan-20260302-130300)
created_at: 2026-03-02
---

# refactoring-124: Replace hardcoded speed=20 in InterceptPrompt.vue

## Summary

`getBestTargetSquare` in `InterceptPrompt.vue` uses a hardcoded `speed=20` instead of the actual interceptor's speed value. The server validates the correct speed regardless, so this is a UI-only concern — the prompt may suggest target squares that are too far or fail to suggest reachable squares.

## Affected Files

- `app/components/encounter/InterceptPrompt.vue` — replace hardcoded `speed=20` with actual interceptor speed from combatant data

## Suggested Fix

Retrieve the interceptor's current speed (from combatant data or store) and pass it to `getBestTargetSquare` instead of the hardcoded value.

## Impact

UI-only. Server validation is correct. Low priority.
