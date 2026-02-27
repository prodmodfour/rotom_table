---
review_id: rules-review-142
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003-track-b-p0
domain: player-view
commits_reviewed:
  - 8f2f0fc
  - 3b62b67
  - 9ad897e
  - 1131ee0
  - 0a6c8b3
  - 6ed4904
  - 8128905
files_reviewed:
  - app/server/api/player/export/[characterId].get.ts
  - app/server/api/player/import/[characterId].post.ts
  - app/composables/useCharacterExportImport.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-24T17:50:00Z
follows_up: null
---

## Review Scope

Track B P0 of feature-003: JSON export/import for out-of-session character management and ServerAddressDisplay for LAN connectivity. Rules review focuses on whether the import's editable field scope correctly respects PTU game mechanics and GM authority boundaries.

**PTU rules relevance:** This feature is primarily infrastructure (data portability, networking). The rules-relevant surface is the import endpoint's whitelist of player-editable fields -- determining which changes a player can make offline without GM oversight.

## Rules Analysis

### Editable Field Scope (Import Endpoint)

The import endpoint allows players to edit offline:

| Field | Entity | PTU Rules Impact | Verdict |
|-------|--------|-----------------|---------|
| `background` | Character | No mechanical impact (flavor text) | Correct -- safe for offline edit |
| `personality` | Character | No mechanical impact (flavor text) | Correct -- safe for offline edit |
| `goals` | Character | No mechanical impact (flavor text) | Correct -- safe for offline edit |
| `notes` | Character | No mechanical impact (player notes) | Correct -- safe for offline edit |
| `nickname` | Pokemon | No mechanical impact per PTU rules | Correct -- safe for offline edit |
| `heldItem` | Pokemon | **Has mechanical impact** (see M1 below) | Conditionally correct |
| `moves` (reorder) | Pokemon | Order affects move selection in combat | Correct -- reorder only, no new moves |

### Held Item Analysis (PTU Chapter 5 -- Equipment & Items)

Pokemon held items in PTU have direct combat effects:
- **Leftovers:** Restore 1/16 max HP at end of each turn
- **Focus Sash:** Survive a hit that would KO at full HP
- **Choice Band/Specs/Scarf:** Lock into one move, boost Attack/SpAtk/Speed
- **Berries:** Trigger at HP thresholds
- **Type-boosting items:** Mystic Water, Charcoal, etc. add damage

The import endpoint allows changing `heldItem` offline. In a strict PTU interpretation, item assignment has mechanical consequences and should require GM awareness. However:

1. The design spec explicitly lists held items as player-editable (design-player-view-infra-001.md, "What Players Can Edit Offline" table)
2. In practice, players manage their own items between sessions (buying items at shops, rearranging team equipment)
3. The GM can override any item change during the next session
4. The conflict detection ensures that if the GM changed the held item during a session, the server version wins

This is a reasonable design decision. The offline-editable held item allows session preparation without requiring the server.

### Move Reorder Safety

The import endpoint processes move changes at lines 199-235:
1. Filters to only accept moves that already exist on the server (`serverMoveIds.has(m.id)`)
2. Maps back to the full server move objects (not import data)
3. Appends server moves not present in the import

This correctly prevents:
- **Learning new moves offline** (moves not on the server are rejected)
- **Modifying move data** (the server's move objects are used, not the import's)
- **Move data injection** (server-authoritative move objects are always used)

Per PTU rules, learning new moves requires leveling up (GM oversight) or Move Tutor (costs Tutor Points, GM oversight). The import correctly restricts to reordering existing moves only.

### Export Data Completeness

The export includes the full character and all owned Pokemon via `serializeCharacter()` and `serializePokemon()`. This captures:
- All stats, combat modifiers, stage modifiers
- Status conditions, injuries, HP
- Equipment, inventory, money
- All Pokemon with moves, abilities, stats, nature

This is comprehensive for a read-only offline reference. The player can review their full character sheet from the exported JSON.

### Server Address Display

`ServerAddressDisplay.vue` and `GET /api/settings/server-info` have no PTU rules implications. These are pure infrastructure components for LAN connectivity.

## Issues

### MEDIUM

#### M1: Held item changes could create session-start confusion if GM is unaware

**Files:** `app/server/api/player/import/[characterId].post.ts`

If a player changes a Pokemon's held item offline (e.g., swapping from Leftovers to Choice Band) and imports the change at session start, the GM may not notice the change. The import result banner shows the number of changes but does not specifically highlight held item changes, which have direct combat implications.

This is not a rules violation -- the design spec explicitly permits it. However, future enhancement consideration: the import response could flag held item changes separately so the GM (or a future GM-facing import review UI) can quickly spot mechanically significant changes vs. flavor text changes.

**No fix required for P0.** This is an observation for future Track B tiers. The current implementation correctly follows the design spec.

## What Looks Good

1. **Conservative edit scope follows PTU authority model.** Stats, level, XP, moves (learning new ones), equipment, and inventory are correctly locked to server-only modification. These all require GM oversight per PTU rules (leveling, item purchases, training).

2. **Conflict detection preserves GM authority.** When the server has newer data (GM made changes during a session), server wins unconditionally. This prevents a player from accidentally reverting GM stat corrections, injury tracking, or status condition changes by importing a stale export.

3. **Move handling is rules-correct.** Only reordering of existing known moves is permitted. No ability to learn new moves, modify move data, or inject moves that don't exist on the server. This matches PTU's move learning requirements (level-up, Tutor Points, TMs -- all requiring GM context).

4. **Export includes complete data for offline reference.** Players can review their full character sheet, Pokemon stats, moves, abilities, and equipment from the JSON export. This covers the primary between-session use case (planning, reviewing) without requiring the server.

## Verdict

**APPROVED**

The import's editable field scope correctly follows PTU authority boundaries. Mechanically impactful fields (stats, level, moves, equipment) are server-only. Flavor text and planning fields (background, notes, nicknames, held items, move order) are safely editable offline. Conflict resolution preserves GM authority. No PTU rules violations found.
