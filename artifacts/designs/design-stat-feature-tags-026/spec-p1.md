# P1 Specification: UI Stat Bonus Source Display

## Section D: Stat Bonus Source Breakdown in Character Sheets

### D1: Player Character Sheet (`PlayerCharacterSheet.vue`)

**Goal:** Show a tooltip or inline breakdown for each stat showing:
- Base value (10 for HP, 5 for others)
- Allocated stat points
- Feature bonuses (with feature names)
- Total

**Current stat display:**
```html
<span class="player-stat-cell__value">{{ stat.value }}</span>
```

**Updated stat display:**
```html
<span
  class="player-stat-cell__value"
  :title="stat.tooltip"
>
  {{ stat.value }}
  <span v-if="stat.featureBonus > 0" class="player-stat-cell__feature-bonus">
    (+{{ stat.featureBonus }})
  </span>
</span>
```

**Tooltip content example:**
```
HP: 15
  Base: 10
  Allocated: 3
  Features: +2 (Athlete, Training Regime)
```

**Implementation:**

Import `parseFeatureStatBonuses` and compute in the component:

```typescript
const featureBonuses = computed(() =>
  parseFeatureStatBonuses(props.character.features)
)

const statEntries = computed(() => {
  const stats = props.character.stats
  const stages = props.character.stageModifiers ?? {}
  const bonuses = featureBonuses.value

  // For HP, the base is 10; for others it's 5
  // But we can't perfectly decompose since we don't store allocated points separately
  // Instead, show the feature bonus portion and let the tooltip explain

  return [
    {
      key: 'hp',
      label: 'HP Base',
      value: stats.hp,
      stage: stages.hp ?? 0,
      featureBonus: bonuses.totals.hp ?? 0,
      featureSources: bonuses.bonuses
        .filter(b => b.stat === 'hp')
        .map(b => b.source),
      tooltip: buildStatTooltip('hp', stats.hp, bonuses, props.character.level, props.character.maxHp)
    },
    // ...same for attack, defense, specialAttack, specialDefense, speed
  ]
})
```

**Tooltip builder (utility function):**

```typescript
function buildStatTooltip(
  stat: keyof Stats,
  total: number,
  bonuses: FeatureStatBonuses,
  level: number,
  maxHp?: number
): string {
  const featureBonus = bonuses.totals[stat] ?? 0
  const sources = bonuses.bonuses
    .filter(b => b.stat === stat)
    .map(b => b.source)

  let tip = `${STAT_LABELS[stat]}: ${total}`

  if (featureBonus > 0) {
    tip += `\n  Features: +${featureBonus} (${sources.join(', ')})`
  }

  if (stat === 'hp' && maxHp !== undefined) {
    tip += `\n  Max HP = Level (${level}) x2 + HP (${total}) x3 + 10 = ${maxHp}`
  }

  return tip
}
```

**Styling:**

```scss
.player-stat-cell__feature-bonus {
  color: $color-success;
  font-size: 0.75em;
  margin-left: 2px;
}
```

The `(+N)` indicator next to the stat value is a compact visual cue. The full breakdown is in the tooltip (hover/long-press). This avoids cluttering the compact stat grid.

### D2: GM Character Sheet and Modal

**Standalone character page (`gm/characters/[id].vue`):**
When viewing (not editing), show the same feature bonus indicators as the player sheet.

**Character modal (`CharacterModal.vue`):**
When in edit mode, show feature bonus indicators next to stat input fields. If the stat value doesn't match the expected total (base + allocated + features), show an informational warning.

This helps the GM notice when adding/removing features should change stats. It does NOT block saving -- the GM has final say.

```html
<div class="stat-edit-row">
  <label>HP</label>
  <input v-model.number="editData.stats.hp" type="number" />
  <span v-if="featureHpBonus > 0" class="feature-bonus-hint">
    (includes +{{ featureHpBonus }} from features)
  </span>
</div>
```

---

## Section E: Bonus Indicators in Creation/Level-Up Flows

### E1: Character Creation Feature Selection

When the user adds a feature in the creation flow, show the stat bonus that will be applied:

```html
<div class="feature-tag" v-for="(feat, idx) in allFeatures" :key="idx">
  <span>{{ feat }}</span>
  <span v-if="getFeatureBonus(feat)" class="feature-bonus-badge">
    +1 {{ getFeatureBonusLabel(feat) }}
  </span>
  <button @click="removeFeature(idx)">x</button>
</div>
```

Where `getFeatureBonus(feat)` checks whether the feature grants a stat bonus and `getFeatureBonusLabel` returns the human-readable stat name (e.g., "HP", "Speed").

### E2: Creation Stats Section Enhancement

In the stat allocation section, show the bonus-inclusive total alongside the allocated points:

```
HP:  10 (base) + 3 (allocated) + 2 (features) = 15
ATK: 5  (base) + 2 (allocated) + 0 (features) = 7
```

This uses the `featureStatBonuses` computed already exposed from the composable.

### E3: Level-Up Feature Selection

Same pattern as E1. When the user adds a feature during level-up, show its stat bonus:

```html
<div class="levelup-feature" v-for="(feat, idx) in featureChoices" :key="idx">
  <span>{{ feat }}</span>
  <span v-if="getFeatureBonus(feat)" class="feature-bonus-badge">
    +1 {{ getFeatureBonusLabel(feat) }}
  </span>
</div>
```

### E4: Level-Up Summary Enhancement

The `LevelUpSummary.vue` should show the total stat changes including feature bonuses:

```
Stats Changed:
  HP: 13 -> 15 (+1 allocated, +1 from Athlete)
  Speed: 10 -> 11 (+1 allocated)
```

This requires computing the delta between old stats and new stats, decomposing the change into allocated and feature-sourced portions.

### E5: [+Any Stat] Choice UI

When a feature with `[+Any Stat]` is added, show a dropdown prompting the user to choose which stat receives the bonus:

```html
<div v-if="anyStatFeatures.length > 0" class="any-stat-chooser">
  <p>The following features grant [+Any Stat]. Choose which stat each boosts:</p>
  <div v-for="feat in anyStatFeatures" :key="feat" class="any-stat-row">
    <span>{{ feat }}</span>
    <select @change="resolveAnyStat(feat, $event.target.value)">
      <option value="">Choose stat...</option>
      <option value="hp">HP</option>
      <option value="attack">Attack</option>
      <option value="defense">Defense</option>
      <option value="specialAttack">Special Attack</option>
      <option value="specialDefense">Special Defense</option>
      <option value="speed">Speed</option>
    </select>
  </div>
</div>
```

When the user makes a choice, the composable updates the feature string to include the chosen tag:
- Before: `"Fighter's Versatility"`
- After: `"Fighter's Versatility [+Speed]"`

This ensures the choice persists when the character is saved.

---

## Styling Guidelines

All P1 UI additions follow the existing SCSS patterns:

- Feature bonus indicators use `$color-success` (green tint) to distinguish from base values
- Tooltips use the browser-native `title` attribute for simplicity (no custom tooltip component)
- Bonus badges in feature lists use a compact pill style matching existing `.tag` class
- No emojis -- use text indicators like `(+1 HP)` or `(+2 Speed)`

---

## Component Hierarchy (P1 additions marked)

```
PlayerCharacterSheet.vue
  |-- Stats grid (P1: feature bonus indicators + tooltips)
  |-- Features list (P1: stat bonus badges per feature)

CharacterModal.vue (edit mode)
  |-- Stat inputs (P1: feature bonus hints)
  |-- Feature editor (P1: stat bonus badges)

Character Creation Flow
  |-- FeatureSelectionSection (P1: stat bonus badges on selected features)
  |-- StatAllocationSection (P1: bonus-inclusive totals shown)
  |-- [+Any Stat] chooser (P1: dropdown for stat choice)

Level-Up Modal
  |-- LevelUpFeatureSection (P1: stat bonus badges)
  |-- LevelUpStatSection (P1: feature bonus context)
  |-- LevelUpSummary (P1: decomposed stat change breakdown)
```

---

## Dependencies on P0

P1 requires all P0 work to be complete:
- `parseFeatureStatBonuses()` must exist and be tested
- `computedStats` in creation/level-up must include feature bonuses
- Server-side recalculation must work for the UI to display correct values

P1 does NOT require schema changes. All bonus data is computed at display time from the existing `features` field.
