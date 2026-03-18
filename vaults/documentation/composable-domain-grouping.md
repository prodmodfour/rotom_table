# Composable Domain Grouping

63 composables across 16 domains in `app/composables/`. All follow `use<PascalCaseName>.ts` naming and are auto-imported by Nuxt 3. VTT composables are exclusively used in VTT grid contexts.

| Domain | Count | Composables |
|---|---|---|
| **VTT 2D Grid** | 6 | useCanvasDrawing, useCanvasRendering, useGridInteraction, useGridMovement, useGridRendering, useTouchInteraction |
| **VTT Isometric** | 7 | useDepthSorting, useIsometricCamera, useIsometricInteraction, useIsometricMovementPreview, useIsometricOverlays, useIsometricProjection, useIsometricRendering |
| **VTT Shared** | 5 | useElevation, useFogPersistence, useFlankingDetection, usePathfinding, useTerrainPersistence |
| **Combat** | 6 | useCombat, useCombatantSwitchButtons, useDamageCalculation, useEncounterActions, useMoveCalculation, useSwitching |
| **Encounter** | 4 | useEncounterBudget, useEncounterCreation, useEncounterHistory, useSwitchModalState |
| **Encounter Store Delegates** | 5 | useEncounterCombatActions, useEncounterMounts, useEncounterOutOfTurn, useEncounterSwitching, useEncounterUndoRedo |
| **Out-of-Turn State** | 1 | useOutOfTurnState |
| **Character/Trainer** | 4 | [[character-creation-composable|useCharacterCreation]], useCharacterExportImport, useTrainerLevelUp, useTrainerXp |
| **Pokemon** | 4 | useEvolutionUndo, useLevelUpAllocation, [[pokemon-sheet-dice-rolls|usePokemonSheetRolls]], [[pokemon-sprite-resolution-chain|usePokemonSprite]] |
| **Player View** | 7 | usePlayerCapture, usePlayerCombat, usePlayerGridView, usePlayerIdentity, usePlayerRequestHandlers, usePlayerScene, usePlayerWebSocket |
| **WebSocket/Sync** | 3 | useGroupViewWebSocket, useStateSync, useWebSocket |
| **Shared/Display** | 3 | useCombatantDisplay, useEntityStats, useTypeChart |
| **Notifications** | 1 | useGmToast |
| **Tables** | 1 | useTableEditor |
| **Trainer Display** | 1 | useTrainerSprite |
| **Items/Healing** | 5 | useCapture, useHapticFeedback, useHealingItems, useRangeParser, useRestHealing |

See [[composable-dependency-chains]] for how these connect. The largest composables are documented in [[largest-composables]].

## See also

- [[encounter-store-decomposition]]
- [[encounter-composable-delegation]]
- [[vtt-component-composable-map]]
- [[game-engine-extraction]] — a destructive proposal to simplify composables by delegating game logic to a standalone engine
- [[domain-module-architecture]] — a destructive proposal to replace the flat directory with vertical domain modules
- [[horizontal-layer-coupling]] — the cross-directory coupling problem the flat structure creates
