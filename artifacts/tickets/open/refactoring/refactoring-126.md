---
id: refactoring-126
title: "Pokemon PUT/POST endpoints wrap all errors in statusCode 500"
priority: P4
severity: low
status: open
domain: pokemon-lifecycle
source: code-review-309 (pre-existing observation)
created_by: slave-collector (plan-20260303-202535)
created_at: 2026-03-03
affected_files:
  - app/server/api/pokemon/[id].put.ts
  - app/server/api/pokemon/index.post.ts
---

## Summary

The outer catch block in `[id].put.ts` (line ~90) and `index.post.ts` wraps all errors in `statusCode: 500`, including intentional 400 validation errors (e.g., loyalty range validation). The error message is preserved via `error.message`, but the status code is lost.

## Problem

Other endpoints in the codebase (e.g., `generate.post.ts`, `wild-spawn.post.ts`) use `if (error.statusCode) throw error` to preserve original status codes before falling through to the generic 500 wrapper. The Pokemon PUT/POST endpoints lack this pattern.

## Suggested Fix

Add `if (error.statusCode) throw error` at the top of the catch block in both endpoints, matching the pattern used elsewhere.

## Impact

Low — the error message still reaches the client correctly. Only the HTTP status code is incorrect (500 instead of 400 for validation errors). No user-visible impact since the UI displays the message, not the status code.
