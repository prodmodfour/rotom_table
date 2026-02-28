<template>
  <div class="class-feature">
    <div class="class-feature__header">
      <h3>Classes &amp; Features</h3>
    </div>

    <!-- Trainer Class Selection -->
    <div class="class-feature__classes">
      <div class="section-subheader">
        <h4>Trainer Classes</h4>
        <span
          class="counter"
          :class="{ 'counter--full': trainerClasses.length >= maxClasses }"
        >
          {{ trainerClasses.length }} / {{ maxClasses }}
        </span>
      </div>

      <div class="class-picker">
        <div class="class-picker__search">
          <input
            v-model="classSearch"
            type="text"
            class="form-input"
            placeholder="Search classes..."
          />
        </div>

        <div class="class-picker__groups">
          <div
            v-for="category in visibleCategories"
            :key="category"
            class="class-group"
          >
            <h5 class="class-group__label">{{ category }}</h5>
            <div class="class-group__items">
              <button
                v-for="cls in filteredClassesByCategory(category)"
                :key="cls.name"
                class="class-option"
                :class="{
                  'class-option--selected': isClassSelected(cls.name),
                  'class-option--disabled': isClassDisabled(cls)
                }"
                :disabled="isClassDisabled(cls)"
                :title="cls.description"
                @click="toggleClass(cls)"
              >
                <span class="class-option__name">{{ cls.name }}</span>
                <span v-if="cls.isBranching" class="class-option__branching" title="Can be taken with different specializations">[Branch]</span>
                <span v-if="cls.associatedSkills.length" class="class-option__skills">
                  {{ cls.associatedSkills.join(', ') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Classes Tags -->
      <div v-if="trainerClasses.length" class="selected-tags">
        <span
          v-for="cls in trainerClasses"
          :key="cls"
          class="tag tag--class"
        >
          {{ cls }}
          <button class="tag__remove" @click="$emit('removeClass', cls)">&times;</button>
        </span>
      </div>

      <!-- Branching Specialization Picker -->
      <div v-if="pendingBranching" class="class-feature__branching-prompt">
        <label>{{ pendingBranching.name }} Specialization:</label>
        <div class="branching-input">
          <select
            v-model="branchingSpec"
            class="form-select"
          >
            <option value="" disabled>Select specialization...</option>
            <option
              v-for="spec in availableSpecializations"
              :key="spec"
              :value="spec"
            >
              {{ spec }}
            </option>
          </select>
          <button class="btn btn--primary btn--sm" :disabled="!branchingSpec" @click="confirmBranching">
            Confirm
          </button>
          <button class="btn btn--secondary btn--sm" @click="cancelBranching">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Feature Selection -->
    <div class="class-feature__features">
      <div class="section-subheader">
        <h4>Features</h4>
        <span
          class="counter"
          :class="{ 'counter--full': features.length >= expectedFeatures }"
        >
          {{ features.length }} / {{ expectedFeatures }} (+1 Training)
        </span>
      </div>

      <div class="feature-input">
        <input
          v-model="newFeature"
          type="text"
          class="form-input"
          placeholder="Enter feature name..."
          @keydown.enter.prevent="onAddFeature"
        />
        <button
          class="btn btn--primary btn--sm"
          :disabled="!newFeature.trim()"
          @click="onAddFeature"
        >
          Add
        </button>
      </div>

      <div v-if="features.length" class="selected-tags">
        <span
          v-for="(feat, i) in features"
          :key="i"
          class="tag tag--feature"
        >
          {{ feat }}
          <button class="tag__remove" @click="$emit('removeFeature', i)">&times;</button>
        </span>
      </div>

      <!-- Training Feature (free slot) -->
      <div class="training-feature">
        <label class="training-feature__label">
          Training Feature
          <span class="training-feature__hint">(free, no prerequisites)</span>
        </label>
        <input
          :value="trainingFeature"
          type="text"
          class="form-input"
          placeholder="Enter training feature name..."
          @input="$emit('update:trainingFeature', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div v-if="warnings.length" class="class-feature__warnings">
      <div
        v-for="(w, i) in filteredWarnings"
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
import type { TrainerClassDef, TrainerClassCategory } from '~/constants/trainerClasses'
import {
  TRAINER_CLASSES,
  TRAINER_CLASS_CATEGORIES,
  getBranchingSpecializations,
  hasBaseClass,
  getSpecialization
} from '~/constants/trainerClasses'
import type { CreationWarning } from '~/utils/characterCreationValidation'

interface Props {
  trainerClasses: string[]
  features: string[]
  trainingFeature: string
  maxClasses: number
  expectedFeatures: number
  warnings: CreationWarning[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addClass: [className: string]
  removeClass: [className: string]
  addFeature: [featureName: string]
  removeFeature: [index: number]
  'update:trainingFeature': [value: string]
}>()

// --- Local State ---
const classSearch = ref('')
const newFeature = ref('')
const pendingBranching = ref<TrainerClassDef | null>(null)
const branchingSpec = ref('')

// --- Computed ---
const normalizedSearch = computed(() => classSearch.value.toLowerCase().trim())

const filteredClasses = computed((): TrainerClassDef[] => {
  if (!normalizedSearch.value) return TRAINER_CLASSES
  return TRAINER_CLASSES.filter(cls =>
    cls.name.toLowerCase().includes(normalizedSearch.value) ||
    cls.category.toLowerCase().includes(normalizedSearch.value) ||
    cls.description.toLowerCase().includes(normalizedSearch.value) ||
    cls.associatedSkills.some(s => s.toLowerCase().includes(normalizedSearch.value))
  )
})

const visibleCategories = computed((): TrainerClassCategory[] =>
  TRAINER_CLASS_CATEGORIES.filter(cat =>
    filteredClasses.value.some(cls => cls.category === cat)
  )
)

const filteredWarnings = computed((): CreationWarning[] =>
  props.warnings.filter(w => w.section === 'classes' || w.section === 'features')
)

// --- Methods ---
function filteredClassesByCategory(category: TrainerClassCategory): TrainerClassDef[] {
  return filteredClasses.value.filter(cls => cls.category === category)
}

/** Check if a non-branching class is selected, or if a branching class has at least one instance */
function isClassSelected(className: string): boolean {
  return props.trainerClasses.some(c => hasBaseClass(c, className))
}

/**
 * Determine if a class button should be disabled.
 * - Non-branching: disabled when already selected (toggle off is allowed), or not selected and at max slots
 * - Branching: disabled when all specializations taken, OR at max slots (can't add another instance)
 */
function isClassDisabled(cls: TrainerClassDef): boolean {
  const atMaxSlots = props.trainerClasses.length >= props.maxClasses
  if (isClassSelected(cls.name)) {
    // Already selected -- for branching, disabled if all specializations taken OR at max slots
    if (cls.isBranching) {
      return isFullySpecialized(cls.name) || atMaxSlots
    }
    // Non-branching: allow toggle-off (not disabled)
    return false
  }
  // Not selected -- disabled if at max class slots
  return atMaxSlots
}

/**
 * Get already-taken specializations for a branching class.
 */
function takenSpecializations(className: string): string[] {
  return props.trainerClasses
    .filter(c => hasBaseClass(c, className))
    .map(c => getSpecialization(c))
    .filter((s): s is string => s !== null)
}

/**
 * Available specializations for the currently pending branching class,
 * excluding already-taken specializations.
 */
const availableSpecializations = computed((): readonly string[] => {
  if (!pendingBranching.value) return []
  const allSpecs = getBranchingSpecializations(pendingBranching.value.name)
  const taken = new Set(takenSpecializations(pendingBranching.value.name))
  return allSpecs.filter(s => !taken.has(s))
})

/**
 * Check if a branching class has used all available specializations.
 */
function isFullySpecialized(className: string): boolean {
  const allSpecs = getBranchingSpecializations(className)
  if (allSpecs.length === 0) return false
  const taken = takenSpecializations(className)
  return taken.length >= allSpecs.length
}

function toggleClass(cls: TrainerClassDef): void {
  if (cls.isBranching) {
    if (isClassSelected(cls.name) && !isFullySpecialized(cls.name)) {
      // Already has one instance but more specializations available -- open picker for another
      pendingBranching.value = cls
      branchingSpec.value = ''
    } else if (isFullySpecialized(cls.name)) {
      // All specializations taken -- remove the last one added
      const toRemove = [...props.trainerClasses].reverse().find(c => hasBaseClass(c, cls.name))
      if (toRemove) emit('removeClass', toRemove)
    } else {
      // No instances yet -- open picker
      pendingBranching.value = cls
      branchingSpec.value = ''
    }
  } else {
    // Non-branching: simple toggle
    if (isClassSelected(cls.name)) {
      emit('removeClass', cls.name)
    } else {
      emit('addClass', cls.name)
    }
  }
}

function confirmBranching(): void {
  if (!pendingBranching.value || !branchingSpec.value) return
  emit('addClass', `${pendingBranching.value.name}: ${branchingSpec.value}`)
  pendingBranching.value = null
  branchingSpec.value = ''
}

function cancelBranching(): void {
  pendingBranching.value = null
  branchingSpec.value = ''
}

function onAddFeature(): void {
  if (!newFeature.value.trim()) return
  emit('addFeature', newFeature.value.trim())
  newFeature.value = ''
}
</script>

<style lang="scss" scoped>
.class-feature {
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

  &__classes {
    margin-bottom: $spacing-xl;
  }

  &__features {
    margin-bottom: $spacing-md;
  }

  &__branching-prompt {
    margin-top: $spacing-md;
    padding: $spacing-md;
    background: $color-bg-tertiary;
    border: 1px solid rgba($color-accent-violet, 0.3);
    border-radius: $border-radius-sm;

    label {
      display: block;
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-accent-violet;
      margin-bottom: $spacing-sm;
    }
  }

  &__warnings {
    margin-top: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.section-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;

  h4 {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// .counter — base styles in _create-form-shared.scss

.class-picker {
  margin-bottom: $spacing-md;

  &__search {
    margin-bottom: $spacing-sm;
  }

  &__groups {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    background: $color-bg-tertiary;
    padding: $spacing-sm;
  }
}

.class-group {
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }

  &__label {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  &__items {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }
}

.class-option {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  font-size: $font-size-sm;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    border-color: $color-accent-violet;
    background: rgba($color-accent-violet, 0.1);
  }

  &--selected {
    background: rgba($color-accent-violet, 0.15);
    border-color: rgba($color-accent-violet, 0.4);
    color: $color-accent-violet;
  }

  &--disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &__name {
    font-weight: 500;
  }

  &__branching {
    color: $color-warning;
    font-weight: 700;
  }

  &__skills {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    font-style: italic;
  }
}

.branching-input {
  display: flex;
  gap: $spacing-sm;
  align-items: center;

  .form-select {
    flex: 1;
  }
}

.feature-input {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;

  .form-input {
    flex: 1;
  }
}

.training-feature {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  border-left: 3px solid $color-accent-teal;

  &__label {
    display: block;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-accent-teal;
    margin-bottom: $spacing-sm;
  }

  &__hint {
    font-weight: 400;
    color: $color-text-secondary;
    font-style: italic;
  }
}

// .selected-tags, .tag base, .tag__remove — in _create-form-shared.scss
// .tag--class, .tag--feature — in _tags.scss
// .warning-item — in _create-form-shared.scss
</style>
