# Testing Strategy

## Testing Strategy

### Unit Tests (P0)
- `experienceCalculation.test.ts`:
  - Basic XP calculation with known inputs
  - Trainer enemies counted at 2x level
  - Boss encounter (no division by players)
  - Significance multiplier edge cases (0.5, 1, 5, 10)
  - Level-up detection across single and multiple levels
  - Tutor point calculation at /5 boundaries
  - Level 100 cap
  - Experience chart accuracy (spot-check against PTU book values)

### API Tests (P0)
- `xp-calculate` returns correct breakdown for a completed encounter
- `xp-distribute` updates Pokemon experience and level in DB
- `xp-distribute` validates per-player total does not exceed allocation
- `xp-distribute` handles multi-level-up correctly

### E2E Tests (P1)
- Full flow: create encounter, defeat enemies, end encounter, distribute XP via modal
- Level-up notification appears when XP crosses threshold
- Skip XP flow works correctly

---

