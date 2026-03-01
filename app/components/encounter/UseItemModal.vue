<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h2>Use Item</h2>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal__body">
          <!-- User display -->
          <div class="use-item__field">
            <span class="use-item__label">User:</span>
            <span class="use-item__value">{{ userName }}</span>
          </div>

          <!-- Target selector -->
          <div class="use-item__field">
            <label class="use-item__label" for="item-target">Target:</label>
            <select
              id="item-target"
              v-model="selectedTargetId"
              class="form-select"
            >
              <option v-for="c in targetCombatants" :key="c.id" :value="c.id">
                {{ getCombatantName(c) }} ({{ c.entity.currentHp }}/{{ c.entity.maxHp }} HP)
              </option>
            </select>
          </div>

          <!-- Available Items -->
          <div class="use-item__items-header">Available Items:</div>

          <div v-if="applicableItems.length === 0" class="use-item__empty">
            No applicable items for this target.
          </div>

          <div v-else class="use-item__item-list">
            <button
              v-for="item in applicableItems"
              :key="item.name"
              class="use-item__item"
              :class="{ 'use-item__item--selected': selectedItemName === item.name }"
              @click="selectedItemName = item.name"
            >
              <div class="use-item__item-icon">
                <PhFirstAidKit :size="20" weight="duotone" />
              </div>
              <div class="use-item__item-info">
                <div class="use-item__item-header">
                  <span class="use-item__item-name">{{ item.name }}</span>
                  <span v-if="item.hpAmount" class="use-item__item-hp">+{{ item.hpAmount }} HP</span>
                </div>
                <div class="use-item__item-desc">{{ item.description }}</div>
              </div>
              <div class="use-item__item-cost">${{ item.cost }}</div>
            </button>
          </div>

          <!-- Result display (after item use) -->
          <div v-if="result" class="use-item__result">
            <div v-if="result.refused" class="use-item__result-refused">
              Target refused the item. Item was not consumed.
            </div>
            <div v-else class="use-item__result-success">
              <PhHeart :size="16" weight="fill" />
              <span v-if="result.hpHealed">
                {{ result.targetName }} healed {{ result.hpHealed }} HP
              </span>
              <span v-if="result.repulsive" class="use-item__repulsive">
                (Repulsive)
              </span>
            </div>
          </div>

          <!-- Error display -->
          <div v-if="errorMessage" class="use-item__error">
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal__footer">
          <button
            class="btn btn--ghost"
            :disabled="!selectedItemName || !selectedTargetId || healingItems.loading.value"
            title="Target refuses the item (not consumed)"
            @click="handleRefuse"
          >
            Target Refuses
          </button>
          <button class="btn btn--secondary" @click="$emit('close')">
            Cancel
          </button>
          <button
            class="btn btn--primary"
            :disabled="!selectedItemName || !selectedTargetId || healingItems.loading.value"
            @click="handleApply"
          >
            {{ healingItems.loading.value ? 'Applying...' : 'Apply Item' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { PhFirstAidKit, PhHeart } from '@phosphor-icons/vue'
import type { Combatant, Pokemon, HumanCharacter, StatusCondition } from '~/types'
import type { HealingItemDef } from '~/constants/healingItems'

const props = defineProps<{
  /** Combatant ID of the user applying the item */
  userId: string
}>()

const emit = defineEmits<{
  close: []
  itemUsed: [result: {
    itemName: string
    targetName: string
    hpHealed?: number
    refused: boolean
  }]
}>()

const encounterStore = useEncounterStore()
const healingItems = useHealingItems()

// State
const selectedTargetId = ref('')
const selectedItemName = ref('')
const result = ref<{
  itemName: string
  targetName: string
  hpHealed?: number
  repulsive?: boolean
  refused: boolean
} | null>(null)
const errorMessage = ref('')

// User combatant
const userCombatant = computed(() =>
  encounterStore.encounter?.combatants.find(c => c.id === props.userId)
)

const userName = computed(() => {
  if (!userCombatant.value) return 'Unknown'
  return getCombatantName(userCombatant.value)
})

// Target combatants (all alive combatants in encounter)
const targetCombatants = computed(() => {
  if (!encounterStore.encounter) return []
  return encounterStore.encounter.combatants.filter(c => {
    const isDead = (c.entity.statusConditions || []).includes('Dead')
    return !isDead
  })
})

// Default target to user for self-use
onMounted(() => {
  if (targetCombatants.value.length > 0) {
    selectedTargetId.value = props.userId
  }
})

// Selected target combatant
const selectedTarget = computed(() => {
  if (!selectedTargetId.value) return null
  return encounterStore.encounter?.combatants.find(
    c => c.id === selectedTargetId.value
  ) ?? null
})

// Applicable items for selected target
const applicableItems = computed<HealingItemDef[]>(() => {
  if (!selectedTarget.value) return []
  return healingItems.getApplicableItems(selectedTarget.value, ['restorative'])
})

// Reset item selection when target changes
watch(selectedTargetId, () => {
  selectedItemName.value = ''
  result.value = null
  errorMessage.value = ''
})

function getCombatantName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (combatant.entity as HumanCharacter).name
}

async function handleApply() {
  if (!selectedItemName.value || !selectedTargetId.value) return

  errorMessage.value = ''
  result.value = null

  try {
    const itemResult = await healingItems.useItem(
      selectedItemName.value,
      props.userId,
      selectedTargetId.value,
      true
    )

    if (itemResult) {
      result.value = {
        itemName: itemResult.itemName,
        targetName: itemResult.targetName,
        hpHealed: itemResult.hpHealed,
        repulsive: itemResult.repulsive,
        refused: itemResult.refused
      }

      emit('itemUsed', {
        itemName: itemResult.itemName,
        targetName: itemResult.targetName,
        hpHealed: itemResult.hpHealed,
        refused: false
      })
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Failed to use item'
  }
}

async function handleRefuse() {
  if (!selectedItemName.value || !selectedTargetId.value) return

  errorMessage.value = ''
  result.value = null

  try {
    const itemResult = await healingItems.useItem(
      selectedItemName.value,
      props.userId,
      selectedTargetId.value,
      false
    )

    if (itemResult) {
      result.value = {
        itemName: selectedItemName.value,
        targetName: '',
        refused: true
      }

      emit('itemUsed', {
        itemName: selectedItemName.value,
        targetName: '',
        refused: true
      })
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Failed to process refusal'
  }
}
</script>

<style lang="scss" scoped>
.use-item {
  &__field {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__label {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text-muted;
    min-width: 60px;
  }

  &__value {
    font-weight: 500;
    color: $color-text;
  }

  &__items-header {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__empty {
    padding: $spacing-lg;
    text-align: center;
    color: $color-text-muted;
    font-size: $font-size-sm;
    background: $color-bg-tertiary;
    border-radius: $border-radius-md;
  }

  &__item-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    max-height: 250px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border: 2px solid transparent;
    border-radius: $border-radius-md;
    cursor: pointer;
    transition: all $transition-fast;
    text-align: left;
    color: $color-text;

    &:hover {
      background: $color-bg-hover;
      border-color: $border-color-default;
    }

    &--selected {
      border-color: $color-success;
      background: rgba($color-success, 0.1);
    }
  }

  &__item-icon {
    flex-shrink: 0;
    color: $color-success;
    display: flex;
    align-items: center;
  }

  &__item-info {
    flex: 1;
    min-width: 0;
  }

  &__item-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__item-name {
    font-weight: 600;
    font-size: $font-size-sm;
  }

  &__item-hp {
    font-weight: 700;
    font-size: $font-size-xs;
    color: $color-success;
  }

  &__item-desc {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-top: 2px;
  }

  &__item-cost {
    flex-shrink: 0;
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 500;
  }

  &__result {
    margin-top: $spacing-md;
    padding: $spacing-md;
    border-radius: $border-radius-md;
  }

  &__result-success {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: $color-success;
    font-weight: 600;
    background: rgba($color-success, 0.1);
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    border: 1px solid rgba($color-success, 0.3);
  }

  &__result-refused {
    color: $color-warning;
    font-weight: 600;
    background: rgba($color-warning, 0.1);
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    border: 1px solid rgba($color-warning, 0.3);
  }

  &__repulsive {
    font-weight: 400;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-left: $spacing-xs;
  }

  &__error {
    margin-top: $spacing-md;
    padding: $spacing-sm $spacing-md;
    color: $color-danger;
    font-size: $font-size-sm;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-md;
  }
}

.form-select {
  flex: 1;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  font-size: $font-size-sm;

  &:focus {
    border-color: $color-accent-scarlet;
    outline: none;
    box-shadow: 0 0 0 2px rgba($color-accent-scarlet, 0.2);
  }

  option {
    background: $color-bg-secondary;
    color: $color-text;
  }
}
</style>
