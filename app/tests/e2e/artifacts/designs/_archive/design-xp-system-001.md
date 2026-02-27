---
design_id: design-xp-system-001
ticket_id: ptu-rule-055
category: FEATURE_GAP
scope: FULL
domain: pokemon-lifecycle
status: implemented
affected_files:
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
new_files:
  - app/utils/experienceCalculation.ts
  - app/server/api/encounters/[id]/xp-calculate.post.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/components/encounter/LevelUpNotification.vue
---

# Design: Post-Combat XP Calculation & Distribution System

## Summary

Implement the full PTU 1.05 experience system: calculate XP from defeated enemies after combat, present a distribution UI for GM approval, apply XP to participating Pokemon, and detect level-ups with stat point prompts. Currently, the `defeatedEnemies` array is tracked during combat but never consumed -- the GM manually updates experience values on individual Pokemon sheets.

The `captureRate.ts` pure-utility pattern is the architectural reference: a pure calculation function with typed input/output and full breakdown, consumed by a thin API endpoint.

---

## PTU Rules Reference

### Pokemon Experience (PTU Core p.460)

**Step 1 -- Base Experience Value:**
Total the levels of all defeated enemy combatants. For enemy Trainers who participated directly in combat, treat their level as **doubled**.

*Example: A Level 10 Trainer with a Level 20 Pokemon = 20 + 20 = 40 Base XP.*

**Step 2 -- Significance Multiplier (x1 to x5+):**
GM-assigned multiplier based on narrative significance and challenge level.
- Insignificant (wild Pidgeys): x1 to x1.5
- Average encounters: x2 to x3
- Significant (gym leader, rival): x4 to x5+

Adjust by +/- x0.5 to x1.5 based on difficulty relative to party strength.

**Step 3 -- Division by Players:**
Divide total XP by the number of **players** (not Pokemon). Each player then splits their share among the Pokemon they used.

### XP Regulation Rules (PTU Core p.460)
- XP can only go to Pokemon who **participated** in the encounter (as written).
- **Fainted Pokemon CAN receive XP** (unlike video games).
- GM may optionally allow non-participant Pokemon to receive a portion (boss encounters, timeskips).
- GM may cap XP per Pokemon to prevent one Pokemon from outstripping the party average.

### Boss Encounter XP (PTU Core p.489)
Boss enemy XP is **not divided** by number of players -- each player receives the full Boss XP.

### Pokemon Experience Chart (PTU Core p.203)
Level-to-XP-needed table from Level 1 (0 XP) to Level 100 (20,555 XP). Each level has a cumulative "Exp Needed" threshold.

### Level-Up Effects (PTU Core p.202)
When a Pokemon levels up:
1. Gains **+1 Stat Point** (must follow Base Relations Rule)
2. May learn new **Moves** from its learnset at the new level
3. May **Evolve** (if evolution conditions are met at this level)
4. At Level 20: gains **Second Ability** (Basic or Advanced)
5. At Level 40: gains **Third Ability** (any)
6. At levels divisible by 5: gains **+1 Tutor Point**

### Trainer Experience (PTU Core p.461)
Trainers level via **Milestones** (badges, major victories) or an **Experience Bank** (10 XP = +1 Level). Trainer XP is GM-discretionary: 0 for trivial encounters, 1-2 for average, 3-5 for significant. This design focuses on Pokemon XP; Trainer XP is a separate GM action.

### Training Experience (PTU Core p.202)
Daily training grants XP = half Pokemon's level + Command Rank bonus. This is separate from combat XP and already partially modeled by the `trainingExp` field on the Pokemon model.

---

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | XP calculation formula | NOT_IMPLEMENTED | `defeatedEnemies` tracked but never consumed | **P0** |
| B | XP distribution API | NOT_IMPLEMENTED | No endpoint to apply XP to Pokemon | **P0** |
| C | XP distribution UI (post-encounter modal) | NOT_IMPLEMENTED | GM sees no XP summary after combat | **P1** |
| D | Level-up detection & notification | NOT_IMPLEMENTED | No detection when XP crosses threshold | **P2** |
| E | Stat allocation prompt on level-up | NOT_IMPLEMENTED | No UI for +1 stat point assignment | **P2** |
| F | Move/ability/evolution prompts on level-up | NOT_IMPLEMENTED | No automation for level-up side effects | **P2** |

---

## A. XP Calculation Utility (P0)

### New File: `app/utils/experienceCalculation.ts`

Pure functions, zero DB access, full breakdown output. Follows `captureRate.ts` pattern.

#### Constants

```typescript
// PTU Experience Chart (Core p.203)
// Maps level -> cumulative XP needed to reach that level
export const EXPERIENCE_CHART: Record<number, number> = {
  1: 0, 2: 10, 3: 20, 4: 30, 5: 40,
  6: 50, 7: 60, 8: 70, 9: 80, 10: 90,
  11: 110, 12: 135, 13: 160, 14: 190, 15: 220,
  16: 250, 17: 285, 18: 320, 19: 360, 20: 400,
  21: 460, 22: 530, 23: 600, 24: 670, 25: 745,
  26: 820, 27: 900, 28: 990, 29: 1075, 30: 1165,
  31: 1260, 32: 1355, 33: 1455, 34: 1555, 35: 1660,
  36: 1770, 37: 1880, 38: 1995, 39: 2110, 40: 2230,
  41: 2355, 42: 2480, 43: 2610, 44: 2740, 45: 2875,
  46: 3015, 47: 3155, 48: 3300, 49: 3445, 50: 3645,
  51: 3850, 52: 4060, 53: 4270, 54: 4485, 55: 4705,
  56: 4930, 57: 5160, 58: 5390, 59: 5625, 60: 5865,
  61: 6110, 62: 6360, 63: 6610, 64: 6865, 65: 7125,
  66: 7390, 67: 7660, 68: 7925, 69: 8205, 70: 8485,
  71: 8770, 72: 9060, 73: 9350, 74: 9645, 75: 9945,
  76: 10250, 77: 10560, 78: 10870, 79: 11185, 80: 11505,
  81: 11910, 82: 12320, 83: 12735, 84: 13155, 85: 13580,
  86: 14010, 87: 14445, 88: 14885, 89: 15330, 90: 15780,
  91: 16235, 92: 16695, 93: 17160, 94: 17630, 95: 18105,
  96: 18585, 97: 19070, 98: 19560, 99: 20055, 100: 20555
}

// Default significance multiplier presets (GM convenience)
export const SIGNIFICANCE_PRESETS = {
  insignificant: 1,
  below_average: 1.5,
  average: 2,
  above_average: 3,
  significant: 4,
  major: 5,
} as const

export type SignificancePreset = keyof typeof SIGNIFICANCE_PRESETS
```

#### Types

```typescript
export interface DefeatedEnemy {
  species: string
  level: number
  isTrainer: boolean  // Trainers count as 2x level for XP
}

export interface XpCalculationInput {
  defeatedEnemies: DefeatedEnemy[]
  significanceMultiplier: number  // GM-set, typically 1-5
  playerCount: number             // Number of players (NOT Pokemon)
  isBossEncounter: boolean        // Boss XP is not divided by players
}

export interface XpCalculationResult {
  totalXpPerPlayer: number
  breakdown: {
    enemyLevelsTotal: number       // Sum of enemy levels (trainers counted 2x)
    baseExperienceValue: number    // enemyLevelsTotal (before multiplier)
    significanceMultiplier: number
    multipliedXp: number           // base * multiplier
    playerCount: number
    isBossEncounter: boolean
    perPlayerXp: number            // final per-player amount
    enemies: {
      species: string
      level: number
      isTrainer: boolean
      xpContribution: number       // Effective level contribution
    }[]
  }
}

export interface XpApplicationResult {
  pokemonId: string
  species: string
  previousExperience: number
  xpGained: number
  newExperience: number
  previousLevel: number
  newLevel: number
  levelsGained: number
  levelUps: LevelUpEvent[]
}

export interface LevelUpEvent {
  newLevel: number
  statPointsGained: number        // Always 1 per level
  tutorPointGained: boolean       // True if level is divisible by 5
  newMovesAvailable: string[]     // Moves learned at this level from learnset
  canEvolve: boolean              // Whether evolution is available at this level
  newAbilitySlot: 'second' | 'third' | null  // Level 20 or 40
}
```

#### Functions

```typescript
/**
 * Calculate post-encounter XP per player.
 * PTU Core p.460: total defeated levels, apply significance, divide by players.
 */
export function calculateEncounterXp(input: XpCalculationInput): XpCalculationResult

/**
 * Given a Pokemon's current experience and XP to add, determine the new level
 * and any level-up events.
 * PTU Core p.202-203.
 */
export function calculateLevelUps(
  currentExperience: number,
  currentLevel: number,
  xpToAdd: number,
  learnset?: { level: number; move: string }[],
  evolutionLevels?: number[]
): XpApplicationResult

/**
 * Get the XP needed for a specific level from the chart.
 */
export function getXpForLevel(level: number): number

/**
 * Get the level a Pokemon should be at given a total experience value.
 */
export function getLevelForXp(totalXp: number): number

/**
 * Get XP remaining until next level.
 */
export function getXpToNextLevel(currentExperience: number, currentLevel: number): number
```

### Why Pure Functions

The XP calculation must be:
1. **Testable** -- Unit tests can verify every edge case without DB setup
2. **Reusable** -- The same functions serve the API endpoint, the UI preview, and future training XP
3. **Auditable** -- Full breakdown shows the GM exactly how XP was computed

---

## B. XP Calculation API Endpoint (P0)

### `POST /api/encounters/:id/xp-calculate`

**Purpose:** Calculate XP for a completed encounter without applying it. This is a read-only preview endpoint the GM uses before approving distribution.

**Request Body:**
```typescript
{
  significanceMultiplier: number  // Required, 1-10
  playerCount: number             // Required, 1+
  isBossEncounter?: boolean       // Optional, default false
  trainerEnemyIds?: string[]      // Optional: which defeated enemies were Trainers (level counted 2x)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    totalXpPerPlayer: number
    breakdown: XpCalculationResult['breakdown']
    // Convenience: list of player-side Pokemon who participated
    participatingPokemon: {
      id: string
      species: string
      nickname: string | null
      currentLevel: number
      currentExperience: number
      ownerId: string | null
      ownerName: string | null
    }[]
  }
}
```

**Logic:**
1. Load encounter by ID (must exist, may be active or ended)
2. Read `defeatedEnemies` from encounter record
3. Enrich with `isTrainer` flag from `trainerEnemyIds` (or infer from combatant type if the defeated enemy was a human combatant)
4. Call `calculateEncounterXp()` pure function
5. Collect participating player-side Pokemon from combatants (side === 'players' and type === 'pokemon')
6. Return calculation + participant list

**Validation:**
- `significanceMultiplier` must be a number between 0.5 and 10
- `playerCount` must be a positive integer

### Data Model Changes for P0

**Encounter.defeatedEnemies** -- Extend the existing `{ species: string; level: number }` to include `type: 'pokemon' | 'human'`:

```typescript
{ species: string; level: number; type: 'pokemon' | 'human' }
```

This change is backwards-compatible: existing entries without `type` default to `'pokemon'`. The `damage.post.ts` endpoint already pushes to this array when a combatant faints; we add the `type` field there.

**No new Prisma columns** for P0. The existing `defeatedEnemies` JSON column and `Pokemon.experience` column are sufficient.

---

## C. XP Distribution API Endpoint (P0)

### `POST /api/encounters/:id/xp-distribute`

**Purpose:** Apply XP to Pokemon after GM approval. This is the write endpoint.

**Request Body:**
```typescript
{
  significanceMultiplier: number
  playerCount: number
  isBossEncounter?: boolean
  trainerEnemyIds?: string[]
  // Distribution: how each player splits their XP among their Pokemon
  distribution: {
    pokemonId: string
    xpAmount: number
  }[]
}
```

**Validation Rules:**
- Each `pokemonId` must exist in the database
- Each `pokemonId` should belong to a player-side combatant in the encounter (warn but allow override for GM flexibility with non-participant Pokemon)
- The sum of `xpAmount` across all Pokemon belonging to the same player must not exceed `totalXpPerPlayer` (prevent over-allocation) -- unless GM explicitly overrides
- `xpAmount` must be a non-negative integer

**Response:**
```typescript
{
  success: true,
  data: {
    results: XpApplicationResult[]
    totalXpDistributed: number
  }
}
```

**Logic:**
1. Recalculate `totalXpPerPlayer` from encounter data (verify client values match)
2. Validate distribution does not exceed per-player totals
3. For each Pokemon in distribution:
   a. Load Pokemon from DB
   b. Calculate new experience total: `currentExperience + xpAmount`
   c. Determine new level from experience chart
   d. If leveled up, load learnset from SpeciesData to identify available moves
   e. Update Pokemon record: `experience`, `level`, `tutorPoints` (if level crossed a /5 boundary)
   f. Build `XpApplicationResult` with level-up events
4. Return all results

**Database Writes:**
```sql
UPDATE Pokemon SET
  experience = :newExperience,
  level = :newLevel,
  tutorPoints = tutorPoints + :tutorPointsGained
WHERE id = :pokemonId
```

Note: Stat points from leveling are NOT auto-applied. The GM/player must manually allocate them (P2 addresses this). The API only updates `experience`, `level`, and `tutorPoints`.

---

## D. XP Distribution UI -- Post-Encounter Modal (P1)

### New Component: `app/components/encounter/XpDistributionModal.vue`

**Trigger:** When the GM clicks "End Encounter" and the encounter has `defeatedEnemies.length > 0`, show this modal before (or after) the end endpoint fires.

**Flow:**
1. GM clicks "End Encounter" on `EncounterHeader`
2. If `defeatedEnemies` is non-empty, show `XpDistributionModal` instead of the current `confirm()` dialog
3. Modal displays:
   - **Defeated enemies list** with species, level, and type tag (Pokemon/Trainer)
   - **Significance multiplier** selector (preset dropdown + custom number input)
   - **Player count** (auto-detected from unique owners of player-side Pokemon, editable)
   - **Boss encounter** toggle
   - **Calculated XP per player** (live-updating as inputs change)
   - **Per-player distribution section:** For each player, show their Pokemon that participated. Each Pokemon has an XP input field. Running total shows remaining XP to allocate.
4. GM adjusts distribution and clicks "Apply XP"
5. Frontend calls `POST /api/encounters/:id/xp-distribute`
6. On success, display results summary (who leveled up, new levels, available moves)
7. Then proceed with the existing end-encounter flow

**Alternative flow:** GM can click "Skip XP" to end the encounter without distributing XP (for encounters where XP was already given manually, or where the GM wants to defer).

### UI Layout (Rough)

```
+--------------------------------------------------+
| Post-Combat XP Distribution                  [X] |
+--------------------------------------------------+
| Defeated Enemies:                                |
|   Pidgey Lv.5, Rattata Lv.3, Bug Catcher Lv.8  |
|                                                  |
| Significance: [Average (x2)  v] [Custom: ___]   |
| Players: [3]  Boss Encounter: [ ]                |
|                                                  |
| Base XP: 24  |  x2  |  / 3 players  =  16 each  |
+--------------------------------------------------+
| Player: Hassan                                   |
|   [Chompy Lv.12]     XP: [10]  (Exp: 135->145)  |
|   [Sparky Lv.8]      XP: [6]   (Exp: 70->76)    |
|   Remaining: 0 / 16                              |
|--------------------------------------------------|
| Player: Ilaria                                   |
|   [Iris Lv.10]       XP: [16]  (Exp: 90->106)   |
|   Remaining: 0 / 16              LEVEL UP! -> 11 |
+--------------------------------------------------+
| [Skip XP]                         [Apply XP]     |
+--------------------------------------------------+
```

### Integration Points

- **`app/pages/gm/index.vue`**: Change `endEncounter()` from `confirm()` to opening `XpDistributionModal` when `defeatedEnemies.length > 0`
- **`app/components/gm/EncounterHeader.vue`**: No change needed (already emits `@end`)
- **`app/stores/encounter.ts`**: Add `distributeXp()` action that calls the distribute endpoint
- **WebSocket**: After XP distribution, broadcast `xp_distributed` event so Group View can show level-up celebrations

---

## E. Level-Up Detection & Notification (P2)

### Level-Up Response Data

The `xp-distribute` endpoint (P0) already returns `XpApplicationResult[]` which includes `levelsGained` and `levelUps[]`. P2 builds UI on top of this.

### New Component: `app/components/encounter/LevelUpNotification.vue`

Displayed after XP distribution succeeds, for each Pokemon that leveled up:

1. **Species name** and new level
2. **+1 Stat Point available** reminder (per level gained)
3. **New moves available** from learnset at this level
4. **Evolution available** flag (if applicable)
5. **New ability slot** (at Level 20 or 40)
6. **Tutor Point gained** (at levels divisible by 5)

This is informational only in P2 -- the GM/player must navigate to the Pokemon sheet to apply stat points, choose moves, and trigger evolution. Full automation is out of scope for this design.

### Future: Stat Allocation Modal (P2 stretch)

If time permits, a modal that lets the player immediately allocate their +1 stat point per level gained, with Base Relations Rule validation. This would:
1. Load the Pokemon's base stats and current stat point distribution
2. Show which stats can legally receive the point (respecting Base Relations)
3. Apply the stat point and recalculate derived stats (maxHp, evasions)
4. Save to database

This requires understanding the full Base Relations Rule implementation, which may warrant its own design spec if complexity is high.

---

## Data Flow Diagram

```
COMBAT PHASE (existing):
  damage.post.ts -> faint detected -> push to defeatedEnemies[]
                                          |
                                          v
END ENCOUNTER (P0+P1):
  GM clicks "End Encounter"
       |
       v
  defeatedEnemies.length > 0?
       |yes                    |no
       v                       v
  XpDistributionModal      End encounter
  (P1, fallback: API only)    normally
       |
       v
  xp-calculate (preview)
       |
       v
  GM sets multiplier, distribution
       |
       v
  xp-distribute (apply)
       |
       v
  Pokemon DB updated (experience, level, tutorPoints)
       |
       v
  Level-up results displayed (P2)
       |
       v
  End encounter proceeds (existing end.post.ts flow)
```

---

## Edge Cases & Design Decisions

### 1. Trainer enemies in defeatedEnemies
The current `damage.post.ts` pushes `{ species, level }` when any enemy faints. To distinguish trainers (2x level for XP), we add `type: 'pokemon' | 'human'` to the defeated entry. The combatant already has a `type` field we can read.

### 2. Rounding
XP values are always rounded down (floor) after division. Fractional XP is discarded per PTU convention.

### 3. Pokemon used by multiple trainers
Edge case: a Pokemon is traded mid-combat. For simplicity, the distribution UI lists all player-side Pokemon that were in the encounter. The GM manually assigns XP regardless of ownership changes.

### 4. Empty defeatedEnemies
If the encounter ends with no defeated enemies (e.g., the party fled), skip the XP modal entirely.

### 5. Already-ended encounters
The `xp-calculate` and `xp-distribute` endpoints work on any encounter (active or ended). This lets the GM distribute XP after the fact if they forgot during the end flow.

### 6. Max level cap
Pokemon cannot exceed Level 100. If XP would push past Level 100, cap experience at `EXPERIENCE_CHART[100]` (20,555).

### 7. Negative XP
Never allow negative XP distribution. Validate `xpAmount >= 0` on the server.

### 8. Re-distribution
The distribute endpoint is idempotent in the sense that it adds XP to current values. If the GM accidentally distributes twice, the Pokemon gets double XP. To prevent this, the endpoint should record that XP was distributed for this encounter (add a `xpDistributed: boolean` field to the Encounter model in P1, used as a warning but not a hard block).

---

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

## Files Changed Summary

### P0 (XP Calculation + Distribution API)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/experienceCalculation.ts` | Pure XP calculation functions + experience chart |
| **NEW** | `app/server/api/encounters/[id]/xp-calculate.post.ts` | Preview XP calculation endpoint |
| **NEW** | `app/server/api/encounters/[id]/xp-distribute.post.ts` | Apply XP to Pokemon endpoint |
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` | Add `type` field to defeatedEnemies entries |
| **EDIT** | `app/types/encounter.ts` | Extend `defeatedEnemies` type with `isTrainer` flag |
| **NEW** | `app/tests/unit/utils/experienceCalculation.test.ts` | Unit tests for pure functions |

### P1 (XP Distribution UI)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/encounter/XpDistributionModal.vue` | Post-combat XP distribution modal |
| **EDIT** | `app/pages/gm/index.vue` | Replace `confirm()` with XP modal on end encounter |
| **EDIT** | `app/stores/encounter.ts` | Add `calculateXp()` and `distributeXp()` actions |
| **EDIT** | `app/prisma/schema.prisma` | Add `xpDistributed` boolean to Encounter (optional safety flag) |

### P2 (Level-Up Automation)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/encounter/LevelUpNotification.vue` | Level-up results display |
| **NEW** | `app/server/api/pokemon/[id]/add-experience.post.ts` | Standalone XP add endpoint (for training, manual GM grants) |
| **EDIT** | `app/components/encounter/XpDistributionModal.vue` | Show level-up results after distribution |

---

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
