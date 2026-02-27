---
review_id: code-review-027
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-012
domain: combat
commits_reviewed:
  - ed32385
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-18T03:00:00
---

## Review Scope

Reviewed commit `ed32385` implementing refactoring-012: cap initial evasion at +6 per PTU rules (p.310-314). The ticket identified 3 sites computing `Math.floor(stat / 5)` without a `Math.min(6, ...)` cap. The worker extracted an `initialEvasion()` helper and applied it to the 2 sites that actually needed changes (Site 2 delegates to Site 1 via `buildCombatantFromEntity`).

## Issues

### CRITICAL
None.

### HIGH
None.

### MEDIUM
None.

## Verification

1. **Helper correctness:** `initialEvasion(stat)` returns `Math.min(MAX_EVASION, Math.floor(stat / 5))` with `MAX_EVASION = 6`. Matches PTU p.310-314 and the existing dynamic `calculateEvasion()` in `damageCalculation.ts:92` and `useCombat.ts:53`.

2. **Site 1 — `buildCombatantFromEntity` (combatant.service.ts:565-567):** All three evasion fields now call `initialEvasion()`. Confirmed.

3. **Site 2 — `buildPokemonCombatant` (pokemon-generator.service.ts:290):** Delegates to `buildCombatantFromEntity`. Worker correctly identified no change needed here. Confirmed via grep at line 290.

4. **Site 3 — `load.post.ts:116-118`:** Imports `initialEvasion` from `combatant.service` and uses it for all three evasion fields. Confirmed.

5. **No remaining uncapped sites:** `grep 'physicalEvasion:|specialEvasion:|speedEvasion:'` in `app/server/` returns only the 2 fixed sites. `from-scene.post.ts` delegates to the shared builders. No inline evasion calculations remain anywhere in the server directory.

6. **Tests:** 507/508 Vitest pass (1 pre-existing failure in `settings.test.ts` — refactoring-013, unrelated).

## What Looks Good

- Extracted a named, exported, documented helper (`initialEvasion`) instead of inlining `Math.min(6, ...)` at each site — single source of truth for the formula.
- `MAX_EVASION = 6` constant avoids magic numbers and makes the PTU rule self-documenting.
- Correctly identified that refactoring-011 (resolved earlier) already collapsed Site 2 into Site 1, reducing the actual fix from 3 sites to 2. Shows awareness of prior work.
- Minimal diff (22 insertions, 6 deletions across 2 files) — focused and clean.
- Good commit message with PTU page reference.

## Verdict

APPROVED — Clean, correct fix. All evasion-setting sites now use the capped helper. No uncapped `Math.floor(stat / 5)` patterns remain in the server codebase. No scenarios need re-running (evasion initial values are cosmetic — live accuracy checks already used the capped `calculateEvasion()`).
