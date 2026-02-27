<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h3>Status Conditions - {{ combatantName }}</h3>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal__body">
          <!-- Immunity warning banner -->
          <div v-if="immuneWarnings.length > 0" class="immunity-warning">
            <PhWarningCircle :size="16" weight="bold" />
            <span>
              Type immunities detected:
              {{ immuneWarnings.map(w => `${w.immuneType}-type immune to ${w.status}`).join(', ') }}
            </span>
          </div>

          <div class="status-grid">
            <label
              v-for="status in AVAILABLE_STATUSES"
              :key="status"
              class="status-checkbox"
              :class="{
                'status-checkbox--active': statusInputs.includes(status),
                'status-checkbox--immune': isNewAndImmune(status)
              }"
            >
              <input
                type="checkbox"
                :checked="statusInputs.includes(status)"
                @change="toggleStatus(status)"
              />
              <span class="status-checkbox__label">
                {{ status }}
                <span v-if="getImmuneLabel(status)" class="status-checkbox__immune-tag">
                  IMMUNE
                </span>
              </span>
            </label>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="clearAllStatuses">Clear All</button>
          <button
            v-if="hasImmuneAdditions"
            class="btn btn--warning"
            @click="applyWithOverride"
          >
            Force Apply (GM Override)
          </button>
          <button class="btn btn--primary" @click="applyStatuses">Save Changes</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import type { StatusCondition } from '~/types'
import { ALL_STATUS_CONDITIONS } from '~/constants/statusConditions'
import { findImmuneStatuses, isImmuneToStatus } from '~/utils/typeStatusImmunity'

const props = defineProps<{
  combatantName: string
  currentStatuses: StatusCondition[]
  /** Pokemon types for immunity checking (empty for human combatants) */
  entityTypes: string[]
}>()

const emit = defineEmits<{
  close: []
  save: [add: StatusCondition[], remove: StatusCondition[], override: boolean]
}>()

const AVAILABLE_STATUSES = ALL_STATUS_CONDITIONS

// Status inputs initialized from current values
const statusInputs = ref<StatusCondition[]>([...props.currentStatuses])

const toggleStatus = (status: StatusCondition) => {
  const index = statusInputs.value.indexOf(status)
  if (index === -1) {
    statusInputs.value = [...statusInputs.value, status]
  } else {
    statusInputs.value = statusInputs.value.filter(s => s !== status)
  }
}

const clearAllStatuses = () => {
  statusInputs.value = []
}

/** Statuses being newly added (not already present) */
const newAdditions = computed(() => {
  return statusInputs.value.filter(s => !props.currentStatuses.includes(s))
})

/** Check which new additions are immune based on entity types */
const immuneWarnings = computed(() => {
  if (props.entityTypes.length === 0) return []
  return findImmuneStatuses(props.entityTypes, newAdditions.value)
})

/** Whether any new additions are immune */
const hasImmuneAdditions = computed(() => immuneWarnings.value.length > 0)

/** Check if a specific status is both newly added AND immune */
const isNewAndImmune = (status: StatusCondition): boolean => {
  if (props.entityTypes.length === 0) return false
  const isNew = !props.currentStatuses.includes(status) && statusInputs.value.includes(status)
  return isNew && isImmuneToStatus(props.entityTypes, status)
}

/** Get immune label for display (returns immune type or empty string) */
const getImmuneLabel = (status: StatusCondition): string => {
  if (props.entityTypes.length === 0) return ''
  if (!statusInputs.value.includes(status)) return ''
  if (props.currentStatuses.includes(status)) return '' // Already applied
  return isImmuneToStatus(props.entityTypes, status) ? 'immune' : ''
}

const applyStatuses = () => {
  const toAdd = statusInputs.value.filter(s => !props.currentStatuses.includes(s))
  const toRemove = props.currentStatuses.filter(s => !statusInputs.value.includes(s))

  emit('save', toAdd, toRemove, false)
  emit('close')
}

const applyWithOverride = () => {
  const toAdd = statusInputs.value.filter(s => !props.currentStatuses.includes(s))
  const toRemove = props.currentStatuses.filter(s => !statusInputs.value.includes(s))

  emit('save', toAdd, toRemove, true)
  emit('close')
}
</script>

<style lang="scss" scoped>
.immunity-warning {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm;
  margin-bottom: $spacing-sm;
  background: rgba($color-warning, 0.1);
  border: 1px solid rgba($color-warning, 0.3);
  border-radius: $border-radius-md;
  color: $color-warning;
  font-size: $font-size-sm;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $spacing-sm;
}

.status-checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.05);
  }

  &--active {
    border-color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.1);
  }

  &--immune {
    border-color: $color-warning;
    background: rgba($color-warning, 0.1);

    &:hover {
      border-color: $color-warning;
      background: rgba($color-warning, 0.15);
    }
  }

  input[type="checkbox"] {
    accent-color: $color-accent-scarlet;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__immune-tag {
    font-size: 10px;
    font-weight: 700;
    color: $color-warning;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.btn--warning {
  background: $color-warning;
  color: #000;
  border: none;
  padding: $spacing-xs $spacing-md;
  border-radius: $border-radius-md;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: darken($color-warning, 10%);
  }
}
</style>
