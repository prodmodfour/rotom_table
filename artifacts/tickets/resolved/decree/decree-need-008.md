---
ticket_id: decree-need-008
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-008
domain: vtt
topic: water-terrain-cost
affected_files:
  - app/stores/terrain.ts
  - app/composables/useGridMovement.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should water terrain cost 2 movement per cell for swimmers, or 1 (normal)?

## PTU Rule Reference

- **p.231**: "Underwater: Underwater Terrain is any water that a Pokemon or Trainer can be submerged in. You may not move through Underwater Terrain during battle if you do not have a Swim Capability."
- Water is classified as a "Basic Terrain Type" alongside Regular and Earth terrain, NOT as Slow Terrain.
- Slow Terrain is a separate modifier: "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead."

## Current Behavior

`terrain.ts`: `water: 2` — water costs double even for swimmers. Additionally, `getTerrainAwareSpeed()` already selects the (typically lower) Swim speed for water terrain. This double-dips: lower speed AND double cost.

## Options

### Option A: Water cost = 1 for swimmers (PTU literal)
Water is basic terrain. Swimmers use their Swim speed (already lower) but at normal cost.

### Option B: Water cost = 2 (current)
Editorial judgment that water should slow swimmers. But combined with lower Swim speed, this is harsh.

### Option C: GM-configurable
Some water is calm (cost 1), some is rough currents (cost 2).

## Blocking

Affects all water-based VTT movement. Current behavior is functional but arguably double-penalizes.
