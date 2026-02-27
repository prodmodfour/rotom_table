---
review_id: rules-review-145
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-003-track-b-p0
domain: player-view
commits_reviewed:
  - 689cb48
  - aa25732
  - cb56759
  - 4cfb11b
  - b38c2e6
  - 606d725
  - 3e1f82d
  - 723ff37
  - d0028f1
mechanics_verified:
  - player-editable-field-scope
  - move-reorder-safety
  - conflict-detection
  - import-transaction-atomicity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Moves
  - core/05-pokemon.md#Equipment-and-Items
reviewed_at: 2026-02-24T20:15:00Z
follows_up: rules-review-142
---

## Review Scope

Re-review of feature-003 Track B P0 fix cycle (9 commits). The original rules-review-142 was APPROVED. This review verifies that the 9 fix commits applied in response to code-review-152 (8 issues: C1, H1, H2, H3, M1-M4) introduced no PTU rules regressions.

## Mechanics Verified

### Player-Editable Field Scope (Import Whitelist)

- **Rule:** Players manage their own flavor text (background, personality, goals, notes) between sessions. Move learning requires leveling or Tutor Points (GM oversight). Stats, level, XP, equipment, and inventory are GM-authoritative. (`core/05-pokemon.md`, `core/03-trainers.md`)
- **Implementation:** The Zod schema (`importPayloadSchema`) validates exactly: character `id`, `background`, `personality`, `goals`, `notes`. Pokemon: `id`, `nickname`, `heldItem`, `moves` (reorder only). The server-side whitelist (`charEditableFields = ['background', 'personality', 'goals', 'notes']`) restricts character writes to these 4 fields regardless of payload contents. The C1 fix (commit 689cb48) removed `.passthrough()` from both `importPayloadSchema.character` and `pokemonImportSchema.moves`, so Zod now strips any unknown fields by default. This is a strict improvement -- the field scope was already correct, but the validation is now tighter.
- **Status:** CORRECT -- no regression. The fix strengthened the defense-in-depth without changing the editable field scope.

### Move Reorder Safety

- **Rule:** Learning new moves requires leveling up, Tutor Points, or TMs -- all require GM context. Players cannot learn moves offline. (`core/05-pokemon.md#Moves`)
- **Implementation:** Lines 191-228 of `app/server/api/player/import/[characterId].post.ts`. The logic is unchanged from the original review:
  1. `serverMoveIds` is built from server state only
  2. `validImportMoves` filters to moves that already exist on the server (`serverMoveIds.has(m.id)`)
  3. `reorderedMoves` maps to the full server move objects (not import data)
  4. Remaining server moves not in the import are appended
  5. Final moves are serialized from server objects only
- **Fix impact:** The C1 fix removed `.passthrough()` from the move sub-schema. Previously, extra fields on move objects in the import payload would pass through Zod validation (though they were never used -- the code always maps back to server move objects). Now those extra fields are stripped at validation time. This adds a defense layer but does not change behavior.
- **Status:** CORRECT -- no regression. Move injection remains impossible. Only reordering of existing server-known moves is permitted.

### Conflict Detection (Server Wins)

- **Rule:** GM authority is paramount. If the GM modified an entity (character or Pokemon) after the export was created, the server version must be preserved. This ensures GM stat corrections, injury tracking, status changes, and move tutoring are never accidentally reverted by a stale import.
- **Implementation:** Lines 117-128 (character) and 155-227 (Pokemon) compare `entity.updatedAt > exportedAt`. If the server entity was modified after export and the values differ, the conflict is recorded with `resolution: 'server_wins'` and the import value is skipped. The H2 fix (commit cb56759) moved the character update into the same `prisma.$transaction()` as Pokemon updates. The H3 fix (commit 4cfb11b) separated the response into `characterFieldsUpdated` and `pokemonUpdated` counts. Neither fix changed the conflict detection logic.
- **Status:** CORRECT -- no regression. Conflict detection and server-wins resolution are intact.

### Import Transaction Atomicity

- **Rule:** Not a PTU rule per se, but affects game state integrity. If a character update succeeds but Pokemon updates fail (or vice versa), the game state becomes inconsistent -- some offline edits applied, others lost. This could create confusion about what the player actually changed.
- **Implementation:** The H2 fix (commit cb56759) wraps both `humanCharacter.update()` and all `pokemon.update()` calls in a single `prisma.$transaction(async (tx) => { ... })` (lines 241-252). If any update fails, the entire batch rolls back. This is an improvement over the original code, which had the character update outside the transaction.
- **Status:** CORRECT -- improvement. No rules regression.

## Fix-by-Fix Rules Impact Assessment

| Fix ID | Commit | Rules Impact | Assessment |
|--------|--------|-------------|------------|
| C1 | 689cb48 | Tightens Zod validation -- strips unknown fields instead of passing them through | No regression. Editable field scope unchanged. Defense-in-depth improved. |
| H1 | aa25732 | Click-outside handler on ServerAddressDisplay | No rules impact. Pure UI/UX fix. |
| H2 | cb56759 | Single transaction for character + Pokemon updates | No regression. Improves atomicity of game state writes. |
| H3 | 4cfb11b | Separate `characterFieldsUpdated` / `pokemonUpdated` counts in response | No regression. The server still counts the same fields. Client message now says "Updated X character field(s) and Y Pokemon" instead of a mixed count. More accurate. |
| M1 | b38c2e6 | Rename `importResult` to `operationResult` | No rules impact. Pure naming refactor. All references updated in composable and component. |
| M2 | 723ff37 | Update app-surface.md with new endpoints | No rules impact. Documentation only. |
| M3 | 606d725 | Read appVersion from package.json | No rules impact. Export metadata field only. Import does not validate appVersion. |
| M4 | 3e1f82d | Refetch server addresses on every panel expand | No rules impact. Networking feature only. |
| docs | d0028f1 | Update feature-003 ticket with fix cycle log | No rules impact. Documentation only. |

## Held Item Observation (Carried Forward from rules-review-142)

The M1 observation from rules-review-142 remains valid: held item changes have combat implications (Leftovers, Focus Sash, Choice items, type-boosting items), and the import result banner does not specifically flag held item changes for GM awareness. This is not a rules violation -- the design spec explicitly permits held item editing offline. No fix commits changed the held item handling logic. This remains a future-tier enhancement consideration.

## Summary

All 9 fix commits were reviewed against the PTU rules surface of the import/export feature. The editable field scope is unchanged: `background`, `personality`, `goals`, `notes` for characters; `nickname`, `heldItem`, and move reorder for Pokemon. Stats, level, XP, moves (learning new), equipment, and inventory remain server-only. Move reorder logic still maps exclusively to server move objects, preventing injection. Conflict detection preserves GM authority via server-wins resolution. The C1 fix (removing `.passthrough()`) strengthened validation without changing behavior. The H2 fix (single transaction) improved atomicity. No rules regressions found.

## Rulings

None required. All fix commits are infrastructure/UX improvements that do not alter game mechanics.

## Verdict

**APPROVED**

No PTU rules regressions from the fix cycle. The editable field scope, move reorder safety, conflict detection, and GM authority boundaries are all intact. The C1 and H2 fixes are net improvements to the defense posture of rules-relevant code.

## Required Changes

None.
