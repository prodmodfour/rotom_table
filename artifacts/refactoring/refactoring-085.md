---
id: refactoring-085
title: Add duplicate feature detection in addFeature
priority: P4
category: EXT-DUPLICATE
status: open
domain: character-lifecycle
source: character-lifecycle-audit.md (R037)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# refactoring-085: Add duplicate feature detection in addFeature

## Summary

The `addFeature` function in `useCharacterCreation.ts` appends features without checking for duplicates. GMs can accidentally add the same non-Ranked feature twice. Ranked features (`[Ranked X]` tag) legitimately appear multiple times.

## Affected Files

- `app/composables/useCharacterCreation.ts` (`addFeature` function)

## Suggested Fix

Add a duplicate check before appending: if the feature does NOT have a `[Ranked]` tag and already exists in the array, either warn or prevent the addition.

## Impact

Low — GM error prevention. No gameplay impact if GM doesn't double-add features.
