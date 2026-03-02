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
                {{ getCombatantName(c) }}
                ({{ c.entity.currentHp }}/{{ getEffectiveMaxHp(c.entity.maxHp, c.entity.injuries || 0) }} HP)
                <template v-if="isCombatantFainted(c)"> [Fainted]</template>
              </option>
            </select>
          </div>

          <!-- Grouped item sections -->
          <div v-if="hasAnyApplicableItems" class="use-item__sections">
            <!-- Restoratives -->
            <div v-if="groupedItems.restorative.length > 0" class="use-item__section">
              <div class="use-item__section-header">
                <PhHeart :size="14" weight="bold" />
                Restoratives
              </div>
              <div class="use-item__item-list">
                <button
                  v-for="item in groupedItems.restorative"
                  :key="item.name"
                  class="use-item__item"
                  :class="{ 'use-item__item--selected': selectedItemName === item.name }"
                  @click="selectedItemName = item.name"
                >
                  <div class="use-item__item-icon use-item__item-icon--restorative">
                    <PhFirstAidKit :size="18" weight="duotone" />
                  </div>
                  <div class="use-item__item-info">
                    <div class="use-item__item-header">
                      <span class="use-item__item-name">{{ item.name }}</span>
                      <span v-if="item.repulsive" class="use-item__repulsive-badge" title="May decrease Pokemon loyalty with repeated use">
                        <PhWarning :size="12" weight="bold" />
                        Repulsive
                      </span>
                    </div>
                    <div class="use-item__item-desc">{{ item.description }}</div>
                  </div>
                  <div class="use-item__item-effect">
                    <span v-if="item.hpAmount" class="use-item__item-hp">+{{ item.hpAmount }} HP</span>
                  </div>
                  <div class="use-item__item-cost">${{ item.cost }}</div>
                </button>
              </div>
            </div>

            <!-- Status Cures -->
            <div v-if="groupedItems.cure.length > 0" class="use-item__section">
              <div class="use-item__section-header">
                <PhPill :size="14" weight="bold" />
                Status Cures
              </div>
              <div class="use-item__item-list">
                <button
                  v-for="item in groupedItems.cure"
                  :key="item.name"
                  class="use-item__item"
                  :class="{ 'use-item__item--selected': selectedItemName === item.name }"
                  @click="selectedItemName = item.name"
                >
                  <div class="use-item__item-icon use-item__item-icon--cure">
                    <PhPill :size="18" weight="duotone" />
                  </div>
                  <div class="use-item__item-info">
                    <div class="use-item__item-header">
                      <span class="use-item__item-name">{{ item.name }}</span>
                      <span v-if="item.repulsive" class="use-item__repulsive-badge" title="May decrease Pokemon loyalty with repeated use">
                        <PhWarning :size="12" weight="bold" />
                        Repulsive
                      </span>
                    </div>
                    <div class="use-item__item-desc">{{ item.description }}</div>
                  </div>
                  <div class="use-item__item-effect">
                    <span class="use-item__item-cure-label">
                      {{ getCureLabel(item) }}
                    </span>
                  </div>
                  <div class="use-item__item-cost">${{ item.cost }}</div>
                </button>
              </div>
            </div>

            <!-- Combined -->
            <div v-if="groupedItems.combined.length > 0" class="use-item__section">
              <div class="use-item__section-header">
                <PhStar :size="14" weight="bold" />
                Combined
              </div>
              <div class="use-item__item-list">
                <button
                  v-for="item in groupedItems.combined"
                  :key="item.name"
                  class="use-item__item"
                  :class="{ 'use-item__item--selected': selectedItemName === item.name }"
                  @click="selectedItemName = item.name"
                >
                  <div class="use-item__item-icon use-item__item-icon--combined">
                    <PhStar :size="18" weight="duotone" />
                  </div>
                  <div class="use-item__item-info">
                    <div class="use-item__item-header">
                      <span class="use-item__item-name">{{ item.name }}</span>
                    </div>
                    <div class="use-item__item-desc">{{ item.description }}</div>
                  </div>
                  <div class="use-item__item-effect">
                    <span v-if="item.hpAmount" class="use-item__item-hp">+{{ item.hpAmount }} HP</span>
                    <span class="use-item__item-cure-label">+All Cures</span>
                  </div>
                  <div class="use-item__item-cost">${{ item.cost }}</div>
                </button>
              </div>
            </div>

            <!-- Revives -->
            <div v-if="groupedItems.revive.length > 0" class="use-item__section">
              <div class="use-item__section-header">
                <PhHeartBreak :size="14" weight="bold" />
                Revives
              </div>
              <div class="use-item__item-list">
                <button
                  v-for="item in groupedItems.revive"
                  :key="item.name"
                  class="use-item__item"
                  :class="{ 'use-item__item--selected': selectedItemName === item.name }"
                  @click="selectedItemName = item.name"
                >
                  <div class="use-item__item-icon use-item__item-icon--revive">
                    <PhHeartBreak :size="18" weight="duotone" />
                  </div>
                  <div class="use-item__item-info">
                    <div class="use-item__item-header">
                      <span class="use-item__item-name">{{ item.name }}</span>
                      <span v-if="item.repulsive" class="use-item__repulsive-badge" title="May decrease Pokemon loyalty with repeated use">
                        <PhWarning :size="12" weight="bold" />
                        Repulsive
                      </span>
                    </div>
                    <div class="use-item__item-desc">{{ item.description }}</div>
                  </div>
                  <div class="use-item__item-effect">
                    <span v-if="item.hpAmount" class="use-item__item-hp">{{ item.hpAmount }} HP</span>
                    <span v-else-if="item.healToPercent" class="use-item__item-hp">{{ item.healToPercent }}% HP</span>
                  </div>
                  <div class="use-item__item-cost">${{ item.cost }}</div>
                </button>
              </div>
            </div>
          </div>

          <!-- No items state -->
          <div v-else class="use-item__empty">
            No applicable items for this target.
          </div>

          <!-- Result display (after item use) -->
          <div v-if="result" class="use-item__result">
            <div v-if="result.refused" class="use-item__result-refused">
              Target refused the item. Item was not consumed.
            </div>
            <div v-else class="use-item__result-success">
              <PhHeart :size="16" weight="fill" />
              <span v-if="result.revived">
                {{ result.targetName }} was revived!
              </span>
              <span v-if="result.hpHealed">
                {{ result.targetName }} healed {{ result.hpHealed }} HP
              </span>
              <span v-if="result.conditionsCured && result.conditionsCured.length > 0">
                {{ !result.hpHealed && !result.revived ? result.targetName + ' ' : '' }}Cured: {{ result.conditionsCured.join(', ') }}
              </span>
              <span v-if="result.repulsive" class="use-item__repulsive-result">
                <PhWarning :size="14" weight="bold" />
                Repulsive
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
import { PhFirstAidKit, PhHeart, PhHeartBreak, PhPill, PhStar, PhWarning } from '@phosphor-icons/vue'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import type { Combatant, StatusCondition } from '~/types'
import type { HealingItemDef, HealingItemCategory } from '~/constants/healingItems'

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
    conditionsCured?: StatusCondition[]
    revived?: boolean
    repulsive?: boolean
    refused: boolean
  }]
}>()

const encounterStore = useEncounterStore()
const healingItems = useHealingItems()
const { getCombatantName } = useCombatantDisplay()

// State
const selectedTargetId = ref('')
const selectedItemName = ref('')
const result = ref<{
  itemName: string
  targetName: string
  hpHealed?: number
  conditionsCured?: StatusCondition[]
  revived?: boolean
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

// Target combatants (all non-dead combatants in encounter)
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

// Applicable items for selected target, grouped by category
const groupedItems = computed<Record<HealingItemCategory, HealingItemDef[]>>(() => {
  const empty: Record<HealingItemCategory, HealingItemDef[]> = {
    restorative: [],
    cure: [],
    combined: [],
    revive: [],
  }
  if (!selectedTarget.value) return empty

  const items = healingItems.getApplicableItems(selectedTarget.value)
  const grouped = { ...empty }
  for (const item of items) {
    grouped[item.category] = [...grouped[item.category], item]
  }
  return grouped
})

const hasAnyApplicableItems = computed(() => {
  return Object.values(groupedItems.value).some(items => items.length > 0)
})

function isCombatantFainted(combatant: Combatant): boolean {
  return (combatant.entity.statusConditions || []).includes('Fainted')
}

function getCureLabel(item: HealingItemDef): string {
  if (item.curesAllPersistent) return 'All Persistent'
  if (item.curesAllStatus) return 'All Status'
  if (item.curesConditions && item.curesConditions.length > 0) {
    return item.curesConditions.join(', ')
  }
  return ''
}

// Reset item selection when target changes
watch(selectedTargetId, () => {
  selectedItemName.value = ''
  result.value = null
  errorMessage.value = ''
})

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
        conditionsCured: itemResult.conditionsCured,
        revived: itemResult.revived,
        repulsive: itemResult.repulsive,
        refused: itemResult.refused
      }

      emit('itemUsed', {
        itemName: itemResult.itemName,
        targetName: itemResult.targetName,
        hpHealed: itemResult.hpHealed,
        conditionsCured: itemResult.conditionsCured,
        revived: itemResult.revived,
        repulsive: itemResult.repulsive,
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

  &__sections {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    max-height: 350px;
    overflow-y: auto;
  }

  &__section {
    &-header {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-weight: 600;
      font-size: $font-size-sm;
      color: $color-text-muted;
      margin-bottom: $spacing-xs;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
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
    display: flex;
    align-items: center;

    &--restorative { color: $color-success; }
    &--cure { color: $color-info; }
    &--combined { color: $color-warning; }
    &--revive { color: $color-accent-scarlet; }
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

  &__item-effect {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  &__item-hp {
    font-weight: 700;
    font-size: $font-size-xs;
    color: $color-success;
  }

  &__item-cure-label {
    font-weight: 500;
    font-size: $font-size-xs;
    color: $color-info;
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

  &__repulsive-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-warning;
    background: rgba($color-warning, 0.1);
    padding: 1px $spacing-xs;
    border-radius: $border-radius-sm;
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
    flex-wrap: wrap;
  }

  &__result-refused {
    color: $color-warning;
    font-weight: 600;
    background: rgba($color-warning, 0.1);
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    border: 1px solid rgba($color-warning, 0.3);
  }

  &__repulsive-result {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-weight: 500;
    font-size: $font-size-xs;
    color: $color-warning;
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
