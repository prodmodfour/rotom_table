---
design_id: design-mounting-001
ticket_id: feature-004
category: FEATURE
scope: FULL
domain: combat
status: implemented
decree: decree-003, decree-004
affected_files:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/types/character.ts
  - app/prisma/schema.prisma
  - app/server/services/combatant.service.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/composables/useCombat.ts
  - app/composables/useGridMovement.ts
  - app/components/vtt/VTTToken.vue
  - app/stores/encounter.ts
  - app/stores/encounterGrid.ts
  - app/constants/trainerClasses.ts
  - app/constants/equipment.ts
new_files:
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/dismount.post.ts
  - app/server/services/mounting.service.ts
  - app/utils/mountingRules.ts
  - app/composables/useMounting.ts
  - app/components/encounter/MountControls.vue
  - app/components/vtt/VTTMountedToken.vue
---

# Design: Pokemon Mounting / Rider System (feature-004)

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Mount Relationship Data Model, B. Mountable Capability Parsing, C. Mount/Dismount API Endpoints, D. Mount State in Combat (Turn System Integration) | [spec-p0.md](spec-p0.md) |
| P1 | E. VTT Linked Token Movement, F. Dismount Check on Damage/Push, G. Mounted Prowess Edge Effect, H. Intercept Bonus (Rider/Mount), I. UI Mount Indicators | [spec-p1.md](spec-p1.md) |
| P2 | J. Rider Class Feature: Rider (Agility Training Doubling), K. Ramming Speed (Run Up Ability), L. Conqueror's March (Pass-range Moves), M. Ride as One (Shared Speed Evasion + Initiative Sharing), N. Lean In (Burst/Blast/Cone/Line Resistance), O. Cavalier's Reprisal (Counter-Attack), P. Overrun (Speed Stat to Damage) | [spec-p2.md](spec-p2.md) |

## Summary

Implement the PTU Pokemon mounting system for combat encounters. Trainers can mount Pokemon with the Mountable capability, gaining access to the mount's movement during their turn while the mount retains its own Standard Action on its Pokemon turn. The system includes mount/dismount actions, forced dismount checks on heavy damage or Push effects, linked VTT token movement for mounted pairs, and integration with the Rider trainer class features.

### PTU Rules Reference

- **PTU p.218 (05-pokemon.md):** Core mounting rules. Mount as Standard Action (Acrobatics/Athletics DC 10). Expert skill: mount as Free Action during Shift (2m+ movement). Mounted rider uses mount's Movement Capabilities for Shift. Mount keeps unused movement + Standard Action on Pokemon turn. Dismount check on 1/4 max HP damage or Push. Easy Intercept between rider and mount.
- **PTU p.306-307 (10-indices-and-reference.md):** Mountable X capability. Pokemon can serve as mount for X average Trainers.
- **PTU p.139 (03-skills-edges-and-features.md):** Mounted Prowess edge. Auto-succeed mounting checks, +3 to remain-mounted checks.
- **PTU pp.102-103 (04-trainer-classes.md):** Rider class. 7 features: Rider (double Agility Training), Ramming Speed, Conqueror's March, Ride as One, Lean In, Cavalier's Reprisal, Overrun.
- **PTU p.242 (07-combat.md):** Intercept maneuver rules. Mounted pairs get easy Intercept (no distance requirement).

### Related Decrees

- **decree-003:** All tokens are passable; enemy-occupied squares are rough terrain. Mounted pairs occupy the mount's position -- rider and mount share the same grid square(s).
- **decree-004:** Massive damage check uses real HP lost after temp HP absorption. Applies to dismount check threshold (1/4 max HP after temp HP).

### Current State

- `Mountable X` is stored in Pokemon `otherCapabilities` string array but never parsed or used mechanically.
- `Rider` trainer class exists in `constants/trainerClasses.ts` as a catalog entry but has no feature implementations.
- `Mounted Prowess` edge exists only as a string in character edge lists -- no mechanical effect coded.
- No mount relationship tracking exists anywhere in the data model.
- VTT tokens are always independent -- no concept of linked/paired tokens.
- Movement system has no awareness of mount movement capabilities being available to trainers.

---

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Mount relationship data model (DB + types) | NOT_IMPLEMENTED | No tracking of who is mounted on what | **P0** |
| B | Mountable capability parsing from otherCapabilities | NOT_IMPLEMENTED | Stored as string, never parsed | **P0** |
| C | Mount/dismount API endpoints | NOT_IMPLEMENTED | No action endpoints | **P0** |
| D | Mount state in combat turn system | NOT_IMPLEMENTED | Turn system unaware of mounting | **P0** |
| E | VTT linked token movement for mounted pairs | NOT_IMPLEMENTED | Tokens always independent | **P1** |
| F | Dismount check on damage/push | NOT_IMPLEMENTED | No forced dismount triggers | **P1** |
| G | Mounted Prowess edge mechanical effect | NOT_IMPLEMENTED | Edge stored as string only | **P1** |
| H | Easy Intercept between rider and mount | NOT_IMPLEMENTED | No distance override for mounted pairs | **P1** |
| I | UI mount indicators (token badges, panel controls) | NOT_IMPLEMENTED | No visual indicator of mount state | **P1** |
| J | Rider class: Agility Training doubling | NOT_IMPLEMENTED | Class entry only, no features | **P2** |
| K | Ramming Speed (Run Up ability grant) | NOT_IMPLEMENTED | No feature implementation | **P2** |
| L | Conqueror's March (Pass-range moves) | NOT_IMPLEMENTED | No feature implementation | **P2** |
| M | Ride as One (shared Speed Evasion + initiative) | NOT_IMPLEMENTED | No feature implementation | **P2** |
| N | Lean In (Burst/Blast/Cone/Line resistance) | NOT_IMPLEMENTED | No feature implementation | **P2** |
| O | Cavalier's Reprisal (counter-attack) | NOT_IMPLEMENTED | No feature implementation | **P2** |
| P | Overrun (Speed stat to damage on Dash/Pass) | NOT_IMPLEMENTED | No feature implementation | **P2** |

---

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
