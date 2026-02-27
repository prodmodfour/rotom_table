# Testing Strategy

## Testing Strategy

### Unit Tests (Vitest)

| Test | Tier |
|---|---|
| `trainerSkills.ts` -- `getDefaultSkills()` returns all 17 skills as Untrained | P0 |
| `trainerBackgrounds.ts` -- each background has exactly 1 Adept, 1 Novice, 3 Pathetic | P0 |
| `characterCreationValidation.ts` -- stat allocation warnings for over/under 10 points | P0 |
| `characterCreationValidation.ts` -- skill background warnings for wrong counts | P0 |
| `characterCreationValidation.ts` -- edge/feature count warnings | P1 |
| `useCharacterCreation.ts` -- `applyBackground()` correctly modifies skills | P0 |
| `useCharacterCreation.ts` -- `buildCreatePayload()` produces correct API shape | P0 |
| `useCharacterCreation.ts` -- `statPointsRemaining` tracks correctly | P0 |

### E2E Tests (Playwright)

| Test | Tier |
|---|---|
| Create character with full stat allocation, verify DB record has correct stats | P0 |
| Create character with background preset, verify skills in DB match preset | P0 |
| Create character with classes, features, edges, verify all stored in DB | P1 |
| Stat point cap (cannot add >5 to single stat) | P0 |
| Full creation flow: background + skills + stats + edges + features + bio, verify everything persists | P2 |

---

