---
last_updated: 2026-02-24T00:30:00
updated_by: slave-collector (plan-20260223-141341)
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done (135) | **STALE** | done | done | created | 83.0% (73/88) |
| capture | done (33) | **STALE** | done | done | created | 75.0% (18/24) |
| healing | done (42) | **STALE** | done | done | created | 80.0% (24/30) |
| pokemon-lifecycle | done (68) | **STALE** | done | done | created | 75.0% (33/44) |
| character-lifecycle | done (68) | **STALE** | done | done | created | 68.3% (28/41) |
| encounter-tables | done (27) | **STALE** | done | done | created | 64.3% (9/14) |
| scenes | done (42) | **STALE** | done | done | created | 55.6% (10/18) |
| vtt-grid | done (42) | **STALE** | done | done | created | 46.7% (7/15) |

**Overall: 202/274 correct (73.7%) — stale, will increase significantly after re-mapping**

## Active Work

All 8 domains fully processed through M2 ticket creation. Matrix pipeline is **complete** (M7) but all capabilities are stale.

## Staleness Status

All 8 domains are stale due to sessions 5–13 code changes. Re-mapping is now urgent — session 13 added P1 implementations on top of session 12's P0 implementations.

**Session 13 changes (4 P1/P0 implementations + follow-up fixes):**
- **combat:** ptu-rule-045 P1 — DR from armor in damage calc, evasion from shields, Focus stat bonuses, Heavy Armor speed CS (major new capabilities in damage calc + combatant builder + move calculation composable)
- **pokemon-lifecycle:** ptu-rule-055 P1 — XpDistributionModal, encounter store actions, end-encounter integration, xpDistributed safety flag (major new capabilities)
- **character-lifecycle:** ptu-rule-056 P1 — Trainer class constants, ClassFeatureSection, EdgeSelectionSection, useCharacterCreation state management (major new capabilities)
- **encounter-tables:** ptu-rule-058 P0 — Density separated from spawn count, DENSITY_SUGGESTIONS, explicit count spinner, densityMultiplier removed from UI (significant capability change)

**Combined sessions 12+13 impact per domain:**
1. **combat** — Equipment P0+P1: 4 API endpoints, 1 constants file, 1 utility, equipment bonuses in damage calc + combatant builder + move composable + evasion
2. **pokemon-lifecycle** — XP P0+P1: 2 API endpoints, 1 utility, 1 modal component, store actions, end-encounter integration
3. **character-lifecycle** — Char creation P0+P1: 3 constants files, 5 components, 1 composable, 1 validation utility
4. **encounter-tables** — Density P0: type changes, service refactoring, UI changes, store changes

## Audit Correction

- **combat-R010** (evasion CS treatment): Original audit classified as "Approximation" — Game Logic Reviewer (rules-review-102) independently confirmed the implementation was already correct per PTU's two-part evasion system. Audit item should be reclassified as "Correct" on next re-audit.

## Session 14 Changes (additional staleness)

- **combat:** ptu-rule-077 fix — Focus (Speed) stat bonuses now applied to initiative + evasion (combatant.service.ts, useMoveCalculation.ts, useCombat.ts, damageCalculation.ts, calculate-damage endpoint)
- **combat:** ptu-rule-045 P2 — HumanEquipmentTab.vue, EquipmentCatalogBrowser.vue, CharacterModal + GM page wiring
- **encounter-tables:** ptu-rule-060 P0 — encounterBudget.ts utility, useEncounterBudget composable, BudgetIndicator component, GenerateEncounterModal + StartEncounterModal extensions
- **encounter-tables:** ptu-rule-058 P1 fixes — NaN guards, null guard, WS broadcast, utility extraction in SignificancePanel + XpDistributionModal + experienceCalculation.ts
- **pokemon-lifecycle:** ptu-rule-055 P2 — LevelUpNotification.vue, add-experience endpoint, XpDistributionModal level-up integration
- **character-lifecycle:** ptu-rule-056 P2 — BiographySection.vue, useCharacterCreation biography fields, gm/create.vue quick/full-create mode toggle

## Session 16 Changes (additional staleness)

- **combat:** ptu-rule-079 fix — Helmet conditional DR now stacks with manual DR override in calculate-damage endpoint
- **character-lifecycle:** ptu-rule-078 fix — Corrected ~28 trainer class associatedSkills in trainerClasses.ts
- **character-lifecycle:** ptu-rule-080 fix — Level-aware stat allocation, skill rank caps, edges/features validation in characterCreationValidation.ts, trainerStats.ts, useCharacterCreation.ts, create.vue
- **encounter-tables:** ptu-rule-060 P0 fixes — SCSS mixin ancestor selector, BudgetGuide extraction from GenerateEncounterModal, PC-only player count filter in scenes page

## Session 18 Changes (additional staleness)

- **encounter-tables:** ptu-rule-060 P1 significance — significanceTier Prisma column, tier selector in StartEncounterModal + GenerateEncounterModal, API endpoints, encounter store, parent page wiring
- **vtt-grid:** feature-002 P0 isometric grid — useIsometricProjection, useIsometricCamera, useIsometricRendering, isometricCamera store, IsometricCanvas + CameraControls components, GridSettingsPanel + VTTContainer feature flag, Prisma schema isometric columns
- **character-lifecycle:** ptu-rule-078 H1+H2 fix — Juggler +Guile, Dancer +Athletics in trainerClasses.ts
- **NEW DOMAIN: player-view:** feature-003 P0 Track A — playerIdentity store, usePlayerIdentity composable, player-view API, 8 player components, WebSocket player role, player page + layout

## Session 19 Changes (additional staleness)

- **character-lifecycle:** ptu-rule-056 H1 fix — moved `_create-form.scss` from `additionalData` to `css` array in nuxt.config.ts
- **character-lifecycle:** feature-001 P0 — trainerSprites.ts catalog (180 sprites), useTrainerSprite.ts composable, TrainerSpritePicker.vue modal, 17 avatar rendering integration points across components
- **encounter-tables:** ptu-rule-060 reviewed APPROVED — no code changes, but capabilities are now verified
- **character-lifecycle:** ptu-rule-078 reviewed APPROVED — no code changes, but capabilities are now verified

## Session 20 Changes (additional staleness)

- **player-view:** feature-003 P0 fix cycle — PlayerTab type to types/player.ts, shared _player-view.scss, $player-nav-clearance variable, evasion bonus fix, WS character_update listener, polling backoff, aria-label, inline error
- **vtt-grid:** feature-002 P0 fix cycle — EncounterRecord isometric fields, server-side validation, template endpoint propagation, contextmenu Vue directive, bounding box fix, dead animation removal, sorted cell cache, canvas path optimization
- **character-lifecycle:** feature-001 P0 reviewed — code-review-143 CHANGES_REQUIRED, rules-review-133 APPROVED (no code changes, just review artifacts)

## Session 21 Changes (additional staleness)

- **character-lifecycle:** feature-001 P0 fix cycle — defineProps crash fix in HumanCard.vue, avatar error handling standardized to reactive null-out across 12 files (HumanCard, CharacterModal, PlayerLobbyView, gm/characters/[id], gm/create, QuickCreateForm, GMActionModal, InitiativeTracker, VTTToken, CombatantDetailsPanel), app-surface.md update
- **player-view:** feature-003 P0 APPROVED — no code changes, review artifacts only (code-review-144, rules-review-134)
- **vtt-grid:** feature-002 P0 APPROVED — no code changes, review artifacts only (code-review-145, rules-review-135)

## Session 24 Changes (additional staleness)

- **player-view:** feature-003 P1 fix cycle — canBeCommanded check in usePlayerCombat + PlayerCombatActions, SCSS extraction to _player-combat-actions.scss (new file), alert→toast notifications, isMyTurn dedup via composable in PlayerEncounterView, dead PlayerActionPanel.vue deleted, nuxt.config.ts updated
- **vtt-grid:** feature-002 P1 fix cycle — combatantCanFly/getSkySpeed extracted to app/utils/combatantCapabilities.ts (new file), pathfinding extracted to app/composables/usePathfinding.ts (new file), elevation cost in A* heuristic fixed, isValidMove passes elevation to A*, sprite cache re-render + clearSpriteCache, combatant ID-only watcher, diamond hit detection, movement preview terrain elevation
- **character-lifecycle:** feature-001 P0 APPROVED — no code changes, review artifacts only (code-review-149, rules-review-139)

## Recommended Next Steps

1. Re-map all 8 domains + add player-view domain — sessions 12-24 added major new capabilities
2. Re-review feature-003 P1 Track A fix cycle (7 commits from code-review-147 + rules-review-137 fixes)
3. Re-review feature-002 P1 fix cycle (9 commits from code-review-148 fixes)
4. Continue feature P1 tiers after re-reviews pass
5. feature-001 P1 (P0 APPROVED)
