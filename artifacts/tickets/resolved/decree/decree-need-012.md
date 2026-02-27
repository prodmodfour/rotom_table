---
ticket_id: decree-need-012
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-012
domain: combat
topic: type-immunity-enforcement
affected_files:
  - app/server/api/encounters/[id]/status.post.ts
  - app/composables/useTypeChart.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should the server enforce type-based status condition immunities, or leave enforcement to the client/GM?

## PTU Rule Reference

- **p.239**: "Electric Types are immune to Paralysis", "Fire Types are immune to Burn", "Ghost Types cannot be Stuck or Trapped", "Ice Types are immune to being Frozen", "Poison and Steel Types are immune to Poison"

## Current Behavior

The type-immunity mapping exists client-side in `useTypeChart.ts` (lines 12-20), but the server endpoint `status.post.ts` performs no type-immunity check. The server will accept adding 'Burned' to a Fire-type Pokemon. No client-side warning is shown either.

## Options

### Option A: Server enforcement
Block invalid type+status combinations at the API level. Clean and rule-faithful but inflexible for edge cases (ability-based type changes, special scenarios).

### Option B: Client warning only
Show a warning in the UI, let the GM override. Server stays permissive. Covers edge cases like abilities that change types.

### Option C: Server enforcement with override flag
Block by default but accept an `override: true` parameter for edge cases.

### Option D: No enforcement (current)
Trust the GM entirely. No warnings, no blocks.

## Blocking

Affects status condition application. Current behavior is functional but allows rule-violating states.
