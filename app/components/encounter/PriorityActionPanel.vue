<template>
  <div class="priority-panel">
    <div class="priority-panel__header">
      <PhLightning :size="20" weight="fill" />
      <span class="priority-panel__title">Priority Actions Available</span>
    </div>

    <div class="priority-panel__instruction">
      Between turns — declare Priority actions before proceeding.
    </div>

    <div
      v-for="combatant in eligibleCombatants"
      :key="combatant.id"
      class="priority-panel__combatant"
    >
      <div class="priority-panel__combatant-info">
        <span class="priority-panel__combatant-name">{{ getName(combatant) }}</span>
        <span class="priority-panel__combatant-init">Init {{ combatant.initiative }}</span>
      </div>

      <div class="priority-panel__buttons">
        <button
          class="btn btn--sm btn--primary"
          @click="declarePriority(combatant.id, 'standard')"
          :disabled="combatant.hasActed"
          :title="combatant.hasActed ? 'Cannot use Standard Priority after acting' : 'Full turn immediately'"
        >
          Priority (Full Turn)
        </button>
        <button
          class="btn btn--sm btn--secondary"
          @click="declarePriority(combatant.id, 'limited')"
          :disabled="combatant.hasActed"
          :title="combatant.hasActed ? 'Cannot use Limited Priority after acting' : 'Priority action only, rest at normal initiative'"
        >
          Limited
        </button>
        <button
          class="btn btn--sm btn--warning"
          @click="declarePriority(combatant.id, 'advanced')"
          :title="combatant.hasActed ? 'Can act, but forfeits next round turn' : 'Priority action only'"
        >
          Advanced
        </button>
      </div>
    </div>

    <div v-if="eligibleCombatants.length === 0" class="priority-panel__empty">
      No combatants eligible for Priority actions.
    </div>

    <button class="btn btn--sm btn--success priority-panel__proceed" @click="$emit('proceed')">
      <PhArrowRight :size="16" weight="bold" />
      No Priority — Continue
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhLightning, PhArrowRight } from '@phosphor-icons/vue'
import type { Combatant } from '~/types/encounter'

const props = defineProps<{
  combatants: Combatant[]
}>()

const emit = defineEmits<{
  priority: [combatantId: string, variant: 'standard' | 'limited' | 'advanced']
  proceed: []
}>()

/**
 * Eligible combatants: alive and haven't used Priority this round.
 * Standard/Limited require !hasActed, but Advanced can be used even if acted.
 * We show all non-Priority-used combatants and let the buttons handle the hasActed check.
 */
const eligibleCombatants = computed(() => {
  return props.combatants.filter(c => {
    // Must be alive
    if (c.entity.currentHp <= 0) return false
    // Must not have used Priority this round
    if (c.outOfTurnUsage?.priorityUsed) return false
    // Must not be holding an action (F2)
    if (c.holdAction?.isHolding) return false
    return true
  })
})

function getName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const entity = combatant.entity as { nickname?: string; species: string }
    return entity.nickname || entity.species
  }
  return (combatant.entity as { name: string }).name
}

function declarePriority(combatantId: string, variant: 'standard' | 'limited' | 'advanced') {
  emit('priority', combatantId, variant)
}
</script>

<style lang="scss" scoped>
.priority-panel {
  background: linear-gradient(135deg, rgba($color-primary, 0.12) 0%, rgba($color-primary, 0.04) 100%);
  border: 1px solid rgba($color-primary, 0.35);
  border-radius: $border-radius-md;
  padding: $spacing-md;
  animation: priority-slide-in 0.25s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  &__title {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__instruction {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-md;
    font-style: italic;
  }

  &__combatant {
    padding: $spacing-sm 0;
    border-bottom: 1px solid rgba($color-primary, 0.12);

    &:last-of-type {
      border-bottom: none;
    }
  }

  &__combatant-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__combatant-name {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__combatant-init {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__buttons {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__empty {
    font-size: $font-size-sm;
    color: $color-text-muted;
    padding: $spacing-sm 0;
    text-align: center;
  }

  &__proceed {
    margin-top: $spacing-md;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
  }
}

@keyframes priority-slide-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
