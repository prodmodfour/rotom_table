---
title: Add flanking_update to WebSocketEvent union type
priority: P4
severity: LOW
category: EXT-TYPE-SAFETY
domain: vtt-grid
source: code-review-276 MED-1
created_by: slave-collector (plan-20260302-130300)
created_at: 2026-03-02
---

# refactoring-121: Add flanking_update to WebSocketEvent union type

## Summary

The `flanking_update` WebSocket event type is not included in the `WebSocketEvent` union type in `app/types/api.ts`. This is a pre-existing pattern — many WS event types are absent from the union type. Adding it improves type safety for flanking event handling.

## Affected Files

- `app/types/api.ts` — add `flanking_update` to the `WebSocketEvent` union

## Suggested Fix

Add the `flanking_update` event type to the WebSocketEvent discriminated union in `app/types/api.ts`, following the same pattern as other WS event types.

## Impact

Type-safety improvement. No runtime behavior change. Low priority.
