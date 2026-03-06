# P0 Specification: Core Parser Utility + Stat Calculation Integration

## Section A: Feature Stat Parser Utility

### New File: `app/utils/featureStatParser.ts`

Pure utility with zero side effects. No database, no reactivity, no imports beyond `~/types/character`.

#### Core Function: `parseFeatureStatBonuses`

```typescript
/**
 * Parse all [+Stat] tags from an array of feature strings and compute
 * aggregate stat bonuses.
 *
 * Per decree-051: Auto-parse [+Stat] tags and apply stat bonuses automatically.
 * Per PTU Core p. 58: "[+Stat] Features with this tag increase a Stat by one point"
 *
 * @param features - Array of feature name strings (as stored in HumanCharacter.features)
 * @returns Parsed bonuses with individual entries, aggregate totals, and any-stat features
 */
export function parseFeatureStatBonuses(features: string[]): FeatureStatBonuses {
  const bonuses: FeatureStatBonus[] = []
  const anyStatFeatures: string[] = []

  for (const feature of features) {
    const parsed = parseFeatureString(feature)
    bonuses.push(...parsed.bonuses)
    if (parsed.hasAnyStat) {
      anyStatFeatures.push(feature)
    }
  }

  // Compute aggregate totals
  const totals: Partial<Stats> = {}
  for (const bonus of bonuses) {
    totals[bonus.stat] = (totals[bonus.stat] ?? 0) + bonus.value
  }

  return { bonuses, totals, anyStatFeatures }
}
```

#### Internal Function: `parseFeatureString`

```typescript
/**
 * Parse a single feature string for [+Stat] tags.
 *
 * Priority chain:
 * 1. Explicit [+Stat] tag in the string (e.g., "Athlete [+HP]" or "Athlete" if "[+HP]" is part of it)
 * 2. [+Any Stat] tag (flagged for user choice; if user chose, the choice appears as [+Speed] etc.)
 * 3. FEATURE_STAT_MAP fallback (plain feature name without tags)
 * 4. No match (returns empty)
 */
function parseFeatureString(feature: string): { bonuses: FeatureStatBonus[], hasAnyStat: boolean } {
  const bonuses: FeatureStatBonus[] = []
  let hasAnyStat = false

  // Step 1: Check for explicit [+Stat] tags via regex
  const tagMatches = [...feature.matchAll(STAT_TAG_REGEX)]

  if (tagMatches.length > 0) {
    for (const match of tagMatches) {
      const tagText = match[1].trim()

      // Check for [+Any Stat] — flagged but not auto-applied
      if (tagText.toLowerCase() === ANY_STAT_TAG.toLowerCase()) {
        hasAnyStat = true
        continue
      }

      const statKey = STAT_TAG_MAP[tagText]
      if (statKey) {
        bonuses.push({
          stat: statKey,
          value: 1,
          source: feature
        })
      }
    }
    return { bonuses, hasAnyStat }
  }

  // Step 2: No explicit tags — try FEATURE_STAT_MAP fallback
  // Strip any trailing whitespace and common suffixes for lookup
  const cleanName = feature.trim()
  const statKey = lookupFeatureStatMap(cleanName)
  if (statKey) {
    bonuses.push({
      stat: statKey,
      value: 1,
      source: feature
    })
  }

  return { bonuses, hasAnyStat }
}
```

#### Internal Function: `lookupFeatureStatMap`

```typescript
/**
 * Case-insensitive lookup in FEATURE_STAT_MAP.
 * Handles exact match and also strips common suffixes like "(Rank 2)".
 */
function lookupFeatureStatMap(featureName: string): keyof Stats | undefined {
  // Try exact match first (case-insensitive)
  const lowerName = featureName.toLowerCase()
  for (const [key, value] of Object.entries(FEATURE_STAT_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }

  // Try stripping ranked suffix: "Terrain Talent (Rank 2)" -> "Terrain Talent"
  const withoutRank = featureName.replace(/\s*\(Rank\s*\d+\)/i, '').trim()
  if (withoutRank !== featureName) {
    return lookupFeatureStatMap(withoutRank)
  }

  // Try stripping branching suffix: "Martial Artist: Guts" -> no match in map
  // (Martial Artist branches are handled separately)

  return undefined
}
```

#### Helper: `computeFeatureBonusStats`

```typescript
/**
 * Convenience function: given a base Stats object and feature list,
 * returns a new Stats object with feature bonuses applied.
 *
 * This is the main integration point for stat calculation.
 */
export function computeFeatureBonusStats(baseStats: Stats, features: string[]): Stats {
  const { totals } = parseFeatureStatBonuses(features)
  return {
    hp: baseStats.hp + (totals.hp ?? 0),
    attack: baseStats.attack + (totals.attack ?? 0),
    defense: baseStats.defense + (totals.defense ?? 0),
    specialAttack: baseStats.specialAttack + (totals.specialAttack ?? 0),
    specialDefense: baseStats.specialDefense + (totals.specialDefense ?? 0),
    speed: baseStats.speed + (totals.speed ?? 0),
  }
}
```

---

## Section B: Stat Calculation Integration

### B1: Character Creation (`useCharacterCreation.ts`)

**Modify `computedStats`** to include feature bonuses:

```typescript
// NEW: Parse feature stat bonuses from selected features
const featureStatBonuses = computed(() =>
  parseFeatureStatBonuses(allFeatures.value)
)

// MODIFIED: Include feature bonuses in computed stats
const computedStats = computed((): Stats => {
  const base: Stats = {
    hp: BASE_HP + form.statPoints.hp,
    attack: BASE_OTHER + form.statPoints.attack,
    defense: BASE_OTHER + form.statPoints.defense,
    specialAttack: BASE_OTHER + form.statPoints.specialAttack,
    specialDefense: BASE_OTHER + form.statPoints.specialDefense,
    speed: BASE_OTHER + form.statPoints.speed,
  }
  // Apply feature bonuses (per decree-051)
  const bonusTotals = featureStatBonuses.value.totals
  return {
    hp: base.hp + (bonusTotals.hp ?? 0),
    attack: base.attack + (bonusTotals.attack ?? 0),
    defense: base.defense + (bonusTotals.defense ?? 0),
    specialAttack: base.specialAttack + (bonusTotals.specialAttack ?? 0),
    specialDefense: base.specialDefense + (bonusTotals.specialDefense ?? 0),
    speed: base.speed + (bonusTotals.speed ?? 0),
  }
})
```

The `maxHp` and `evasions` computeds already derive from `computedStats`, so they automatically pick up feature bonuses with no additional changes.

**Expose for P1 UI:**
```typescript
return {
  // ...existing returns
  featureStatBonuses,  // NEW: for P1 bonus display
}
```

### B2: Level-Up (`useTrainerLevelUp.ts`)

**Modify `buildUpdatePayload()`** to include feature bonuses in the final stats:

```typescript
function buildUpdatePayload() {
  // ... existing code to compute effectiveStats from character.stats + statPointAllocations

  // Combine existing features with newly chosen features
  const allFeatures = [
    ...character.value.features,
    ...featureChoices.value
  ]

  // Apply feature stat bonuses to effective stats (per decree-051)
  const finalStats = computeFeatureBonusStats(effectiveStats, allFeatures)

  // Recalculate maxHp with feature-inclusive HP
  const finalMaxHp = character.value.level * 2 + finalStats.hp * 3 + 10
  // ... or use newLevel if level is changing

  return {
    // ...other fields
    stats: finalStats,
    maxHp: finalMaxHp,
    features: allFeatures,
  }
}
```

**Important consideration:** The current level-up payload builds stats by adding new allocations to existing stats. But the existing stats already include previously-applied feature bonuses (from when the character was created or last saved). This means we need to be careful not to double-count.

**Solution: Decompose stats before adding bonuses.**

The character's stored stats = base + allocated + old feature bonuses. When new features are added during level-up:

1. Parse OLD features to get old feature bonuses
2. Parse ALL features (old + new) to get total feature bonuses
3. Compute delta: `newFeatureBonuses = totalBonuses - oldBonuses`
4. Add only the delta to existing stats, plus the new stat point allocations

```typescript
// In buildUpdatePayload():
const oldFeatureBonuses = parseFeatureStatBonuses(character.value.features)
const allFeatureBonuses = parseFeatureStatBonuses(allFeatures)

// For each stat: existingValue + newAllocation + (newBonus - oldBonus)
const finalStats: Stats = {
  hp: character.value.stats.hp
    + (statPointAllocations.hp ?? 0)
    + ((allFeatureBonuses.totals.hp ?? 0) - (oldFeatureBonuses.totals.hp ?? 0)),
  // ...same for all stats
}
```

### B3: Character Display

The `PlayerCharacterSheet.vue` currently reads `character.stats` directly. Since stats are saved with feature bonuses included (after P0-C), no changes are needed for display correctness in P0. The stat values shown will already include feature bonuses.

P1 adds a breakdown tooltip showing the composition.

---

## Section C: Server-Side Stat Recalculation

### C1: Character Create (`characters/index.post.ts`)

When a character is created, the client sends stats. However, if the client has feature bonuses computed correctly (via the updated `computedStats`), the stats arrive already including bonuses.

**Validation approach:** The server should independently verify the stat calculation by parsing features and checking that the HP stat is consistent.

```typescript
// After existing code that resolves stats:
const features = body.features || []

// Parse feature stat bonuses (per decree-051)
const featureBonuses = parseFeatureStatBonuses(features)

// If client sent stats, trust them but recalculate maxHp with feature-inclusive HP
const hpStat = body.stats?.hp || body.hp || 10
const computedMaxHp = level * 2 + hpStat * 3 + 10
const maxHp = body.maxHp || computedMaxHp
```

Since the client now sends stats WITH feature bonuses included, the server's maxHp calculation is already correct. No fundamental change to the server create flow is needed -- the client is the source of truth for stat allocation, and the server just validates/stores.

### C2: Character Update (`characters/[id].put.ts`)

This is the critical integration point. When features change but stats are NOT provided in the update payload, the server must recalculate stats.

**Scenario:** GM edits features in the character modal (adds "Athlete" which has [+HP]), but only sends the `features` field, not `stats`. The server should detect the feature change and update stats accordingly.

```typescript
// After existing field handling:

// If features changed, recalculate feature stat bonuses
if (body.features !== undefined) {
  const newFeatures: string[] = body.features

  // Only recalculate if stats were NOT explicitly provided
  // (if stats were provided, trust the client's calculation)
  if (!body.stats) {
    // Fetch current character to get existing stats and features
    const current = await prisma.humanCharacter.findUnique({
      where: { id },
      select: {
        hp: true, attack: true, defense: true,
        specialAttack: true, specialDefense: true, speed: true,
        features: true, level: true
      }
    })

    if (current) {
      const oldFeatures: string[] = JSON.parse(current.features)
      const oldBonuses = parseFeatureStatBonuses(oldFeatures)
      const newBonuses = parseFeatureStatBonuses(newFeatures)

      // Compute stat deltas from feature changes
      const statKeys: (keyof Stats)[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']
      for (const stat of statKeys) {
        const oldBonus = oldBonuses.totals[stat] ?? 0
        const newBonus = newBonuses.totals[stat] ?? 0
        const delta = newBonus - oldBonus
        if (delta !== 0) {
          const dbColumn = stat === 'specialAttack' ? 'specialAttack'
            : stat === 'specialDefense' ? 'specialDefense'
            : stat
          updateData[dbColumn] = (current as any)[dbColumn] + delta
        }
      }

      // Recalculate maxHp if HP changed
      const hpDelta = (newBonuses.totals.hp ?? 0) - (oldBonuses.totals.hp ?? 0)
      if (hpDelta !== 0) {
        const newHpStat = current.hp + hpDelta
        const level = body.level ?? current.level
        updateData.maxHp = level * 2 + newHpStat * 3 + 10
      }
    }
  }
}
```

**Design decision:** When the client sends both `features` and `stats`, trust the client (it has the correct calculation). When only `features` is sent (GM manual edit), the server computes the delta. This is the same pattern as the maxHp calculation on create.

---

## Implementation Order (Within P0)

1. `app/utils/featureStatParser.ts` -- pure parser with all functions + constants + FEATURE_STAT_MAP
2. `app/tests/unit/utils/featureStatParser.test.ts` -- comprehensive test coverage
3. `app/composables/useCharacterCreation.ts` -- wire parser into computedStats
4. `app/composables/useTrainerLevelUp.ts` -- wire parser into buildUpdatePayload
5. `app/server/api/characters/[id].put.ts` -- server-side recalculation on feature change
6. `app/server/api/characters/index.post.ts` -- server-side validation on create

---

## Edge Cases

### 1. Multiple [+Stat] tags on one feature line

Some features in the PTU books have multiple tags on one line (e.g., `[+HP] [Orders]`). The regex handles this by using `matchAll` -- it finds all `[+Stat]` patterns independently. Non-stat tags like `[Orders]`, `[Class]`, `[Branch]`, `[Weapon]`, `[Ranked X]`, `[Training]`, `[Stratagem]` are silently ignored because they don't match any key in `STAT_TAG_MAP`.

### 2. Ranked features

Features like "Advanced Capture Techniques" are `[Ranked 4]` with `[+Speed]`. Each rank is a separate feature entry (PTU p. 58: "each Rank counts as gaining a new Feature; thus you apply any [Tags]"). The user enters the feature multiple times or with rank notation:
- `["Advanced Capture Techniques", "Advanced Capture Techniques"]` -- two entries, two [+Speed] bonuses
- `["Advanced Capture Techniques (Rank 1)", "Advanced Capture Techniques (Rank 2)"]` -- the rank suffix is stripped for FEATURE_STAT_MAP lookup

### 3. [+Any Stat] features

Features like "Fighter's Versatility" have `[+Any Stat]`. The parser:
- Flags these in `anyStatFeatures` for the UI to prompt the user
- Does NOT auto-apply any bonus
- If the user has already chosen (GM entered "Fighter's Versatility [+Speed]"), the explicit `[+Speed]` tag is parsed as normal

### 4. Martial Artist branch features

Martial Artist's ability branch determines which stat tag applies to all subsequent features. For example, if the trainer chose the "Guts" branch, all Martial Artist features grant `[+HP]`.

The parser handles this via FEATURE_STAT_MAP for known feature names. But since Martial Artist branch features share names across branches (e.g., "Martial Training" appears for all branches), the map cannot include them -- the stat depends on which branch was chosen.

**Resolution:** The user should enter the feature with the branch context, e.g.:
- "Martial Training (Guts)" -- not in FEATURE_STAT_MAP, but the Guts ability line itself IS: "Guts" maps to `hp` in the fallback map
- Or with explicit tag: "Martial Training [+HP]"

The branch-specific ability names (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) ARE in FEATURE_STAT_MAP since each uniquely maps to one stat.

### 5. Feature removal

When a feature is removed (in creation, level-up, or editing), the parser re-runs on the updated feature list and the stat bonuses update automatically. The reactive `computed` properties handle this.

### 6. GM manual stat override

The GM can always manually edit stats in the character modal. If the GM overrides a stat that includes a feature bonus, the override is respected. The system does not force stats to match the formula -- it's soft guidance (consistent with decree-051's "automation" intent and the existing soft-warning pattern).
