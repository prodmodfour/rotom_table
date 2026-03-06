---
last_updated: 2026-03-06T10:00:00
updated_by: slave-collector (plan-1772755770)
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`) — 3 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-059 | P3 | open | Math.trunc vs Math.floor in movementModifier |
| bug-061 | P3 | open | AP drain injury healing missing validation |
| bug-052 | P4 | open | PlayerCharacterSheet.vue uses bare tag class instead of tag--feature variant |

### PTU Rule Tickets (`tickets/open/ptu-rule/`) — 13 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-147 | P2 | open | No per-effect duration tracking for combat stages |
| ptu-rule-149 | P2 | open | VTT allows free token repositioning without movement enforcement |
| ptu-rule-155 | P2 | open | Player-view R156-R160 implementation gaps |
| ptu-rule-143 | P3 | open | Sprint should not consume Shift Action (decree-050) |
| ptu-rule-144 | P3 | open | Amateur milestone lifestyle stat points missing |
| ptu-rule-145 | P3 | open | Level 30/40 milestones missing bonus edges/features |
| ptu-rule-146 | P3 | open | App defaults to set damage instead of rolled damage |
| ptu-rule-148 | P3 | open | Pokemon released mid-round after initiative passed |
| ptu-rule-152 | P3 | open | No distinction between natural and move-created weather |
| ptu-rule-153 | P3 | open | Nature Walk terrain bypass utility incomplete |
| ptu-rule-154 | P3 | open | Hazard terrain has no mechanical effect |
| ptu-rule-141 | P4 | open | Gas Mask uses fabricated capability name in grantedCapabilities |
| ptu-rule-142 | P4 | open | Implement Permafrost Burn/Poison status tick damage reduction |

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

### Refactoring Tickets (`tickets/open/refactoring/`) — 27 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
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

### Decree-Need Tickets (`tickets/open/decree/`)
*(All decree-needs resolved)*

### In-Progress Tickets — 11
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-129 | P3 | **in-progress** | Condition source-tracking — CHANGES_REQUIRED (code-review-347, rules-review-314) |
| bug-056 | P1 | **in-progress** | XP auto-level milestone choices — fix implemented, needs review |
| bug-064 | P1 | **in-progress** | SCSS $spacing-xs undefined — fix implemented, needs review |
| bug-065 | P1 | **in-progress** | Missing upload-simple.svg icon — fix implemented, needs review |
| bug-066 | P1 | **in-progress** | EncounterTableTableEditor name mismatch — fix implemented, needs review |
| ptu-rule-151 | P1 | **in-progress** | Heavily Injured standard action faint trigger — implemented, needs review |
| bug-057 | P2 | **in-progress** | Max trainer level (50) enforcement — fix implemented, needs review |
| bug-058 | P2 | **in-progress** | HP-loss pathway (Belly Drum/Life Orb) — implemented, needs review |
| ptu-rule-150 | P2 | **in-progress** | Set-HP/Lose-HP flag — implemented (via bug-058), needs review |
| bug-060 | P2 | **in-progress** | Encounter table density export/import — fix implemented, needs review |
| bug-062 | P2 | **in-progress** | Scene frequency reset wiring — fix implemented, needs review |
| bug-063 | P2 | **in-progress** | Speed CS floor ordering — fix implemented, needs review |
| bug-067 | P2 | **in-progress** | PlayerPokemonCard expansion crash — fix implemented, needs review |

## Active Developer Work

**Current status:** Session 121 collection complete. No active slaves.

**Last session (121, 2026-03-06, plan-1772755770):**
- slave-1 (dev): bug-064 — 2 commits. Added missing `@use '../variables' as *` to _level-up-shared.scss.
- slave-2 (dev): bug-056 — 15 commits. Milestone detection in XP pipeline, queued milestone warnings in all XP distribution UIs, fromLevel prop to prevent LevelUpModal race condition.
- slave-3 (dev): bug-065+066 — 4 commits. Added upload-simple.svg icon, fixed TableEditor/ImportTableModal component names.
- slave-4 (dev): ptu-rule-151 — 12 commits. Heavily Injured standard-action faint penalty across 9 combat endpoints + next-turn guard.
- slave-5 (dev): bug-058+ptu-rule-150 — 8 commits. HpReductionType enum (damage/hpLoss/setHp), bypass massive damage for HP loss, GM damage type selector.
- slave-6 (dev): bug-057 — 5 commits. validateTrainerLevel utility, enforced on create/update/CSV-import.
- slave-7 (dev): bug-060 — 5 commits. Density field in export, restore on import, species warnings in import modal.
- slave-8 (dev): bug-062 — 2 commits. resetSceneUsage called on scene activate/deactivate.
- slave-9 (dev): bug-063 — 4 commits. Speed CS floor applied before Slowed, deduplicated speed calc in intercept service.
- slave-10 (dev): bug-067 — 4 commits. Fixed serializer missing statusConditions/stageModifiers, added null guards in PlayerPokemonCard/PlayerCharacterSheet.
- slave-11 (reviewers): refactoring-129 — code-review-347 + rules-review-314 = **CHANGES_REQUIRED**.

**Session 120 (2026-03-05, plan-1772711294):**
- slave-1 (dev): refactoring-129 — 15 commits. Full condition source-tracking (P0+P1).
- slave-2–9 (matrix): Re-mapped 8 domains.
- slave-10–14 (review): 5 reviews, all APPROVED.

**Session 119 (2026-03-05, plan-1772707228):**
- slave-1–5 (review): 6 tickets APPROVED.
- slave-6–10 (dev): ptu-rule-121, ptu-rule-125+126, ptu-rule-130, ptu-rule-133, refactoring-129 design spec.

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-06 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 7 |
| Open tickets (P3) | 12 |
| Open tickets (P4) | 35 |
| In-progress tickets | 13 (10 dev bug/rule fixes, refactoring-129, ptu-rule-150, bug-067) |
| Total open + in-progress | 67 |
| Decree-needs pending | 0 |
| Needing review | 12 newly implemented fixes + refactoring-129 rework |
| Smoke test | PASSED (all 3 views render) |
