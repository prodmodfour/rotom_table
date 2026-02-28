---
id: refactoring-097
title: Replace blocking alert() with non-blocking toast for heavily injured/death notifications
category: UX-PATTERN
priority: P2
severity: MEDIUM
domain: combat
source: code review of slave-4 (plan-20260228-173500)
created_by: slave-collector (plan-20260228-173500)
---

# refactoring-097: Replace blocking alert() with non-blocking toast for heavily injured/death notifications

## Summary

The heavily injured penalty and death check notifications in `useEncounterActions.ts` use the browser `alert()` function, which blocks the entire UI. The rest of the app uses toast notifications or in-component feedback for GM alerts. These should be converted to non-blocking notifications (toast/snackbar) to maintain consistency and avoid interrupting gameplay flow.

## Affected Files

- `app/composables/useEncounterActions.ts` (lines 51-61) — alert() calls for heavily injured HP loss and death events

## Suggested Fix

Replace `alert()` calls with the app's existing toast/notification system. The notifications should:
- Be non-blocking (toast that auto-dismisses or can be dismissed)
- Use appropriate severity styling (warning for heavily injured, critical/red for death)
- Include the combatant name, HP lost, and death cause in the message

## Impact

- UX improvement: no more blocking popups during combat
- Consistency: matches the app's notification pattern elsewhere
