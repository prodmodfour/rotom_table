# Test Directory Structure

55 test files total: 53 unit tests across 6 subdirectories + 2 integration tests. The `e2e/` directory exists but is empty (`.gitkeep` only).

```
tests/
├── unit/
│   ├── api/            # 10 files — server endpoint handlers
│   ├── components/     # 3 files — CombatantCaptureSection, CombatantCard, PokemonCard
│   ├── composables/    # 10 files — useCombat, useDamageCalculation, useGridMovement, etc.
│   ├── services/       # 9 files — combatant, encounterGeneration, healing-item, etc.
│   ├── stores/         # 7 files — encounter, encounterLibrary, encounterTables, library, settings, terrain, terrain-migration
│   └── utils/          # 14 files — diceRoller, gridDistance, captureRate, typeChart, etc.
├── integration/        # 2 files — encounter-tables, fog-of-war
└── e2e/                # empty — UX exploration uses Playwright in ux-sessions/
```

Tests use [[vitest-configuration]] and [[mock-patterns]]. See [[test-coverage-gaps]] for untested areas.
