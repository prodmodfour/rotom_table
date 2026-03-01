<template>
  <div v-if="pendingAoOs.length > 0" class="aoo-prompt" data-testid="aoo-prompt">
    <div class="aoo-prompt__header">
      <img src="/icons/phosphor/warning-circle.svg" alt="" class="aoo-prompt__header-icon" />
      <span class="aoo-prompt__header-title">Attack of Opportunity</span>
      <span class="aoo-prompt__header-count" v-if="pendingAoOs.length > 1">
        {{ pendingAoOs.length }} pending
      </span>
    </div>

    <div
      v-for="action in pendingAoOs"
      :key="action.id"
      class="aoo-prompt__action"
    >
      <div class="aoo-prompt__trigger">
        <span class="aoo-prompt__trigger-desc">{{ action.triggerDescription }}</span>
      </div>

      <div class="aoo-prompt__reactor">
        <div class="aoo-prompt__reactor-info">
          <span class="aoo-prompt__reactor-name">{{ getReactorName(action) }}</span>
          <span class="aoo-prompt__reactor-hp" :class="getHpClass(action)">
            {{ getReactorHp(action) }}
          </span>
        </div>
        <div class="aoo-prompt__reactor-note">
          {{ getStruggleAttackLabel(action) }}
        </div>
      </div>

      <div class="aoo-prompt__damage" v-if="!resolvingAction || resolvingAction !== action.id">
        <div class="aoo-prompt__buttons">
          <button
            class="btn btn--sm btn--success"
            @click="startResolve(action.id)"
          >
            <img src="/icons/phosphor/sword.svg" alt="" class="btn-icon" />
            Accept AoO
          </button>
          <button
            class="btn btn--sm btn--secondary"
            @click="declineAoO(action.id)"
          >
            <img src="/icons/phosphor/x.svg" alt="" class="btn-icon" />
            Decline
          </button>
        </div>
      </div>

      <div class="aoo-prompt__resolve" v-if="resolvingAction === action.id">
        <label class="aoo-prompt__resolve-label">
          Damage dealt:
          <input
            v-model.number="damageInput"
            type="number"
            min="0"
            class="aoo-prompt__resolve-input"
            placeholder="0"
          />
        </label>
        <div class="aoo-prompt__resolve-buttons">
          <button
            class="btn btn--sm btn--success"
            @click="confirmAoO(action.id)"
          >
            Confirm
          </button>
          <button
            class="btn btn--sm btn--secondary"
            @click="cancelResolve"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OutOfTurnAction } from '~/types/combat'
import type { Combatant } from '~/types/encounter'

const props = defineProps<{
  pendingAoOs: OutOfTurnAction[]
  combatants: Combatant[]
}>()

const emit = defineEmits<{
  resolve: [actionId: string, resolution: 'accept' | 'decline', damageRoll?: number]
}>()

const resolvingAction = ref<string | null>(null)
const damageInput = ref<number>(0)

function getReactorName(action: OutOfTurnAction): string {
  const reactor = props.combatants.find(c => c.id === action.actorId)
  if (!reactor) return 'Unknown'
  if (reactor.type === 'pokemon') {
    const entity = reactor.entity as { nickname?: string; species: string }
    return entity.nickname || entity.species
  }
  return (reactor.entity as { name: string }).name
}

function getReactorHp(action: OutOfTurnAction): string {
  const reactor = props.combatants.find(c => c.id === action.actorId)
  if (!reactor) return '?/?'
  return `${reactor.entity.currentHp}/${reactor.entity.maxHp} HP`
}

function getHpClass(action: OutOfTurnAction): string {
  const reactor = props.combatants.find(c => c.id === action.actorId)
  if (!reactor) return ''
  const ratio = reactor.entity.currentHp / reactor.entity.maxHp
  if (ratio <= 0.25) return 'aoo-prompt__reactor-hp--critical'
  if (ratio <= 0.5) return 'aoo-prompt__reactor-hp--low'
  return ''
}

/**
 * Get the Struggle Attack label showing AC and damage info.
 * PTU p.240: Expert+ Combat skill uses AC 3/DB 5 instead of AC 4/DB 4.
 */
function getStruggleAttackLabel(action: OutOfTurnAction): string {
  const reactor = props.combatants.find(c => c.id === action.actorId)
  if (!reactor) return 'Struggle Attack (AC 4)'
  const isExpert = hasExpertCombat(reactor)
  if (isExpert) {
    return 'Struggle Attack (AC 3, DB 5 — Expert+ Combat)'
  }
  return 'Struggle Attack (AC 4, DB 4)'
}

/**
 * Check if a combatant has Expert+ Combat skill rank.
 */
function hasExpertCombat(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const entity = combatant.entity as { skills?: Record<string, string> }
  if (!entity.skills) return false
  const combatRank = entity.skills.Combat || entity.skills.combat
  return combatRank === 'Expert' || combatRank === 'Master'
}

function startResolve(actionId: string) {
  resolvingAction.value = actionId
  damageInput.value = 0
}

function cancelResolve() {
  resolvingAction.value = null
  damageInput.value = 0
}

function confirmAoO(actionId: string) {
  emit('resolve', actionId, 'accept', damageInput.value > 0 ? damageInput.value : undefined)
  resolvingAction.value = null
  damageInput.value = 0
}

function declineAoO(actionId: string) {
  emit('resolve', actionId, 'decline')
}
</script>

<style lang="scss" scoped>
.aoo-prompt {
  background: linear-gradient(135deg, rgba($color-warning, 0.15) 0%, rgba($color-warning, 0.05) 100%);
  border: 1px solid rgba($color-warning, 0.4);
  border-radius: $border-radius-md;
  overflow: hidden;
  animation: aoo-slide-in 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-warning, 0.15);
    border-bottom: 1px solid rgba($color-warning, 0.2);
  }

  &__header-icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) saturate(100%) invert(69%) sepia(63%) saturate(588%) hue-rotate(2deg) brightness(103%) contrast(96%);
  }

  &__header-title {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-warning;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__header-count {
    margin-left: auto;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__action {
    padding: $spacing-md;

    & + & {
      border-top: 1px solid rgba($color-warning, 0.15);
    }
  }

  &__trigger {
    margin-bottom: $spacing-sm;
  }

  &__trigger-desc {
    font-size: $font-size-sm;
    color: $color-text;
    line-height: 1.4;
  }

  &__reactor {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-sm;
  }

  &__reactor-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__reactor-name {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__reactor-hp {
    font-size: $font-size-xs;
    color: $color-success;
    font-weight: 500;

    &--low {
      color: $color-warning;
    }

    &--critical {
      color: $color-danger;
    }
  }

  &__reactor-note {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
  }

  &__buttons {
    display: flex;
    gap: $spacing-sm;
  }

  &__resolve {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding-top: $spacing-sm;
  }

  &__resolve-label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__resolve-input {
    width: 64px;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    background: $color-bg-elevated;
    color: $color-text;
    font-size: $font-size-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $color-warning;
    }
  }

  &__resolve-buttons {
    display: flex;
    gap: $spacing-sm;
  }
}

.btn-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  margin-right: 2px;
}

@keyframes aoo-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
