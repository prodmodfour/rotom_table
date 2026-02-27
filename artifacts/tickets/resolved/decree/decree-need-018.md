---
ticket_id: decree-need-018
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-018
domain: rest
topic: extended-rest-duration
affected_files:
  - app/server/api/pokemon/[id]/extended-rest.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should extended rest always apply exactly 4 hours of healing, or scale with actual rest duration?

## PTU Rule Reference

- **p.252**: "Extended Rests are rests that are at least 4 continuous hours long."
- General rest rule: "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."

Extended rests are "at least 4 hours" — they could be longer. The rest healing rule allows up to 8 hours daily.

## Current Behavior

`extended-rest.post.ts`: Always applies exactly 8 rest periods (4 hours = 240 minutes). An 8-hour overnight rest would only grant 4 hours of healing.

## Options

### Option A: Fixed 4 hours (current)
Simple. GM can manually add more rest periods. Treats "extended rest" as a button that gives exactly 4h.

### Option B: Accept duration parameter
Let the GM specify how long the rest is. Apply proportional healing up to 8h daily cap.

### Option C: Always apply full 8 hours
Most extended rests are overnight. Give the full daily healing allotment.

## Blocking

Affects extended rest healing amounts. Current behavior is functional but may under-heal.
