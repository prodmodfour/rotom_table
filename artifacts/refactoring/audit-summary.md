---
last_audited: 2026-02-18T12:00:00
audited_by: code-health-auditor
scope: "full codebase"
files_scanned: 261
files_deep_read: 20
total_tickets: 10
overflow_files: 0
---

## Metrics
| Metric | Value |
|--------|-------|
| Total files scanned | 261 |
| Total lines of code | 51,831 |
| Files over 800 lines | 6 |
| Files over 600 lines | 4 (next tier) |
| Files over 400 lines | 26 |
| Open tickets (P0) | 3 |
| Open tickets (P1) | 5 |
| Open tickets (P2) | 2 |

## Hotspots
| Rank | File | Lines | Changes (since 02-16) | Categories | Priority |
|------|------|-------|----------------------|------------|----------|
| 1 | app/pages/gm/pokemon/[id].vue | 1614 | 1 | LLM-SIZE, EXT-GOD, LLM-TYPES, EXT-LAYER | P0 |
| 2 | app/pages/gm/habitats/[id].vue | 1024 | 0 | LLM-SIZE, EXT-DUPLICATE, EXT-GOD | P0 |
| 3 | app/pages/gm/characters/[id].vue | 953 | 0 | LLM-SIZE, LLM-TYPES | P0 |
| 4 | app/pages/gm/encounter-tables/[id].vue | 938 | 0 | LLM-SIZE, EXT-DUPLICATE | P0 (via 023) |
| 5 | app/pages/gm/encounter-tables.vue | 927 | 0 | LLM-SIZE, EXT-GOD, EXT-DUPLICATE | P1 |
| 6 | app/components/encounter/MoveTargetModal.vue | 826 | 0 | — (CSS-heavy, script 68 lines) | — |
| 7 | app/components/group/CombatantDetailsPanel.vue | 749 | 0 | — (CSS-heavy, script 116 lines) | — |
| 8 | app/components/habitat/GenerateEncounterModal.vue | 747 | 0 | — (clean component) | — |
| 9 | app/pages/gm/scenes/[id].vue | 680 | 0 | — (within limits) | — |
| 10 | app/pages/gm/encounters.vue | 647 | 0 | — (within limits) | — |

Note: MoveTargetModal.vue (826 lines) and CombatantDetailsPanel.vue (749 lines) are CSS-heavy with small scripts — not real LLM-friendliness issues (consistent with previous audit finding).

## Tickets Written
- `refactoring-023`: Duplicated table editor — encounter-tables/[id].vue ↔ habitats/[id].vue, ~1960 combined lines (P0)
- `refactoring-024`: pokemon/[id].vue — God page, 1614 lines, 6+ responsibilities, `as any` casts (P0)
- `refactoring-025`: characters/[id].vue — 953 lines, 10 `as any` casts (highest in codebase) (P0)
- `refactoring-026`: Duplicated healing tab between pokemon/[id].vue and characters/[id].vue (P1)
- `refactoring-027`: encounter-tables.vue — God page, 927 lines, 7 responsibilities (P1)
- `refactoring-028`: import-csv.post.ts — Monolithic 518-line endpoint with inline CSV parser + DB creation (P1)
- `refactoring-029`: groupViewTabs.ts — 7 Scene interfaces defined in store instead of types/ (P1)
- `refactoring-030`: Duplicated encounter creation workflow in 2 files (P1)
- `refactoring-031`: `as any` casts in 3 encounter UI components (P2)
- `refactoring-032`: SCSS duplication — type badges, modal overlay, sheet styles across 6+ files (P2)

## Overflow
None — all qualifying files fit within the 20-file cap.

## Comparison to Last Audit
- Previous audit: 2026-02-16, domain: combat only, 69 files, 15 deep-read, 7 tickets
- Resolved since last audit: 22 tickets (001-022) — all resolved
- New issues found: 10 tickets (023-032)
- Trend: **improving in combat domain** (0 open combat tickets), **new issues revealed in non-combat domains** (pages, stores, SCSS)

The combat domain is now clean after 22 resolved tickets. The new findings are concentrated in:
1. **GM sheet pages** (pokemon/characters) — God pages with duplicated healing logic
2. **Encounter table pages** (encounter-tables/[id], habitats/[id], encounter-tables) — massive file duplication
3. **Type system gaps** — `as any` casts hiding missing type fields
4. **SCSS duplication** — shared styles copy-pasted instead of extracted

## Clean Files (notable)
The following large non-combat files had **no issues** after deep-read:
- `app/composables/useRangeParser.ts` (594 lines) — well-typed, single-purpose VTT range parser
- `app/composables/useGridInteraction.ts` (588 lines) — complex but focused composable
- `app/stores/encounter.ts` (574 lines) — dramatically improved from 945 lines after refactoring-001
- `app/server/services/combatant.service.ts` (572 lines) — well-typed, clean interfaces
- `app/components/encounter-table/ModificationCard.vue` (538 lines) — CSS-heavy, logic reasonable
- `app/stores/encounterTables.ts` (519 lines) — clean store with minor `e: any` catch blocks
- `app/components/character/CharacterModal.vue` (535 lines) — CSS-heavy, logic clean
- `app/composables/usePokemonSprite.ts` (450 lines) — well-focused, single concern
- `app/composables/useMoveCalculation.ts` (460 lines) — clean after refactoring-017/018

## Recommended First Ticket

**Start with refactoring-025** (characters/[id].vue `as any` casts). This is the highest-density type safety issue (10 casts in one file) with the simplest fix — add healing fields to `HumanCharacter` and `Pokemon` type definitions. Scope: small (2-3 files, ~50 lines changed). This simultaneously eliminates 3 casts in pokemon/[id].vue and unblocks refactoring-026 (healing tab extraction).

After 025, tackle **refactoring-029** (move Scene types to types/) since it's another small-scope type fix.

Then tackle **refactoring-023** (table editor duplication) — the biggest impact ticket. This removes ~900 lines of duplicate code and drops 2 files below the 800-line threshold.

**refactoring-024** (pokemon/[id].vue God page) is the biggest effort — schedule it after the smaller type fixes are in place, combined with refactoring-026 (healing tab extraction).
