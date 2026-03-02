# Testing Strategy

## Overview

The trainer level-up system is tested at three layers:

1. **Unit tests** for pure advancement logic (`trainerAdvancement.ts`)
2. **Composable tests** for reactive state management (`useTrainerLevelUp.ts`)
3. **Component tests** for UI interaction (level-up modal sections)

The pure logic layer carries the most critical correctness requirements and receives the most thorough coverage. The composable layer tests state transitions and payload building. Component tests verify UI interactions without deep logic testing.

---

## Layer 1: Pure Advancement Logic

### File: `app/tests/unit/utils/trainerAdvancement.test.ts`

These tests verify the `trainerAdvancement.ts` pure functions against the PTU advancement table (Core pp. 19-21).

#### Test Suite: `computeTrainerLevelUp`

| Test Case | Input | Expected Output | PTU Reference |
|-----------|-------|-----------------|---------------|
| Level 2 -- even level basics | `level: 2` | `statPoints: 1, edges: 1, features: 0, bonusSkillEdge: true, skillRankCapUnlocked: 'Adept'` | p. 19 |
| Level 3 -- odd level basics | `level: 3` | `statPoints: 1, edges: 0, features: 1, bonusSkillEdge: false, skillRankCapUnlocked: null` | p. 19 |
| Level 4 -- even, no milestone | `level: 4` | `statPoints: 1, edges: 1, features: 0, bonusSkillEdge: false, milestone: null` | p. 20 |
| Level 5 -- Amateur milestone | `level: 5` | `statPoints: 1, features: 1, milestone.name: 'Amateur', classChoicePrompt: true` | p. 19 |
| Level 6 -- Expert Skills | `level: 6` | `bonusSkillEdge: true, skillRankCapUnlocked: 'Expert', edges: 1` | p. 19 |
| Level 10 -- Capable milestone | `level: 10` | `milestone.name: 'Capable', classChoicePrompt: true` | p. 19 |
| Level 12 -- Master Skills | `level: 12` | `bonusSkillEdge: true, skillRankCapUnlocked: 'Master'` | p. 19 |
| Level 20 -- Veteran milestone | `level: 20` | `milestone.name: 'Veteran'` | p. 19 |
| Level 30 -- Elite milestone | `level: 30` | `milestone.name: 'Elite', milestone.choices.length: 3` | p. 19 |
| Level 40 -- Champion milestone | `level: 40` | `milestone.name: 'Champion', milestone.choices.length: 3` | p. 19 |
| Level 50 -- max level | `level: 50` | `statPoints: 1, edges: 1, features: 0` | Table |
| Level 1 -- creation, not advancement | `level: 1` | `features: 0` (no feature at level 1, that is creation) | p. 19 |

#### Test Suite: `computeTrainerAdvancement`

| Test Case | Input | Expected | Notes |
|-----------|-------|----------|-------|
| Single level (3->4) | `from: 3, to: 4` | Array of 1 info | Simple case |
| Multi-level (3->7) | `from: 3, to: 7` | Array of 4 infos (levels 4, 5, 6, 7) | Multi-level jump |
| Crossing Amateur milestone (4->6) | `from: 4, to: 6` | Level 5 has milestone, level 6 has bonus Skill Edge | Milestone in range |
| No change (5->5) | `from: 5, to: 5` | Empty array | Edge case |
| Level decrease (5->3) | `from: 5, to: 3` | Empty array | Edge case |
| Invalid start (0->3) | `from: 0, to: 3` | Empty array | Edge case |
| Max level clamp (48->52) | `from: 48, to: 52` | Array of 2 (levels 49, 50) | Clamped to 50 |

#### Test Suite: `summarizeTrainerAdvancement`

| Test Case | Input | Expected |
|-----------|-------|----------|
| Single level summary | Info for level 4 only | `totalStatPoints: 1, totalEdges: 1, totalFeatures: 0` |
| Multi-level summary (3->7) | Infos for levels 4-7 | `totalStatPoints: 4, totalEdges: 2, totalFeatures: 2, bonusSkillEdges: 0` |
| Summary crossing level 2 (1->3) | Infos for levels 2-3 | `bonusSkillEdges: 1, skillRankCapsUnlocked: [{level: 2, cap: 'Adept'}]` |
| Summary crossing multiple milestones (1->12) | Infos for levels 2-12 | `milestones.length: 2 (Amateur + Capable), bonusSkillEdges: 3` |

#### Test Suite: `getMilestoneAt`

| Test Case | Input | Expected |
|-----------|-------|----------|
| Non-milestone level | `level: 3` | `null` |
| Amateur (5) | `level: 5` | `2 choices` |
| Capable (10) | `level: 10` | `2 choices` |
| Veteran (20) | `level: 20` | `2 choices` |
| Elite (30) | `level: 30` | `3 choices (includes General Feature)` |
| Champion (40) | `level: 40` | `3 choices` |

#### Test Suite: `calculateLifestyleStatPoints`

| Test Case | Input | Expected |
|-----------|-------|----------|
| No lifestyle choice | `level: 10, choices: {}` | `0` |
| Amateur stats at level 6 | `level: 6, choices: {5: 'amateur-stats'}` | `3 (2 retro + 1 for L6)` |
| Amateur stats at level 10 | `level: 10, choices: {5: 'amateur-stats'}` | `5 (2 retro + L6, L8, L10)` |
| Amateur feature (no stats) | `level: 10, choices: {5: 'amateur-feature'}` | `0` |
| Multiple lifestyle tiers | `level: 22, choices: {5: 'amateur-stats', 10: 'capable-stats'}` | `6 (5 amateur + 1 capable at L12)` |

---

## Layer 2: Composable Tests

### File: `app/tests/unit/composables/useTrainerLevelUp.test.ts`

Tests for the reactive composable that manages level-up state.

#### Test Suite: Initialization

| Test Case | Action | Expected |
|-----------|--------|----------|
| Initialize with character | `initialize(char, 5)` | `oldLevel: 4, newLevel: 5, isActive: true` |
| Reset clears state | `reset()` | All reactive state zeroed, `isActive: false` |
| Advancement computed | `initialize(char, 7)` | `advancementInfos.length: 3, summary.totalStatPoints: 3` |

#### Test Suite: Stat Allocation

| Test Case | Action | Expected |
|-----------|--------|----------|
| Increment stat | `incrementStat('attack')` | `statAllocations.attack: 1, statPointsRemaining: N-1` |
| Decrement stat | `decrementStat('attack')` | `statAllocations.attack: 0` |
| Cannot exceed pool | Increment when `statPointsRemaining: 0` | No change |
| Cannot go below 0 | Decrement when `statAllocations.attack: 0` | No change |

#### Test Suite: Skill Rank Allocation

| Test Case | Action | Expected |
|-----------|--------|----------|
| Add skill rank | `addSkillRank('Athletics')` | `skillChoices: ['Athletics']` |
| Rank-up raises effective rank | `addSkillRank('Athletics')` (Untrained) | `getEffectiveSkillRank('Athletics'): 'Novice'` |
| Cannot exceed pool | Add when `skillRanksRemaining: 0` | No change |
| Respects skill rank cap | At level 5 (cap Adept), skill at Adept | `canRankUpSkill: false` |
| Pathetic CAN be raised | Skill at Pathetic, level > 1 | `canRankUpSkill: true` |
| Multiple rank-ups same skill | Add 'Athletics' twice | Effective rank advances 2 steps |
| Remove skill rank | `removeSkillRank(0)` | Removed from choices |

#### Test Suite: Updated Computed Values

| Test Case | Setup | Expected |
|-----------|-------|----------|
| updatedStats reflects allocations | `incrementStat('hp')` on char with hp: 12 | `updatedStats.hp: 13` |
| updatedMaxHp recalculated | Level 4->5, hp 12->13 | `newLevel * 2 + updatedHp * 3 + 10` |
| updatedSkills reflects rank-ups | `addSkillRank('Athletics')` on Novice | `updatedSkills.Athletics: 'Adept'` |
| currentHp clamped to maxHp | `currentHp > updatedMaxHp` | `buildUpdatePayload().currentHp <= updatedMaxHp` |

#### Test Suite: Warnings

| Test Case | Setup | Expected |
|-----------|-------|----------|
| Unallocated stat points | 3 points available, 1 used | `warnings: ['2 stat point(s) unallocated']` |
| Unallocated skill ranks | 3 ranks available, 0 chosen | `warnings: ['3 skill rank(s) unallocated']` |
| No warnings when complete | All points and ranks allocated | `warnings: []` |

#### Test Suite: Build Update Payload

| Test Case | Setup | Expected |
|-----------|-------|----------|
| Payload includes new level | Level 4->5 | `payload.level: 5` |
| Payload includes updated stats | +1 hp allocated | `payload.stats.hp: original + 1` |
| Payload includes updated maxHp | Level and HP changed | `payload.maxHp: correct formula` |
| Payload includes updated skills | Athletics ranked up | `payload.skills.Athletics: next rank` |

---

## Layer 3: Component Tests (Lightweight)

### File: `app/tests/unit/components/levelup/LevelUpModal.test.ts`

Component tests verify rendering and user interactions, not business logic.

| Test Case | Action | Expected |
|-----------|--------|----------|
| Renders with character name | Mount with char | Title shows character name |
| Shows level transition | Mount with level 3->5 | Badge shows "Level 3 -> 5" |
| Shows stat allocation step | Mount, default step | StatSection rendered |
| Next button advances step | Click "Next" | Moves to skills step |
| Back button returns | Click "Back" on skills | Returns to stats step |
| Cancel emits event | Click "Cancel" | `cancel` event emitted |
| Apply emits complete | Click "Apply Level Up" on summary | `complete` event emitted with payload |

### File: `app/tests/unit/components/levelup/LevelUpStatSection.test.ts`

| Test Case | Action | Expected |
|-----------|--------|----------|
| Renders stat grid | Mount with stats | 6 stat rows displayed |
| Shows "Was" column | Mount with char stats | Base stats shown |
| Shows remaining counter | Mount with pool | "Points Remaining: X / Y" |
| Increment emits event | Click [+] on Attack | `incrementStat: 'attack'` emitted |
| Decrement emits event | Click [-] on Attack | `decrementStat: 'attack'` emitted |
| Max HP preview updates | Props change | Preview formula correct |

### File: `app/tests/unit/components/levelup/LevelUpSkillSection.test.ts`

| Test Case | Action | Expected |
|-----------|--------|----------|
| Renders skill grid by category | Mount | Body/Mind/Spirit groups |
| Shows current ranks | Mount with skills | Rank labels correct |
| Disabled when capped | Skill at cap | [+] button disabled |
| Pathetic skills selectable | Skill at Pathetic | [+] button enabled |
| Chosen skills shown | Props with choices | "Chosen" list rendered |

---

## Test Data Fixtures

### Standard Test Character

```typescript
const testCharacter: HumanCharacter = {
  id: 'test-1',
  name: 'Ash',
  characterType: 'player',
  level: 4,
  stats: { hp: 12, attack: 7, defense: 6, specialAttack: 8, specialDefense: 6, speed: 7 },
  currentHp: 42,
  maxHp: 42,
  skills: {
    Acrobatics: 'Untrained', Athletics: 'Novice', Combat: 'Pathetic',
    Intimidate: 'Untrained', Stealth: 'Untrained', Survival: 'Untrained',
    'General Ed': 'Untrained', 'Medicine Ed': 'Untrained', 'Occult Ed': 'Pathetic',
    'Pokemon Ed': 'Adept', 'Technology Ed': 'Pathetic', Guile: 'Untrained',
    Perception: 'Novice', Charm: 'Untrained', Command: 'Untrained',
    Focus: 'Untrained', Intuition: 'Untrained'
  },
  edges: ['Basic Pokeball Proficiency', 'Skill Edge: Pokemon Ed', 'Type Mastery', 'Fleet Footed'],
  features: ['Ace Trainer', 'Training Focused', 'Agility Training', 'Tactical Training', 'Basic Training'],
  trainerClasses: ['Ace Trainer', 'Type Ace: Fire'],
  // ... other fields with defaults
}
```

---

## Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| `trainerAdvancement.ts` | 95%+ | Pure logic, critical correctness, easy to test exhaustively |
| `useTrainerLevelUp.ts` | 85%+ | Reactive state with many code paths, but some are UI-driven |
| Component tests | 60%+ | Render + interaction coverage; deep logic tested in layers above |

---

## PTU Table Verification

The most critical test is verifying the progression table from PTU Core p. 20. A table-driven test should verify that `computeTrainerAdvancement(0, N)` for each N from 1 to 50 produces cumulative totals matching the published table:

```typescript
describe('PTU Progression Table Verification', () => {
  // PTU Core p. 20 table (selected rows)
  const tableRows = [
    { level: 1,  totalFeatures: 5, totalEdges: 4,  totalStats: 10 },
    { level: 2,  totalFeatures: 5, totalEdges: 6,  totalStats: 11 },  // +1 edge + 1 bonus
    { level: 3,  totalFeatures: 6, totalEdges: 6,  totalStats: 12 },
    { level: 5,  totalFeatures: 7, totalEdges: 7,  totalStats: 14 },
    { level: 6,  totalFeatures: 7, totalEdges: 9,  totalStats: 15 },  // +1 edge + 1 bonus
    { level: 10, totalFeatures: 9, totalEdges: 13, totalStats: 19 },
    { level: 12, totalFeatures: 10, totalEdges: 16, totalStats: 21 }, // +1 edge + 1 bonus
    { level: 20, totalFeatures: 14, totalEdges: 23, totalStats: 29 },
    { level: 30, totalFeatures: 19, totalEdges: 33, totalStats: 39 },
    { level: 40, totalFeatures: 24, totalEdges: 43, totalStats: 49 },
    { level: 50, totalFeatures: 29, totalEdges: 53, totalStats: 59 },
  ]

  test.each(tableRows)(
    'level $level matches PTU table: features=$totalFeatures, edges=$totalEdges, stats=$totalStats',
    ({ level, totalFeatures, totalEdges, totalStats }) => {
      // Verify against existing getExpectedFeaturesForLevel, getExpectedEdgesForLevel, getStatPointsForLevel
      // AND against the summarized advancement from level 1
    }
  )
})
```

This table-driven test is the single most important test in the suite. If it passes, the core advancement logic is correct for all levels.

---

## Test Execution

All tests run via the existing Vitest configuration:

```bash
cd app && npx vitest run tests/unit/utils/trainerAdvancement.test.ts
cd app && npx vitest run tests/unit/composables/useTrainerLevelUp.test.ts
cd app && npx vitest run tests/unit/components/levelup/
```

No new test infrastructure needed. The existing `vitest.config.ts` covers the `app/tests/unit/` directory.
