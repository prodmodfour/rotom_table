---
id: feature-004
title: Pokemon Mounting / Rider System
priority: P3
severity: MEDIUM
status: in-progress
domain: combat
source: user-request
created_by: user
created_at: 2026-02-28
---

# feature-004: Pokemon Mounting / Rider System

## Summary

PTU has extensive rules for mounting Pokemon in and out of combat (Chapter 5, p218), including the Mountable capability, Rider trainer class (Chapter 4, pp102-103), and Mounted Prowess edge. The app stores `Mountable X` in Pokemon `otherCapabilities` and has the Rider trainer class as a catalog entry, but no mounting mechanics are implemented.

## PTU Rules Coverage

### Core Mounting Rules (Ch5 p218)
- Mounting is a **Standard Action** (Acrobatics/Athletics DC 10)
- Expert Acrobatics/Athletics: mount as Free Action during Shift (2m+ movement)
- Mounted rider uses **mount's Movement Capabilities** for Shift during trainer turn
- Mount can use unused movement + Standard Action on its Pokemon turn
- **Dismount check**: if damage >= 1/4 max HP or Push effect, Acrobatics/Athletics DC 10 to stay mounted
- Confusion self-damage also triggers dismount check
- Rider can order another Pokemon while using mount to Shift
- Easy Intercept between rider and mount (no distance)

### Mountable X Capability (Ch10 pp306-307)
- Pokemon serves as mount for X average Trainers ignoring weight penalties
- GM discretion (size, power, equipment considerations)

### Mounted Prowess Edge (Ch3)
- Prereq: Novice Acrobatics or Athletics
- Auto-succeed mounting checks, +3 to remain-mounted checks

### Rider Trainer Class (Ch4 pp102-103)
- 7 class features: Rider, Ramming Speed, Conqueror's March, Ride as One, Lean In, Cavalier's Reprisal, Overrun
- Agility Training bonus doubling, shared Speed Evasion, Pass-range moves, damage resistance

## Current State

- `Mountable X` stored as raw string in `otherCapabilities` — no parsing or mechanical effect
- `Rider` trainer class in `constants/trainerClasses.ts` — catalog entry only, no feature logic
- No mount/dismount actions in combat system
- No rider-mount linked movement on VTT grid
- No dismount checks on damage/push
- No Mounted Prowess edge effect
- No Rider class feature implementations

## Required Implementation

### Data Model
- Mount relationship tracking (which trainer is mounted on which Pokemon)
- Mount state in combat (mounted/dismounted)
- Mountable capability parsing from otherCapabilities

### Combat System
- Mount/Dismount actions (Standard Action with skill check)
- Shared movement for mounted pairs
- Dismount checks on qualifying damage/push
- Intercept bonus between rider and mount
- Rider class feature effects

### VTT Grid
- Linked token movement for mounted pairs
- Visual indication of mounted state

### UI
- Mount/dismount buttons in combat actions
- Mounted state indicator on combatant cards
- Mountable capability display on Pokemon sheets

## Impact

Riders cannot use their class features. Mounted combat is a core PTU mechanic that affects movement, action economy, and defensive synergies.

## Resolution Log

### P0 Implementation (2026-03-03)

Branch: `slave/5-dev-feature-004-p0-20260303`

**Commits (13):**
- `1a2cc2d0` — MountState interface in combat.ts
- `7901c522` — mountState field on Combatant in encounter.ts
- `a72a91ba` — mountingRules.ts utility (capability parsing, DC constants, skill checks)
- `638aa99c` — mounting.service.ts (mount/dismount business logic)
- `5aeaf85d` — mount.post.ts API endpoint
- `e43df266` — dismount.post.ts API endpoint
- `8aded059` — Reset mount movement on new round in next-turn.post.ts
- `058bd107` — Mounted combatants use movementRemaining in useGridMovement.ts
- `1f5dcfd0` — Mount/dismount actions and getters in encounter store
- `716c1c77` — Clear mount state on combatant removal
- `88bc800b` — Auto-dismount on faint from damage
- `09b0dce6` — Linked movement for mounted pairs in position endpoint
- `59173398` — Auto-dismount on faint from tick damage
- `7fd76ad0` — Sync mountState in WebSocket surgical update

**Files changed (12):**
- `app/types/combat.ts` (EDIT)
- `app/types/encounter.ts` (EDIT)
- `app/utils/mountingRules.ts` (NEW)
- `app/server/services/mounting.service.ts` (NEW)
- `app/server/api/encounters/[id]/mount.post.ts` (NEW)
- `app/server/api/encounters/[id]/dismount.post.ts` (NEW)
- `app/composables/useGridMovement.ts` (EDIT)
- `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT)
- `app/server/api/encounters/[id]/damage.post.ts` (EDIT)
- `app/server/api/encounters/[id]/position.post.ts` (EDIT)
- `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts` (EDIT)
- `app/stores/encounter.ts` (EDIT)

**P0 covers:** Data model, capability parsing, mount/dismount API, turn system integration, linked movement, auto-dismount on faint, round reset. P1 (VTT tokens, dismount checks on damage/push, UI) and P2 (Rider class features) remain open.

### P0 Fix Cycle (2026-03-02)

Branch: `slave/1-dev-feature-004-fix-20260302`
Review: code-review-285 (CHANGES_REQUIRED — 1C+2H+3M)

**Commits (5):**
- `c26d7a6e` — fix: sync mount partner position and movementRemaining locally after move (CRIT-001, HIGH-002)
- `9007ce5d` — fix: wire skipCheck parameter through mount/dismount endpoints to service (HIGH-001)
- `fa55ac84` — refactor: remove duplicate getMovementSpeedForMount, use getOverlandSpeed (MED-002)
- `f5ae1952` — refactor: replace array mutation with immutable reassignment for mount-on-faint (MED-003)
- `82a06a0e` — docs: add mounting system to app-surface.md (MED-001)

**Files changed (7):**
- `app/composables/useEncounterActions.ts` (EDIT — linked movement + movementRemaining local sync)
- `app/server/services/mounting.service.ts` (EDIT — skipCheck param, remove duplicate import)
- `app/server/api/encounters/[id]/mount.post.ts` (EDIT — pass skipCheck to service)
- `app/server/api/encounters/[id]/dismount.post.ts` (EDIT — accept skipCheck for forward compat)
- `app/utils/mountingRules.ts` (EDIT — remove duplicate getMovementSpeedForMount)
- `app/server/api/encounters/[id]/damage.post.ts` (EDIT — immutable reassignment)
- `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT — immutable reassignment)
- `.claude/skills/references/app-surface.md` (EDIT — mounting system documentation)

### P1 Fix Cycle (2026-03-03)

Branch: `slave/3-dev-feature-004-20260303-165227`
Review: code-review-296 (CHANGES_REQUIRED — 2H+3M), rules-review-269 (APPROVED)

**Commits (5):**
- `f33e6d7f` — fix: offset mount badge to avoid overlap with elevation badge in VTTToken (HIGH-1)
- `9b13fdd6` — fix: apply movement modifiers once upfront for mounted combatants (HIGH-2)
- `e072c51d` — fix: use capacity check instead of blanket skip in MountControls (MED-1)
- `7ef0cfb9` — fix: include heavily injured HP loss in dismount threshold check (MED-2)
- `b5124d88` — fix: show mount partner name in Group and Player combatant cards (MED-3)

**Files changed (8):**
- `app/components/vtt/VTTToken.vue` (EDIT — mount badge position offset)
- `app/utils/movementModifiers.ts` (NEW — extracted applyMovementModifiers for client/server sharing)
- `app/composables/useGridMovement.ts` (EDIT — re-export from utils, return movementRemaining directly)
- `app/server/services/mounting.service.ts` (EDIT — apply modifiers in executeMount and resetMountMovement)
- `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT — apply modifiers in resetCombatantsForNewRound)
- `app/components/encounter/MountControls.vue` (EDIT — capacity check with getMountCapacity/countCurrentRiders)
- `app/server/api/encounters/[id]/damage.post.ts` (EDIT — totalDamageEvent includes heavilyInjuredHpLoss)
- `app/components/encounter/GroupCombatantCard.vue` (EDIT — partner name via getMountPartner)
- `app/components/encounter/PlayerCombatantCard.vue` (EDIT — partner name via getMountPartner)

### P2 Implementation (2026-03-04)

Branch: `slave/2-dev-feature-004-p2-20260304`

**Commits (12):**
- `aae04e0f` — feat: add Rider class feature detection and constants
- `9763fd18` — feat: extend types for P2 Rider class features
- `bacb7c4c` — feat: implement Ride as One speed evasion sharing
- `d7a0da4e` — feat: reset distanceMovedThisTurn and rideAsOneSwapped at turn/round start
- `48d888b9` — feat: add Rider class feature activation actions to encounter store
- `3467ecf4` — feat: add Rider class feature UI to MountControls panel
- `91449c1f` — feat: detect Cavalier's Reprisal opportunity in damage endpoint
- `019f7d1a` — feat: add Run Up, Overrun, and Lean In calculation helpers
- `bad8df60` — feat: track distance moved this turn on token movement
- `cbb3b00e` — feat: reset featureUsage on scene transition
- `c8cd79b0` — fix: use existing $color-warning variable for Rider feature UI
- `065cd55f` — fix: use PhArrowFatRight icon for Conqueror's March

**Files changed (11):**
- `app/utils/mountingRules.ts` (EDIT — Rider feature detection, Run Up/Overrun/Lean In helpers)
- `app/types/combat.ts` (EDIT — distanceMovedThisTurn, MountState P2 fields)
- `app/types/encounter.ts` (EDIT — featureUsage on Combatant)
- `app/constants/trainerClasses.ts` (EDIT — RIDER_FEATURE_NAMES, scene-limit constants)
- `app/server/services/mounting.service.ts` (EDIT — Ride as One evasion sharing)
- `app/server/utils/turn-helpers.ts` (EDIT — distance/rideAsOneSwapped reset)
- `app/server/api/encounters/[id]/damage.post.ts` (EDIT — Cavalier's Reprisal detection)
- `app/server/api/encounters/[id]/next-scene.post.ts` (EDIT — featureUsage reset)
- `app/stores/encounter.ts` (EDIT — feature activation actions)
- `app/composables/useEncounterActions.ts` (EDIT — distance tracking on movement)
- `app/components/encounter/MountControls.vue` (EDIT — Rider feature UI)

**P2 covers:** All 7 Rider class features (Rider, Ramming Speed, Conqueror's March, Ride as One, Lean In, Cavalier's Reprisal, Overrun). Automation levels vary per spec: Ride as One evasion is fully automated; Agility Training and Conqueror's March are toggle/flag-based; Lean In and Overrun have scene-limited usage tracking; Cavalier's Reprisal detects trigger and prompts GM.

### P2 Fix Cycle (2026-03-04)

Branch: `slave/2-dev-feature-004-p2-fix-20260304-085746`
Reviews: code-review-314 (CHANGES_REQUIRED — 1C+2H+3M), rules-review-287 (CHANGES_REQUIRED — 1H+1M)

**Commits (6):**
- `1990f627` — fix: correct applyResistStep to use full PTU effectiveness ladder (rules HIGH-1)
- `df43c212` — fix: rename ConquerorsMarsh to ConquerorsMarch and extract constant (MED-1, rules MED-1, MED-3)
- `9a87409f` — fix: move Agility Training flag from tempConditions to mountState (HIGH-1)
- `c05f2e5a` — fix: wire Ride as One speed evasion into accuracy calculation (CRIT-1)
- `ca87404b` — fix: wire dead Rider utility functions into integration points (HIGH-2)
- `595ce0e4` — docs: update app-surface.md with P2 Rider feature additions (MED-2)

**Files changed (8):**
- `app/utils/mountingRules.ts` (EDIT — fixed applyResistStep effectiveness ladder)
- `app/constants/trainerClasses.ts` (EDIT — added CONQUERORS_MARCH_CONDITION constant)
- `app/stores/encounter.ts` (EDIT — persistent Agility Training, Conqueror's March action cost in store)
- `app/components/encounter/MountControls.vue` (EDIT — use constants, persistent Agility Training check, wired calculateRunUpBonus/calculateOverrunModifiers)
- `app/types/combat.ts` (EDIT — agilityTrainingActive on MountState)
- `app/server/api/encounters/[id]/calculate-damage.post.ts` (EDIT — Ride as One evasion override, riderModifiers annotations)
- `.claude/skills/references/app-surface.md` (EDIT — P2 surface additions)
- `artifacts/tickets/in-progress/feature/feature-004.md` (EDIT — resolution log)
