---
review_id: rules-review-321
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-060
domain: encounter-tables
commits_reviewed:
  - e9cabeb0
  - b16fd6bc
  - 15234f8e
  - a20c6c85
  - 4809bfa6
mechanics_verified:
  - density-tier-round-trip
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - n/a (density tiers are app-specific, not PTU RAW)
reviewed_at: 2026-03-06T18:00:00Z
follows_up: rules-review-317
---

## Mechanics Verified

### Density Tier Round-Trip (Export/Import)

- **Rule:** Density tiers (`sparse | moderate | dense | abundant`) are app-specific metadata with no PTU RAW mechanical effect. The type definition at `app/types/habitat.ts:14` explicitly states: "Population density tiers -- DESCRIPTIVE ONLY, no mechanical effect on spawn count." PTU 1.05 Chapter 11 (Running the Game) discusses wild Pokemon populations in narrative terms but defines no density tier system.
- **Implementation:** The export endpoint (`export.get.ts:49`) includes `density: table.density` in the JSON output. The import endpoint (`import.post.ts:123-127`) validates the incoming density against the allowlist `['sparse', 'moderate', 'dense', 'abundant']` and falls back to `'moderate'` when missing or invalid. The allowlist matches the `DensityTier` type exactly. The fallback value `'moderate'` matches the Prisma schema default (`@default("moderate")` at `schema.prisma:356`).
- **Status:** CORRECT

### Density Fallback Behavior (D2 Fix: H1)

- **Rule:** No PTU rule applies. The fallback to `'moderate'` is a data integrity choice: old exports created before the density fix will lack the field, and the Prisma default for new tables is `'moderate'`.
- **Implementation:** Two new test cases in `encounter-tables.test.ts` (commit `b16fd6bc`):
  1. Import with no `density` field -- asserts created table receives `'moderate'`, verifies the Prisma `create` call includes `density: 'moderate'`.
  2. Import with invalid `density: 'extreme'` -- same assertions.
  Both tests verify the full chain: response `data.density` value AND the Prisma `create` argument.
- **Status:** CORRECT -- H1 from code-review-354 is resolved.

### Modal Dismiss Navigation (D2 Fix: M1)

- **Rule:** No PTU rule applies. This is a UI navigation concern.
- **Implementation:** Commit `e9cabeb0` replaces the raw `$emit('close')` on the overlay click (`line 2`) and X button (`line 6`) with a `handleDismiss()` function. When `importedTableId` is set (meaning the server already created the table), `handleDismiss` emits `'imported'` with the table ID, triggering navigation. When no import has occurred, it emits `'close'` as before. This is approach (b) from code-review-354's suggestion.
- **Status:** CORRECT -- M1 from code-review-354 is resolved.

### densityMultiplier Round-Trip (M2)

- **Rule:** No PTU rule applies. `densityMultiplier` on `TableModification` (`schema.prisma:406`) is app-specific.
- **Implementation:** bug-068 has been filed as an open ticket in `artifacts/tickets/open/bug/bug-068.md` with P3 priority, correctly tracking this as a separate issue. No code change was required in this PR per code-review-354.
- **Status:** CORRECT -- M2 from code-review-354 is resolved (ticket filed).

## Decrees Checked

- **decree-031** (encounter budget formula): Applies to encounter budget calculation, not to density tier export/import. No overlap with this fix.
- **decree-048** (dark cave blindness penalties): Applies to environment presets and accuracy penalties, not to encounter table density. No overlap with this fix.

No other decrees in the encounter-tables domain apply to density tier data integrity.

## Summary

Bug-060 addresses encounter table density field loss on export/import round-trip. The density tier system is entirely app-specific (confirmed by checking PTU 1.05 Chapter 11 and `app/types/habitat.ts:14` annotation). There are no PTU RAW mechanics to verify for correctness. The implementation correctly preserves the four valid density tiers, uses the schema-aligned default for fallback, and the D2 fix commits resolve all three findings from code-review-354:

1. **H1 resolved:** Two density fallback tests added, covering both missing and invalid density values.
2. **M1 resolved:** Modal dismiss (X button and overlay click) now navigates to the imported table when one exists.
3. **M2 resolved:** bug-068 filed for `densityMultiplier` round-trip loss as a separate P3 ticket.

## Rulings

No PTU rule ambiguities discovered. No decree-need tickets required.

## Verdict

**APPROVED** -- No game logic concerns. The density tier system has no PTU RAW mechanical backing, and the data integrity fix is correctly implemented. All code-review-354 findings are addressed.

## Required Changes

None.
