# Composable Dependency Chains

Key dependency chains between [[composable-domain-grouping|composables]]:

- **Movement pipeline:** `useGridMovement` -> `useRangeParser` -> `usePathfinding` (movement range calculation with A* terrain costs). Also imports `movementModifiers.ts` utility for Stuck/Slowed/Sprint modifiers.
- **Isometric render pipeline:** `useIsometricRendering` -> `useIsometricMovementPreview` + `useIsometricOverlays` + `useIsometricProjection` + `useRangeParser`
- **2D input handling:** `useGridInteraction` -> `useTouchInteraction` + selection/measurement/fogOfWar stores
- **2D draw loop:** `useGridRendering` -> `useRangeParser` + `useCanvasDrawing` + fogOfWar/terrain/measurement stores
- **Flanking detection:** `useFlankingDetection` -> `flankingGeometry` util + `combatSides` util (bridges combat + VTT position data)
- **Isometric input:** `useIsometricInteraction` -> `useIsometricProjection` + `useTouchInteraction`
- **Move calculation:** `useMoveCalculation` -> `equipmentBonuses`, `evasionCalculation`, `typeEffectiveness`, `weatherRules`, `visionRules` utilities
- **Player combat:** `usePlayerCombat` -> `usePlayerWebSocket` via `PLAYER_WS_SEND_KEY` injection key

A* terrain costs come from the Pinia [[terrain-type-system|terrain store]] — the store must be populated before [[pathfinding-algorithm|pathfinding]] runs.

## See also

- [[encounter-grid-state]] — the stores referenced in these chains
- [[touch-gesture-handling]] — shared touch composable used by 2D and isometric input
