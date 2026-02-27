---
ticket_id: decree-need-013
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-013
domain: capture
topic: capture-system-version
affected_files:
  - app/utils/captureRate.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Which capture system should the app use — the core 1d100 system or the errata d20 playtest system?

## PTU Rule Reference

- **Core rulebook p.214**: 1d100 system. Roll 1d100, subtract trainer level and modifiers, compare to capture rate (base 100 with adjustments for HP, status, evolution, level).
- **errata-2.md p.8**: Completely different d20 system. Base capture rate = 10 + (Level / 10). Checklist-based modifiers subtract 2 per checkbox. Labeled as "Sept 2015 Playtest."

## Current Behavior

The codebase implements the core 1d100 system exclusively. No option for the errata variant. The errata is labeled as a "playtest packet" so its canonical status is unclear.

## Options

### Option A: Keep 1d100 system (current)
Core rules. Already implemented. More granular capture rates.

### Option B: Switch to d20 system
Simpler. Aligns with the errata/playtest direction. Would require rewriting capture logic.

### Option C: Make configurable via AppSettings
Support both systems. GM chooses which to use.

## Blocking

Affects all capture mechanics. Current behavior is functional.
