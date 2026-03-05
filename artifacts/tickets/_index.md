---
generated_at: 2026-03-05T18:42:34.547Z
total_tickets: 360
open: 62
in_progress: 1
resolved: 297
---

# Tickets Index

## Open Tickets (62)

| ID | Category | Priority | Domain | Summary |
|----|----------|----------|--------|--------|
| bug-056 | bug | P1 | character-lifecycle | When a character gains enough XP to auto-level past a milest |
| ptu-rule-151 | ptu-rule | P1 | healing | The Heavily Injured status has a secondary trigger: "taking  |
| bug-057 | bug | P2 | character-lifecycle | The character POST and PUT API endpoints do not enforce a ma |
| bug-058 | bug | P2 | combat | PTU distinguishes "HP loss" (e.g., Belly Drum, Life Orb reco |
| bug-060 | bug | P2 | encounter-tables | When exporting and re-importing encounter tables, the densit |
| bug-062 | bug | P2 | scenes | `resetSceneUsage()` exists to clear scene-frequency move cou |
| bug-063 | bug | P2 | vtt-grid | `Math.max(modifiedSpeed, 2)` is applied after the Slowed con |
| ptu-rule-147 | ptu-rule | P2 | combat | Round counter exists but there is no per-effect duration tra |
| ptu-rule-149 | ptu-rule | P2 | combat | The VTT allows tokens to be repositioned freely without enfo |
| ptu-rule-150 | ptu-rule | P2 | healing | No "set HP" or "lose HP" flag exists to distinguish direct H |
| ptu-rule-155 | ptu-rule | P2 | player-view | The player-view implementation audit found that R156-R160 an |
| feature-026 | feature | P2 | character-lifecycle | Implement automatic parsing of `[+Stat]` tags in PTU feature |
| feature-027 | feature | P2 | character-lifecycle | Migrate the edge data model from `string[]` to an array of s |
| bug-059 | bug | P3 | combat | `Math.trunc` is used instead of `Math.floor` in movementModi |
| bug-061 | bug | P3 | healing | The AP drain injury healing pathway does not validate that t |
| ptu-rule-143 | ptu-rule | P3 | combat | Per decree-050, Sprint consumes only the Standard Action (PT |
| ptu-rule-144 | ptu-rule | P3 | character-lifecycle | At level 5 (Amateur milestone), lifestyle stat points should |
| ptu-rule-145 | ptu-rule | P3 | character-lifecycle | Level 30 and 40 milestones grant bonus edges/features with s |
| ptu-rule-146 | ptu-rule | P3 | combat | PTU defaults to rolled damage. The app defaults to set damag |
| ptu-rule-148 | ptu-rule | P3 | combat | When a Pokemon is released mid-round after initiative has pa |
| ptu-rule-152 | ptu-rule | P3 | scenes | PTU distinguishes natural weather (narrative, affects travel |
| ptu-rule-153 | ptu-rule | P3 | scenes | The `naturewalkBypassesTerrain()` utility exists and correct |
| ptu-rule-154 | ptu-rule | P3 | scenes | Hazard terrain type exists visually on the VTT but has no me |
| bug-052 | bug | P4 | character-lifecycle | `PlayerCharacterSheet.vue` renders feature tags with bare `c |
| ptu-rule-141 | ptu-rule | P4 | character-lifecycle | ptu-rule-141: Gas Mask grantedCapabilities uses fabricated c |
| ptu-rule-142 | ptu-rule | P4 | combat | ptu-rule-142: Implement Permafrost Burn/Poison status tick d |
| ux-006 | ux | P4 | — | ux-006: PTU injury markers may leak precise HP info in playe |
| ux-011 | ux | P4 | character-lifecycle | ux-011: Custom item form missing grantedCapabilities input f |
| ux-013 | ux | P4 | character-lifecycle | ux-013: Stacked bonus Skill Edge rank-up display shows incor |
| ux-014 | ux | P4 | pokemon-lifecycle | UX-014: Evolution undo snapshot staleness warning |
| ux-015 | ux | P4 | pokemon-lifecycle | UX-015: Replace alert() with inline UI for evolution prevent |
| ux-016 | ux | P4 | combat | ux-016: hasActed flag not set when all three actions individ |
| ux-017 | ux | P4 | encounter-tables | The Dim Cave preset description says "Negated by Darkvision" |
| ux-018 | ux | P4 | encounter-tables | Dim Cave description says "Negated by Darkvision" and Dark C |
| refactoring-099 | refactoring | P4 | — | refactoring-099: Extract XP actions from encounter.ts store  |
| refactoring-100 | refactoring | P4 | — | When a combatant faints from any damage source, `applyDamage |
| refactoring-101 | refactoring | P4 | pokemon-lifecycle | Deduplicate type-badge SCSS across evolution components |
| refactoring-102 | refactoring | P4 | pokemon-lifecycle | Extract EvolutionSelectionModal from duplicated branching ev |
| refactoring-103 | refactoring | P4 | — | `damage.post.ts` line 119 uses `entity.species` for defeated |
| refactoring-104 | refactoring | P4 | — | `useCharacterCreation.ts` (lines 289, 321) contains inline ` |
| refactoring-107 | refactoring | P4 | character-lifecycle | refactoring-107: Extract duplicated SCSS from level-up P1 co |
| refactoring-109 | refactoring | P4 | pokemon-lifecycle | Tighten MoveDetail interface types in MoveLearningPanel |
| refactoring-110 | refactoring | P4 | pokemon-lifecycle | Hide Level 40 ability button when Level 20 milestone incompl |
| refactoring-115 | refactoring | P4 | combat | Refactoring-115: switching.service.ts exceeds 800-line limit |
| refactoring-116 | refactoring | P4 | — | refactoring-116: XpDistributionModal.vue exceeds 800-line fi |
| refactoring-118 | refactoring | P4 | — | refactoring-118: Remove unused flankingMap destructure in Gr |
| refactoring-119 | refactoring | P4 | — | refactoring-119: Update stale interrupt.post.ts file header  |
| refactoring-121 | refactoring | P4 | vtt-grid | refactoring-121: Add flanking_update to WebSocketEvent union |
| refactoring-123 | refactoring | P4 | combat | refactoring-123: Fix distanceMoved in intercept failure path |
| refactoring-124 | refactoring | P4 | combat, vtt-grid | refactoring-124: Replace hardcoded speed=20 in InterceptProm |
| refactoring-126 | refactoring | P4 | pokemon-lifecycle | The outer catch block in `[id].put.ts` (line ~90) and `index |
| refactoring-130 | refactoring | P4 | encounter-tables | When clearing an environment preset, the endpoint stores `'{ |
| refactoring-132 | refactoring | P4 | combat | refactoring-132: Add type-narrowing helper for Combatant ent |
| refactoring-136 | refactoring | P4 | encounter-tables | `useEncounterOutOfTurn` defines and exports `enterBetweenTur |
| refactoring-137 | refactoring | P4 | encounter-tables | `toggleVisionCapability` (encounter store line 567) calls `g |
| refactoring-138 | refactoring | P4 | combat | Refactoring-098 converted the primary damage/next-turn/move  |
| refactoring-140 | refactoring | P4 | combat | After refactoring-098 converted entity mutations to immutabl |
| refactoring-141 | refactoring | P4 | combat | refactoring-141: Remove redundant useAction('standard') call |
| refactoring-142 | refactoring | P4 | combat | refactoring-142: Add unit tests for computeEquipmentBonuses |
| refactoring-143 | refactoring | P4 | combat | refactoring-143: Add unit tests for checkRecallReleasePair |
| refactoring-144 | refactoring | P4 | combat | refactoring-144: Update decree-001 citation in weather tick  |
| docs-017 | docs | P4 | tooling | The bug-047 ticket resolution log references stale commit ha |

## In-Progress Tickets (1)

| ID | Category | Priority | Domain | Source |
|----|----------|----------|--------|--------|
| refactoring-129 | refactoring | P3 | combat | decree-047 |

## Open Decree-Needs (0)

All decree-needs addressed.

## Summary by Category

| Category | Open | In-Progress | Resolved | Total |
|----------|------|-------------|----------|-------|
| bug | 9 | 0 | 54 | 63 |
| ptu-rule | 15 | 0 | 107 | 122 |
| feature | 2 | 0 | 25 | 27 |
| ux | 8 | 0 | 10 | 18 |
| decree | 0 | 0 | 51 | 51 |
| refactoring | 27 | 1 | 33 | 61 |
| docs | 1 | 0 | 17 | 18 |
