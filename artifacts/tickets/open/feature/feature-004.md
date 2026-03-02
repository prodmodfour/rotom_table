---
id: feature-004
title: Pokemon Mounting / Rider System
priority: P3
severity: MEDIUM
status: open
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
