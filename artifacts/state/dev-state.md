---
last_updated: 2026-03-06T19:30:00
updated_by: slave-collector (plan-1772793388)
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`) — 4 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-059 | P3 | open | Math.trunc vs Math.floor in movementModifier |
| bug-061 | P3 | open | AP drain injury healing missing validation |
| bug-068 | P3 | open | densityMultiplier lost on encounter table export/import round-trip |
| bug-052 | P4 | open | PlayerCharacterSheet.vue uses bare tag class instead of tag--feature variant |

### PTU Rule Tickets (`tickets/open/ptu-rule/`) — 15 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-147 | P2 | open | No per-effect duration tracking for combat stages |
| ptu-rule-149 | P2 | open | VTT allows free token repositioning without movement enforcement |
| ptu-rule-155 | P2 | open | Player-view R156-R160 implementation gaps (R156/R159/R160 reclassified to Partial) |
| ptu-rule-156 | P2 | open | Terrain/weather-sourced Other conditions must re-apply on send-out per decree-053 |
| ptu-rule-157 | P2 | open | Heavily injured penalty missing faint vs unconscious distinction |
| ptu-rule-158 | P2 | open | Heavily injured penalty needs action-type scope limitation |
| ptu-rule-143 | P3 | open | Sprint should not consume Shift Action (decree-050) |
| ptu-rule-144 | P3 | open | Amateur milestone lifestyle stat points missing |
| ptu-rule-145 | P3 | open | Level 30/40 milestones missing bonus edges/features |
| ptu-rule-146 | P3 | open | App defaults to set damage instead of rolled damage |
| ptu-rule-148 | P3 | open | Pokemon released mid-round after initiative passed |
| ptu-rule-152 | P3 | open | No distinction between natural and move-created weather |
| ptu-rule-153 | P3 | open | Nature Walk terrain bypass utility incomplete |
| ptu-rule-154 | P3 | open | Hazard terrain has no mechanical effect |
| ptu-rule-159 | P4 | open | Pain Split marker injury deferral not implemented |

### Feature Tickets (`tickets/open/feature/`) — 2 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| feature-026 | P2 | open | Auto-parse [+Stat] feature tags for stat bonuses |
| feature-027 | P2 | open | Migrate edge data model from string[] to structured objects |

### UX Tickets (`tickets/open/ux/`) — 8 open
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

### Refactoring Tickets (`tickets/open/refactoring/`) — 28 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-145 | P3 | open | Extract duplicated heavily injured penalty block into shared server utility |
| refactoring-099 | P4 | open | Extract XP actions from encounter.ts store (806 lines) |
| refactoring-100 | P4 | open | Reset badlyPoisonedRound on faint in applyDamageToEntity |
| refactoring-101 | P4 | open | Deduplicate type-badge SCSS across evolution components |
| refactoring-102 | P4 | open | Extract EvolutionSelectionModal from duplicated branching evolution UI |
| refactoring-103 | P4 | open | damage.post.ts uses species instead of nickname for defeated enemy tracking |
| refactoring-104 | P4 | open | useCharacterCreation.ts has inline rank progression arrays instead of shared constant |
| refactoring-107 | P4 | open | Extract duplicated SCSS from level-up P1 components |
| refactoring-109 | P4 | open | Tighten MoveDetail interface types in MoveLearningPanel |
| refactoring-110 | P4 | open | Hide Level 40 ability button when Level 20 milestone incomplete |
| refactoring-115 | P4 | open | switching.service.ts exceeds 800-line limit (now 839 lines) |
| refactoring-116 | P4 | open | XpDistributionModal.vue exceeds 800-line file limit (1016 lines) |
| refactoring-118 | P4 | open | Remove unused flankingMap destructure in GridCanvas.vue |
| refactoring-119 | P4 | open | Update stale interrupt.post.ts file header comment |
| refactoring-121 | P4 | open | Add flanking_update to WebSocketEvent union type |
| refactoring-123 | P4 | open | Fix distanceMoved to use actual moved value in intercept failure paths |
| refactoring-124 | P4 | open | Replace hardcoded speed=20 in InterceptPrompt.vue |
| refactoring-126 | P4 | open | Pokemon PUT/POST endpoints wrap all errors in statusCode 500 |
| refactoring-130 | P4 | open | Environment preset clearing stores '{}' instead of null in database |
| refactoring-132 | P4 | open | Add type-narrowing helper for Combatant entity access |
| refactoring-136 | P4 | open | Remove dead enterBetweenTurns/exitBetweenTurns exports from useEncounterOutOfTurn |
| refactoring-137 | P4 | open | toggleVisionCapability uses direct getHistory() instead of delegated captureSnapshot |
| refactoring-138 | P4 | open | Remaining entity mutation sites in aoo-resolve, breather, healing-item, living-weapon |
| refactoring-140 | P4 | open | Update stale 'mutates entity' comment in damage.post.ts |
| refactoring-141 | P4 | open | Remove redundant useAction('standard') call for Sprint and Breather |
| refactoring-142 | P4 | open | Add unit tests for computeEquipmentBonuses including conditionalSpeedPenalties |
| refactoring-143 | P4 | open | Add unit tests for checkRecallReleasePair including isFaintedSwitch path |
| refactoring-144 | P4 | open | Update decree-001 citation comments in weather tick minimum floor |

### Docs Tickets (`tickets/open/docs/`) — 1 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| docs-017 | P4 | open | bug-047 resolution log has stale commit hashes and missing affected_files |

### Decree-Need Tickets (`tickets/open/decree/`) — 1 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| decree-need-053 | P2 | open | HP-loss pathway: should Belly Drum/Life Orb bypass massive damage injury? |

### In-Progress Tickets — 7
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-129 | P3 | **in-progress** | Condition source-tracking — rework done (CRIT-001/HIGH-001/MED fixes), needs re-review |
| bug-056 | P1 | **in-progress** | XP auto-level milestone choices — CHANGES_REQUIRED (code-review-348) |
| ptu-rule-151 | P1 | **in-progress** | Heavily Injured standard action faint trigger — CHANGES_REQUIRED (code-review-351) |
| bug-057 | P2 | **in-progress** | Max trainer level (50) enforcement — CHANGES_REQUIRED (code-review-353) |
| bug-058 | P2 | **in-progress** | HP-loss pathway (Belly Drum/Life Orb) — CHANGES_REQUIRED (code-review-352) |
| ptu-rule-150 | P2 | **in-progress** | Set-HP/Lose-HP flag — CHANGES_REQUIRED (via bug-058, code-review-352) |
| bug-060 | P2 | **in-progress** | Encounter table density export/import — CHANGES_REQUIRED (code-review-354) |

## Active Developer Work

**Current status:** Session 122 collection complete. No active slaves.

**Last session (122, 2026-03-06, plan-1772793388):**
- slave-1 (dev): refactoring-129 — 5 commits. CHANGES_REQUIRED rework: synced conditionInstances on revive Fainted removal (CRIT-001), filtered conditionInstances on encounter-end (HIGH-001), documented system source clearing omission (MED-002), registered conditionSourceRules in app-surface (MED-001).
- slave-6 (dev): ptu-rule-155 — 1 commit. Reclassified R156/R159/R160 capture rules to Partial in player-view matrix.
- slave-2 (review): bug-056 — code-review-348 CHANGES_REQUIRED + rules-review-315 APPROVED.
- slave-3 (review): bug-064 — code-review-349 APPROVED.
- slave-4 (review): bug-065+066 — code-review-350 APPROVED.
- slave-5 (review): ptu-rule-151 — code-review-351 CHANGES_REQUIRED + rules-review-316 APPROVED.
- slave-7 (review): bug-058+ptu-rule-150 — code-review-352 CHANGES_REQUIRED + rules-review-317 APPROVED WITH NOTES.
- slave-8 (review): bug-057 — code-review-353 CHANGES_REQUIRED.
- slave-9 (review): bug-060 — code-review-354 CHANGES_REQUIRED.
- slave-10 (review): bug-062 — code-review-355 APPROVED.
- slave-11 (review): bug-063 — code-review-356 APPROVED.
- slave-12 (review): bug-067 — code-review-357 APPROVED.

**Session 121 (2026-03-06, plan-1772755770):**
- slave-1–10 (dev): bug-064, bug-056, bug-065+066, ptu-rule-151, bug-058+ptu-rule-150, bug-057, bug-060, bug-062, bug-063, bug-067 — 61 commits total.
- slave-11 (reviewers): refactoring-129 — CHANGES_REQUIRED.

**Session 120 (2026-03-05, plan-1772711294):**
- slave-1 (dev): refactoring-129 — 15 commits. Full condition source-tracking (P0+P1).
- slave-2–9 (matrix): Re-mapped 8 domains.
- slave-10–14 (review): 5 reviews, all APPROVED.

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-06 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 9 |
| Open tickets (P3) | 11 |
| Open tickets (P4) | 40 |
| In-progress tickets | 7 (5 CHANGES_REQUIRED bugs, ptu-rule-150/151, refactoring-129 rework) |
| Total open + in-progress | 67 |
| Decree-needs pending | 1 (decree-need-053) |
| Needing re-review | refactoring-129 (rework done) |
| Smoke test | PASSED (all 3 views render) |
