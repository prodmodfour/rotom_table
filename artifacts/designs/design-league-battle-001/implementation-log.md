# Implementation Log: design-league-battle-001

## P0 Implementation

**Branch:** `slave/3-developer-ptu-rule-107-p0-20260227`
**Date:** 2026-02-27

### Commits

| Hash | Message | Files |
|------|---------|-------|
| `a0e2cd3` | feat: add TrainerDeclaration interface for League Battle phases | `app/types/combat.ts` |
| `8f4cf44` | feat: add declarations field to Encounter type and Prisma schema | `app/types/encounter.ts`, `app/prisma/schema.prisma` |
| `872597a` | feat: add declarations to encounter service response builder | `app/server/services/encounter.service.ts` |
| `ae194cf` | feat: add declaration recording endpoint for League Battle | `app/server/api/encounters/[id]/declare.post.ts` (new) |
| `a4e5202` | feat: implement three-phase League Battle turn progression | `app/server/api/encounters/[id]/next-turn.post.ts` |
| `c315833` | feat: initialize declarations field on encounter start | `app/server/api/encounters/[id]/start.post.ts` |
| `e8bd61e` | feat: add declaration getters and submitDeclaration action to store | `app/stores/encounter.ts` |
| `6c66b73` | fix: persist declarations in encounter PUT endpoint for undo/redo | `app/server/api/encounters/[id].put.ts` |
| `c53c70d` | fix: make initiative reorder phase-aware for resolution phase | `app/server/services/encounter.service.ts`, `stages.post.ts`, `status.post.ts`, `breather.post.ts` |

### Summary of Changes

#### A. Declaration Data Model
- Added `TrainerDeclaration` interface to `app/types/combat.ts` with fields: combatantId, trainerName, actionType, description, targetIds, round
- Added `declarations: TrainerDeclaration[]` to `Encounter` interface in `app/types/encounter.ts`
- Added `declarations String @default("[]")` to Prisma Encounter model
- Updated `EncounterRecord`, `ParsedEncounter`, and `buildEncounterResponse` in encounter service

#### B. Declaration Recording API
- Created `app/server/api/encounters/[id]/declare.post.ts`
- Validates: phase is `trainer_declaration`, combatant is current turn's trainer, no duplicate declarations per round
- Records declaration without executing it or advancing turn

#### C. Phase Transition Logic
- Rewrote League Battle section of `next-turn.post.ts` for three-phase flow:
  - `trainer_declaration` (all done) -> `trainer_resolution`
  - `trainer_resolution` (all done) -> `pokemon`
  - `pokemon` (all done) -> new round -> `trainer_declaration`
- Resolution turn order is reversed trainer order (high-to-low speed)
- Declarations cleared only on new round start
- Updated encounter PUT endpoint to persist declarations for undo/redo

#### D. Resolution Execution
- During resolution phase, each trainer's turn state is reset so they can execute their declared action
- `resetResolvingTrainerTurnState()` gives the resolving trainer fresh action economy
- GM manually executes the declared action using existing endpoints, then calls next-turn

#### Additional: Initiative Reorder Fix
- Updated `reorderInitiativeAfterSpeedChange` to accept `currentPhase` parameter
- During `trainer_resolution`, trainers sort descending (high-to-low) instead of ascending
- Updated all three callers (stages.post.ts, status.post.ts, breather.post.ts)

### Remaining for P1
- DeclarationPanel.vue (GM UI for entering declarations)
- DeclarationSummary.vue (read-only view of declarations)
- WebSocket broadcast for declaration events
- Auto-skip fainted trainers during declaration/resolution
- Speed change mid-declaration reorder edge cases
