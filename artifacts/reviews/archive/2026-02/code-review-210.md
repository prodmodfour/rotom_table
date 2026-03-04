---
review_id: code-review-210
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-114+ptu-rule-116
domain: combat+vtt-grid
commits_reviewed:
  - 92ae757
  - 53c5bb7
files_reviewed:
  - app/server/api/encounters/[id]/breather.post.ts
  - app/utils/evasionCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/stores/encounterCombat.ts
  - app/composables/useEncounterActions.ts
  - app/constants/combatManeuvers.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/utils/combatantCapabilities.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T16:30:00Z
follows_up: null
---

## Review Scope

Two P4 game mechanics tickets from session 54:

1. **ptu-rule-114** (commit 92ae757): Assisted breather variant per PTU p.245. When assisted by an adjacent character's Standard Action, the breather target receives a synthetic `ZeroEvasion` tempCondition instead of Tripped+Vulnerable. 6 files changed.

2. **ptu-rule-116** (commit 53c5bb7): Naturewalk status condition immunity. Pokemon with Naturewalk on matching terrain are blocked from receiving Slowed/Stuck at status application time. Server-side enforcement with GM override, following the decree-012 pattern. 2 files changed.

### Decree Compliance

- **decree-005** (auto-apply CS from status conditions): Respected. `reapplyActiveStatusCsEffects()` is called after stage reset in breather, as it was before. No changes to that flow.
- **decree-012** (server-side type immunity with GM override): The Naturewalk immunity check in `status.post.ts` follows the exact same pattern -- 409 rejection with informative message, `override: true` to bypass. Correct.
- **decree-010** (multi-tag terrain): `findNaturewalkImmuneStatuses` checks `cell?.type` (the base terrain type, not the flags), which is correct. Naturewalk immunity is about the terrain type, not whether the cell is flagged rough/slow.
- **decree-003** (enemy-occupied rough terrain): Not affected. The Naturewalk status immunity check operates at status application time via the API, not during movement. The terrain movement bypass (separate code path) already respects decree-003 per the comments in `combatantCapabilities.ts`.

## Issues

No CRITICAL, HIGH, or MEDIUM issues found.

## What Looks Good

### ptu-rule-114: Assisted Breather

**ZeroEvasion tempCondition lifecycle is correct.** The synthetic `ZeroEvasion` is pushed into `combatant.tempConditions` (line 149 of breather.post.ts) using immutable spread, and tempConditions are cleared to `[]` at end of next turn by `next-turn.post.ts` (line 68). This matches the "until end of their next turn" rule from PTU p.245. The same lifecycle already governs Sprint and Tripped/Vulnerable tempConditions, so there is no risk of orphaned state.

**Both evasion calculation code paths are updated.** The `ZeroEvasion` check is added in:
- `evasionCalculation.ts` line 46 (client-side composable path via `computeTargetEvasions`)
- `calculate-damage.post.ts` line 232 (server-side damage calculation path)

Both paths check `tempConditions` for the exact string `'ZeroEvasion'` in addition to the existing `ZERO_EVASION_CONDITIONS` check. Since `useMoveCalculation.ts` calls `computeTargetEvasions`, the client UI damage preview also picks up the change automatically.

**Action consumption is correct.** The assisted variant is included in the full-action list at `useEncounterActions.ts` line 155, consuming both standard and shift actions. The breather endpoint itself also marks `standardActionUsed: true` and `shiftActionUsed: true` (line 165-170). The assisted variant correctly skips the `breatherShift` signal (line 173), since the assisted character does not need to shift away from enemies.

**Immutability patterns are followed.** `combatant.tempConditions` is always spread into a new array (lines 149, 155, 159). `entity.stageModifiers` is assigned a fresh object (`{ ...defaultStages }` at line 106). The `result` object is built incrementally but not mutated after creation.

**Move log distinguishes variants.** The move name uses `'Take a Breather (Assisted)'` vs `'Take a Breather'`, and `buildBreatherNotes` generates distinct descriptive text for the assisted case. Good for GM review and undo history.

**The maneuver entry is well-formed.** The new `take-a-breather-assisted` entry in `combatManeuvers.ts` uses `actionType: 'full'`, `requiresTarget: false`, and a clear `shortDesc` that mentions the ally's Standard Action cost. The icon is differentiated from the standard breather.

### ptu-rule-116: Naturewalk Status Immunity

**`findNaturewalkImmuneStatuses` is well-structured.** Early returns for non-Pokemon, disabled terrain, missing position, and irrelevant statuses. The function delegates terrain matching to the existing `naturewalkBypassesTerrain` utility, avoiding logic duplication.

**Terrain data parsing is correct.** `status.post.ts` line 77-79 parses `record.terrainState` as `JSON.parse(record.terrainState || '{}').cells ?? []`, safely handling both empty/undefined terrainState and the case where terrain is disabled. The `terrainEnabled` flag is checked before parsing.

**The decree-012 override pattern is faithfully replicated.** The 409 response structure includes `naturewalkImmune` array and `hint` field, matching the type immunity response shape. The existing `handleStatus` error handler in `useEncounterActions.ts` (line 91-98) catches 409 errors and shows an alert directing the GM to use Force Apply -- this will catch both type immunity and Naturewalk immunity rejections without any client-side changes needed. The generic message format ("Status blocked: {message}") works for both rejection types.

**Naturewalk parsing covers both data sources.** `getCombatantNaturewalks` checks both `capabilities.naturewalk` (direct array) and `capabilities.otherCapabilities` (parsed from "Naturewalk (Forest, Grassland)" strings). The parser handles comma-separated and "and"-separated terrain names. Deduplication via `Set` prevents double-matching.

**Scope is correctly limited to Slowed and Stuck.** The `NATUREWALK_IMMUNE_STATUSES` constant only includes `['Slowed', 'Stuck']`, which matches the PTU p.239-240 rule. No over-broad immunity.

**Edge case: no grid position.** When `combatant.position` is undefined (combatant not placed on the grid), the function returns an empty array, allowing the status to be applied normally. This is the correct behavior -- you cannot claim terrain-based immunity if you are not on the terrain.

**Edge case: default terrain type.** When there is no terrain cell at the combatant's position (they are on an unpainted cell), `cell?.type ?? 'normal'` defaults to `'normal'`. Since most Naturewalk types map to `'normal'` terrain (Grassland, Forest, Tundra, Desert, Urban), this means Pokemon with common Naturewalk types will get immunity on unpainted cells. This is a known characteristic of the terrain system's simplified type mapping and is consistent with how Naturewalk movement bypass already works in the grid code. The GM can override if this is inappropriate for the scenario.

**Edge case: large tokens (tokenSize > 1).** The function only checks the single cell at `combatant.position` (the top-left corner), not all cells occupied by a large token. This is consistent with how terrain movement bypass works throughout the codebase (single-position lookup), so this is not a new inconsistency introduced by this change.

### Cross-Cutting Quality

**Commit granularity is appropriate.** Two commits for two independent tickets. Each commit is focused on a single mechanical feature with all its touchpoints included.

**Error handling is consistent.** Both endpoints re-throw H3 errors and wrap unexpected errors in 500 responses with descriptive messages.

**No immutability violations detected.** All array and object updates use spread operators or `Array.from()`.

**No file size concerns.** `combatantCapabilities.ts` is now 330 lines (well under 800 limit). `status.post.ts` is 177 lines. `breather.post.ts` is 270 lines.

## Verdict

**APPROVED**

Both implementations are clean, correct, and follow established project patterns. The ZeroEvasion synthetic condition lifecycle is properly managed through the existing tempConditions clearing mechanism. The Naturewalk status immunity check correctly follows the decree-012 pattern for server-side enforcement with GM override. Both changes are well-scoped and introduce no regressions to existing functionality.
