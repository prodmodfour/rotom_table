<template>
  <div class="levelup-summary">
    <h3>Level-Up Summary</h3>
    <p class="levelup-summary__subtitle">
      {{ characterName }}: Level {{ fromLevel }} -> Level {{ toLevel }}
    </p>

    <!-- Milestone Choices -->
    <div v-if="milestoneChoiceDetails.length" class="summary-section">
      <h4 class="summary-section__title">Milestones</h4>
      <div class="summary-section__list">
        <div
          v-for="ms in milestoneChoiceDetails"
          :key="ms.level"
          class="summary-item summary-item--changed"
        >
          <span class="summary-item__label">{{ ms.name }} (L{{ ms.level }})</span>
          <span class="summary-item__value">{{ ms.choiceLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Stat Changes -->
    <div class="summary-section">
      <h4 class="summary-section__title">Stats</h4>
      <div class="summary-section__list">
        <div
          v-for="stat in statChanges"
          :key="stat.key"
          class="summary-item"
          :class="{ 'summary-item--changed': stat.delta > 0 }"
        >
          <span class="summary-item__label">{{ stat.label }}</span>
          <span class="summary-item__value">
            {{ stat.oldValue }}
            <template v-if="stat.delta > 0">
              -> {{ stat.newValue }} <span class="summary-item__delta">(+{{ stat.delta }})</span>
            </template>
            <template v-else>
              <span class="summary-item__unchanged">(unchanged)</span>
            </template>
          </span>
        </div>
      </div>
      <div class="summary-maxhp">
        <span class="summary-maxhp__label">Max HP</span>
        <span class="summary-maxhp__value">
          {{ currentMaxHp }} -> {{ updatedMaxHp }}
        </span>
      </div>
    </div>

    <!-- Edges -->
    <div v-if="allEdgeDisplayItems.length" class="summary-section">
      <h4 class="summary-section__title">New Edges</h4>
      <div class="summary-section__tags">
        <span
          v-for="(edge, i) in allEdgeDisplayItems"
          :key="i"
          class="summary-tag"
          :class="{ 'summary-tag--skill': edge.isSkillEdge }"
        >
          {{ edge.label }}
        </span>
      </div>
    </div>

    <!-- Skill Rank-Ups (from all Skill Edges) -->
    <div v-if="skillRankUpDetails.length" class="summary-section">
      <h4 class="summary-section__title">Skill Rank-Ups (from Skill Edges)</h4>
      <div class="summary-section__list">
        <div
          v-for="(rankUp, i) in skillRankUpDetails"
          :key="i"
          class="summary-item summary-item--changed"
        >
          <span class="summary-item__label">{{ rankUp.skill }}</span>
          <span class="summary-item__value">
            {{ rankUp.from }} -> {{ rankUp.to }}
            <span class="summary-item__source">({{ rankUp.source }})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div v-if="featureChoices.length" class="summary-section">
      <h4 class="summary-section__title">New Features</h4>
      <div class="summary-section__tags">
        <span
          v-for="(feat, i) in featureChoices"
          :key="i"
          class="summary-tag summary-tag--feature"
        >
          {{ feat }}
        </span>
      </div>
    </div>

    <!-- Classes -->
    <div v-if="newClassChoices.length" class="summary-section">
      <h4 class="summary-section__title">New Classes</h4>
      <div class="summary-section__tags">
        <span
          v-for="cls in newClassChoices"
          :key="cls"
          class="summary-tag summary-tag--class"
        >
          {{ cls }}
        </span>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="warnings.length" class="summary-section summary-section--warnings">
      <h4 class="summary-section__title">Warnings</h4>
      <div class="summary-section__list">
        <div
          v-for="(warning, i) in warnings"
          :key="i"
          class="summary-item summary-item--warning"
        >
          <span class="summary-item__label">{{ warning }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Stats, SkillRank } from '~/types/character'
import type { StatPoints } from '~/composables/useCharacterCreation'
import type { TrainerAdvancementSummary } from '~/utils/trainerAdvancement'
import type { BonusSkillEdgeChoice } from '~/composables/useTrainerLevelUp'
import { STAT_DEFINITIONS, RANK_PROGRESSION } from '~/constants/trainerStats'

interface Props {
  /** Character name */
  characterName: string
  /** Level transition */
  fromLevel: number
  toLevel: number
  /** Stat allocations */
  statAllocations: StatPoints
  currentStats: Stats
  /** Current and updated maxHp */
  currentMaxHp: number
  updatedMaxHp: number
  /** Warnings about incomplete allocations */
  warnings: string[]
  /** Advancement summary */
  summary: TrainerAdvancementSummary | null
  /** P1: Edge choices */
  edgeChoices: string[]
  /** P1: Bonus Skill Edge choices */
  bonusSkillEdgeChoices: BonusSkillEdgeChoice[]
  /** P1: Regular Skill Edge skill names (parsed from edgeChoices) */
  regularSkillEdgeSkills: string[]
  /** P1: Feature choices */
  featureChoices: string[]
  /** P1: New class choices */
  newClassChoices: string[]
  /** P1: Milestone choices (level -> choiceId) */
  milestoneChoices: Record<number, string>
  /** P1: Character's current skills (for rank-up display) */
  currentSkills: Record<string, SkillRank>
}

const props = defineProps<Props>()

/** Compute stat change rows */
const statChanges = computed(() =>
  STAT_DEFINITIONS.map(stat => ({
    key: stat.key,
    label: stat.label,
    oldValue: props.currentStats[stat.key] ?? 0,
    newValue: (props.currentStats[stat.key] ?? 0) + props.statAllocations[stat.key],
    delta: props.statAllocations[stat.key]
  }))
)

/** Milestone choice details for display */
const milestoneChoiceDetails = computed(() => {
  if (!props.summary) return []
  return props.summary.milestones
    .filter(m => props.milestoneChoices[m.level])
    .map(m => {
      const choiceId = props.milestoneChoices[m.level]
      const choice = m.choices.find(c => c.id === choiceId)
      return {
        level: m.level,
        name: m.name,
        choiceLabel: choice?.label ?? choiceId
      }
    })
})

/** Combined edge display items (regular + bonus skill edges) */
const allEdgeDisplayItems = computed(() => {
  const items: Array<{ label: string; isSkillEdge: boolean }> = []
  for (const edge of props.edgeChoices) {
    items.push({ label: edge, isSkillEdge: edge.startsWith('Skill Edge:') })
  }
  for (const choice of props.bonusSkillEdgeChoices) {
    items.push({
      label: `Skill Edge: ${choice.skill} (Bonus L${choice.fromLevel})`,
      isSkillEdge: true
    })
  }
  return items
})

/**
 * Skill rank-up details from ALL Skill Edges (bonus + regular).
 * Properly handles stacking: if the same skill is raised multiple times,
 * each subsequent rank-up starts from where the previous one left off.
 */
const skillRankUpDetails = computed(() => {
  const details: Array<{ skill: string; from: string; to: string; source: string }> = []
  // Track running rank per skill so stacked rank-ups display correctly
  const runningRank: Record<string, string> = {}

  // Bonus Skill Edge rank-ups first
  for (const choice of props.bonusSkillEdgeChoices) {
    const currentRank = runningRank[choice.skill] ?? (props.currentSkills[choice.skill] ?? 'Untrained') as string
    const currentIndex = RANK_PROGRESSION.indexOf(currentRank)
    const newIndex = Math.min(currentIndex + 1, RANK_PROGRESSION.length - 1)
    const newRank = RANK_PROGRESSION[newIndex]
    details.push({
      skill: choice.skill,
      from: currentRank,
      to: newRank,
      source: `Bonus L${choice.fromLevel}`
    })
    runningRank[choice.skill] = newRank
  }

  // Regular Skill Edge rank-ups
  for (const skillName of props.regularSkillEdgeSkills) {
    const currentRank = runningRank[skillName] ?? (props.currentSkills[skillName] ?? 'Untrained') as string
    const currentIndex = RANK_PROGRESSION.indexOf(currentRank)
    const newIndex = Math.min(currentIndex + 1, RANK_PROGRESSION.length - 1)
    const newRank = RANK_PROGRESSION[newIndex]
    details.push({
      skill: skillName,
      from: currentRank,
      to: newRank,
      source: 'Regular Edge'
    })
    runningRank[skillName] = newRank
  }

  return details
})
</script>

<style lang="scss" scoped>
.levelup-summary {
  h3 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-md;
    color: $color-text;
    font-weight: 600;
  }

  &__subtitle {
    margin: 0 0 $spacing-lg 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

.summary-section {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__title {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &--warnings {
    border-color: rgba($color-warning, 0.3);
    background: rgba($color-warning, 0.05);
  }
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &--changed {
    background: rgba($color-success, 0.05);
  }

  &--warning {
    background: rgba($color-warning, 0.1);
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__value {
    font-size: $font-size-sm;
    color: $color-text;
    font-weight: 500;
  }

  &__delta {
    color: $color-success;
    font-weight: 600;
  }

  &__unchanged {
    color: $color-text-muted;
    font-style: italic;
  }

  &__source {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 400;
  }
}

.summary-tag {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  background: rgba($color-success, 0.1);
  border: 1px solid rgba($color-success, 0.3);
  color: $color-text;

  &--skill {
    background: rgba($color-warning, 0.1);
    border-color: rgba($color-warning, 0.3);
    color: $color-warning;
  }

  &--feature {
    background: rgba($color-accent-violet, 0.1);
    border-color: rgba($color-accent-violet, 0.3);
  }

  &--class {
    background: rgba($color-accent-violet, 0.15);
    border-color: rgba($color-accent-violet, 0.4);
    color: $color-accent-violet;
  }
}

.summary-maxhp {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $glass-border;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    font-weight: 600;
    text-transform: uppercase;
  }

  &__value {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-accent-teal;
  }
}
</style>
