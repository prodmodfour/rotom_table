---
id: docs-017
title: "bug-047 resolution log has stale commit hashes and missing affected_files entry"
priority: P4
severity: LOW
status: open
domain: tooling
source: code-review-337 MED-001 + MED-002
created_by: slave-collector (plan-1772664485)
created_at: 2026-03-04
affected_files:
  - artifacts/tickets/resolved/bug/bug-047.md
---

## Summary

The bug-047 ticket resolution log references stale commit hashes that don't exist on any branch, and the `affected_files` frontmatter is incomplete.

## Problem

1. **Stale commit hashes:** Resolution log references commits `e4137af1` and `f06f0dca` but the actual commits are `38e637ad` (attempt.post.ts fix) and `c4783211` (intercept.service.ts fix).

2. **Missing affected file:** The `affected_files` frontmatter only lists `attempt.post.ts` but `intercept.service.ts` was also modified as part of the fix.

## Suggested Fix

1. Update commit hashes in the resolution log to the correct values
2. Add `app/server/services/intercept.service.ts` to the `affected_files` list

## Impact

Documentation/traceability only. No functional impact.
