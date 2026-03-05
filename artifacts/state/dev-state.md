---
last_updated: 2026-03-05T12:00:00
updated_by: survey
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-052 | P4 | open | PlayerCharacterSheet.vue uses bare tag class instead of tag--feature variant |
| bug-053 | P2 | open | Vision state not propagated via WebSocket to other clients (CRIT-1+HIGH-1) |

### PTU Rule Tickets (`tickets/open/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-121 | P4 | open | Sprint endpoint missing action consumption |
| ptu-rule-125 | P4 | open | Populate grantedCapabilities on capability-granting catalog entries |
| ptu-rule-126 | P4 | open | Snow Boots conditional Overland speed penalty not enforced |
| ptu-rule-130 | P4 | open | Fainted recall+release pair should not apply League switch restriction |
| ptu-rule-133 | P4 | open | Permafrost ability weather damage reduction not handled |

### Feature Tickets (`tickets/in-progress/feature/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| feature-025 | P2 | **in-progress** | Per-combatant Darkvision/Blindsense tracking — P0 done, code-review-331 CHANGES_REQUIRED |

### UX Tickets (`tickets/open/ux/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ux-006 | P4 | open | PTU injury markers may leak precise HP info in player mode |
| ux-011 | P4 | open | Custom item form missing grantedCapabilities input field |
| ux-013 | P4 | open | LevelUpSummary stacked bonus Skill Edge display incorrect progression |
| ux-014 | P4 | open | Evolution undo snapshot staleness warning |
| ux-015 | P4 | open | Replace alert() with inline UI for evolution prevention messages |
| ux-016 | P4 | open | hasActed flag not set when all three actions individually exhausted |
| ux-017 | P4 | open | Preset descriptions misleadingly imply tier-specific vision negation |
| ux-018 | P4 | open | Environment preset descriptions imply tier-specific vision negation |

### Docs Tickets (`tickets/open/docs/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| docs-017 | P4 | open | bug-047 resolution log has stale commit hashes and missing affected_files |
| docs-018 | P4 | open | app-surface.md missing vision tracking endpoint, component, and utility |

### Refactoring Tickets

#### Open (`tickets/open/refactoring/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-086 | P4 | open | Code-review-189 MED-1 (combat) |
| refactoring-087 | P4 | open | Code-review-190 MED-1 (vtt-grid) |
| refactoring-088 | P4 | open | Code-review-195 MED-1 (vtt-grid) |
| refactoring-091 | P4 | open | Code-review-203 M1 (character-lifecycle) |
| refactoring-095 | P4 | open | Guard addEdge() against Skill Edge string injection |
| refactoring-098 | P3 | open | Refactor entity mutation in heavily injured/death paths to immutable patterns |
| refactoring-099 | P4 | open | Extract XP actions from encounter.ts store (806 lines) |
| refactoring-100 | P4 | open | Reset badlyPoisonedRound on faint in applyDamageToEntity |
| refactoring-101 | P4 | open | Deduplicate type-badge SCSS across evolution components |
| refactoring-102 | P4 | open | Extract EvolutionSelectionModal from duplicated branching evolution UI |
| refactoring-103 | P4 | open | damage.post.ts uses species instead of nickname for defeated enemy tracking |
| refactoring-104 | P4 | open | useCharacterCreation.ts has inline rank progression arrays instead of shared constant |
| refactoring-107 | P4 | open | Extract duplicated SCSS from level-up P1 components |
| refactoring-109 | P4 | open | Tighten MoveDetail interface types in MoveLearningPanel |
| refactoring-110 | P4 | open | Hide Level 40 ability button when Level 20 milestone incomplete |
| refactoring-113 | P3 | open | Wire or remove autoDeclineFaintedReactor in aoo-resolve.post.ts |
| refactoring-115 | P4 | open | switching.service.ts exceeds 800-line limit (811 lines) |
| refactoring-116 | P4 | open | XpDistributionModal.vue exceeds 800-line file limit (1016 lines) |
| refactoring-117 | P3 | open | Extract loyalty calculation to shared utility |
| refactoring-118 | P4 | open | Remove unused flankingMap destructure in GridCanvas.vue |
| refactoring-119 | P4 | open | Update stale interrupt.post.ts file header comment |
| refactoring-121 | P4 | open | Add flanking_update to WebSocketEvent union type |
| refactoring-122 | P3 | open | Wire receivedFlankingMap into group/player views |
| refactoring-123 | P4 | open | Fix distanceMoved to use actual moved value in intercept failure paths |
| refactoring-124 | P4 | open | Replace hardcoded speed=20 in InterceptPrompt.vue |
| refactoring-126 | P4 | open | Pokemon PUT/POST endpoints wrap all errors in statusCode 500 |
| refactoring-128 | P3 | open | Extract getEffectiveEquipBonuses from useMoveCalculation.ts |
| refactoring-129 | P3 | open | Design source-tracking for applied conditions |
| refactoring-130 | P4 | open | Environment preset clearing stores '{}' instead of null in database |
| refactoring-132 | P4 | open | Extract shared significance preset utilities |
| refactoring-133 | P4 | open | Validate `source` parameter in vision toggle API endpoint |
| refactoring-134 | P4 | open | alert() reintroduced in toggleVisionCapability store action |
| refactoring-135 | P4 | open | Vision toggle API lacks source parameter validation |

## Active Developer Work

**Current status:** Session 116 collection complete. No active slaves.

**Last session (116, 2026-03-05, plan-1772668105):**
- slave-1 (review): feature-025 — 2 commits. **CHANGES_REQUIRED** (code-review-331: 1C+2H+2M). Rules-review-303 APPROVED.
- slave-2 (dev): refactoring-112 — 9 commits. Encounter store decomposed into 5 composables (970→sub-800 lines)
- slave-3 (dev): refactoring-131 — 9 commits. Replaced ~46 alert() calls with useGmToast across all non-combat domains
- slave-4 (dev): ptu-rule-135 — 4 commits. Implemented origin-dependent loyalty defaults (decree-049)

**Session 115 (2026-03-04, plan-1772664485):**
- slave-1 (dev): bug-051 — 2 commits. Housekeeping: verified fix, closed ticket lifecycle
- slave-2 (dev): feature-025 — 8 commits. Implemented darkvision/blindsense tracking P0 (decree-048)
- slave-3 (dev): ptu-rule-058 — 1 commit. Verified P2 fix cycle, added verification log
- slave-4–8 (reviews): refactoring-097 C/R, refactoring-111 APPROVED, refactoring-108 C/R, bug-047 APPROVED, refactoring-096 APPROVED

**Session 114 (2026-03-04, plan-1772661312):**
- slave-1 (dev): refactoring-097 — 6 commits. alert()→toast conversion (useGmToast + GmToastContainer)
- slave-2 (dev): feature-025 — 1 commit. Design spec: design-darkvision-tracking-001
- slave-3–6 (dev): refactoring-096, refactoring-111, refactoring-108, bug-047

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-05 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 1 (bug-053 vision WS sync) |
| Open tickets (P3) | 6 |
| Open tickets (P4) | 43 |
| In-progress tickets | 1 (feature-025, P2) |
| Total open + in-progress | 51 |
| Needing fix cycles | feature-025 (code-review-331: 1C+2H+2M) |
| Needing review | (none — ptu-rule-135, refactoring-112, refactoring-131 now resolved but merged without review) |
