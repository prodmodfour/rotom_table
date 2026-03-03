# Composables CLAUDE.md

54 composables across 13 domains. All follow `use<PascalCaseName>.ts` naming and are auto-imported by Nuxt 3. **VTT composables are exclusively used in VTT grid contexts -- NOT used for non-VTT features.**

## Domain Grouping

| Domain | Composables |
|---|---|
| **VTT 2D Grid** (6) | useCanvasDrawing, useCanvasRendering, useGridInteraction, useGridMovement, useGridRendering, useTouchInteraction |
| **VTT Isometric** (6) | useDepthSorting, useIsometricCamera, useIsometricInteraction, useIsometricOverlays, useIsometricProjection, useIsometricRendering |
| **VTT Shared** (5) | useElevation, useFogPersistence, useFlankingDetection, usePathfinding, useTerrainPersistence |
| **Combat** (5) | useCombat, useDamageCalculation, useEncounterActions, useMoveCalculation, useSwitching |
| **Encounter** (4) | useEncounterBudget, useEncounterCreation, useEncounterHistory, useSwitchModalState |
| **Character/Trainer** (4) | useCharacterCreation, useCharacterExportImport, useTrainerLevelUp, useTrainerXp |
| **Pokemon** (4) | useEvolutionUndo, useLevelUpAllocation, usePokemonSheetRolls, usePokemonSprite |
| **Player View** (7) | usePlayerCapture, usePlayerCombat, usePlayerGridView, usePlayerIdentity, usePlayerRequestHandlers, usePlayerScene, usePlayerWebSocket |
| **WebSocket/Sync** (3) | useGroupViewWebSocket, useStateSync, useWebSocket |
| **Shared/Display** (3) | useCombatantDisplay, useEntityStats, useTypeChart |
| **Tables** (1) | useTableEditor |
| **Trainer Display** (1) | useTrainerSprite |
| **Items/Healing** (5) | useCapture, useHapticFeedback, useHealingItems, useRangeParser, useRestHealing |

## Key Dependency Chains

- `useGridMovement` -> `useRangeParser` -> `usePathfinding` (movement range calculation with A* terrain costs). Also imports `movementModifiers.ts` utility for Stuck/Slowed/Sprint modifiers.
- `useIsometricRendering` -> `useIsometricOverlays` + `useIsometricProjection` + `useRangeParser` (full iso render pipeline)
- `useGridInteraction` -> `useTouchInteraction` + selection/measurement/fogOfWar stores (input handling)
- `useGridRendering` -> `useRangeParser` + `useCanvasDrawing` + fogOfWar/terrain/measurement stores (2D draw loop)
- `useFlankingDetection` -> `flankingGeometry` util + `combatSides` util (bridges combat + VTT position data)
- `useIsometricInteraction` -> `useIsometricProjection` + `useTouchInteraction` (iso input handling)
- `useMoveCalculation` -> `equipmentBonuses`, `evasionCalculation`, `typeEffectiveness` utilities
- `usePlayerCombat` -> `usePlayerWebSocket` via `PLAYER_WS_SEND_KEY` injection key

## Largest Composables (over 20KB)

| File | Size | Notes |
|---|---|---|
| useGridMovement.ts | 26KB | PTU movement rules, diagonal costs, terrain, multi-cell tokens |
| useIsometricRendering.ts | 27KB | Full isometric draw loop with sprite caching |
| useGridRendering.ts | 26KB | 2D canvas draw: grid, fog, terrain, measurement overlays |
| usePathfinding.ts | 25KB | A* with terrain costs, elevation, multi-cell footprints |
| useMoveCalculation.ts | 24KB | PTU move resolution: accuracy, damage, STAB, crits, effectiveness |
| useIsometricInteraction.ts | 22KB | Isometric mouse/touch input with inverse projection |
| usePokemonSprite.ts | 22KB | Showdown sprite URLs with 280+ special name mappings |
| useIsometricOverlays.ts | 22KB | Isometric fog, terrain, measurement drawing |
| useGridInteraction.ts | 20KB | 2D mouse/touch input, pan, zoom, marquee selection |

## Gotchas

- **Module-level refs in useEncounterHistory**: `history` and `currentIndex` are declared at module scope (outside the function), making them singleton state shared across all consumers. This is intentional for undo/redo but means the state persists across component mounts.
- **280+ special name mappings in usePokemonSprite**: The `showdownNames` record maps Pokemon names (hyphens, special chars, forms) to Showdown sprite URL slugs. New Pokemon or forms need manual entries here.
- **A* terrain costs from store**: usePathfinding receives terrain cost callbacks from callers, but useGridMovement and useRangeParser wire these to the Pinia terrain store. The store must be populated before pathfinding runs.
- **useFlankingDetection bridges combat+VTT**: Uses combat types (Combatant, CombatSide) with grid position data. Changes to either combat or VTT types require updating this composable. Decree-040 (flanking after evasion cap) is enforced here.
