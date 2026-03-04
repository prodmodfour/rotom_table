---
ticket_id: ptu-rule-107
ticket_type: ptu-rule
priority: P2
status: in-progress
domain: combat
topic: league-battle-trainer-phases
source: decree-021
design: design-league-battle-001
affected_files:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/declare.post.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
  - app/prisma/schema.prisma
  - app/components/encounter/DeclarationPanel.vue
  - app/components/encounter/DeclarationSummary.vue
created_at: 2026-02-26T18:00:00
---

## Summary

Implement the two-phase trainer system for League Battles: declare (low-to-high speed) then resolve (high-to-low speed).

## PTU Rule

"In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed." (p.227)

## Current Behavior

`combat.ts` defines `trainer_declaration | trainer_resolution | pokemon` phases, but `start.post.ts` only sets up declaration + pokemon. `next-turn.post.ts` skips resolution entirely.

## Required Behavior

1. In League Battle mode, after all trainers declare (low-to-high speed), transition to `trainer_resolution` phase
2. During resolution, process trainers in high-to-low speed order
3. Each trainer's declared action is executed during resolution
4. After all resolutions complete, transition to `pokemon` phase
5. UI must show declarations to all players during resolution phase (the strategic information advantage)

## Notes

- The `trainer_resolution` type already exists in `combat.ts` — needs to be connected
- Related: decree-006 (dynamic initiative with speed CS changes), decree-021

## Resolution Log

### Design Phase
- Design spec created: `artifacts/designs/design-league-battle-001/`
- P0: Core declaration/resolution flow (data model, API, phase transitions)
- P1: UI enhancements, WebSocket sync, edge cases (faint/skip/undo)
- Status: design-complete, awaiting implementation

### P0 Implementation (2026-02-27)
- Branch: `slave/3-developer-ptu-rule-107-p0-20260227`
- 9 commits implementing core declaration/resolution flow:
  - `a0e2cd3` TrainerDeclaration interface
  - `8f4cf44` declarations field on Encounter type + Prisma schema
  - `872597a` encounter service response builder update
  - `ae194cf` declare.post.ts endpoint (new)
  - `a4e5202` three-phase turn progression in next-turn.post.ts
  - `c315833` declarations initialization in start.post.ts
  - `e8bd61e` encounter store getters + submitDeclaration action
  - `6c66b73` PUT endpoint undo/redo compatibility
  - `c53c70d` initiative reorder phase-awareness fix
- **P0 status: implemented** (pending review)
- P1 remains: UI components (DeclarationPanel, DeclarationSummary), WebSocket sync, edge cases

### P0 Fix Cycle (code-review-198) (2026-02-27)
- Branch: `slave/1-developer-ptu-rule-107-fix-20260227`
- Addresses all issues from code-review-198 CHANGES_REQUIRED:
  - `11a42f3` **CRITICAL C1**: Skip tempConditions clearing during declaration phase; clear in resetResolvingTrainerTurnState instead
    - Files: `app/server/api/encounters/[id]/next-turn.post.ts`
  - `8a3e507` **HIGH H1**: Reset hasActed for ALL trainers at declaration->resolution transition (not just first)
    - Files: `app/server/api/encounters/[id]/next-turn.post.ts`
  - `b90f089` **HIGH H2**: Add POST /api/encounters/:id/declare to app-surface.md
    - Files: `.claude/skills/references/app-surface.md`
  - `06bcb11` **MEDIUM M2**: Unit tests for three-phase flow, tempConditions, hasActed, and declare validation
    - Files: `app/tests/unit/api/league-battle-phases.test.ts`
- **P0 fix status: complete** (APPROVED: code-review-202 + rules-review-178)

### P1 Implementation (2026-02-28)
- Branch: `slave/3-developer-ptu-rule-107-p1-20260228`
- 7 commits implementing P1 UI, WebSocket sync, and edge cases:
  - `4faef76` DeclarationPanel component (GM form during declaration phase)
    - Files: `app/components/encounter/DeclarationPanel.vue`
  - `c46ad18` DeclarationSummary component (read-only declaration list)
    - Files: `app/components/encounter/DeclarationSummary.vue`
  - `2e47c3a` WebSocket sync for declaration events (trainer_declared, declaration_update)
    - Files: `app/server/routes/ws.ts`
  - `904c765` Auto-skip fainted trainers and undeclared resolvers (edge case H1)
    - Files: `app/server/api/encounters/[id]/next-turn.post.ts`
  - `1f8aec1` Integrate DeclarationPanel + DeclarationSummary into GM page
    - Files: `app/pages/gm/index.vue`, `app/components/encounter/DeclarationPanel.vue`
  - `3bae724` Integrate DeclarationSummary into Group encounter view
    - Files: `app/pages/group/_components/EncounterView.vue`
  - `d6d69f3` Update phase labels with turn order direction (H6)
    - Files: `app/components/gm/EncounterHeader.vue`, `app/components/gm/CombatantSides.vue`, `app/components/group/InitiativeTracker.vue`
- **P1 status: implemented** (pending review)

### P1 Fix Cycle (code-review-217) (2026-02-28)
- Branch: `slave/2-developer-ptu-rule-107-fix-20260228`
- Addresses all issues from code-review-217 CHANGES_REQUIRED (1 HIGH, 3 MEDIUM):
  - `2230040` **HIGH-1**: Add unit tests for skipFaintedTrainers and skipUndeclaredTrainers
    - Files: `app/tests/unit/api/league-battle-phases.test.ts`
    - Added skip helper functions mirroring next-turn.post.ts, updated simulateNextTurn with skip logic and declarations parameter, added 7 test cases
  - `505ee87` **MEDIUM-2**: Replace hardcoded color values with SCSS variables
    - Files: `app/assets/scss/_variables.scss`, `app/components/encounter/DeclarationPanel.vue`, `app/components/encounter/DeclarationSummary.vue`, `app/components/gm/EncounterHeader.vue`, `app/components/gm/CombatantSides.vue`
    - Defined $color-accent-violet-light, replaced all raw #7c3aed and #a78bfa
  - `2339d1b` **MEDIUM-3**: Filter fainted trainers from declaration progress denominator
    - Files: `app/components/encounter/DeclarationPanel.vue`
  - `1f1d10b` **MEDIUM-1**: Update app-surface.md with new components and WebSocket events
    - Files: `.claude/skills/references/app-surface.md`
- **P1 fix status: complete** (awaiting re-review)
