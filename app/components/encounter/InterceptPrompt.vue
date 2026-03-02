<template>
  <div v-if="pendingIntercepts.length > 0" class="intercept-prompt" data-testid="intercept-prompt">
    <div class="intercept-prompt__header">
      <img src="/icons/phosphor/shield.svg" alt="" class="intercept-prompt__header-icon" />
      <span class="intercept-prompt__header-title">Intercept Opportunity</span>
      <span class="intercept-prompt__header-count" v-if="pendingIntercepts.length > 1">
        {{ pendingIntercepts.length }} pending
      </span>
    </div>

    <div
      v-for="action in pendingIntercepts"
      :key="action.id"
      class="intercept-prompt__action"
    >
      <div class="intercept-prompt__trigger">
        <span class="intercept-prompt__trigger-desc">{{ action.triggerDescription }}</span>
        <span class="intercept-prompt__trigger-type" :class="interceptTypeClass(action)">
          {{ interceptTypeLabel(action) }}
        </span>
      </div>

      <div class="intercept-prompt__reactor">
        <div class="intercept-prompt__reactor-info">
          <span class="intercept-prompt__reactor-name">{{ getReactorName(action) }}</span>
          <span class="intercept-prompt__reactor-hp" :class="getHpClass(action)">
            {{ getReactorHp(action) }}
          </span>
        </div>
        <div class="intercept-prompt__reactor-note">
          Full Action + Interrupt (consumes Standard + Shift)
        </div>
      </div>

      <!-- Resolve UI (not yet resolving) -->
      <div
        class="intercept-prompt__controls"
        v-if="!resolvingAction || resolvingAction !== action.id"
      >
        <div class="intercept-prompt__buttons">
          <button
            class="btn btn--sm btn--success"
            @click="startResolve(action)"
          >
            <img src="/icons/phosphor/shield.svg" alt="" class="btn-icon" />
            Attempt Intercept
          </button>
          <button
            class="btn btn--sm btn--secondary"
            @click="declineIntercept(action.id)"
          >
            <img src="/icons/phosphor/x.svg" alt="" class="btn-icon" />
            Decline
          </button>
        </div>
      </div>

      <!-- Resolving: skill check input -->
      <div class="intercept-prompt__resolve" v-if="resolvingAction === action.id">
        <div class="intercept-prompt__resolve-info">
          <span v-if="action.triggerType === 'ally_hit_melee'" class="intercept-prompt__dc">
            DC: {{ calculateDC(action) }} (3 &times; {{ calculateDistance(action) }}m)
          </span>
          <span v-else class="intercept-prompt__dc">
            Need to reach target square (shift = check &divide; 2)
          </span>
        </div>

        <label class="intercept-prompt__resolve-label">
          Acrobatics/Athletics check:
          <input
            v-model.number="skillCheckInput"
            type="number"
            min="0"
            class="intercept-prompt__resolve-input"
            placeholder="0"
            @keyup.enter="confirmIntercept(action)"
          />
        </label>

        <div class="intercept-prompt__resolve-buttons">
          <button
            class="btn btn--sm btn--success"
            @click="confirmIntercept(action)"
            :disabled="skillCheckInput < 0"
          >
            Resolve
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
import { ref } from 'vue'
import type { OutOfTurnAction } from '~/types/combat'
import type { Combatant } from '~/types/encounter'
import { ptuDistanceTokensBBox } from '~/utils/gridDistance'
import { getLineOfAttackCellsMultiTile, canReachLineOfAttack } from '~/utils/lineOfAttack'
import type { GridPosition } from '~/types/spatial'

const props = defineProps<{
  pendingIntercepts: OutOfTurnAction[]
  combatants: Combatant[]
}>()

const emit = defineEmits<{
  interceptMelee: [actionId: string, interceptorId: string, targetId: string, attackerId: string, skillCheck: number]
  interceptRanged: [actionId: string, interceptorId: string, attackerId: string, targetSquare: GridPosition, skillCheck: number]
  decline: [actionId: string]
}>()

const resolvingAction = ref<string | null>(null)
const skillCheckInput = ref<number>(0)

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
  if (ratio <= 0.25) return 'intercept-prompt__reactor-hp--critical'
  if (ratio <= 0.5) return 'intercept-prompt__reactor-hp--low'
  return ''
}

function interceptTypeLabel(action: OutOfTurnAction): string {
  return action.triggerType === 'ally_hit_melee' ? 'Melee' : 'Ranged'
}

function interceptTypeClass(action: OutOfTurnAction): string {
  return action.triggerType === 'ally_hit_melee'
    ? 'intercept-prompt__trigger-type--melee'
    : 'intercept-prompt__trigger-type--ranged'
}

function calculateDistance(action: OutOfTurnAction): number {
  const interceptor = props.combatants.find(c => c.id === action.actorId)
  const targetId = action.triggerContext?.originalTargetId
  const target = targetId ? props.combatants.find(c => c.id === targetId) : null

  if (!interceptor?.position || !target?.position) return 0
  return ptuDistanceTokensBBox(
    { position: interceptor.position, size: interceptor.tokenSize || 1 },
    { position: target.position, size: target.tokenSize || 1 }
  )
}

function calculateDC(action: OutOfTurnAction): number {
  return 3 * calculateDistance(action)
}

/**
 * Get the best (closest reachable) target square on the line of attack
 * for a ranged intercept. Auto-selects the optimal interception point.
 */
function getBestTargetSquare(action: OutOfTurnAction): GridPosition | null {
  const interceptor = props.combatants.find(c => c.id === action.actorId)
  const attackerId = action.triggerContext?.attackerId
  const originalTargetId = action.triggerContext?.originalTargetId
  const attacker = attackerId ? props.combatants.find(c => c.id === attackerId) : null
  const target = originalTargetId ? props.combatants.find(c => c.id === originalTargetId) : null

  if (!interceptor?.position || !attacker?.position || !target?.position) return null

  const attackLine = getLineOfAttackCellsMultiTile(
    attacker.position, attacker.tokenSize || 1,
    target.position, target.tokenSize || 1
  )

  // Use a generous speed estimate for finding the best square
  // (actual speed enforcement happens server-side)
  const speed = 20
  const result = canReachLineOfAttack(
    interceptor.position, speed, attackLine, interceptor.tokenSize || 1
  )
  return result.bestSquare
}

function startResolve(action: OutOfTurnAction) {
  resolvingAction.value = action.id
  skillCheckInput.value = 0
}

function cancelResolve() {
  resolvingAction.value = null
  skillCheckInput.value = 0
}

function confirmIntercept(action: OutOfTurnAction) {
  const check = skillCheckInput.value || 0

  if (action.triggerType === 'ally_hit_melee') {
    const targetId = action.triggerContext?.originalTargetId || ''
    const attackerId = action.triggerContext?.attackerId || ''
    emit('interceptMelee', action.id, action.actorId, targetId, attackerId, check)
  } else {
    const attackerId = action.triggerContext?.attackerId || ''
    const targetSquare = getBestTargetSquare(action)
    if (!targetSquare) return // Cannot determine interception square
    emit('interceptRanged', action.id, action.actorId, attackerId, targetSquare, check)
  }

  resolvingAction.value = null
  skillCheckInput.value = 0
}

function declineIntercept(actionId: string) {
  emit('decline', actionId)
}
</script>

<style lang="scss" scoped>
.intercept-prompt {
  background: linear-gradient(135deg, rgba($color-info, 0.15) 0%, rgba($color-info, 0.05) 100%);
  border: 1px solid rgba($color-info, 0.4);
  border-radius: $border-radius-md;
  overflow: hidden;
  animation: intercept-slide-in 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-info, 0.15);
    border-bottom: 1px solid rgba($color-info, 0.2);
  }

  &__header-icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) saturate(100%) invert(52%) sepia(65%) saturate(550%) hue-rotate(176deg) brightness(96%) contrast(91%);
  }

  &__header-title {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-info;
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
      border-top: 1px solid rgba($color-info, 0.15);
    }
  }

  &__trigger {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  &__trigger-desc {
    font-size: $font-size-sm;
    color: $color-text;
    line-height: 1.4;
    flex: 1;
  }

  &__trigger-type {
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;

    &--melee {
      background: rgba($color-warning, 0.2);
      color: $color-warning;
    }

    &--ranged {
      background: rgba($color-info, 0.2);
      color: $color-info;
    }
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

  &__controls {
    padding-top: $spacing-xs;
  }

  &__buttons {
    display: flex;
    gap: $spacing-sm;
  }

  &__dc {
    font-size: $font-size-sm;
    color: $color-text;
    font-weight: 500;
  }

  &__resolve {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid rgba($color-info, 0.15);
  }

  &__resolve-info {
    padding-bottom: $spacing-xs;
  }

  &__resolve-label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__resolve-input {
    width: 72px;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    background: $color-bg-elevated;
    color: $color-text;
    font-size: $font-size-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $color-info;
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

@keyframes intercept-slide-in {
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
