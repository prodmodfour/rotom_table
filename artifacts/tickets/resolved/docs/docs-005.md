---
id: docs-005
title: "Add CLAUDE.md for app/composables/"
priority: P0
severity: HIGH
status: resolved
domain: composables
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 2
affected_files:
  - app/composables/CLAUDE.md (new)
---

# docs-005: Add CLAUDE.md for app/composables/

## Summary

Create a descendant CLAUDE.md in `app/composables/` to map the 54 composables by domain. With no grouping, agents reading this directory see a flat list of 54 files and waste exploration rounds discovering which composable does what. The domain grouping table, naming convention, and key dependency chains give agents instant orientation.

## Target File

`app/composables/CLAUDE.md` (~65 lines)

## Required Content

### Domain Grouping Table (54 composables)

| Domain | Count | Key Files |
|--------|-------|-----------|
| VTT 2D Grid | 4 | useCanvasDrawing, useCanvasRendering, useGridInteraction, useGridRendering |
| VTT Isometric | 7 | useIsometricCamera, useIsometricInteraction, useIsometricOverlays, useIsometricProjection, useIsometricRendering, useDepthSorting, useElevation |
| VTT Shared | 7 | useGridMovement, usePathfinding, useRangeParser, useFogPersistence, useTerrainPersistence, useTouchInteraction, useFlankingDetection |
| Combat | 9 | useCombat, useCombatantDisplay, useDamageCalculation, useMoveCalculation, useCapture, useHealingItems, useSwitchModalState, useSwitching, useTypeChart |
| Encounter | 4 | useEncounterActions, useEncounterCreation, useEncounterHistory, useEncounterBudget |
| Character/Trainer | 5 | useCharacterCreation, useCharacterExportImport, useTrainerLevelUp, useTrainerSprite, useTrainerXp |
| Pokemon | 3 | useLevelUpAllocation, useEvolutionUndo, usePokemonSheetRolls |
| Player View | 6 | usePlayerCombat, usePlayerGridView, usePlayerIdentity, usePlayerRequestHandlers, usePlayerScene, useHapticFeedback |
| WebSocket/Sync | 4 | useWebSocket, usePlayerWebSocket, useGroupViewWebSocket, useStateSync |
| Shared/Display | 2 | useEntityStats, usePokemonSprite |
| Tables | 1 | useTableEditor |
| Trainer Display | 1 | useTrainerSprite |
| Rest/Healing | 1 | useRestHealing |

### Naming Convention
- Pattern: `use<PascalCaseName>.ts` exporting `use<PascalCaseName>()`
- All auto-imported by Nuxt 3 — no explicit imports needed in components
- VTT composables are exclusively used in VTT grid contexts — NOT used for non-VTT features

### Key Dependency Chains
- `useGridMovement` → `useRangeParser` → `usePathfinding`
- `useGridRendering` → `useCanvasDrawing` + `useRangeParser`
- `useIsometricRendering` → `useIsometricProjection` + `useIsometricOverlays` + `useRangeParser`
- `useIsometricInteraction` → `useIsometricProjection` + `useTouchInteraction`
- `useGridInteraction` → `useTouchInteraction`
- `useMoveCalculation` → uses utilities from `equipmentBonuses`, `evasionCalculation`, `typeEffectiveness`
- `usePlayerCombat` → injects from `usePlayerWebSocket` via `PLAYER_WS_SEND_KEY` injection key

### Largest Composables (context budget awareness)
- `useGridMovement.ts` — 27.1KB (movement validation, A* pathfinding integration, all PTU speed rules)
- `useIsometricRendering.ts` — 26.5KB (full iso canvas rendering pipeline)
- `useGridRendering.ts` — 26.3KB (full 2D canvas rendering pipeline)
- `usePathfinding.ts` — 25.4KB (A* implementation with terrain costs)
- `useMoveCalculation.ts` — 23.9KB (accuracy rolls, damage calcs, equipment, evasion)
- `usePokemonSprite.ts` — 22.2KB (Showdown sprites with 100+ special name mappings)
- `useIsometricInteraction.ts` — 22.2KB (iso mouse/touch handling)
- `useIsometricOverlays.ts` — 21.9KB (iso overlay rendering: fog, terrain, measurement)

### Gotchas
- `useEncounterHistory` uses **module-level `ref` arrays** (NOT returned from composable) — shared global singleton state that survives store resets but NOT page reloads
- `usePokemonSprite` has 100+ special name mappings for Showdown sprite URLs (forms, regional variants, gender differences)
- `usePathfinding` implements full A* — terrain costs come from the `terrain` store, NOT props
- `useFlankingDetection` bridges combat + VTT domains (consumes `flankingGeometry` utils and `combatSides` utils)
- VTT composables are the largest in the codebase (6 files over 20KB each) — budget context window accordingly

## Verification

- File is 30-80 lines
- Domain groupings verified against actual file list (54 files)
- Dependency chains verified against actual import statements
- Naming convention matches Nuxt 3 auto-import behavior

## Resolution Log

- **132b0385** — Created `app/composables/CLAUDE.md` (50 lines)
  - 5 sections: Domain Grouping, Naming Convention, Key Dependency Chains, Largest Composables, Gotchas
  - 54 composable files confirmed and grouped across 13 domains
  - 9 files over 20KB documented with exact sizes
  - Dependency chains verified against actual import statements
  - Gotchas verified: module-level refs in useEncounterHistory (lines 6-7), 280+ name mappings in usePokemonSprite
  - No duplication with parent `app/CLAUDE.md`
- **4d4bd31e** — Gap fix: added useIsometricInteraction, useMoveCalculation, usePlayerCombat dependency chains; added VTT exclusivity note (53 lines)
