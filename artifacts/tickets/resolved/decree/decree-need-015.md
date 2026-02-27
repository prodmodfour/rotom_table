---
ticket_id: decree-need-015
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-015
domain: capture
topic: capture-hp-percentage-base
affected_files:
  - app/utils/captureRate.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should the capture rate HP percentage use real max HP or injury-reduced effective max HP?

## PTU Rule Reference

- **p.214**: "If the Pokemon is above 75% Hit Points, subtract 30..."
- **p.250**: "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."

The injury rule says effects based on "Max Hit Points" use the real maximum. But the capture rate HP check is about the current/max percentage — is "max" the real max or effective max?

## Current Behavior

`captureRate.ts` line 69-70: `const hpPercentage = (currentHp / maxHp) * 100` — uses real max HP.

Example: Pokemon with 50 max HP, 3 injuries (effective max 35), at 35 HP (full effective health):
- Real max: 35/50 = 70% → applies -15 penalty
- Effective max: 35/35 = 100% → applies -30 penalty

## Options

### Option A: Real max HP (current)
Consistent with the injury section's rule about "real maximum." More generous to capturers.

### Option B: Effective max HP
A Pokemon at "full health" (given injuries) is treated as 100%. Harder to capture when at full effective health.

## Blocking

Affects capture rate calculations for injured Pokemon. Current behavior is functional.
