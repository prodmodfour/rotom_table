---
ticket_id: decree-need-019
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-019
domain: rest
topic: new-day-extended-rest
affected_files:
  - app/server/api/game/new-day.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should the "New Day" action include an implicit extended rest, or remain a pure counter reset?

## PTU Rule Reference

PTU describes resting and new days as separate concepts. Resting heals HP. Extended rest (4+ hours) clears persistent conditions and restores AP. A new "day" resets daily limits. In most campaigns, a new day implies overnight sleep (an extended rest).

## Current Behavior

`new-day.post.ts` resets: `restMinutesToday`, `injuriesHealedToday`, daily move usage, drained/bound AP, current AP to max. Does NOT: heal HP, clear status conditions, or heal injuries.

## Options

### Option A: Counter reset only (current)
GM must trigger extended rest separately before/after new-day. More explicit control.

### Option B: Bundle with extended rest
New day automatically includes full extended rest effects (heal HP, clear persistent conditions, restore AP).

### Option C: Configurable checkbox
"Include extended rest with new day?" toggle.

## Blocking

Workflow convenience. Current behavior is functional but requires two separate actions for typical overnight rest.
