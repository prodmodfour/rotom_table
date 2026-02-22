---
last_updated: 2026-02-22T22:00:00
updated_by: slave-collector (plan-20260222-204629)
---

# Dev Ecosystem State

## Open Tickets

### Bug Tickets (`tickets/bug/`)
| Ticket | Priority | Severity | Status | Summary |
|--------|----------|----------|--------|---------|
| bug-001–029 | P0–P3 | — | resolved | (all resolved — see sessions 1–9) |

### PTU Rule Tickets (`tickets/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-029–076 | P1–P3 | resolved | (all resolved — see sessions 1–12) |
| ptu-rule-045 | P3 | **in-progress** | Equipment/armor system — P0+P1 approved, **P2 fixes applied** (5 commits): WS broadcast to parent, shared constants extraction, input max, app-surface. Needs re-review |
| ptu-rule-055 | P3 | **in-progress** | XP calculation — P0+P1 approved, **P2 fixes applied** (6 commits): NaN guards, remove duplicate level-up, upper bound validation, v-for key, app-surface. Needs re-review |
| ptu-rule-056 | P3 | **in-progress** | Character creation form — P0+P1 approved, **P2 fixes applied** (7 commits): cmToFeetInches bug, trainer weight class, negative int, magic number, money, QuickCreateForm extract. Needs re-review |
| ptu-rule-058 | P3 | **in-progress** | Encounter density/significance — P0+P1 complete, **H1 fix applied** (NaN guards in XpDistributionModal, combined with 055 fixes). Needs re-review |
| ptu-rule-060 | P3 | **in-progress** | Level-budget/significance — **P0 re-reviewed**: code-review-130 CHANGES_REQUIRED (C2: SCSS mixin selector, M3: file size, M4: NPC player count), rules-review-120 APPROVED |
| ptu-rule-077 | P3 | **reviewed** | Focus (Speed) initiative/evasion — fix implemented, **APPROVED** (code-review-125 + rules-review-115) |
| ptu-rule-078 | P3 | **open** | Trainer class associated skills data mismatch (from rules-review-111) |
| ptu-rule-079 | P3 | **open** | Helmet conditional DR not applied with manual DR override (from code-review-120) |
| ptu-rule-080 | P3 | **open** | Higher-level char creation validation missing (from code-review-121) |
| ptu-rule-081 | P4 | **open** | Multiple Focus items not explicitly prevented (from rules-review-115 M2) |
| ptu-rule-082 | P4 | **open** | Pokemon maxHp not auto-updated on level-up (from rules-review-118) |

### Feature Tickets (`tickets/feature/`)
| Ticket | Priority | Status | Summary | Design Complexity |
|--------|----------|--------|---------|-------------------|
| feature-001 | P3 | **design-complete** | B2W2 trainer sprites for NPC/player avatars — design spec written (design-trainer-sprites-001.md) | single-phase |
| feature-002 | P2 | **design-complete** | 3D isometric rotatable grid for VTT — design spec written (design-isometric-grid-001.md) | multi-phase |
| feature-003 | P1 | **design-in-progress** | Full Player View — Track A (core) + Track B (infra) design specs written, Track C (integration) pending | multi-phase-parallel |

### UX Tickets (`tickets/ux/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ux-001 | P4 | **open** | Equipment catalog browser closes on equip, forces re-open for multi-item sessions (from code-review-127 M3) |

## Active Developer Work

**Current task:** Slave collection for plan-20260222-204629 completed — 8 slaves merged (32 commits total).

**Session 15 (2026-02-22):**
- ptu-rule-058 H1 fix applied (slave-1, 6 commits) — NaN-safe computed accessors to XpDistributionModal + ptu-rule-055 P2 fixes (duplicate level-up removal, upper bound validation, v-for key, app-surface)
- ptu-rule-045 P2 fixes applied (slave-2, 5 commits) — WS broadcast moved to parent, shared constants extracted, input max, app-surface
- ptu-rule-056 P2 fixes applied (slave-3, 7 commits) — cmToFeetInches rounding, trainer weight classes, negative value guard, magic number, money, QuickCreateForm extraction
- ptu-rule-060 P0 re-reviewed (slave-4) — code-review-130 CHANGES_REQUIRED (C2: SCSS mixin selector direction, M3: file >800 lines, M4: NPC player count), rules-review-120 APPROVED
- feature-001 design spec written (slave-5) — B2W2 trainer sprites (design-trainer-sprites-001.md)
- feature-002 design spec written (slave-6) — 3D isometric grid (design-isometric-grid-001.md)
- feature-003 Track A design spec written (slave-7) — Player View core (design-player-view-core-001.md)
- feature-003 Track B design spec written (slave-8) — Player View infra (design-player-view-infra-001.md)

**Next actions (by priority — "finish all tiers" rule):**
1. **Fix** ptu-rule-060 P0 issues from code-review-130 (CHANGES_REQUIRED — C2: SCSS mixin ancestor selector, M3: GenerateEncounterModal >800 lines, M4: NPC player count)
2. **Re-review** ptu-rule-058 (H1 fix applied — NaN guards in XpDistributionModal)
3. **Re-review** ptu-rule-045 P2 (fixes applied — WS broadcast, shared constants, input max, app-surface)
4. **Re-review** ptu-rule-055 P2 (fixes applied — duplicate display, upper bound, v-for key, app-surface)
5. **Re-review** ptu-rule-056 P2 (fixes applied — cmToFeetInches, weight class, negative int, magic number, money, extraction)
6. ptu-rule-060 P1+ (level budget remaining tiers)
7. ptu-rule-078 P3 (trainer class skills data correction)
8. ptu-rule-079 P3 (helmet DR parity gap)
9. ptu-rule-080 P3 (higher-level char creation validation)
10. ptu-rule-081 P4 (multiple Focus items enforcement)
11. ptu-rule-082 P4 (Pokemon maxHp auto-update on level-up)
12. feature-003 Track C design (integration — depends on Track A + Track B)

## Review Status

### Session 15 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-130 | ptu-rule-060 P0 re-review | CHANGES_REQUIRED | senior-reviewer | 2026-02-22 |
| rules-review-120 | ptu-rule-060 P0 re-review | APPROVED | game-logic-reviewer | 2026-02-22 |

### Session 14 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-123 | ptu-rule-058 P1 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-113 | ptu-rule-058 P1 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-124 | ptu-rule-060 P0 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-114 | ptu-rule-060 P0 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-125 | ptu-rule-077 fix | APPROVED | senior-reviewer | 2026-02-21 |
| rules-review-115 | ptu-rule-077 fix | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-126 | ptu-rule-058 P1 re-review | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-116 | ptu-rule-058 P1 re-review | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-127 | ptu-rule-045 P2 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-117 | ptu-rule-045 P2 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-128 | ptu-rule-055 P2 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-118 | ptu-rule-055 P2 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-129 | ptu-rule-056 P2 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-119 | ptu-rule-056 P2 | PASS WITH ISSUES | game-logic-reviewer | 2026-02-21 |

### Session 13 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-119 | ptu-rule-055 P1 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-109 | ptu-rule-055 P1 | APPROVED | game-logic-reviewer | 2026-02-20 |
| code-review-119b | ptu-rule-055 P1 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-120 | ptu-rule-045 P1 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-110 | ptu-rule-045 P1 | PASS WITH NOTES | game-logic-reviewer | 2026-02-20 |
| code-review-120b | ptu-rule-045 P1 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-121 | ptu-rule-056 P1 | PASS WITH ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-111 | ptu-rule-056 P1 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-121b | ptu-rule-056 P1 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-122 | ptu-rule-058 P0 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-112 | ptu-rule-058 P0 | PASS | game-logic-reviewer | 2026-02-20 |

### Sessions 9-12 Reviews
(see previous state — 54 review artifacts, all resolved)

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032–056 | P2–P3 | resolved | (all resolved — see sessions 8–12) |
| refactoring-057 | P4 | resolved | Zero-weight selection guard (session 12-13) |
| refactoring-058 | P4 | resolved | Immutable turnState pattern (session 12-13) |
| refactoring-059 | P4 | open | densityMultiplier API serialization cleanup (from code-review-122) |
| refactoring-060 | P4 | open | Count clamping test coverage (from code-review-122) |
| refactoring-061 | P4 | open | CSS duplication in create components (from code-review-121) |
| refactoring-062 | P4 | open | buildCombatantFromEntity test coverage (from code-review-120b) |
| refactoring-063 | P4 | **resolved** | Extract shared significance preset utilities (from code-review-123 M2 + rules-review-113 M2) — resolved by slave-1 |
| refactoring-064 | P4 | **resolved** | Extract shared difficulty color styles (from code-review-124 H2) — resolved by slave-1 (plan-20260221-215717) |
| refactoring-065 | P4 | open | Extract shared evasion computation helper in useMoveCalculation (from code-review-125 M1) |
| refactoring-066 | P4 | open | Use calculateEvasion for initial evasion in combatant builder (from code-review-125 M2) |
| refactoring-067 | P4 | open | Dead calculateInitiative in useCombat missing Focus bonus (from rules-review-115 M1) |
| refactoring-068 | P4 | open | Equipment dropdown uses DOM manipulation instead of reactive ref (from code-review-127 M2) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 1 (feature-003 — design-in-progress) |
| Open tickets (P2) | 1 (feature-002 — design-complete) |
| Open tickets (P3) | 11 (5 ptu-rules in-progress + 1 reviewed + 3 open ptu-rules + feature-001 design-complete + ptu-rule-060 needs fix) |
| Open tickets (P4) | 11 (refactoring-059, 060, 061, 062, 065, 066, 067, 068 + ptu-rule-081, 082 + ux-001) |
| Total open | 24 |
| Total resolved | 140 |

## Session Summary (2026-02-20, session 13)

**Review cycle completed:** 4 P1/P0 implementations reviewed and approved
- ptu-rule-045 P1 (equipment combat — APPROVED_WITH_ISSUES → follow-up APPROVED)
- ptu-rule-055 P1 (XP distribution — CHANGES_REQUIRED → follow-up APPROVED)
- ptu-rule-056 P1 (char creation classes/features — PASS WITH ISSUES → follow-up APPROVED)
- ptu-rule-058 P0 (density/significance — APPROVED + PASS)

**Follow-up fix cycles:** 3 (all resolved same session)
- 045: immutability fix + let→const
- 055: double API calls + stale response protection + SCSS extraction
- 056: skill edge rank reversion + validation clarity + dead code + shared constants

**Refactorings resolved:** 2 (057 zero-weight guard, 058 immutable turnState)

**Tickets created:** 4 (ptu-rule-077, ptu-rule-078, refactoring-059, refactoring-060)

**Reviews completed:** 14 artifacts (5 initial code reviews, 4 rules reviews, 3 follow-up code reviews, 2 pre-existing reviews confirmed)

**Net movement:** 6→9 open (+3 net: +4 new tickets, -2 refactorings resolved, +1 from reclassification), 134→138 resolved (+4)

**All P0, P1, and P2 tickets remain at 0.**

## Session Summary (2026-02-21, session 14)

**Orchestrator orch-1771652588:** ptu-rule-058 P1 (significance multiplier + XP UI)
- 11 commits merged to master via worktree `agent/dev-058-p1-1771652588`
- New: SignificancePanel component, significance PUT endpoint, SCSS partial
- Modified: encounter schema, type, service, store, GM page, XpDistributionModal, encounter list/put endpoints
- ptu-rule-060 is now **unblocked** (058 P1 dependency satisfied)
- Pending: code review + game logic review for 058 P1

**Slave collection plan-20260221-063148:** 4 slaves merged (14 commits total)
- **slave-1** (senior-reviewer): code-review-123 for ptu-rule-058 P1 — verdict: **CHANGES_REQUIRED**
- **slave-2** (game-logic-reviewer): rules-review-113 for ptu-rule-058 P1 — verdict: **APPROVED**
- **slave-4** (developer): ptu-rule-077 Focus (Speed) fix — 7 commits (evasion calc, combatant builder, move calc, damage endpoint, tests)
- **slave-3** (developer): ptu-rule-060 P0 level budget — 5 commits (encounterBudget.ts, useEncounterBudget, BudgetIndicator, modal extensions)

**Slave collection plan-20260221-071325:** 6 slaves merged (26 commits total)
- **slave-1** (developer): ptu-rule-058 P1 fixes — 7 commits (NaN guards, null guard, WS broadcast, utility extraction, fallback fix, app-surface, ticket update)
- **slave-2** (reviewers): ptu-rule-060 P0 review — code-review-124 CHANGES_REQUIRED + rules-review-114 APPROVED
- **slave-3** (reviewers): ptu-rule-077 review — code-review-125 APPROVED + rules-review-115 APPROVED
- **slave-4** (developer): ptu-rule-045 P2 — 6 commits (HumanEquipmentTab, EquipmentCatalogBrowser, CharacterModal, GM page, design+ticket update)
- **slave-5** (developer): ptu-rule-055 P2 — 4 commits (LevelUpNotification, add-experience endpoint, XpDistributionModal integration, ticket update)
- **slave-6** (developer): ptu-rule-056 P2 — 5 commits (BiographySection, useCharacterCreation, create page mode toggle, design+ticket update)

**Tickets filed:** 5 (refactoring-064, 065, 066, 067, ptu-rule-081)
**Tickets resolved:** 1 (refactoring-063 — by slave-1)
**Net movement:** 14→18 open (+4 net: +5 new tickets, -1 resolved)

**Slave collection plan-20260221-215717:** 5 slaves merged (15 commits total)
- **slave-1** (developer): ptu-rule-060 P0 fixes — 7 commits (rename field, player count filter, SCSS extraction, wire props, manual party input, app-surface, ticket update). Also resolved refactoring-064.
- **slave-2** (reviewers): ptu-rule-058 P1 re-review — code-review-126 CHANGES_REQUIRED (H1: XpDistributionModal NaN guards) + rules-review-116 APPROVED
- **slave-3** (reviewers): ptu-rule-045 P2 review — code-review-127 CHANGES_REQUIRED (C1: malformed WS event, H1: duplicated constants, H2: app-surface) + rules-review-117 APPROVED
- **slave-4** (reviewers): ptu-rule-055 P2 review — code-review-128 CHANGES_REQUIRED (H1: duplicate level-up display) + rules-review-118 APPROVED
- **slave-5** (reviewers): ptu-rule-056 P2 review — code-review-129 CHANGES_REQUIRED (C1: file >800 lines, H1: cmToFeetInches bug, H2: wrong weight class) + rules-review-119 PASS WITH ISSUES (H1: weight class)

**Tickets filed:** 3 (ptu-rule-082, refactoring-068, ux-001)
**Tickets resolved:** 1 (refactoring-064 — by slave-1)
**Net movement:** 18→21 open (+3 net: +3 new tickets, -1 resolved, +1 ptu-rule-082 new)

## Session Summary (2026-02-22, session 15)

**Slave collection plan-20260222-204629:** 8 slaves merged (32 commits total)
- **slave-1** (developer): ptu-rule-058 H1 + ptu-rule-055 P2 fixes — 6 commits (NaN-safe computed, remove duplicate level-up, upper bound validation, v-for key, app-surface, ticket update)
- **slave-2** (developer): ptu-rule-045 P2 fixes — 5 commits (WS broadcast to parent, shared constants extraction, input max, app-surface, ticket update)
- **slave-3** (developer): ptu-rule-056 P2 fixes — 7 commits (cmToFeetInches, trainer weight class, negative int guard, magic number, money, QuickCreateForm extraction, ticket update)
- **slave-4** (reviewers): ptu-rule-060 P0 re-review — code-review-130 CHANGES_REQUIRED (C2: SCSS mixin selector, M3: file >800 lines, M4: NPC player count) + rules-review-120 APPROVED
- **slave-5** (developer): feature-001 design — 1 commit (design-trainer-sprites-001.md)
- **slave-6** (developer): feature-002 design — 1 commit (design-isometric-grid-001.md)
- **slave-7** (developer): feature-003 Track A design — 5 commits (design-player-view-core-001.md + PTU rule corrections)
- **slave-8** (developer): feature-003 Track B design — 5 commits (design-player-view-infra-001.md + infrastructure corrections)

**Tickets filed:** 0
**Tickets resolved:** 0
**Design specs created:** 4 (trainer sprites, isometric grid, player view core, player view infra)
**Net movement:** 21→21 open (no change — all work was fix cycles and design specs)

**All P0 tickets remain at 0.**
