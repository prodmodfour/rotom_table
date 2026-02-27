# Shared Specifications

## Composable: `useCharacterCreation.ts`

### New File: `app/composables/useCharacterCreation.ts`

State management for the multi-section creation form. Encapsulates:

- Reactive form state (all fields)
- Background application logic (apply preset, compute skills)
- Stat point tracking (pool remaining, per-stat cap)
- Feature/edge counters
- Validation warnings (soft, not blocking)
- `buildCreatePayload()` -- transforms form state into the API body shape

```typescript
export function useCharacterCreation() {
  const form = reactive({
    // Basic
    name: '',
    characterType: 'npc' as CharacterType,
    level: 1,
    location: '',
    // Background
    backgroundPreset: null as TrainerBackground | null,
    backgroundName: '',
    // Skills
    skills: getDefaultSkills(),
    // Stats
    statPoints: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
    // Classes/Features/Edges
    trainerClasses: [] as string[],
    features: [] as string[],
    trainingFeature: '',
    edges: [] as string[],
    // Bio
    age: null as number | null,
    gender: null as string | null,
    height: null as number | null,
    weight: null as number | null,
    backgroundText: '',
    personality: '',
    goals: '',
    money: 5000,
    notes: ''
  })

  // --- Computed ---
  const statPointsUsed = computed(() =>
    Object.values(form.statPoints).reduce((sum, v) => sum + v, 0)
  )
  const statPointsRemaining = computed(() => 10 - statPointsUsed.value)

  const computedStats = computed((): Stats => ({
    hp: 10 + form.statPoints.hp,
    attack: 5 + form.statPoints.attack,
    defense: 5 + form.statPoints.defense,
    specialAttack: 5 + form.statPoints.specialAttack,
    specialDefense: 5 + form.statPoints.specialDefense,
    speed: 5 + form.statPoints.speed
  }))

  const maxHp = computed(() =>
    form.level * 2 + computedStats.value.hp * 3 + 10
  )

  const allFeatures = computed(() =>
    form.trainingFeature
      ? [...form.features, form.trainingFeature]
      : [...form.features]
  )

  // --- Actions ---
  function applyBackground(bg: TrainerBackground) {
    const skills = getDefaultSkills()
    skills[bg.adeptSkill] = 'Adept'
    skills[bg.noviceSkill] = 'Novice'
    for (const s of bg.patheticSkills) {
      skills[s] = 'Pathetic'
    }
    form.skills = skills
    form.backgroundPreset = bg
    form.backgroundName = bg.name
  }

  function buildCreatePayload() {
    return {
      name: form.name,
      characterType: form.characterType,
      level: form.level,
      location: form.location || undefined,
      stats: computedStats.value,
      maxHp: maxHp.value,
      currentHp: maxHp.value,
      trainerClasses: form.trainerClasses,
      skills: form.skills,
      features: allFeatures.value,
      edges: form.edges,
      age: form.age,
      gender: form.gender,
      height: form.height,
      weight: form.weight,
      background: form.backgroundText || undefined,
      personality: form.personality || undefined,
      goals: form.goals || undefined,
      money: form.money,
      notes: form.notes || undefined
    }
  }

  return {
    form,
    statPointsUsed,
    statPointsRemaining,
    computedStats,
    maxHp,
    allFeatures,
    applyBackground,
    buildCreatePayload
  }
}
```

---


## Validation Utility: `app/utils/characterCreationValidation.ts`

Pure validation functions for PTU character creation rules. Returns warning arrays, not errors -- the GM always has the final say.

```typescript
export interface CreationWarning {
  section: 'stats' | 'skills' | 'edges' | 'features' | 'classes'
  message: string
  severity: 'info' | 'warning'
}

export function validateStatAllocation(
  statPoints: Record<string, number>,
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const total = Object.values(statPoints).reduce((s, v) => s + v, 0)

  if (total !== 10 && level === 1) {
    warnings.push({
      section: 'stats',
      message: `Level 1 trainers should allocate exactly 10 stat points (currently ${total})`,
      severity: 'warning'
    })
  }

  for (const [stat, points] of Object.entries(statPoints)) {
    if (points > 5 && level === 1) {
      warnings.push({
        section: 'stats',
        message: `${stat} has ${points} added points (max 5 per stat at level 1)`,
        severity: 'warning'
      })
    }
  }

  return warnings
}

export function validateSkillBackground(
  skills: Record<string, string>,
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const ranks = Object.values(skills)
  const adeptCount = ranks.filter(r => r === 'Adept').length
  const noviceCount = ranks.filter(r => r === 'Novice').length
  const patheticCount = ranks.filter(r => r === 'Pathetic').length

  if (adeptCount !== 1) {
    warnings.push({ section: 'skills', message: `Background should set exactly 1 skill to Adept (found ${adeptCount})`, severity: 'warning' })
  }
  if (noviceCount !== 1) {
    warnings.push({ section: 'skills', message: `Background should set exactly 1 skill to Novice (found ${noviceCount})`, severity: 'warning' })
  }
  if (patheticCount !== 3) {
    warnings.push({ section: 'skills', message: `Background should set exactly 3 skills to Pathetic (found ${patheticCount})`, severity: 'warning' })
  }

  return warnings
}

export function validateEdgesAndFeatures(
  edges: string[],
  features: string[],
  trainerClasses: string[],
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []

  if (level === 1 && edges.length !== 4) {
    warnings.push({ section: 'edges', message: `Level 1 trainers start with 4 edges (have ${edges.length})`, severity: 'warning' })
  }
  if (level === 1 && features.length !== 5) {
    warnings.push({ section: 'features', message: `Level 1 trainers start with 5 features (4 + 1 Training) (have ${features.length})`, severity: 'warning' })
  }
  if (trainerClasses.length > 4) {
    warnings.push({ section: 'classes', message: `Maximum 4 trainer classes (have ${trainerClasses.length})`, severity: 'warning' })
  }

  return warnings
}
```

---


## Changes to Existing Files

### `app/pages/gm/create.vue`

**Major refactor.** The human form section is replaced with:

1. Quick/Full mode toggle (P2)
2. In P0/P1: the form is expanded in-place with new section components
3. The `createHuman()` function calls `buildCreatePayload()` from the composable
4. The Pokemon form is unchanged

The page becomes a layout shell that imports and composes the section components. The inline `humanForm` reactive object is replaced by the `useCharacterCreation()` composable.

### `app/server/api/characters/index.post.ts`

**No changes needed.** The endpoint already accepts `trainerClasses`, `skills`, `features`, `edges`, `background`, `personality`, `goals`, `age`, `gender`, `height`, `weight`, and `money`. It serializes arrays/objects to JSON for storage. The only change is that the client now actually sends these fields.

### `app/types/character.ts`

**No changes needed.** The `HumanCharacter` interface already has all the fields: `trainerClasses: string[]`, `skills: Record<string, SkillRank>`, `features: string[]`, `edges: string[]`, biographical fields, etc.

### `app/stores/library.ts`

**No changes needed.** The `createHuman()` action already passes `Partial<HumanCharacter>` to the API. The expanded form just sends more fields.

---


## Component Hierarchy (Final State)

```
pages/gm/create.vue
  |-- (mode toggle: Quick / Full)  [P2]
  |
  |-- Quick Mode: existing inline form (name, type, level, raw stats, notes)
  |
  |-- Full Mode:
      |-- Section 1: Basic Info (inline: name, type, level, location)
      |-- Section 2: SkillBackgroundSection.vue  [P0]
      |-- Section 3: EdgeSelectionSection.vue     [P1]
      |-- Section 4: ClassFeatureSection.vue      [P1]
      |-- Section 5: StatAllocationSection.vue    [P0]
      |-- Section 6: BiographySection.vue         [P2]
```

---


## Out of Scope

- **Feature prerequisite enforcement**: Full prerequisite trees for hundreds of features would require a separate reference data project. The form uses free-text input.
- **Level-up flow**: This design covers creation only. Level-up stat/feature/edge additions are a separate system.
- **Player View creation**: This form is GM-only. Player self-service character creation is a future feature.
- **Pokemon selection during creation**: Step 8 (Choose Pokemon) is handled by the existing Pokemon creation flow and trainer linking.
- **Inventory/item management during creation**: Step 9 items are handled post-creation through the character sheet.

---


## Implementation Order

1. **P0 (constants + stat allocation + skill backgrounds)**
   - `app/constants/trainerSkills.ts`
   - `app/constants/trainerBackgrounds.ts`
   - `app/utils/characterCreationValidation.ts`
   - `app/composables/useCharacterCreation.ts`
   - `app/components/create/StatAllocationSection.vue`
   - `app/components/create/SkillBackgroundSection.vue`
   - Update `app/pages/gm/create.vue` to use new composable and sections
   - Unit tests for constants, validation, and composable

2. **P1 (class/feature/edge selection)**
   - `app/constants/trainerClasses.ts`
   - `app/components/create/ClassFeatureSection.vue`
   - `app/components/create/EdgeSelectionSection.vue`
   - Background choice variants (backgrounds with either/or options)
   - Unit + E2E tests

3. **P2 (biography + mode toggle)**
   - `app/components/create/BiographySection.vue`
   - Quick/Full mode toggle in create page
   - Full E2E creation flow test

---

