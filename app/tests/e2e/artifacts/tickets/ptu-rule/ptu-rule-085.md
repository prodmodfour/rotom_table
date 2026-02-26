---
id: ptu-rule-085
title: Legendary Pokemon detection hard-coded to false
priority: P2
severity: HIGH
status: in-progress
domain: capture
source: capture-audit.md (capture-R016)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-085: Legendary Pokemon detection hard-coded to false

## Summary

Both capture API endpoints hard-code `isLegendary: false`. The pure utility `calculateCaptureRate` correctly applies -30 to capture rate for legendaries, but the API layer never activates it. Legendary Pokemon are 30 points easier to capture than PTU intends.

## Affected Files

- `app/server/api/capture/rate.post.ts` (line 99: `isLegendary: false // Could add legendary detection later`)
- `app/server/api/capture/attempt.post.ts` (line 64: `isLegendary: false`)
- `app/utils/captureRate.ts` (supports `isLegendary` correctly)

## PTU Rule Reference

Legendary Pokemon receive a -30 modifier to capture rate (core 1.05).

## Suggested Fix

Options (in order of robustness):
1. Add `legendary: Boolean` field to SpeciesData Prisma model, populate from seed data
2. Create a `LEGENDARY_SPECIES` constant lookup in `app/constants/`
3. Accept `isLegendary` as a GM-provided parameter in the API request body

Option 1 is most robust. Option 3 is quickest.

## Impact

All legendary Pokemon capture attempts ignore the -30 penalty, making them significantly easier to capture than intended.

## Fix Log

- **Commit:** d680f8b — `fix: auto-detect legendary Pokemon for capture rate -30 modifier`
- **Files changed:**
  - `app/constants/legendarySpecies.ts` — new file with `LEGENDARY_SPECIES` Set (96 species, Gen 1-8) and `isLegendarySpecies()` helper with case-insensitive lookup
  - `app/server/api/capture/rate.post.ts` — auto-detects legendary from species name, accepts `isLegendary` GM override in request body
  - `app/server/api/capture/attempt.post.ts` — auto-detects legendary from species name
- **Approach:** Used Option 2 (constant lookup) as primary detection, with Option 3 (GM override) as fallback in the rate endpoint. No Prisma migration needed.
