<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal modal--levelup">
      <div class="modal__header">
        <div class="modal__header-text">
          <h2>Level Up: {{ character.name }}</h2>
          <span class="level-badge">Level {{ character.level }} -> {{ targetLevel }}</span>
        </div>
        <div class="modal__header-right">
          <span class="step-indicator">
            {{ currentStepLabel }} ({{ currentStepIndex + 1 }}/{{ steps.length }})
          </span>
          <button class="modal__close" @click="$emit('cancel')">x</button>
        </div>
      </div>

      <div class="modal__body">
        <!-- Advancement Summary Banner -->
        <div v-if="summary" class="advancement-banner">
          <div class="advancement-banner__item">
            <span class="advancement-banner__label">Stat Points</span>
            <span class="advancement-banner__value">+{{ levelUp.statPointsTotal.value }}</span>
          </div>
          <div v-if="levelUp.regularEdgesTotal.value > 0 || levelUp.bonusSkillEdgeEntries.value.length > 0" class="advancement-banner__item">
            <span class="advancement-banner__label">Edges</span>
            <span class="advancement-banner__value">+{{ levelUp.regularEdgesTotal.value + levelUp.bonusSkillEdgeEntries.value.length }}</span>
          </div>
          <div v-if="levelUp.featuresTotal.value > 0" class="advancement-banner__item">
            <span class="advancement-banner__label">Features</span>
            <span class="advancement-banner__value">+{{ levelUp.featuresTotal.value }}</span>
          </div>
          <div v-if="summary.milestones.length > 0" class="advancement-banner__item">
            <span class="advancement-banner__label">Milestones</span>
            <span class="advancement-banner__value">{{ summary.milestones.length }}</span>
          </div>
        </div>

        <!-- Step Content -->
        <LevelUpMilestoneSection
          v-if="currentStep === 'milestones'"
          :milestones="summary?.milestones ?? []"
          :milestone-choices="levelUp.milestoneChoices.value"
          @set-milestone-choice="levelUp.setMilestoneChoice"
        />

        <LevelUpStatSection
          v-if="currentStep === 'stats'"
          :current-stats="character.stats"
          :allocations="levelUp.statAllocations"
          :total-points="levelUp.statPointsTotal.value"
          :points-remaining="levelUp.statPointsRemaining.value"
          :new-level="targetLevel"
          :current-max-hp="levelUp.currentMaxHp.value"
          :updated-max-hp="levelUp.updatedMaxHp.value"
          @increment-stat="levelUp.incrementStat"
          @decrement-stat="levelUp.decrementStat"
        />

        <LevelUpSkillSection
          v-if="currentStep === 'skills'"
          :current-skills="character.skills"
          :skill-choices="[]"
          :total-ranks="0"
          :ranks-remaining="0"
          :target-level="targetLevel"
          :caps-unlocked="summary?.skillRankCapsUnlocked ?? []"
          :get-effective-skill-rank="levelUp.getEffectiveSkillRank"
          :can-rank-up-skill="() => false"
        />

        <LevelUpEdgeSection
          v-if="currentStep === 'edges'"
          :effective-skills="levelUp.effectiveSkills.value"
          :regular-edges-total="levelUp.regularEdgesTotal.value"
          :bonus-skill-edges="levelUp.bonusSkillEdgeEntries.value"
          :edge-choices="levelUp.edgeChoices.value"
          :bonus-skill-edge-choices="levelUp.bonusSkillEdgeChoices.value"
          :target-level="targetLevel"
          @add-edge="levelUp.addEdge"
          @remove-edge="levelUp.removeEdge"
          @add-bonus-skill-edge="levelUp.addBonusSkillEdge"
          @remove-bonus-skill-edge="levelUp.removeBonusSkillEdge"
        />

        <LevelUpFeatureSection
          v-if="currentStep === 'features'"
          :current-features="character.features"
          :feature-choices="levelUp.featureChoices.value"
          :total-features="levelUp.featuresTotal.value"
          :trainer-classes="[...character.trainerClasses, ...levelUp.newClassChoices.value]"
          @add-feature="levelUp.addFeature"
          @remove-feature="levelUp.removeFeature"
        />

        <LevelUpClassSection
          v-if="currentStep === 'classes'"
          :current-classes="character.trainerClasses"
          :max-classes="MAX_TRAINER_CLASSES"
          :class-choice-levels="levelUp.classChoiceLevels.value"
          :new-class-choices="levelUp.newClassChoices.value"
          @add-class="levelUp.addClass"
          @remove-class="levelUp.removeClass"
        />

        <LevelUpSummary
          v-if="currentStep === 'summary'"
          :character-name="character.name"
          :from-level="character.level"
          :to-level="targetLevel"
          :stat-allocations="levelUp.statAllocations"
          :current-stats="character.stats"
          :current-max-hp="levelUp.currentMaxHp.value"
          :updated-max-hp="levelUp.updatedMaxHp.value"
          :warnings="levelUp.warnings.value"
          :summary="summary"
          :edge-choices="levelUp.edgeChoices.value"
          :bonus-skill-edge-choices="levelUp.bonusSkillEdgeChoices.value"
          :regular-skill-edge-skills="levelUp.regularSkillEdgeSkills.value"
          :feature-choices="levelUp.featureChoices.value"
          :new-class-choices="levelUp.newClassChoices.value"
          :milestone-choices="levelUp.milestoneChoices.value"
          :current-skills="character.skills"
        />
      </div>

      <div class="modal__footer">
        <button
          v-if="hasPreviousStep"
          class="btn btn--secondary"
          @click="previousStep"
        >
          Back
        </button>
        <div class="modal__footer-spacer"></div>
        <button
          class="btn btn--secondary"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          v-if="hasNextStep"
          class="btn btn--primary"
          @click="nextStep"
        >
          Next
        </button>
        <button
          v-if="currentStep === 'summary'"
          class="btn btn--primary"
          @click="applyLevelUp"
        >
          Apply Level Up
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HumanCharacter } from '~/types/character'
import type { TrainerAdvancementSummary } from '~/utils/trainerAdvancement'
import { MAX_TRAINER_CLASSES } from '~/constants/trainerClasses'

interface Props {
  /** The character being leveled up (current state) */
  character: HumanCharacter
  /** Target level to advance to */
  targetLevel: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Emitted when the GM confirms all choices. Payload is the updated character fields. */
  complete: [updatedData: Partial<HumanCharacter>]
  /** Emitted when the GM cancels the level-up */
  cancel: []
}>()

// --- Composable ---
const levelUp = useTrainerLevelUp()

// Initialize on mount
onMounted(() => {
  levelUp.initialize(props.character, props.targetLevel)
})

// Cleanup on unmount
onUnmounted(() => {
  levelUp.reset()
})

// --- Advancement Summary ---
const summary = computed((): TrainerAdvancementSummary | null => levelUp.summary.value)

// --- Step Navigation ---
// Order: milestones (if any) -> stats -> skills -> edges (if any) -> features (if any) -> classes (if any) -> summary
// Milestones first because they affect edge/feature/stat counts.
const steps = computed((): string[] => {
  const s: string[] = []

  // Milestones first (they affect edge/feature counts)
  if (summary.value && summary.value.milestones.length > 0) {
    s.push('milestones')
  }

  // Stats (always present)
  s.push('stats')

  // Skills (always present -- read-only overview of caps per decree-037)
  s.push('skills')

  // Edges (if base edges, bonus Skill Edges, or milestone bonus edges)
  if (levelUp.regularEdgesTotal.value > 0 || levelUp.bonusSkillEdgeEntries.value.length > 0) {
    s.push('edges')
  }

  // Features (if base features or milestone bonus features)
  if (levelUp.featuresTotal.value > 0) {
    s.push('features')
  }

  // Class choice (if levels 5 or 10 crossed)
  if (summary.value && summary.value.classChoicePrompts.length > 0) {
    s.push('classes')
  }

  // Summary always last
  s.push('summary')

  return s
})

/** Human-readable step label for the header indicator */
const STEP_LABELS: Record<string, string> = {
  milestones: 'Milestones',
  stats: 'Stats',
  skills: 'Skills',
  edges: 'Edges',
  features: 'Features',
  classes: 'Classes',
  summary: 'Summary'
}

const currentStepIndex = ref(0)

// Guard: clamp index if step list shrinks (e.g., milestone choice changes)
watch(steps, (newSteps) => {
  if (currentStepIndex.value >= newSteps.length) {
    currentStepIndex.value = Math.max(0, newSteps.length - 1)
  }
})

const currentStep = computed(() => steps.value[currentStepIndex.value] ?? 'stats')

const currentStepLabel = computed(() => STEP_LABELS[currentStep.value] ?? currentStep.value)

const hasPreviousStep = computed(() => currentStepIndex.value > 0)
const hasNextStep = computed(() => currentStepIndex.value < steps.value.length - 1)

function nextStep(): void {
  if (hasNextStep.value) {
    currentStepIndex.value++
  }
}

function previousStep(): void {
  if (hasPreviousStep.value) {
    currentStepIndex.value--
  }
}

// --- Apply ---
function applyLevelUp(): void {
  const payload = levelUp.buildUpdatePayload()
  emit('complete', payload)
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  @include modal-overlay-enhanced;
}

.modal {
  @include modal-container-enhanced;

  &--levelup {
    max-width: 700px;
    max-height: 85vh;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;
    background: linear-gradient(135deg, rgba($color-accent-teal, 0.1) 0%, transparent 100%);
  }

  &__header-text {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    h2 {
      margin: 0;
      font-size: $font-size-lg;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: $font-size-lg;
    cursor: pointer;
    padding: $spacing-xs;
    line-height: 1;
    border-radius: $border-radius-sm;
    transition: all $transition-fast;

    &:hover {
      color: $color-text;
      background: $color-bg-hover;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $glass-border;
    background: rgba($color-bg-primary, 0.5);
  }

  &__footer-spacer {
    flex: 1;
  }
}

.level-badge {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-accent-teal;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-accent-teal, 0.1);
  border: 1px solid rgba($color-accent-teal, 0.3);
  border-radius: $border-radius-sm;
}

.step-indicator {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
}

.advancement-banner {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-xs;
  }

  &__value {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-success;
  }
}

// Shared button styles
.btn {
  padding: $spacing-sm $spacing-lg;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition-fast;

  &--primary {
    background: $gradient-sv-cool;
    color: $color-text;
    border-color: transparent;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }

  &--secondary {
    background: $color-bg-tertiary;
    color: $color-text-secondary;
    border-color: $border-color-default;

    &:hover {
      background: $color-bg-hover;
      color: $color-text;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
