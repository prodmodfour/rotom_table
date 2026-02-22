<template>
  <div class="biography-section">
    <button
      class="biography-section__header"
      type="button"
      @click="$emit('toggle')"
    >
      <h3>Biography</h3>
      <span class="biography-section__toggle" :class="{ 'biography-section__toggle--open': expanded }">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z" />
        </svg>
      </span>
    </button>

    <div v-if="expanded" class="biography-section__body">
      <div class="bio-row">
        <div class="form-group">
          <label>Age</label>
          <input
            :value="age"
            type="number"
            class="form-input"
            min="1"
            placeholder="Character age"
            @input="$emit('update:age', parseOptionalInt($event))"
          />
        </div>

        <div class="form-group">
          <label>Gender</label>
          <input
            :value="gender"
            type="text"
            class="form-input"
            placeholder="Any value (PTU allows any)"
            @input="$emit('update:gender', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="bio-row">
        <div class="form-group">
          <label>Height</label>
          <div class="bio-unit-input">
            <input
              :value="height"
              type="number"
              class="form-input"
              min="1"
              placeholder="Height"
              @input="$emit('update:height', parseOptionalInt($event))"
            />
            <span class="bio-unit-input__suffix">cm</span>
            <span v-if="height" class="bio-unit-input__converted">
              {{ cmToFeetInches(height) }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Weight</label>
          <div class="bio-unit-input">
            <input
              :value="weight"
              type="number"
              class="form-input"
              min="1"
              placeholder="Weight"
              @input="$emit('update:weight', parseOptionalInt($event))"
            />
            <span class="bio-unit-input__suffix">kg</span>
            <span v-if="weight" class="bio-unit-input__converted">
              {{ kgToLbs(weight) }} lbs
              <span class="bio-unit-input__weight-class">
                (WC {{ computeWeightClass(weight) }})
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Background Story</label>
        <textarea
          :value="backgroundStory"
          class="form-input"
          rows="3"
          placeholder="Character background and history..."
          @input="$emit('update:backgroundStory', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Personality</label>
        <textarea
          :value="personality"
          class="form-input"
          rows="2"
          placeholder="Character personality traits..."
          @input="$emit('update:personality', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Goals</label>
        <textarea
          :value="goals"
          class="form-input"
          rows="2"
          placeholder="Character goals and aspirations..."
          @input="$emit('update:goals', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div class="form-group">
        <label>
          Money
          <span class="bio-hint">(default 5,000 for level 1, PTU p. 17)</span>
        </label>
        <div class="bio-unit-input">
          <input
            :value="money"
            type="number"
            class="form-input"
            min="0"
            @input="$emit('update:money', parseIntOrDefault($event, defaultMoney))"
          />
          <span class="bio-unit-input__suffix">P</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  expanded: boolean
  age: number | null
  gender: string
  height: number | null
  weight: number | null
  backgroundStory: string
  personality: string
  goals: string
  money: number
  defaultMoney: number
}

defineProps<Props>()

defineEmits<{
  toggle: []
  'update:age': [value: number | null]
  'update:gender': [value: string]
  'update:height': [value: number | null]
  'update:weight': [value: number | null]
  'update:backgroundStory': [value: string]
  'update:personality': [value: string]
  'update:goals': [value: string]
  'update:money': [value: number]
}>()

/** Parse an input event to an optional integer (null if empty) */
function parseOptionalInt(event: Event): number | null {
  const value = (event.target as HTMLInputElement).value
  if (!value) return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

/** Parse an input event to an integer, falling back to a default */
function parseIntOrDefault(event: Event, defaultValue: number): number {
  const value = (event.target as HTMLInputElement).value
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/** Convert cm to feet/inches display string */
function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  if (inches === 12) {
    return `${feet + 1}'0"`
  }
  return `${feet}'${inches}"`
}

/** Convert kg to lbs display string */
function kgToLbs(kg: number): string {
  return (kg * 2.20462).toFixed(1)
}

/**
 * Compute PTU weight class from kg.
 * PTU weight classes (from Pokedex entries):
 * WC 1: 0-10 kg, WC 2: 10-25 kg, WC 3: 25-50 kg,
 * WC 4: 50-100 kg, WC 5: 100-200 kg, WC 6: 200+ kg
 */
function computeWeightClass(kg: number): number {
  if (kg <= 10) return 1
  if (kg <= 25) return 2
  if (kg <= 50) return 3
  if (kg <= 100) return 4
  if (kg <= 200) return 5
  return 6
}
</script>

<style lang="scss" scoped>
.biography-section {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: $spacing-md;
    color: $color-text;

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
      flex: 1;
      text-align: left;
    }

    &:hover {
      .biography-section__toggle {
        color: $color-accent-teal;
      }
    }
  }

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: $color-text-secondary;
    transition: transform $transition-fast, color $transition-fast;
    transform: rotate(-90deg);
    flex-shrink: 0;
    margin-left: $spacing-sm;

    &--open {
      transform: rotate(0deg);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }
}

.bio-row {
  display: flex;
  gap: $spacing-md;

  .form-group {
    flex: 1;
  }
}

.bio-unit-input {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .form-input {
    flex: 1;
  }

  &__suffix {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    font-weight: 600;
    min-width: 24px;
  }

  &__converted {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    white-space: nowrap;
  }

  &__weight-class {
    color: $color-accent-teal;
    font-weight: 600;
  }
}

.bio-hint {
  font-weight: 400;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  font-style: italic;
}
</style>
