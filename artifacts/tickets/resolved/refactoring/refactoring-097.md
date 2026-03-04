---
id: refactoring-097
title: Replace blocking alert() with non-blocking toast for heavily injured/death notifications
category: UX-PATTERN
priority: P2
severity: MEDIUM
status: in-progress
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

## Resolution Log

### Implementation (2026-03-04)

Created a reusable `useGmToast` singleton composable and `GmToastContainer` component, then replaced all blocking `alert()` calls in the combat domain with non-blocking toast notifications.

**New files:**
- `app/composables/useGmToast.ts` — Singleton composable managing toast queue with severity-based auto-dismiss durations
- `app/components/encounter/GmToastContainer.vue` — Fixed-position overlay rendering toasts with Phosphor icons
- `app/assets/scss/components/_gm-toast.scss` — Toast styles with severity variants (warning/amber, critical/red, error, info, success)

**Modified files:**
- `app/composables/useEncounterActions.ts` — Replaced 9 `alert()` calls with `showToast()` (heavily injured, death, league suppressed, dismount check, status blocked, status failure)
- `app/pages/gm/index.vue` — Added `GmToastContainer` to template; replaced 2 `alert()` calls in next-turn handler with `showToast()`

**Commits:**
- `f94ca65c` feat: create useGmToast composable for non-blocking GM notifications
- `1bfe9403` feat: create GmToastContainer component with SCSS styles
- `e1863a62` refactor: replace all alert() calls with useGmToast in useEncounterActions
- `19d9c0c5` feat: add GmToastContainer to GM encounter page
- `06116bd9` refactor: replace alert() with showToast in GM page next-turn handler

**Severity mapping:**
- Heavily injured penalty: `warning` (amber, 8s auto-dismiss)
- Death event: `critical` (red, 12s auto-dismiss)
- League death suppressed: `info` (cyan, 5s auto-dismiss)
- Dismount check: `warning` (amber, 8s auto-dismiss)
- Status blocked (decree-012): `warning` (amber, 8s auto-dismiss)
- Status update failure: `error` (red, 8s auto-dismiss)

**Remaining alert() calls:** Many `alert()` calls remain in non-combat domains (scenes, pokemon sheets, equipment, evolution). These are outside the scope of this combat-focused ticket and should be addressed by separate refactoring tickets.
