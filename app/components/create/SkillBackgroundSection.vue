<template>
  <div class="skill-background">
    <div class="skill-background__header">
      <h3>Background &amp; Skills</h3>
    </div>

    <div class="skill-background__selector">
      <div class="form-group">
        <label>Background</label>
        <select
          class="form-select"
          :value="selectedValue"
          @change="onBackgroundChange"
        >
          <option value="">-- Select a Background --</option>
          <option value="__custom__">Custom Background</option>
          <option disabled>---</option>
          <option
            v-for="bg in SAMPLE_BACKGROUNDS"
            :key="bg.name"
            :value="bg.name"
          >
            {{ bg.name }}
          </option>
        </select>
      </div>

      <div v-if="isCustomBackground" class="form-group">
        <label>Background Name</label>
        <input
          type="text"
          class="form-input"
          placeholder="Enter custom background name"
          :value="backgroundName"
          @input="$emit('update:backgroundName', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div v-if="activeBackground && !isCustomBackground" class="skill-background__description">
      <p>{{ activeBackground.description }}</p>
      <div class="skill-background__summary">
        <span class="rank-tag rank-tag--adept">Adept: {{ activeBackground.adeptSkill }}</span>
        <span class="rank-tag rank-tag--novice">Novice: {{ activeBackground.noviceSkill }}</span>
        <span
          v-for="skill in activeBackground.patheticSkills"
          :key="skill"
          class="rank-tag rank-tag--pathetic"
        >
          Pathetic: {{ skill }}
        </span>
      </div>
    </div>

    <div v-if="isCustomBackground" class="skill-background__custom">
      <p class="skill-background__hint">
        Select 1 skill to raise to Adept, 1 to Novice, and 3 to lower to Pathetic.
      </p>

      <div class="custom-picks">
        <div class="form-group">
          <label>Adept Skill</label>
          <select
            class="form-select"
            :value="customAdept"
            @change="onCustomAdeptChange"
          >
            <option value="">-- Pick Adept Skill --</option>
            <option
              v-for="skill in availableForAdept"
              :key="skill"
              :value="skill"
            >
              {{ skill }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Novice Skill</label>
          <select
            class="form-select"
            :value="customNovice"
            @change="onCustomNoviceChange"
          >
            <option value="">-- Pick Novice Skill --</option>
            <option
              v-for="skill in availableForNovice"
              :key="skill"
              :value="skill"
            >
              {{ skill }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Pathetic Skills (pick 3)</label>
          <div class="pathetic-checkboxes">
            <label
              v-for="skill in availableForPathetic"
              :key="skill"
              class="checkbox-item"
              :class="{ 'checkbox-item--disabled': customPathetics.length >= 3 && !customPathetics.includes(skill) }"
            >
              <input
                type="checkbox"
                :checked="customPathetics.includes(skill)"
                :disabled="customPathetics.length >= 3 && !customPathetics.includes(skill)"
                @change="onPatheticToggle(skill)"
              />
              <span>{{ skill }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="skill-background__grid">
      <h4>Skills</h4>
      <div
        v-for="(categorySkills, category) in PTU_SKILL_CATEGORIES"
        :key="category"
        class="skill-category"
      >
        <h5>{{ category }}</h5>
        <div class="skill-category__items">
          <div
            v-for="skill in categorySkills"
            :key="skill"
            class="skill-item"
            :class="`skill-item--${String(skills[skill]).toLowerCase()}`"
          >
            <span class="skill-item__name">{{ skill }}</span>
            <span class="skill-rank">{{ skills[skill] }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="warnings.length" class="skill-background__warnings">
      <div
        v-for="(w, i) in warnings"
        :key="i"
        class="warning-item"
        :class="`warning-item--${w.severity}`"
      >
        {{ w.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkillRank } from '~/types/character'
import type { PtuSkillName } from '~/constants/trainerSkills'
import { PTU_SKILL_CATEGORIES, PTU_ALL_SKILLS } from '~/constants/trainerSkills'
import { SAMPLE_BACKGROUNDS } from '~/constants/trainerBackgrounds'
import type { TrainerBackground } from '~/constants/trainerBackgrounds'
import type { CreationWarning } from '~/utils/characterCreationValidation'

interface Props {
  skills: Record<PtuSkillName, SkillRank>
  backgroundName: string
  isCustomBackground: boolean
  warnings: CreationWarning[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  applyBackground: [bg: TrainerBackground]
  clearBackground: []
  enableCustomBackground: []
  setSkillRank: [skill: PtuSkillName, rank: SkillRank]
  'update:backgroundName': [name: string]
}>()

// Determine selected dropdown value from current state
const selectedValue = computed(() => {
  if (props.isCustomBackground) return '__custom__'
  if (props.backgroundName) {
    const found = SAMPLE_BACKGROUNDS.find(bg => bg.name === props.backgroundName)
    if (found) return found.name
  }
  return ''
})

// Active background object (for preset mode)
const activeBackground = computed((): TrainerBackground | null => {
  if (props.isCustomBackground || !props.backgroundName) return null
  return SAMPLE_BACKGROUNDS.find(bg => bg.name === props.backgroundName) || null
})

// --- Custom Background Tracking ---
const customAdept = computed((): string => {
  if (!props.isCustomBackground) return ''
  const entry = Object.entries(props.skills).find(([_, rank]) => rank === 'Adept')
  return entry ? entry[0] : ''
})

const customNovice = computed((): string => {
  if (!props.isCustomBackground) return ''
  const entry = Object.entries(props.skills).find(([_, rank]) => rank === 'Novice')
  return entry ? entry[0] : ''
})

const customPathetics = computed((): string[] => {
  if (!props.isCustomBackground) return []
  return Object.entries(props.skills)
    .filter(([_, rank]) => rank === 'Pathetic')
    .map(([skill]) => skill)
})

// Available skills for each custom picker (exclude skills already used in other slots)
const availableForAdept = computed((): PtuSkillName[] =>
  PTU_ALL_SKILLS.filter(s =>
    s !== customNovice.value && !customPathetics.value.includes(s)
  )
)

const availableForNovice = computed((): PtuSkillName[] =>
  PTU_ALL_SKILLS.filter(s =>
    s !== customAdept.value && !customPathetics.value.includes(s)
  )
)

const availableForPathetic = computed((): PtuSkillName[] =>
  PTU_ALL_SKILLS.filter(s =>
    s !== customAdept.value && s !== customNovice.value
  )
)

// --- Event Handlers ---
function onBackgroundChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value === '__custom__') {
    emit('enableCustomBackground')
  } else if (value === '') {
    emit('clearBackground')
  } else {
    const bg = SAMPLE_BACKGROUNDS.find(b => b.name === value)
    if (bg) emit('applyBackground', bg)
  }
}

function onCustomAdeptChange(event: Event) {
  const skill = (event.target as HTMLSelectElement).value as PtuSkillName
  // Clear old adept
  if (customAdept.value) {
    emit('setSkillRank', customAdept.value as PtuSkillName, 'Untrained')
  }
  if (skill) {
    emit('setSkillRank', skill, 'Adept')
  }
}

function onCustomNoviceChange(event: Event) {
  const skill = (event.target as HTMLSelectElement).value as PtuSkillName
  // Clear old novice
  if (customNovice.value) {
    emit('setSkillRank', customNovice.value as PtuSkillName, 'Untrained')
  }
  if (skill) {
    emit('setSkillRank', skill, 'Novice')
  }
}

function onPatheticToggle(skill: PtuSkillName) {
  if (customPathetics.value.includes(skill)) {
    emit('setSkillRank', skill, 'Untrained')
  } else if (customPathetics.value.length < 3) {
    emit('setSkillRank', skill, 'Pathetic')
  }
}
</script>

<style lang="scss" scoped>
.skill-background {
  &__header {
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      padding-bottom: $spacing-sm;
      border-bottom: 1px solid $glass-border;
      font-size: $font-size-md;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 600;
    }
  }

  &__selector {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    .form-group {
      flex: 1;
    }
  }

  &__description {
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    padding: $spacing-md;
    margin-bottom: $spacing-md;

    p {
      margin: 0 0 $spacing-sm 0;
      color: $color-text-secondary;
      font-style: italic;
      font-size: $font-size-sm;
    }
  }

  &__summary {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__custom {
    margin-bottom: $spacing-md;
  }

  &__hint {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin: 0 0 $spacing-md 0;
  }

  &__grid {
    margin-top: $spacing-md;

    h4 {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-sm;
      color: $color-text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  &__warnings {
    margin-top: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.rank-tag {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;

  &--adept {
    background: rgba($color-info, 0.15);
    color: $color-info;
    border: 1px solid rgba($color-info, 0.3);
  }

  &--novice {
    background: rgba($color-text-muted, 0.15);
    color: $color-text-muted;
    border: 1px solid rgba($color-text-muted, 0.3);
  }

  &--pathetic {
    background: rgba($color-danger, 0.15);
    color: $color-danger;
    border: 1px solid rgba($color-danger, 0.3);
  }
}

.custom-picks {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  padding: $spacing-md;
}

.pathetic-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $spacing-xs;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $color-text;
  cursor: pointer;

  input[type="checkbox"] {
    accent-color: $color-danger;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.skill-category {
  margin-bottom: $spacing-md;

  h5 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    font-weight: 500;
  }

  &__items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: $spacing-xs;
  }
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;

  &__name {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &--untrained {
    opacity: 0.6;
  }

  &--pathetic {
    border-left: 3px solid $color-danger;
  }

  &--novice {
    border-left: 3px solid $color-text-muted;
  }

  &--adept {
    border-left: 3px solid $color-info;
  }

  &--expert {
    border-left: 3px solid $color-success;
  }

  &--master {
    border-left: 3px solid $color-warning;
  }
}

.skill-rank {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-xs;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  text-transform: capitalize;
}

// .warning-item — in _create-form-shared.scss
</style>
