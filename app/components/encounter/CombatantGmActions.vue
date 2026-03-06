<template>
  <div class="combatant-gm-actions">
    <!-- HP Controls -->
    <div class="action-row">
      <input
        v-model.number="damageInput"
        type="number"
        class="form-input form-input--sm"
        placeholder="DMG"
        min="0"
      />
      <button class="btn btn--sm btn--danger" @click="applyDamage">
        -HP
      </button>
      <select
        v-model="lossTypeInput"
        class="form-select form-select--sm"
        title="HP reduction type: Damage (injuries), HP Loss (no massive damage), Set HP (no massive damage)"
      >
        <option value="damage">DMG</option>
        <option value="hpLoss">Loss</option>
        <option value="setHp">Set</option>
      </select>
    </div>
    <div class="action-row">
      <input
        v-model.number="healInput"
        type="number"
        class="form-input form-input--sm"
        placeholder="HEAL"
        min="0"
      />
      <button class="btn btn--sm btn--success" @click="applyHeal">
        +HP
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="action-row action-row--controls">
      <button
        class="btn btn--sm btn--secondary"
        title="Add Temp HP"
        @click="showTempHpModal = true"
      >
        +T
      </button>
      <button
        class="btn btn--sm btn--secondary"
        title="Modify Stages"
        @click="showStagesModal = true"
      >
        CS
      </button>
      <button
        class="btn btn--sm btn--secondary"
        title="Status Conditions"
        @click="showStatusModal = true"
      >
        ST
      </button>
    </div>

    <!-- Use Item Button -->
    <button
      class="btn btn--sm btn--success use-item-btn"
      title="Use Healing Item"
      @click="showUseItemModal = true"
    >
      <PhFirstAidKit :size="14" weight="bold" />
      Item
    </button>

    <!-- Actions Button -->
    <button
      class="btn btn--sm btn--primary"
      title="Take Action"
      @click="handleActClick"
    >
      Act
    </button>

    <!-- Switch Pokemon Button (visible for trainers with Pokemon, or Pokemon owned by trainers) -->
    <button
      v-if="canShowSwitchButton"
      class="btn btn--sm btn--secondary"
      title="Switch Pokemon"
      :disabled="isSwitchDisabled"
      @click="$emit('switchPokemon', combatant.id)"
    >
      <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="btn-icon" />
      Switch
    </button>

    <!-- Fainted Switch Button (visible when a trainer's Pokemon is fainted) -->
    <button
      v-if="canShowFaintedSwitchButton"
      class="btn btn--sm btn--warning"
      title="Switch Fainted Pokemon (Shift Action)"
      :disabled="isFaintedSwitchDisabled"
      @click="$emit('faintedSwitch', combatant.id)"
    >
      <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="btn-icon" />
      Fainted Switch
    </button>

    <!-- Force Switch Button (GM-triggered, for move effects like Roar) -->
    <button
      v-if="canShowForceSwitchButton"
      class="btn btn--sm btn--accent"
      title="Force Switch (Roar, etc.)"
      @click="$emit('forceSwitch', combatant.id)"
    >
      <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="btn-icon" />
      Force Switch
    </button>

    <button class="btn btn--sm btn--ghost" @click="$emit('remove', combatant.id)">
      Remove
    </button>

    <!-- Modals -->
    <TempHpModal
      v-if="showTempHpModal"
      :current-temp-hp="currentTempHp"
      @close="showTempHpModal = false"
      @apply="handleTempHpApply"
    />

    <CombatStagesModal
      v-if="showStagesModal"
      :combatant-name="displayName"
      :current-stages="currentStages"
      @close="showStagesModal = false"
      @save="handleStagesSave"
    />

    <StatusConditionsModal
      v-if="showStatusModal"
      :combatant-name="displayName"
      :current-statuses="statusConditions"
      :entity-types="entityTypes"
      @close="showStatusModal = false"
      @save="handleStatusSave"
    />

    <UseItemModal
      v-if="showUseItemModal"
      :user-id="combatant.id"
      @close="showUseItemModal = false"
      @item-used="showUseItemModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { PhFirstAidKit } from '@phosphor-icons/vue'
import type { Combatant, StatusCondition, StageModifiers } from '~/types'

const props = defineProps<{
  combatant: Combatant
  displayName: string
  currentTempHp: number
  currentStages: StageModifiers
  statusConditions: StatusCondition[]
  entityTypes: string[]
}>()

const emit = defineEmits<{
  damage: [combatantId: string, damage: number, lossType?: 'damage' | 'hpLoss' | 'setHp']
  heal: [combatantId: string, amount: number, tempHp?: number, healInjuries?: number]
  stages: [combatantId: string, changes: Partial<StageModifiers>, absolute: boolean]
  status: [combatantId: string, add: StatusCondition[], remove: StatusCondition[], override: boolean]
  openActions: [combatantId: string]
  remove: [combatantId: string]
  switchPokemon: [combatantId: string]
  faintedSwitch: [combatantId: string]
  forceSwitch: [combatantId: string]
}>()

// Input states
const damageInput = ref(0)
const healInput = ref(0)
const lossTypeInput = ref<'damage' | 'hpLoss' | 'setHp'>('damage')

// Modal states
const showTempHpModal = ref(false)
const showStagesModal = ref(false)
const showStatusModal = ref(false)
const showUseItemModal = ref(false)

const entity = computed(() => props.combatant.entity)
const isPokemon = computed(() => props.combatant.type === 'pokemon')

// Switch button visibility and disabled logic (extracted to composable)
const {
  canShowSwitchButton,
  isSwitchDisabled,
  canShowFaintedSwitchButton,
  isFaintedSwitchDisabled,
  canShowForceSwitchButton
} = useCombatantSwitchButtons(
  computed(() => props.combatant),
  entity,
  isPokemon
)

// Actions
const applyDamage = () => {
  if (damageInput.value > 0) {
    emit('damage', props.combatant.id, damageInput.value, lossTypeInput.value)
    damageInput.value = 0
    lossTypeInput.value = 'damage'
  }
}

const applyHeal = () => {
  if (healInput.value > 0) {
    emit('heal', props.combatant.id, healInput.value)
    healInput.value = 0
  }
}

const handleTempHpApply = (amount: number) => {
  emit('heal', props.combatant.id, 0, amount)
}

const handleStagesSave = (changes: Partial<StageModifiers>, absolute: boolean) => {
  emit('stages', props.combatant.id, changes, absolute)
}

const handleStatusSave = (add: StatusCondition[], remove: StatusCondition[], override: boolean) => {
  if (add.length > 0 || remove.length > 0) {
    emit('status', props.combatant.id, add, remove, override)
  }
}

const handleActClick = () => {
  emit('openActions', props.combatant.id)
}
</script>

<style lang="scss" scoped>
.combatant-gm-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  min-width: 100px;
}

// Use Item button with icon alignment
.use-item-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

// Button icon (inline SVG in buttons)
.btn-icon {
  width: 14px;
  height: 14px;
  filter: invert(1);
  vertical-align: middle;
  margin-right: 2px;
}

// Action rows
.action-row {
  display: flex;
  gap: $spacing-xs;

  &--controls {
    justify-content: space-between;
  }

  .form-input--sm {
    width: 50px;
    padding: $spacing-xs;
    font-size: $font-size-xs;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;

    &::placeholder {
      color: $color-text-muted;
    }

    &:focus {
      border-color: $color-accent-scarlet;
      outline: none;
      box-shadow: 0 0 0 2px rgba($color-accent-scarlet, 0.2);
    }
  }

  .form-select--sm {
    width: 56px;
    padding: 2px;
    font-size: $font-size-xs;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    cursor: pointer;

    &:focus {
      border-color: $color-accent-scarlet;
      outline: none;
    }
  }
}
</style>
