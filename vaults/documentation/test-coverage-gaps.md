# Test Coverage Gaps

**Well covered:** utils (14 tests), composables (10), API handlers (10), services (9), stores (7).

**Major gaps:**

- **VTT:** 14 components + 6 composables + 6 stores = 26 source files, only ~4 related tests (gridMovement, terrain, terrain-migration, gridDistance)
- **Player:** 16 components + 1 page = 17 source files, 0 tests
- **Isometric:** 5 composables + 1 component + 1 store = 7 source files, 0 tests
- **Components overall:** 3 unit tests out of 153 total components
- **WebSocket:** 3 source files (composable, server route, server util), 0 tests
- **Integration:** Only 2 files — cross-layer flows (e.g., encounter creation -> combat -> XP) untested

## See also

- [[test-directory-structure]]
- [[vtt-component-composable-map]]
- [[clean-code]] — gaps weaken the "passes all tests" property of clean code
- [[technical-debt]] — untested areas are a form of technical debt
- [[technical-debt-cause-missing-tests]] — the risks of deploying without test feedback
