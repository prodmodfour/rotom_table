<template>
  <div v-if="showDeclarationPanel" class="declaration-panel">
    <div class="declaration-header">
      <PhTextAlignLeft :size="20" />
      <span class="phase-label">Declaration Phase</span>
      <span class="progress">{{ declarationProgress }}</span>
    </div>

    <div class="declaring-trainer">
      <span class="trainer-name">{{ currentTrainerName }}</span>
      <span class="trainer-speed">Speed: {{ currentTrainerSpeed }}</span>
    </div>

    <div class="declaration-form">
      <label class="form-label">Action Type</label>
      <select v-model="actionType" class="action-type-select">
        <option value="" disabled>Select action...</option>
        <option value="command_pokemon">Command Pokemon</option>
        <option value="switch_pokemon">Switch Pokemon</option>
        <option value="use_item">Use Item</option>
        <option value="use_feature">Use Feature</option>
        <option value="orders">Orders</option>
        <option value="pass">Pass</option>
      </select>

      <label class="form-label">Description</label>
      <textarea
        v-model="description"
        placeholder="Describe the declared action..."
        class="declaration-description"
        rows="2"
      />

      <button
        class="btn btn-primary"
        :disabled="!canDeclare"
        @click="submitDeclaration"
      >
        <PhCheck :size="16" />
        Declare &amp; Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhTextAlignLeft, PhCheck } from '@phosphor-icons/vue'

const emit = defineEmits<{
  declared: []
}>()

const encounterStore = useEncounterStore()

const actionType = ref('')
const description = ref('')

const showDeclarationPanel = computed(() =>
  encounterStore.isLeagueBattle &&
  encounterStore.currentPhase === 'trainer_declaration' &&
  encounterStore.currentCombatant?.type === 'human'
)

const currentTrainerName = computed(() => {
  const c = encounterStore.currentCombatant
  if (!c) return ''
  return (c.entity as { name: string }).name
})

const currentTrainerSpeed = computed(() => {
  const c = encounterStore.currentCombatant
  if (!c) return 0
  return c.initiative
})

const declarationProgress = computed(() => {
  const trainers = encounterStore.trainersByTurnOrder
  const aliveTrainers = trainers.filter(t => (t.entity as { currentHp: number }).currentHp > 0)
  const declared = encounterStore.currentDeclarations.length
  return `${declared + 1} of ${aliveTrainers.length}`
})

const canDeclare = computed(() =>
  actionType.value !== '' && description.value.trim() !== ''
)

async function submitDeclaration() {
  const combatant = encounterStore.currentCombatant
  if (!combatant) return

  try {
    encounterStore.captureSnapshot('Declare action')
    await encounterStore.submitDeclaration(
      combatant.id,
      actionType.value as 'command_pokemon' | 'switch_pokemon' | 'use_item' | 'use_feature' | 'orders' | 'pass',
      description.value.trim()
    )
    await encounterStore.nextTurn()

    // Notify parent to broadcast via WebSocket
    emit('declared')

    // Reset form for next declaration
    actionType.value = ''
    description.value = ''
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    alert(`Declaration failed: ${message}`)
  }
}
</script>

<style lang="scss" scoped>
.declaration-panel {
  background: linear-gradient(135deg, rgba($color-accent-violet, 0.12) 0%, rgba($color-accent-violet-light, 0.06) 100%);
  border: 2px solid rgba($color-accent-violet, 0.4);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;
  box-shadow: 0 0 16px rgba($color-accent-violet, 0.2);
}

.declaration-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  color: $color-accent-violet-light;
  font-weight: 600;
}

.phase-label {
  font-size: $font-size-md;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress {
  margin-left: auto;
  font-size: $font-size-sm;
  color: $color-text-muted;
  background: $color-bg-tertiary;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
}

.declaring-trainer {
  display: flex;
  align-items: baseline;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $glass-border;
}

.trainer-name {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $color-text;
}

.trainer-speed {
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.declaration-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.form-label {
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.action-type-select {
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $color-accent-violet;
  }
}

.declaration-description {
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;
  font-family: inherit;
  resize: vertical;

  &::placeholder {
    color: $color-text-muted;
  }

  &:focus {
    outline: none;
    border-color: $color-accent-violet;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-lg;
  background: linear-gradient(135deg, $color-accent-violet 0%, $color-accent-violet-light 100%);
  color: #fff;
  border: none;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: $spacing-xs;

  &:hover:not(:disabled) {
    box-shadow: 0 0 12px rgba($color-accent-violet, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
