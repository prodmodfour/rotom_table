---
design_id: design-trainer-xp-001
ticket_id: feature-009
category: FEATURE_GAP
scope: FULL
domain: character-lifecycle
status: p1-implemented
affected_files:
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/server/api/characters/[id].put.ts
  - app/server/api/capture/attempt.post.ts
  - app/stores/library.ts
  - app/stores/encounterXp.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/composables/useTrainerLevelUp.ts
new_files:
  - app/utils/trainerExperience.ts
  - app/server/api/characters/[id]/xp.post.ts
  - app/server/api/characters/[id]/xp-history.get.ts
  - app/server/api/encounters/[id]/trainer-xp-distribute.post.ts
  - app/composables/useTrainerXp.ts
  - app/components/character/TrainerXpPanel.vue
  - app/components/encounter/TrainerXpSection.vue
  - app/components/scene/QuestXpDialog.vue
---


# Design: Trainer XP & Advancement Tracking

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Trainer XP Data Model, B. XP Management Endpoints, C. Auto-Level-Up Trigger, D. GM XP Award UI | [spec-p0.md](spec-p0.md) |
| P1 | E. New Species Capture XP, F. Batch Trainer XP After Encounters, G. Quest/Milestone XP from Scene Tools | [spec-p1.md](spec-p1.md) |

## Summary

The current system allows the GM to manually edit a trainer's level, and feature-008 added a guided level-up workflow (stat allocation, milestone choices) when the level changes. However, there is no XP tracking for trainers. PTU trainers have an "Experience Bank" that accumulates XP from combat, catching new species, and GM awards. When the bank reaches 10 or more, the trainer immediately gains a level and subtracts 10 from their bank.

This design adds:
1. A `trainerXp` field on `HumanCharacter` (the experience bank)
2. Server endpoints to award/deduct XP with auto-level trigger
3. A `capturedSpecies` JSON field to track first-time species captures
4. GM-facing XP management UI on the character sheet
5. Integration hooks for capture (+1 XP) and post-encounter trainer XP distribution

### PTU Trainer XP Rules (Reference)

Per PTU 1.05 Core Chapter 11 — Running the Game (p.461):

- **Two ways to level:** Milestones (story events) and Experience
- **Experience Bank:** When a Trainer reaches 10+ Experience, immediately subtract 10 and gain 1 Level
- **Milestones do NOT affect the experience bank** (they are separate leveling paths)
- **Automatic XP source:** Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience
- **All other XP is GM-granted** — the GM decides when and how much to award
- **Trainer XP after encounters (p.461):** GM grants 0-5 XP based on narrative significance:
  - Weak/average wild Pokemon: 0 XP usually
  - Average trainer/strong wild: 1-2 XP
  - Significant battles: 3-5 XP
  - "Lost" battles that would have been a milestone: 1-2 XP or more

### Matrix Rules Covered

| Rule | Title | Tier |
|------|-------|------|
| R053 | Leveling Triggers | P0 (auto-level at 10 XP) |
| R054 | Experience Bank | P0 (trainerXp field, award/deduct) |
| R060 | Experience From Pokemon | P1 (+1 XP on new species capture) |

### Applicable Decrees

- **decree-030:** Significance presets cap at x5. Trainer XP presets should follow the same range.

### Dependencies

- **feature-008 (Trainer Level-Up Milestone Workflow):** REQUIRED. When XP triggers a level-up, the existing LevelUpModal from feature-008 must activate. P0 of feature-008 is already implemented and merged to master.

---

## Current State Analysis

### What Exists

| Component | Current Behavior | Gap |
|-----------|-----------------|-----|
| `HumanCharacter` schema | `level` field, manually editable | No `trainerXp` field, no experience bank |
| `[id].put.ts` (character API) | Accepts any field update | No XP-aware level trigger |
| `useTrainerLevelUp.ts` | Activated when level changes (feature-008) | Not connected to XP system |
| `LevelUpModal.vue` | Guided stat/skill allocation (feature-008) | Triggered by manual level change only |
| `capture/attempt.post.ts` | Links captured Pokemon to trainer | No species tracking, no +1 XP |
| `XpDistributionModal.vue` | Post-encounter **Pokemon** XP distribution | No trainer XP section |
| `encounterXp.ts` store | Calculates/distributes **Pokemon** XP | No trainer XP actions |
| `experienceCalculation.ts` | Pokemon XP chart, encounter XP formulas | Trainer XP is simpler (flat 10 per level) |

### What is Missing

- `trainerXp` field on HumanCharacter (integer, the experience bank)
- `capturedSpecies` field on HumanCharacter (JSON array of species names, for +1 XP tracking)
- XP award/deduct API endpoints with auto-level trigger
- GM XP management panel on character sheet
- Trainer XP section in post-encounter XP distribution flow
- Capture hook: +1 XP on new species
- Multi-level jump handling (e.g., awarding 25 XP when bank is at 8 = 3 level-ups + 3 XP remaining)

### DB Schema Changes Required

```prisma
model HumanCharacter {
  // ... existing fields ...
  trainerXp        Int      @default(0)   // Experience bank (0-9, auto-levels at 10)
  capturedSpecies  String   @default("[]") // JSON array of species names captured by this trainer
}
```

---

## Priority Map

| # | Feature | What it Does | Priority |
|---|---------|-------------|----------|
| A | Trainer XP data model | `trainerXp` + `capturedSpecies` fields on HumanCharacter | **P0** |
| B | XP management endpoints | Award/deduct XP with auto-level detection and multi-level jump | **P0** |
| C | Auto-level-up trigger | When XP >= 10, subtract 10, increment level, fire level-up modal | **P0** |
| D | GM XP award UI | XP display panel on character sheet with quick-award buttons | **P0** |
| E | New species capture XP | +1 XP when catching a species not in `capturedSpecies` | **P1** |
| F | Batch trainer XP after encounters | Trainer XP section in post-encounter XP distribution flow | **P1** |
| G | Quest/milestone XP from scenes | GM scene tools for awarding XP to participants | **P1** |

---


## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [testing-strategy.md](testing-strategy.md)

---


## Out of Scope

- **Hatching/breeding XP:** PTU mentions hatching as an XP source. Breeding/hatching is not in the app yet; this design covers the data model (`capturedSpecies` tracks any first-time acquisition) but not the hatching workflow.
- **Evolution XP:** PTU grants +1 XP for evolving a species not previously owned. The `capturedSpecies` field will track this, but evolution XP hookup is deferred until the evolution system is reviewed.
- **Player View XP display:** The Player View may show XP in the future, but this design is GM-only for XP management.
- **XP presets/templates:** No preset encounter-to-trainer-XP formulas. The GM manually decides trainer XP amounts (per PTU p.461).
- **Server-side enforcement of level-up choices:** The server does not enforce stat allocation. It triggers the level-up; the client handles choices via feature-008's LevelUpModal.

---


## Implementation Log

### P0 — Core Trainer XP Model (2026-03-01)

**Branch:** `slave/2-dev-feature-009-p0-20260301`

| Section | Files | Commit |
|---------|-------|--------|
| A. Schema migration | `app/prisma/schema.prisma` | `ffd4e2fa` |
| A. Type update + serializers | `app/types/character.ts`, `app/server/utils/serializers.ts`, `app/server/api/characters/[id].put.ts` | `7a4aceea` |
| B. Pure utility | `app/utils/trainerExperience.ts` (NEW) | `9f2116f8` |
| B. XP endpoints | `app/server/api/characters/[id]/xp.post.ts` (NEW), `xp-history.get.ts` (NEW) | `13fc558f` |
| C. Composable | `app/composables/useTrainerXp.ts` (NEW) | `6c0db88d` |
| D. XP panel | `app/components/character/TrainerXpPanel.vue` (NEW) | `1044a780` |
| D. Integration | `app/pages/gm/characters/[id].vue`, `app/components/character/CharacterModal.vue` | `2eff700b` |
| Tests | T1-T4: 47 tests across 3 files | `b9f174bb` |

**All P0 edge cases handled:**
- Multi-level jumps (e.g., bank 8 + 15 = 23 -> 2 levels, bank 3)
- Max level cap (50) with excess XP preserved in bank
- Negative XP deduction with floor at 0
- WebSocket broadcast on level change
- LevelUpModal integration via pendingLevelUp/event chain

### P0 Fix Cycle — code-review-246 (2026-03-01)

**Branch:** `slave/2-dev-feature-009-p0-fix-20260301`

| Issue | Severity | Fix | Commit |
|-------|----------|-----|--------|
| Stale data in CharacterModal after XP award | HIGH | Add refresh emit, update editData from payload | `ed7fb197` |
| app-surface.md missing XP endpoints/components | HIGH | Document xp.post, xp-history.get, TrainerXpPanel, useTrainerXp | `72d3d565` |
| xp-history returns negative xpToNextLevel at max level | MEDIUM | Return null at max level (50) | `3211428f` |
| Duplicate award logic in TrainerXpPanel | MEDIUM | Extract shared processXpAward() helper | `b7a9da6a` |
| console.log in XP endpoint | MEDIUM | Remove audit log (data available in API response) | `5522a5dc` |

### P1 — Integration: Capture XP, Encounter XP, Quest XP (2026-03-01)

**Branch:** `slave/2-dev-feature-009-p1-20260301`

| Section | Files | Commit |
|---------|-------|--------|
| E. Capture species XP hook | `app/server/api/capture/attempt.post.ts` (modified) | `8a93024b` |
| F. Batch trainer XP endpoint | `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts` (NEW) | `03e2d081` |
| F. Store extension | `app/stores/encounterXp.ts` (modified) | `035d0662` |
| F. Significance mapping | `app/utils/trainerExperience.ts` (modified) | `a84ad956` |
| F. TrainerXpSection component | `app/components/encounter/TrainerXpSection.vue` (NEW) | `66339904` |
| F. XpDistributionModal integration | `app/components/encounter/XpDistributionModal.vue` (modified) | `fa9ee6cf` |
| G. Quest XP dialog | `app/components/scene/QuestXpDialog.vue` (NEW), `app/pages/gm/scenes/[id].vue` (modified) | `256a0304` |

**All P1 sections implemented:**
- Capture XP: +1 trainer XP on new species, speciesXp in capture response
- Encounter XP: TrainerXpSection in XpDistributionModal with per-trainer input, level-up preview, quick-set, significance-based suggestion
- Quest XP: QuestXpDialog component in scene detail with per-character preview, sequential API calls

### P1 Fix Cycle — code-review-257 (2026-03-01)

**Branch:** `slave/1-dev-feature-009-p1-fix-20260301`

| Issue | Severity | Fix | Commit |
|-------|----------|-----|--------|
| Endpoint missing encounter validation | HIGH | Add loadEncounter(encounterId) call | `088bc70a` |
| app-surface.md missing P1 entries | HIGH | Document 5 missing items (endpoint, components, mapping, store action) | `0c6bdf09` |
| Trainer XP result discarded, no feedback | MEDIUM | Store + display trainer XP results in results phase, partial failure handling | `041187ea` |
| Stale trainerXp from combatant snapshot | MEDIUM | Fetch fresh data from /api/characters/:id/xp-history on modal open | `c31f9213` |

---

## Implementation Order

1. **P0 (Core XP Model)**
   - Schema migration: `trainerXp`, `capturedSpecies` fields
   - `app/utils/trainerExperience.ts` -- pure XP math functions
   - `app/server/api/characters/[id]/xp.post.ts` -- award/deduct endpoint with auto-level
   - `app/composables/useTrainerXp.ts` -- reactive XP state and actions
   - `app/components/character/TrainerXpPanel.vue` -- XP display and quick-award UI
   - Integration into `gm/characters/[id].vue` and `CharacterModal.vue`
   - Wire auto-level trigger to feature-008's LevelUpModal
   - Update `app/types/character.ts` with new fields
   - Unit tests for XP math and multi-level jump logic

2. **P1 (Integration)**
   - `app/server/api/capture/attempt.post.ts` -- hook +1 XP on new species capture
   - `app/components/encounter/TrainerXpSection.vue` -- trainer XP in post-encounter flow
   - `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts` -- batch trainer XP endpoint
   - Scene/quest XP tools for GM
   - Unit tests for capture hook and batch distribution
