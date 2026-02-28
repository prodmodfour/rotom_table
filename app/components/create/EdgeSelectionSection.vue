<template>
  <div class="edge-selection">
    <div class="edge-selection__header">
      <h3>Edges</h3>
      <span
        class="counter"
        :class="{ 'counter--full': edges.length >= startingEdges }"
      >
        {{ edges.length }} / {{ startingEdges }}
      </span>
    </div>

    <!-- Edge Name Input -->
    <div class="edge-input">
      <input
        v-model="newEdge"
        type="text"
        class="form-input"
        :class="{ 'form-input--error': edgeError }"
        placeholder="Enter edge name..."
        @keydown.enter.prevent="onAddEdge"
        @input="edgeError = ''"
      />
      <button
        class="btn btn--primary btn--sm"
        :disabled="!newEdge.trim()"
        @click="onAddEdge"
      >
        Add Edge
      </button>
    </div>
    <p v-if="edgeError" class="edge-error">{{ edgeError }}</p>

    <!-- Skill Edge Shortcut -->
    <div class="skill-edge-shortcut">
      <button
        class="btn btn--secondary btn--sm"
        :class="{ 'btn--active': showSkillEdgeDropdown }"
        @click="showSkillEdgeDropdown = !showSkillEdgeDropdown"
      >
        Add Skill Edge
      </button>

      <div v-if="showSkillEdgeDropdown" class="skill-edge-dropdown">
        <p class="skill-edge-dropdown__hint">
          Skill Edges raise a skill rank by one step. Cannot raise Pathetic skills or exceed Novice at level 1.
        </p>
        <div class="skill-edge-dropdown__grid">
          <div
            v-for="(categorySkills, category) in PTU_SKILL_CATEGORIES"
            :key="category"
            class="skill-edge-category"
          >
            <h5>{{ category }}</h5>
            <div class="skill-edge-category__items">
              <button
                v-for="skill in categorySkills"
                :key="skill"
                class="skill-edge-btn"
                :class="{
                  'skill-edge-btn--pathetic': skills[skill] === 'Pathetic',
                  'skill-edge-btn--capped': isSkillCapped(skill)
                }"
                :disabled="skills[skill] === 'Pathetic' || isSkillCapped(skill)"
                :title="getSkillEdgeTooltip(skill)"
                @click="onAddSkillEdge(skill)"
              >
                <span class="skill-edge-btn__name">{{ skill }}</span>
                <span class="skill-edge-btn__rank">{{ skills[skill] }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Edges Tags -->
    <div v-if="edges.length" class="selected-tags">
      <span
        v-for="(edge, i) in edges"
        :key="i"
        class="tag tag--edge"
        :class="{ 'tag--skill-edge': edge.startsWith('Skill Edge:') }"
      >
        {{ edge }}
        <button class="tag__remove" @click="$emit('removeEdge', i)">&times;</button>
      </span>
    </div>

    <div v-if="filteredWarnings.length" class="edge-selection__warnings">
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
import type { SkillRank } from '~/types/character'
import type { PtuSkillName } from '~/constants/trainerSkills'
import { PTU_SKILL_CATEGORIES } from '~/constants/trainerSkills'
import type { CreationWarning } from '~/utils/characterCreationValidation'

interface Props {
  edges: string[]
  skills: Record<PtuSkillName, SkillRank>
  startingEdges: number
  level: number
  warnings: CreationWarning[]
  /** Validation function for adding edges. Returns error string if blocked, null on success. */
  addEdgeFn?: (edgeName: string) => string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addEdge: [edgeName: string]
  removeEdge: [index: number]
  addSkillEdge: [skill: PtuSkillName]
}>()

// --- Local State ---
const newEdge = ref('')
const showSkillEdgeDropdown = ref(false)
const edgeError = ref('')

// --- Computed ---
const filteredWarnings = computed((): CreationWarning[] =>
  props.warnings.filter(w => w.section === 'edges')
)

// --- Methods ---
function onAddEdge(): void {
  if (!newEdge.value.trim()) return
  edgeError.value = ''

  // If a validation function is provided, check it before emitting
  if (props.addEdgeFn) {
    const error = props.addEdgeFn(newEdge.value.trim())
    if (error) {
      edgeError.value = error
      return
    }
  } else {
    emit('addEdge', newEdge.value.trim())
  }

  newEdge.value = ''
}

function isSkillCapped(skill: PtuSkillName): boolean {
  const rank = props.skills[skill]
  if (rank === 'Master') return true
  // At level 1, cannot raise above Novice via Skill Edges
  if (props.level === 1) {
    const highRanks: SkillRank[] = ['Novice', 'Adept', 'Expert', 'Master']
    return highRanks.includes(rank)
  }
  return false
}

function getSkillEdgeTooltip(skill: PtuSkillName): string {
  const rank = props.skills[skill]
  if (rank === 'Pathetic') return 'Cannot raise Pathetic skills with Skill Edges'
  if (rank === 'Master') return 'Already at Master rank'
  if (props.level === 1 && ['Novice', 'Adept', 'Expert'].includes(rank)) {
    return 'Cannot raise above Novice at level 1'
  }
  const progression: Record<string, string> = {
    'Untrained': 'Novice',
    'Novice': 'Adept',
    'Adept': 'Expert',
    'Expert': 'Master'
  }
  return `Raise ${skill} from ${rank} to ${progression[rank] || 'next rank'}`
}

function onAddSkillEdge(skill: PtuSkillName): void {
  emit('addSkillEdge', skill)
  // Note: the parent composable's addSkillEdge returns an error string or null.
  // Since we use emits, the parent will handle validation. We show a brief
  // feedback via the dropdown remaining open so the user sees the rank change.
}
</script>

<style lang="scss" scoped>
.edge-selection {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
      flex: 1;
    }
  }

  &__warnings {
    margin-top: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

// .counter base + --full — in _create-form-shared.scss
.counter {
  margin-left: $spacing-md;
  flex-shrink: 0;
}

.edge-input {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;

  .form-input {
    flex: 1;

    &--error {
      border-color: $color-danger;
    }
  }
}

.edge-error {
  font-size: $font-size-xs;
  color: $color-danger;
  margin: 0 0 $spacing-sm 0;
}

.skill-edge-shortcut {
  margin-bottom: $spacing-md;

  .btn--active {
    background: rgba($color-warning, 0.15);
    border-color: rgba($color-warning, 0.4);
    color: $color-warning;
  }
}

.skill-edge-dropdown {
  margin-top: $spacing-sm;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid rgba($color-warning, 0.3);
  border-radius: $border-radius-sm;

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin: 0 0 $spacing-sm 0;
    font-style: italic;
  }

  &__grid {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.skill-edge-category {
  h5 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  &__items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: $spacing-xs;
  }
}

.skill-edge-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  font-size: $font-size-sm;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    border-color: $color-warning;
    background: rgba($color-warning, 0.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &--pathetic {
    border-left: 3px solid $color-danger;
  }

  &--capped {
    opacity: 0.4;
  }

  &__name {
    font-weight: 500;
  }

  &__rank {
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
    text-transform: capitalize;
  }
}

// .selected-tags, .tag base, .tag__remove — in _create-form-shared.scss

.tag {
  &--edge {
    background: rgba($color-warning, 0.15);
    border: 1px solid rgba($color-warning, 0.3);
    color: $color-warning;
  }

  &--skill-edge {
    background: rgba($color-warning, 0.2);
    border-color: rgba($color-warning, 0.4);
  }
}

// .warning-item — in _create-form-shared.scss
</style>
