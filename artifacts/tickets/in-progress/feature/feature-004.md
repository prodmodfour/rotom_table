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
