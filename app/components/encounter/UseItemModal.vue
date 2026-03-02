<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h2>Use Item</h2>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal__body">
          <!-- User display with action cost -->
          <div class="use-item__field">
            <span class="use-item__label">User:</span>
            <span class="use-item__value">{{ userName }}</span>
            <span class="use-item__action-badge" :class="actionCostClass">
              <PhLightning :size="12" weight="bold" />
              {{ actionCostLabel }}
            </span>
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

          <!-- P2: Range status -->
          <div v-if="!isSelfUse && rangeStatus" class="use-item__field">
            <span class="use-item__label">Range:</span>
            <span
              class="use-item__range-status"
              :class="rangeStatus.adjacent ? 'use-item__range-status--ok' : 'use-item__range-status--far'"
            >
              <PhMapPin :size="14" weight="bold" />
              {{ rangeStatus.adjacent ? 'Adjacent' : `Too far (${rangeStatus.distance}m)` }}
            </span>
          </div>

          <!-- P2: Action cost and forfeit info -->
          <div class="use-item__action-info">
            <div class="use-item__action-detail">
              <PhLightning :size="14" weight="bold" />
              <span v-if="isSelfUse">
                Full-Round Action (Standard + Shift)
              </span>
              <span v-else>
                Standard Action
              </span>
              <span v-if="!canUseAction" class="use-item__action-warning">
                (not available)
              </span>
            </div>
            <div v-if="!isSelfUse" class="use-item__forfeit-info">
              <PhTimer :size="14" weight="bold" />
              Target forfeits next Standard + Shift
              <span v-if="hasMedicTraining" class="use-item__medic-badge">
                <PhShieldCheck :size="12" weight="bold" />
                Exempt (Medic Training)
              </span>
            </div>
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
                  :class="{
                    'use-item__item--selected': selectedItemName === item.name,
                    'use-item__item--out-of-stock': !gmMode && getItemQuantity(item.name) <= 0
                  }"
                  :disabled="!gmMode && getItemQuantity(item.name) <= 0"
                  @click="selectItem(item.name)"
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
                  <div class="use-item__item-qty" :class="{ 'use-item__item-qty--zero': getItemQuantity(item.name) <= 0 }">
                    x{{ getItemQuantity(item.name) }}
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
                  :class="{
                    'use-item__item--selected': selectedItemName === item.name,
                    'use-item__item--out-of-stock': !gmMode && getItemQuantity(item.name) <= 0
                  }"
                  :disabled="!gmMode && getItemQuantity(item.name) <= 0"
                  @click="selectItem(item.name)"
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
                  <div class="use-item__item-qty" :class="{ 'use-item__item-qty--zero': getItemQuantity(item.name) <= 0 }">
                    x{{ getItemQuantity(item.name) }}
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
                  :class="{
                    'use-item__item--selected': selectedItemName === item.name,
                    'use-item__item--out-of-stock': !gmMode && getItemQuantity(item.name) <= 0
                  }"
                  :disabled="!gmMode && getItemQuantity(item.name) <= 0"
                  @click="selectItem(item.name)"
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
                  <div class="use-item__item-qty" :class="{ 'use-item__item-qty--zero': getItemQuantity(item.name) <= 0 }">
                    x{{ getItemQuantity(item.name) }}
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
                  :class="{
                    'use-item__item--selected': selectedItemName === item.name,
                    'use-item__item--out-of-stock': !gmMode && getItemQuantity(item.name) <= 0
                  }"
                  :disabled="!gmMode && getItemQuantity(item.name) <= 0"
                  @click="selectItem(item.name)"
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
                  <div class="use-item__item-qty" :class="{ 'use-item__item-qty--zero': getItemQuantity(item.name) <= 0 }">
                    x{{ getItemQuantity(item.name) }}
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
          <!-- P2: GM Mode toggle -->
          <label class="use-item__gm-toggle" title="Skip inventory check (GM override)">
            <input type="checkbox" v-model="gmMode" />
            <PhShieldStar :size="14" weight="bold" />
            GM Mode
          </label>

          <div class="use-item__footer-actions">
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
              :disabled="isApplyDisabled"
              :title="applyDisabledReason"
              @click="handleApply"
            >
              {{ healingItems.loading.value ? 'Applying...' : 'Apply Item' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  PhFirstAidKit, PhHeart, PhHeartBreak, PhLightning, PhMapPin,
  PhPill, PhShieldCheck, PhShieldStar, PhStar, PhTimer, PhWarning
} from '@phosphor-icons/vue'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import { ptuDistanceTokensBBox } from '~/utils/gridDistance'
import type { Combatant, StatusCondition, HumanCharacter, Pokemon, InventoryItem } from '~/types'
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
const gmMode = ref(false)
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

// P2: Self-use detection
const isSelfUse = computed(() =>
  selectedTargetId.value === props.userId
)

// P2: Medic Training check
const hasMedicTraining = computed(() => {
  if (!userCombatant.value || userCombatant.value.type !== 'human') return false
  const edges = (userCombatant.value.entity as HumanCharacter).edges || []
  return edges.some(e => e.toLowerCase().includes('medic training'))
})

// P2: Action availability check
const canUseAction = computed(() => {
  if (!userCombatant.value) return false
  const ts = userCombatant.value.turnState
  if (isSelfUse.value) {
    // Full-Round: need both Standard and Shift unused
    return !ts.standardActionUsed && !ts.shiftActionUsed
  }
  // Standard Action only
  return !ts.standardActionUsed
})

// P2: Action cost label
const actionCostLabel = computed(() =>
  isSelfUse.value ? 'Full-Round' : 'Standard'
)

const actionCostClass = computed(() =>
  isSelfUse.value ? 'use-item__action-badge--full' : 'use-item__action-badge--standard'
)

// P2: Adjacency/range check
const rangeStatus = computed(() => {
  if (!userCombatant.value || !selectedTargetId.value) return null
  if (isSelfUse.value) return { adjacent: true, distance: 0 }

  const target = encounterStore.encounter?.combatants.find(
    c => c.id === selectedTargetId.value
  )
  if (!target) return null

  const userPos = userCombatant.value.position
  const targetPos = target.position
  if (!userPos || !targetPos) return { adjacent: true, distance: 0 } // Gridless

  const distance = ptuDistanceTokensBBox(
    { position: userPos, size: userCombatant.value.tokenSize || 1 },
    { position: targetPos, size: target.tokenSize || 1 }
  )
  return { adjacent: distance <= 1, distance }
})

// P2: Inventory resolution — find the trainer who owns the items
const trainerInventory = computed((): InventoryItem[] => {
  if (!userCombatant.value) return []

  // If user is a trainer, use their inventory
  if (userCombatant.value.type === 'human') {
    return (userCombatant.value.entity as HumanCharacter).inventory || []
  }

  // If user is a Pokemon, find their owner trainer in the encounter
  const pokemon = userCombatant.value.entity as Pokemon
  const ownerId = pokemon.ownerId
  if (!ownerId) return []

  const trainer = encounterStore.encounter?.combatants.find(
    c => c.type === 'human' && c.entityId === ownerId
  )
  if (!trainer) return []
  return (trainer.entity as HumanCharacter).inventory || []
})

function getItemQuantity(itemName: string): number {
  const invItem = trainerInventory.value.find(inv => inv.name === itemName)
  return invItem ? invItem.quantity : 0
}

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

// P2: Comprehensive disabled check
const isApplyDisabled = computed(() => {
  if (!selectedItemName.value || !selectedTargetId.value) return true
  if (healingItems.loading.value) return true
  if (!canUseAction.value) return true
  if (rangeStatus.value && !rangeStatus.value.adjacent) return true
  // Check inventory (unless GM mode)
  if (!gmMode.value && getItemQuantity(selectedItemName.value) <= 0) return true
  return false
})

const applyDisabledReason = computed(() => {
  if (!selectedItemName.value) return 'Select an item'
  if (!selectedTargetId.value) return 'Select a target'
  if (!canUseAction.value) {
    return isSelfUse.value
      ? 'Full-Round Action not available (Standard or Shift already used)'
      : 'Standard Action already used this turn'
  }
  if (rangeStatus.value && !rangeStatus.value.adjacent) return 'Target is not adjacent'
  if (!gmMode.value && getItemQuantity(selectedItemName.value) <= 0) return 'Out of stock'
  return ''
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

function selectItem(itemName: string) {
  // Don't select out-of-stock items unless in GM mode
  if (!gmMode.value && getItemQuantity(itemName) <= 0) return
  selectedItemName.value = itemName
}

// Reset item selection when target changes
watch(selectedTargetId, () => {
  selectedItemName.value = ''
  result.value = null
  errorMessage.value = ''
})

async function handleApply() {
  if (isApplyDisabled.value) return

  errorMessage.value = ''
  result.value = null

  try {
    const itemResult = await healingItems.useItem(
      selectedItemName.value,
      props.userId,
      selectedTargetId.value,
      true,
      gmMode.value
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
      false,
      gmMode.value
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

  &__action-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;

    &--standard {
      color: $color-info;
      background: rgba($color-info, 0.15);
    }

    &--full {
      color: $color-warning;
      background: rgba($color-warning, 0.15);
    }
  }

  &__range-status {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    font-weight: 600;

    &--ok {
      color: $color-success;
    }

    &--far {
      color: $color-danger;
    }
  }

  &__action-info {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
  }

  &__action-detail {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text-muted;
  }

  &__action-warning {
    color: $color-danger;
    font-weight: 600;
  }

  &__forfeit-info {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text-muted;
    font-size: $font-size-xs;
  }

  &__medic-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: $color-success;
    font-weight: 600;
    font-size: $font-size-xs;
    background: rgba($color-success, 0.1);
    padding: 1px $spacing-xs;
    border-radius: $border-radius-sm;
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    max-height: 300px;
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
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border: 2px solid transparent;
    border-radius: $border-radius-md;
    cursor: pointer;
    transition: all $transition-fast;
    text-align: left;
    color: $color-text;

    &:hover:not(:disabled) {
      background: $color-bg-hover;
      border-color: $border-color-default;
    }

    &--selected {
      border-color: $color-success;
      background: rgba($color-success, 0.1);
    }

    &--out-of-stock {
      opacity: 0.4;
      cursor: not-allowed;
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

  &__item-qty {
    flex-shrink: 0;
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-text;
    min-width: 24px;
    text-align: center;

    &--zero {
      color: $color-danger;
    }
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

  &__gm-toggle {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      accent-color: $color-warning;
    }

    &:hover {
      color: $color-warning;
    }
  }

  &__footer-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.modal__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
