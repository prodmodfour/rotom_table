---
review_id: rules-review-313
review_type: rules
reviewer: game-logic-reviewer
trigger: ptu-rule-135
target_report: null
domain: capture
commits_reviewed:
  - 81b9cef3
  - 280d5a65
  - 1cce5e80
mechanics_verified:
  - loyalty-defaults-by-origin
  - friend-ball-loyalty-bonus
  - intercept-loyalty-threshold
verdict: approved-with-notes
issues_found: 1
ptu_refs:
  - "core/05-pokemon.md p.210 lines 1468-1470 (wild loyalty 2)"
  - "core/05-pokemon.md p.211 lines 1499-1502 (hatched loyalty 3)"
  - "core/05-pokemon.md p.211 lines 1513-1514 (loyalty 3+ for Intercept)"
reviewed_at: 2026-03-05
---

# Rules Review 313 — ptu-rule-135: Origin-Dependent Loyalty Defaults

## Decree Check

**decree-049** (capture / loyalty-default-by-origin): Active. Mandates wild captures start at Loyalty 2 (Wary), hatched/gifted/starter/custom at Loyalty 3 (Neutral). All three implementation commits cite this decree in code comments. No violations.

No other decrees in the capture or loyalty domain conflict.

## Mechanics Verified

### 1. Wild Capture Loyalty (PASS)

**PTU RAW:** "Most caught wild Pokemon will begin at [Loyalty 2]" (core/05-pokemon.md p.210, lines 1468-1470).

**Implementation (attempt.post.ts:195):** Sets `loyalty: 2` explicitly on successful capture, with `origin: 'captured'`. Correct.

### 2. Friend Ball +1 Loyalty (PASS)

**PTU RAW:** "A caught Pokemon will start with +1 Loyalty" (Friend Ball, p.279).

**Implementation (attempt.post.ts:211-219):** Uses `currentLoyalty = 2` as the base (per decree-049), then applies `+1` via `Math.min(6, currentLoyalty + 1)`, yielding 3. This correctly models the interaction: wild capture (loyalty 2) + Friend Ball (+1) = loyalty 3 (Neutral). The `Math.min(6, ...)` cap is correct per the 0-6 loyalty scale.

### 3. Manual Pokemon Creation (PASS with note)

**Implementation (pokemon/index.post.ts:20):** `body.loyalty ?? (origin === 'wild' ? 2 : 3)`. Only checks for `'wild'` origin, not `'captured'`. Per decree-049, `captured` should also map to 2.

In practice, this endpoint is used for manual Pokemon creation where `captured` origin would not be set (the capture flow uses `attempt.post.ts` which handles loyalty directly). However, the inconsistency means a GM manually creating a Pokemon with `origin: 'captured'` via this endpoint would get loyalty 3 instead of 2.

See MED-001 below.

### 4. Entity Builder Fallback (PASS)

**Implementation (entity-builder.service.ts:65):** `(record as any).loyalty ?? (record.origin === 'wild' || record.origin === 'captured' ? 2 : 3)`. Correctly handles both `wild` and `captured` origins for the null-loyalty fallback path. This is the read-path defense for legacy DB records missing the loyalty value.

### 5. Pokemon Generator (PASS — no changes needed)

**Implementation (pokemon-generator.service.ts:198-203):** `getStartingLoyalty()` already correctly maps `captured` and `wild` to 2, all others to 3. This function predates ptu-rule-135 and was already compliant with decree-049.

### 6. Serializer Fallbacks (PASS — no changes, acceptable)

**serializers.ts:51, 242:** Both use `(p as any).loyalty ?? 3`. These are read-path serializers for API responses. The `?? 3` fallback handles legacy records where the loyalty column might be null. The ticket explicitly decided to leave these as-is since they handle unknown-origin legacy data. Acceptable.

### 7. Intercept Loyalty Check (PASS — pre-existing, not in scope)

**intercept.service.ts:118:** `pokemon.loyalty ?? 3` fallback. If a wild Pokemon's loyalty were null (legacy data), this would grant loyalty 3 and allow Intercept. This is a pre-existing issue not introduced by this change. The entity-builder fix (item 4) should prevent null loyalty from reaching this code path for any Pokemon loaded through the standard flow.

## Issues

### MED-001: pokemon/index.post.ts missing `captured` origin check

**File:** `app/server/api/pokemon/index.post.ts:20`
**Severity:** MEDIUM
**Rule:** decree-049 mapping specifies `wild -> 2`, but the actual `PokemonOrigin` type also includes `captured` which should also map to 2.

**Current:**
```typescript
const loyalty = body.loyalty ?? (origin === 'wild' ? 2 : 3)
```

**Expected:**
```typescript
const loyalty = body.loyalty ?? (origin === 'wild' || origin === 'captured' ? 2 : 3)
```

**Impact:** Low in practice — the capture flow sets loyalty directly in `attempt.post.ts` and never routes through this endpoint. A GM manually creating a Pokemon with `origin: 'captured'` via the REST API would get loyalty 3 instead of 2. The entity-builder fallback (which does check `captured`) would mask this on subsequent reads only if the DB value were null, but since this endpoint writes loyalty 3 to the DB, the entity-builder fallback would not trigger.

**PTU ref:** decree-049 mapping; `PokemonOrigin` type includes `captured` (character.ts:15).

## Errata Check

No errata entries in `books/markdown/errata-2.md` relate to loyalty mechanics. Core text is the authoritative source.

## Verdict

**APPROVED WITH NOTES.** The implementation correctly follows PTU RAW and decree-049 for the primary capture flow. One MEDIUM consistency issue in the manual creation endpoint (MED-001) where `captured` origin is not checked. This has minimal practical impact since the capture flow bypasses this endpoint, but should be fixed for correctness.

All three implementation commits are correctly scoped and well-commented with decree-049 citations.
