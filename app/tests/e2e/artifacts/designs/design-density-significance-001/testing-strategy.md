# Testing Strategy

## Testing Strategy

### P0 Tests

- **Unit:** `xpCalculation.ts` pure function tests (input/output, edge cases: 0 enemies, all trainers, significance at boundaries)
- **Unit:** `generate.post.ts` no longer reads densityMultiplier; spawn count must come from request body
- **Unit:** `DENSITY_SUGGESTIONS` constant has entries for all `DensityTier` values
- **Integration:** Generate with explicit count=6 produces exactly 6 Pokemon regardless of table density tier
- **Integration:** Generate with modification selected no longer scales spawn count (modification only affects species pool)
- **Regression:** Existing encounter tables with density tiers still load and display correctly

### P1 Tests

- **Unit:** `calculateEncounterXp()` -- base XP sums levels correctly, trainers count as 2x, significance multiplies, division rounds correctly
- **Unit:** `calculateEncounterXp()` edge cases -- 0 defeated enemies, 0 players (clamped to 1), significance 0.5
- **Integration:** PUT significance endpoint validates range, updates record, returns updated encounter
- **Integration:** GET xp endpoint returns correct breakdown for a completed encounter

### P2 Tests

- **Unit:** Environment preset constants have valid effect definitions
- **Integration:** Encounter with dark cave preset reports accuracy penalty for given distance
- **Integration:** Frozen lake preset triggers weight-class warning for large Pokemon

---

