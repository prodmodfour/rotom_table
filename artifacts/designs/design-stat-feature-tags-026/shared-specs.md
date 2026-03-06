# Shared Specifications

## Existing Code Analysis

### 1. Feature Storage Model

Features are stored as `string[]` in the `HumanCharacter.features` JSON column. Each element is the feature name as free text. Examples from actual character data:

```
["Ace Trainer", "Perseverance", "Athlete", "Training Regime"]
```

The app currently does not parse or interpret feature strings in any way. They are displayed as-is in character sheets and stored verbatim.

### 2. Stat Calculation Pipeline (Current)

**Character creation (`useCharacterCreation.ts`):**
```typescript
const computedStats = computed((): Stats => ({
  hp: BASE_HP + form.statPoints.hp,
  attack: BASE_OTHER + form.statPoints.attack,
  // ...same for all stats
}))
```

Stats = base value + allocated points. No feature bonus term exists.

**Level-up (`useTrainerLevelUp.ts`):**
The `buildUpdatePayload()` function computes effective stats as:
```
existing stats + new stat point allocations
```
No feature bonus term.

**Character sheet display (`PlayerCharacterSheet.vue`):**
Reads `character.stats` directly from the API response. No derived calculation.

**Server APIs (`characters/index.post.ts`, `characters/[id].put.ts`):**
Stats are passed through from the client. The server computes maxHp (`level * 2 + hp * 3 + 10`) but does not modify stat values.

### 3. PTU [+Stat] Tag Catalog

Complete catalog of [+Stat] tags found in PTU 1.05 (chapters 3-4):

#### Specific Stat Tags (Deterministic)

| Stat | Classes/Features |
|------|-----------------|
| `[+HP]` | Survivalist (class + 5 features = 6), Athlete (class + 4 features = 5), Hex Maniac (class + 5 features = 6), Sage (class + 6 features = 7), Martial Artist/Guts branch |
| `[+Speed]` | Capture Specialist (class + 3 features = 4), Juggler (class + 6 features = 7), Rider (class + 6 features = 7), Dancer (class + 6 features = 7), Hunter (class + 6 features = 7), Provocateur (class + 6 features = 7), Tumbler (class + 6 features = 7), Ninja (class + 5 features = 6), Warper (class + 6 features = 7), Martial Artist/Inner Focus branch, Martial Artist/Limber branch, Martial Artist/Technician branch |
| `[+Attack]` | Rogue (class + 6 features = 7), Martial Artist/Reckless branch |
| `[+Defense]` | Roughneck (class + 6 features = 7), Martial Artist/Iron Fist branch |
| `[+Special Attack]` | Musician (class + 5 features = 6), Telekinetic (class + 6 features = 7) |
| `[+Special Defense]` | Oracle (class + 6 features = 7), Telepath (class + 6 features = 7) |

#### General Features (Chapter 3) with Deterministic Tags

| Feature | Tag |
|---------|-----|
| Blur | `[+Speed]` |
| Defender | `[+HP]` |
| Dive | `[+Speed]` |
| Multi-Tasking | `[+Speed]` |
| Walk It Off | `[+HP]` |

#### [+Any Stat] Features (User Choice Required)

| Feature | Tags | Notes |
|---------|------|-------|
| Fighter's Versatility | `[+Any Stat]` | Player chooses one stat |
| Signature Move | `[+Any Stat]` | Player chooses one stat |
| Type Expertise | `[Ranked 2] [+Any Stat]` | Player chooses per rank |

#### Martial Artist Branch-Conditional Tags

Martial Artist is a special case. The class feature itself has no [+Stat] tag, but each ability branch maps to a specific stat:

| Branch (Ability) | Tag on subsequent features |
|------------------|---------------------------|
| Guts | `[+HP]` |
| Inner Focus | `[+Speed]` |
| Iron Fist | `[+Defense]` |
| Limber | `[+Speed]` |
| Reckless | `[+Attack]` |
| Technician | `[+Speed]` |

These tags appear on the ability name line itself (e.g., line "Guts\n[+HP]"), not on the Martial Artist class feature. Each subsequent Martial Artist feature inherits the [+Stat] of its branch. Since the parser operates on the feature string the user enters, the user should either:
- Enter features with the tag suffix: "Martial Training (Guts) [+HP]"
- Or the parser should use the FEATURE_STAT_MAP fallback

### 4. Key Insight: Where Bonuses Are Applied

From PTU p. 15 example:
> "Lisa decides her Trainer is quick in battle and assigns her Combat Stats as so: 13 HP, 7 Attack, 5 Defense, 5 Special Attack, 5 Special Defense, 10 Speed. **With the two [+HP] tags from before, her final HP is 15.**"

This means [+Stat] bonuses are **added directly to the stat value**. They are not combat stages, not temporary bonuses -- they are permanent stat increases that factor into:
- MaxHP calculation (HP stat is used in formula: `level * 2 + hp * 3 + 10`)
- Evasion calculation (defense/spDef/speed divided by 5)
- Damage calculation (attack/spAtk added to damage rolls)

---

## Interfaces

### New File: `app/utils/featureStatParser.ts`

```typescript
import type { Stats } from '~/types/character'

/** A single stat bonus parsed from a feature tag */
export interface FeatureStatBonus {
  /** The stat being boosted */
  stat: keyof Stats
  /** The amount of the bonus (always +1 per tag in PTU) */
  value: number
  /** The feature name that granted this bonus */
  source: string
}

/** Result of parsing all features for a character */
export interface FeatureStatBonuses {
  /** Individual bonus entries (one per [+Stat] tag found) */
  bonuses: FeatureStatBonus[]
  /** Aggregate bonus per stat (sum of all matching bonuses) */
  totals: Partial<Stats>
  /** Features with [+Any Stat] that need user choice */
  anyStatFeatures: string[]
}

/**
 * Canonical stat name mapping from PTU tag text to Stats key.
 * Handles all variations found in the PTU books.
 */
export const STAT_TAG_MAP: Record<string, keyof Stats> = {
  'HP': 'hp',
  'Attack': 'attack',
  'Defense': 'defense',
  'Special Attack': 'specialAttack',
  'Special Defense': 'specialDefense',
  'Speed': 'speed',
  // Lowercase variants for robustness
  'hp': 'hp',
  'attack': 'attack',
  'defense': 'defense',
  'special attack': 'specialAttack',
  'special defense': 'specialDefense',
  'speed': 'speed',
  // Abbreviations (for user convenience)
  'Atk': 'attack',
  'Def': 'defense',
  'SpA': 'specialAttack',
  'SpAtk': 'specialAttack',
  'SpD': 'specialDefense',
  'SpDef': 'specialDefense',
  'Spe': 'speed',
  'Spd': 'speed',
}

/**
 * Fallback mapping for features whose names don't contain explicit [+Stat] tags
 * but are known to grant stat bonuses from PTU text.
 *
 * This handles cases where the GM enters just the feature name without tags.
 * Format: feature name (case-insensitive) -> stat key
 *
 * NOTE: Only includes features where the stat is unambiguous (not [+Any Stat]).
 * Martial Artist branch features are NOT included here because the stat depends
 * on which ability branch was chosen.
 */
export const FEATURE_STAT_MAP: Record<string, keyof Stats> = {
  // Chapter 3 General Features
  'Blur': 'speed',
  'Defender': 'hp',
  'Dive': 'speed',
  'Multi-Tasking': 'speed',
  'Walk It Off': 'hp',
  // The class features themselves (first feature of class chain)
  'Capture Specialist': 'speed',
  'Advanced Capture Techniques': 'speed',
  'Captured Momentum': 'speed',
  'Gotta Catch \'Em All': 'speed',
  'Juggler': 'speed',
  'Bounce Shot': 'speed',
  'Juggling Show': 'speed',
  'Round Trip': 'speed',
  'Tag In': 'speed',
  'Emergency Release': 'speed',
  'First Blood': 'speed',
  'Rider': 'speed',
  'Ramming Speed': 'speed',
  'Conqueror\'s March': 'speed',
  'Ride as One': 'speed',
  'Lean In': 'speed',
  'Cavalier\'s Reprisal': 'speed',
  'Overrun': 'speed',
  'Survivalist': 'hp',
  'Natural Fighter': 'hp',
  'Trapper': 'hp',
  'Wilderness Guide': 'hp',
  'Terrain Talent': 'hp',
  'Adaptive Geography': 'hp',
  'Athlete': 'hp',
  'Training Regime': 'hp',
  'Coaching': 'hp',
  'Adrenaline Rush': 'hp',
  'Athletic Moves': 'hp',
  'Dancer': 'speed',
  'Dance Form': 'speed',
  'Beguiling Dance': 'speed',
  'Dance Practice': 'speed',
  'Choreographer': 'speed',
  'Power Pirouette': 'speed',
  'Passing Waltz': 'speed',
  'Hunter': 'speed',
  'Pack Tactics': 'speed',
  'Surprise!': 'speed',
  'Hunter\'s Reflexes': 'speed',
  'Finisher': 'speed',
  'Don\'t Look Away': 'speed',
  'Pack Master': 'speed',
  'Musician': 'specialAttack',
  'Musical Ability': 'specialAttack',
  'Mt. Moon Blues': 'specialAttack',
  'Cacophony': 'specialAttack',
  'Noise Complaint': 'specialAttack',
  'Voice Lessons': 'specialAttack',
  'Provocateur': 'speed',
  'Push Buttons': 'speed',
  'Quick Wit': 'speed',
  'Mixed Messages': 'speed',
  'Powerful Motivator': 'speed',
  'Play Them Like a Fiddle': 'speed',
  'Enchanting Gaze': 'speed',
  'Rogue': 'attack',
  'Cutthroat': 'attack',
  'Dirty Fighting': 'attack',
  'Unexpected Attacks': 'attack',
  'Underhanded Tactics': 'attack',
  'Street Fighter': 'attack',
  'Scoundrel\'s Strike': 'attack',
  'Roughneck': 'defense',
  'Menace': 'defense',
  'Mettle': 'defense',
  'Malice': 'defense',
  'Fearsome Display': 'defense',
  'Cruel Gaze': 'defense',
  'Tough as Nails': 'defense',
  'Tumbler': 'speed',
  'Aerialist': 'speed',
  'Quick Gymnastics': 'speed',
  'Flip Out': 'speed',
  'Death From Above': 'speed',
  'Quick Reflexes': 'speed',
  'Burst of Speed': 'speed',
  'Hex Maniac': 'hp',
  'Hex Maniac Studies': 'hp',
  'Diffuse Pain': 'hp',
  'Malediction': 'hp',
  'Grand Hex': 'hp',
  'Ninja': 'speed',
  'Poison Weapons': 'speed',
  'Genjutsu': 'speed',
  'Utility Drop': 'speed',
  'Weightless Step': 'speed',
  'Kinjutsu': 'speed',
  'Oracle': 'specialDefense',
  'Divination': 'specialDefense',
  'Unveiled Sight': 'specialDefense',
  'Small Prophecies': 'specialDefense',
  'Mark of Vision': 'specialDefense',
  'Two-Second Preview': 'specialDefense',
  'Prescience': 'specialDefense',
  'Sage': 'hp',
  'Sacred Shield': 'hp',
  'Mystic Defense': 'hp',
  'Sage\'s Benediction': 'hp',
  'Lay on Hands': 'hp',
  'Highly Responsive to Prayers': 'hp',
  'Divine Wind': 'hp',
  'Telekinetic': 'specialAttack',
  'PK Alpha': 'specialAttack',
  'PK Omega': 'specialAttack',
  'Power of the Mind': 'specialAttack',
  'PK Combat': 'specialAttack',
  'Telekinetic Burst': 'specialAttack',
  'Psionic Overload': 'specialAttack',
  'Telepath': 'specialDefense',
  'Honed Mind': 'specialDefense',
  'Telepathic Awareness': 'specialDefense',
  'Thought Detection': 'specialDefense',
  'Telepathic Warning': 'specialDefense',
  'Mental Assault': 'specialDefense',
  'Suggestion': 'specialDefense',
  'Warper': 'speed',
  'Space Distortion': 'speed',
  'Warping Ground': 'speed',
  'Strange Energy': 'speed',
  'Farcast': 'speed',
  'Warped Transmission': 'speed',
  'Reality Bender': 'speed',
}
```

---

## Constants

```typescript
/**
 * Regex pattern for detecting [+Stat] tags in feature text.
 * Captures the stat name inside the brackets.
 * Handles: [+HP], [+Attack], [+Special Attack], [+Special Defense], [+Speed], [+Any Stat]
 */
export const STAT_TAG_REGEX = /\[\+([^\]]+)\]/g

/**
 * The [+Any Stat] tag text. Features with this tag require user choice.
 */
export const ANY_STAT_TAG = 'Any Stat'
```

---

## Stat Calculation Formula (Updated)

Current:
```
stat = BASE + allocatedPoints
```

Updated (P0):
```
stat = BASE + allocatedPoints + featureStatBonuses
```

Where `featureStatBonuses` is the sum of all `[+Stat]` tags matching that stat across all features.

For maxHp, the formula uses the computed HP stat:
```
maxHp = level * 2 + (BASE_HP + allocatedHpPoints + featureHpBonuses) * 3 + 10
```

This means each `[+HP]` feature tag is worth 3 maxHp at any level (since hp stat is multiplied by 3 in the formula).

---

## Parser Priority Chain

When determining stat bonuses for a feature string:

1. **Explicit [+Stat] tag in the string** -- highest priority. If the feature string contains `[+Speed]`, parse it directly.
2. **Explicit [+Any Stat] tag** -- the feature string contains `[+Any Stat]`. Flag for user choice. If the user has already chosen (e.g., "Fighter's Versatility [+Speed]"), parse the chosen stat.
3. **FEATURE_STAT_MAP fallback** -- if no explicit tag is found in the string, look up the feature name (case-insensitive, trimmed) in the fallback map.
4. **No match** -- feature does not grant a stat bonus (e.g., "Perseverance", "Ace Trainer", "Quick Switch").

---

## Changes to Existing Files

### `app/composables/useCharacterCreation.ts`

**What changes:**
- Import `parseFeatureStatBonuses` from the new parser utility
- Add `featureStatBonuses` computed property that parses `allFeatures`
- Update `computedStats` to include feature bonuses
- Update `maxHp` to use the bonus-inclusive HP stat
- Expose `featureStatBonuses` for UI display (P1)

**Key constraint:** The stat point allocation (incrementStat/decrementStat) must operate on allocated points only, NOT on the bonus-inclusive total. The feature bonus is added at the final `computedStats` level.

### `app/composables/useTrainerLevelUp.ts`

**What changes:**
- Import `parseFeatureStatBonuses` from the new parser utility
- Add `effectiveFeatureStatBonuses` computed that includes both existing features AND newly chosen features
- Update `buildUpdatePayload()` to compute final stats including feature bonuses
- Expose bonus data for summary display (P1)

### `app/server/api/characters/index.post.ts`

**What changes:**
- Import `parseFeatureStatBonuses` from the parser utility
- After parsing features from the request body, compute feature stat bonuses
- Add feature bonuses to the stat values before storing
- Recalculate maxHp using the bonus-inclusive HP stat

### `app/server/api/characters/[id].put.ts`

**What changes:**
- Import `parseFeatureStatBonuses` from the parser utility
- When features are updated, recalculate feature stat bonuses
- If features change but stats are not explicitly provided, read current base stats and recalculate
- Update maxHp when HP-affecting features change

### `app/types/character.ts`

**No changes needed for P0.** The `Stats` interface and `HumanCharacter` interface remain the same. Stats store the final computed values (base + allocated + feature bonuses). The parser is a read-time utility.

For P1, a new optional field may be added:
```typescript
interface HumanCharacter {
  // ... existing fields
  /** Cached feature stat bonus breakdown (computed, not stored in DB) */
  featureStatBonuses?: FeatureStatBonuses
}
```
