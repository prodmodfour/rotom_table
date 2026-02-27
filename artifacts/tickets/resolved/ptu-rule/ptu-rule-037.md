---
ticket_id: ptu-rule-037
type: ptu-rule
priority: P3
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: senior-reviewer
created_at: 2026-02-18T16:15:00
domain: pokemon-generation
severity: LOW
affected_files:
  - app/prisma/seed.ts
---

## Summary

The seed parser's name-detection regex in `parsePokedexContent()` matches "HP:" as a valid Pokemon name. While practically unreachable today (Pokemon names always appear on lines 2-4 of each page, before stat lines), this is a latent false-positive risk. If a pokedex file ever had a missing or malformed name line, "HP:" on line ~7 would be parsed as a species named "Hp:".

## Details

The regex at seed.ts:254:
```
/^[A-Z][A-Z0-9\-\(\).:'É\u2019]+(?:\s+[A-Za-z0-9,%\s\-\(\).:'É\u2019]+)?$/
```

Matches "HP:" because: `[A-Z]` → "H", `[A-Z0-9\-\(\).:'É\u2019]+` → "P:" (colon is in the character class). The existing skip list (`Contents`, `TM`, `HM`, `MOVE LIST`, `TUTOR MOVE LIST`, `EGG MOVE LIST`) does not include stat-header lines.

**Note:** This is pre-existing — the old ALL CAPS regex also matched "HP:". The ptu-rule-033 fix did not introduce this.

## Impact

LOW — currently unreachable because all 994 pokedex files have Pokemon names before stat lines in the 10-line scan window. Risk is latent only.

## Suggested Fix

Add stat-header patterns to the skip list at seed.ts:256:
```javascript
if (['Contents', 'TM', 'HM', 'MOVE LIST', 'TUTOR MOVE LIST', 'EGG MOVE LIST', 'HP:', 'HP'].includes(line)) continue
```

Or tighten the first regex group to exclude colon: `[A-Z][A-Z0-9\-\(\).'É\u2019]+` (remove `:` from the first character class). However, this would break `TYPE: NULL` which needs the colon. The skip list approach is safer.

## Fix Log

- **File:** `app/prisma/seed.ts`, line 257
- **Change:** Added `'HP:'` and `'HP'` to the skip list in the name-detection loop
- **Before:** `['Contents', 'TM', 'HM', 'MOVE LIST', 'TUTOR MOVE LIST', 'EGG MOVE LIST']`
- **After:** `['Contents', 'TM', 'HM', 'MOVE LIST', 'TUTOR MOVE LIST', 'EGG MOVE LIST', 'HP:', 'HP']`
- **Verification:** Confirmed no Pokemon species is named "HP" or "HP:" across all 994 pokedex files. The only occurrences of `^HP:$` in pokedex files are stat-header lines (e.g., Oricorio forms) that appear after `Base Stats:`.
- **Risk:** None. Among stat headers that actually appear in pokedex files, only `HP:` matches because it is inherently all-uppercase (an abbreviation). The other stat headers (`Attack:`, `Defense:`, `Speed:`, etc.) use mixed-case in the files, so their first character class fails after position 1. If the files contained all-uppercase forms (`ATTACK:`, `DEFENSE:`, etc.), those would also match the regex — but no pokedex file uses that format.

## Source

Discovered during code-review-041 (review of ptu-rule-033 fix).
