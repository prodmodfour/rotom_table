# Implementation Log

## Implementation Log

### P0 Implementation (2026-02-20)

**Status:** Complete

**Files created/modified:**

| Action | File | Notes |
|--------|------|-------|
| **NEW** | `app/utils/experienceCalculation.ts` | Pure functions + EXPERIENCE_CHART. Reuses existing `checkLevelUp()` from `levelUpCheck.ts` for per-level event details instead of duplicating logic. |
| **NEW** | `app/server/api/encounters/[id]/xp-calculate.post.ts` | Read-only preview endpoint. Returns breakdown + participating player-side Pokemon list with owner names. |
| **NEW** | `app/server/api/encounters/[id]/xp-distribute.post.ts` | Write endpoint. Recalculates XP server-side to verify client values. Updates experience, level, tutorPoints in DB. |
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` | Added `type: combatant.type` to defeatedEnemies push (line 62). |
| **EDIT** | `app/types/encounter.ts` | Made `type` optional on `defeatedEnemies` for backwards compatibility with pre-existing entries. |
| **EDIT** | `app/server/services/encounter.service.ts` | Updated `defeatedEnemies` type signatures in ParsedEncounter, buildEncounterResponse, saveEncounterCombatants. |

**Design deviations:**
- `calculateLevelUps()` returns `Omit<XpApplicationResult, 'pokemonId' | 'species'>` instead of full `XpApplicationResult` since it's a pure function that doesn't know the Pokemon identity. The API endpoint adds `pokemonId` and `species` when building the result.
- Reuses existing `checkLevelUp()` and `summarizeLevelUps()` from `levelUpCheck.ts` rather than reimplementing level-up detection, then maps the result to the `LevelUpEvent` type defined in the design.
- `trainerEnemyIds` supports index-based string IDs (e.g., "0", "1") for backwards compatibility with legacy entries that lack the `type` field.

### P0 Post-Review Fixes (2026-02-20)

**Review:** code-review-117 (CHANGES_REQUIRED)

**Commits:** ff36de0, 4dac196, 1df3717, c062fb0

| Issue | Fix | Commit |
|-------|-----|--------|
| **H1** (HIGH): Duplicate pokemonId race condition | Added deduplication guard at start of validation — rejects 400 if same pokemonId appears twice in distribution array | ff36de0 |
| **M3** (MEDIUM): Duplicated enrichment logic | Extracted `enrichDefeatedEnemies()` + `RawDefeatedEnemy` type into `experienceCalculation.ts`, updated both endpoints | 4dac196 |
| **M2** (MEDIUM): Missing app-surface.md entries | Added xp-calculate and xp-distribute to encounters API section | 1df3717 |
| **M1** (MEDIUM): Per-player validation gap | Added TODO comment documenting the pool-level vs per-player validation gap, deferred to P1 | c062fb0 |

### P1 Implementation (2026-02-20)

**Status:** Complete

**Commits:** 5a388a4, 8119970, 79fc199, ebb1706, b078693, ad5c421

**Files created/modified:**

| Action | File | Notes |
|--------|------|-------|
| **EDIT** | `app/prisma/schema.prisma` | Added `xpDistributed Boolean @default(false)` to Encounter model |
| **EDIT** | `app/server/services/encounter.service.ts` | Added `xpDistributed` to EncounterRecord, ParsedEncounter, and buildEncounterResponse |
| **EDIT** | `app/types/encounter.ts` | Added optional `xpDistributed?: boolean` to Encounter type |
| **EDIT** | `app/server/api/encounters/[id]/xp-distribute.post.ts` | Sets xpDistributed=true after successful distribution; updated TODO comment |
| **EDIT** | `app/stores/encounter.ts` | Added `calculateXp()` and `distributeXp()` actions wrapping API endpoints |
| **NEW** | `app/components/encounter/XpDistributionModal.vue` | Full post-combat XP distribution modal with per-player validation |
| **EDIT** | `app/pages/gm/index.vue` | Replaced confirm() with XpDistributionModal when defeatedEnemies.length > 0 |

**Features implemented:**
- Defeated enemies list with species, level, type tags (Pokemon/Trainer)
- Significance multiplier selector (preset dropdown + custom number input)
- Player count (auto-detected from combatants, editable)
- Boss encounter toggle
- Live-updating XP per player calculation
- Per-player distribution section with XP input fields per Pokemon
- Per-player XP validation (prevents one player taking another's share — M1 fix from code-review-117)
- Split Evenly button per player
- Level-up preview inline
- Results summary after distribution (species, XP gained, level changes, new moves/abilities/tutor points)
- xpDistributed safety flag with warning banner on re-distribution
- Skip XP and Apply XP flow both proceed to end encounter

**Design deviations:**
- Player count detected from combatant owners (props) rather than from API response to avoid double API call on mount
- Modal uses Teleport to body (consistent with GMActionModal pattern in the codebase)

### P2 Implementation (2026-02-21)

**Status:** Complete

**Commits:** 253e3cb, f4bf446, 1735d09

**Files created/modified:**

| Action | File | Notes |
|--------|------|-------|
| **NEW** | `app/components/encounter/LevelUpNotification.vue` | Level-up results display showing per-Pokemon: stat points, tutor points, new moves, ability milestones, evolution eligibility. Transforms `XpApplicationResult[]` into display-friendly format. |
| **NEW** | `app/assets/scss/components/_level-up-notification.scss` | SCSS partial for LevelUpNotification with color-coded detail items (teal=stat, violet=tutor, green=move, pink=ability, amber=evolution). |
| **NEW** | `app/server/api/pokemon/[id]/add-experience.post.ts` | Standalone XP add endpoint accepting `{ amount: number }`. Loads Pokemon + learnset, calculates level-ups, updates DB (experience, level, tutorPoints), returns `XpApplicationResult`. |
| **EDIT** | `app/components/encounter/XpDistributionModal.vue` | Added `hasLevelUps` computed and `LevelUpNotification` component in results phase, displayed conditionally after XP distribution when any Pokemon gained levels. |

**Design deviations:**
- LevelUpNotification is rendered inside the XpDistributionModal results section (below results-total, above footer) rather than as a separate modal/overlay — keeps the flow unified in one modal.
- Evolution eligibility shows as a notification ("Evolution may be available at Level X!") rather than a detailed evolution path, since SpeciesData does not encode evolution conditions and the GM must consult the Pokedex entry manually.

