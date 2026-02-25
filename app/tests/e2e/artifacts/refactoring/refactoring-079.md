---
ticket_id: refactoring-079
priority: P4
severity: LOW
status: open
domain: player-view
source: code-review-158 M3
created_by: slave-collector (plan-20260225-130000)
created_at: 2026-02-25
---

# refactoring-079: Replace deprecated document.execCommand('copy') in SessionUrlDisplay

## Summary

The `copyToClipboard` function in `SessionUrlDisplay.vue` uses `document.execCommand('copy')` as a fallback for non-HTTPS contexts. This API is deprecated and removed from web standards. While it still works in current browsers for the LAN use case (`http://192.168.x.x`), it should be replaced before browsers remove support.

## Affected Files

- `app/components/gm/SessionUrlDisplay.vue` — lines 221-237

## Current Behavior

When `navigator.clipboard.writeText()` is not available (non-HTTPS context), the fallback creates a hidden textarea, sets its value, selects it, and calls `document.execCommand('copy')`.

## Expected Behavior

Either:
1. Show a "select and copy manually" prompt with the URL pre-selected in an input field
2. Or use a polyfill/alternative clipboard approach that doesn't rely on deprecated APIs

## Impact

Low — the tunnel connection (HTTPS) always has `navigator.clipboard` available. Only LAN connections (`http://`) trigger the fallback. Current browsers still support `execCommand('copy')`.

## Suggested Fix

Replace the `execCommand` fallback with a user-friendly "tap to select, then copy" approach using a pre-populated readonly input field with a select-all-on-focus behavior.
