<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal--catalog">
      <div class="modal__header">
        <h2>Equipment Catalog</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <PhX :size="18" weight="bold" />
        </button>
      </div>

      <div class="modal__body">
        <!-- Filters -->
        <div class="catalog-filters">
          <div class="filter-group">
            <label>Filter by Slot</label>
            <select v-model="selectedSlot" class="filter-select">
              <option value="">All Slots</option>
              <option v-for="slot in EQUIPMENT_SLOTS" :key="slot" :value="slot">
                {{ slotLabel(slot) }}
              </option>
            </select>
          </div>
          <div class="filter-group filter-group--search">
            <label>Search</label>
            <div class="search-input-wrapper">
              <PhMagnifyingGlass :size="14" weight="bold" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                class="filter-input"
                placeholder="Search items..."
              />
            </div>
          </div>
        </div>

        <!-- Grouped Items -->
        <div v-if="filteredGroups.length" class="catalog-groups">
          <div
            v-for="group in filteredGroups"
            :key="group.slot"
            class="catalog-group"
          >
            <h3 class="group-header">
              <component :is="slotIcon(group.slot)" :size="16" weight="bold" />
              {{ slotLabel(group.slot) }}
            </h3>
            <div class="group-items">
              <div
                v-for="item in group.items"
                :key="item.name"
                class="catalog-item"
              >
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span v-if="item.cost" class="item-cost">{{ item.cost.toLocaleString() }}P</span>
                </div>
                <p class="item-description">{{ item.description }}</p>
                <div class="item-bonuses">
                  <span v-if="item.damageReduction" class="item-bonus item-bonus--dr">
                    DR {{ item.damageReduction }}
                  </span>
                  <span v-if="item.evasionBonus" class="item-bonus item-bonus--evasion">
                    Evasion +{{ item.evasionBonus }}
                  </span>
                  <span v-if="item.speedDefaultCS" class="item-bonus item-bonus--speed">
                    Speed CS {{ item.speedDefaultCS }}
                  </span>
                  <span v-if="item.statBonus" class="item-bonus item-bonus--focus">
                    +{{ item.statBonus.value }} {{ formatStatName(item.statBonus.stat) }}
                  </span>
                  <span v-if="item.conditionalDR" class="item-bonus item-bonus--conditional">
                    {{ item.conditionalDR.amount }} DR ({{ item.conditionalDR.condition }})
                  </span>
                  <span v-if="item.canReady" class="item-bonus item-bonus--ready">
                    Can Ready
                  </span>
                </div>
                <button
                  v-if="targetCharacterId"
                  class="btn btn--primary btn--sm equip-btn"
                  :disabled="saving"
                  @click="equipToCharacter(item)"
                >
                  <PhArrowRight :size="14" weight="bold" />
                  Equip
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="empty-state">No items match your search</p>
      </div>

      <!-- Success Toast -->
      <Transition name="equip-toast">
        <div v-if="successMessage" class="equip-toast">
          <PhCheckCircle :size="16" weight="bold" />
          {{ successMessage }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhX, PhMagnifyingGlass, PhArrowRight, PhRing, PhCheckCircle } from '@phosphor-icons/vue'
import { EQUIPMENT_CATALOG, EQUIPMENT_SLOTS, SLOT_LABELS, SLOT_ICONS, STAT_LABELS } from '~/constants/equipment'
import type { EquipmentSlot, EquippedItem, EquipmentSlots } from '~/types/character'

const props = defineProps<{
  targetCharacterId?: string
}>()

const emit = defineEmits<{
  close: []
  equipped: [equipment: EquipmentSlots]
}>()

const { showToast } = useGmToast()
const selectedSlot = ref<EquipmentSlot | ''>('')
const searchQuery = ref('')
const saving = ref(false)
const successMessage = ref<string | null>(null)
let successTimer: ReturnType<typeof setTimeout> | null = null

interface CatalogGroup {
  slot: EquipmentSlot
  items: EquippedItem[]
}

function slotLabel(slot: EquipmentSlot): string {
  return SLOT_LABELS[slot] ?? slot
}

function slotIcon(slot: EquipmentSlot) {
  return SLOT_ICONS[slot] ?? PhRing
}

function formatStatName(stat: string): string {
  return STAT_LABELS[stat] ?? stat
}

const allGroups = computed<CatalogGroup[]>(() => {
  const groups: CatalogGroup[] = []
  for (const slot of EQUIPMENT_SLOTS) {
    const items = Object.values(EQUIPMENT_CATALOG).filter(item => item.slot === slot)
    if (items.length > 0) {
      groups.push({ slot, items })
    }
  }
  return groups
})

const filteredGroups = computed<CatalogGroup[]>(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const slotFilter = selectedSlot.value

  return allGroups.value
    .filter(group => !slotFilter || group.slot === slotFilter)
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        !query || item.name.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false)
      )
    }))
    .filter(group => group.items.length > 0)
})

function showSuccess(itemName: string) {
  successMessage.value = `Equipped ${itemName}`
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    successMessage.value = null
  }, 2500)
}

async function equipToCharacter(item: EquippedItem) {
  if (!props.targetCharacterId) return

  saving.value = true
  try {
    const response = await $fetch(`/api/characters/${props.targetCharacterId}/equipment`, {
      method: 'PUT',
      body: { slots: { [item.slot]: item } }
    })
    if (response.success) {
      showSuccess(item.name)
      emit('equipped', response.data.slots)
    }
  } catch (error: any) {
    showToast(`Failed to equip ${item.name}: ${error.data?.message || error.message || 'Unknown error'}`, 'error')
  } finally {
    saving.value = false
  }
}

onUnmounted(() => {
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  @include modal-overlay-enhanced;
}

.modal {
  @include modal-container-enhanced;

  &--catalog {
    position: relative;
    max-width: 700px;
    max-height: 80vh;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba($color-accent-teal, 0.1) 0%, transparent 100%);
  }

  &__body {
    overflow-y: auto;
    max-height: 65vh;
  }
}

.catalog-filters {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &--search {
    flex: 1;
  }

  label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
}

.filter-select {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }

  option {
    background: $color-bg-secondary;
    color: $color-text;
  }
}

.search-input-wrapper {
  position: relative;

  .search-icon {
    position: absolute;
    left: $spacing-sm;
    top: 50%;
    transform: translateY(-50%);
    color: $color-text-muted;
  }
}

.filter-input {
  width: 100%;
  padding: $spacing-xs $spacing-sm $spacing-xs $spacing-lg;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }

  &::placeholder {
    color: $color-text-muted;
  }
}

.catalog-groups {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.group-header {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: $spacing-sm;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $border-color-subtle;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.catalog-item {
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  transition: border-color $transition-fast;

  &:hover {
    border-color: $border-color-emphasis;
  }
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xs;
}

.item-name {
  font-weight: 600;
  font-size: $font-size-sm;
  color: $color-text;
}

.item-cost {
  font-size: $font-size-xs;
  color: $color-warning;
  font-weight: 500;
}

.item-description {
  font-size: $font-size-xs;
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
  line-height: 1.4;
}

.item-bonuses {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
}

.item-bonus {
  font-size: $font-size-xs;
  padding: 2px $spacing-xs;
  border-radius: $border-radius-sm;
  border: 1px solid;

  &--dr {
    background: rgba($color-info, 0.1);
    border-color: rgba($color-info, 0.25);
    color: $color-info;
  }

  &--evasion {
    background: rgba($color-success, 0.1);
    border-color: rgba($color-success, 0.25);
    color: $color-success;
  }

  &--speed {
    background: rgba($color-warning, 0.1);
    border-color: rgba($color-warning, 0.25);
    color: $color-warning;
  }

  &--focus {
    background: rgba($color-accent-violet, 0.1);
    border-color: rgba($color-accent-violet, 0.25);
    color: $color-accent-violet;
  }

  &--conditional {
    background: rgba($color-accent-pink, 0.1);
    border-color: rgba($color-accent-pink, 0.25);
    color: $color-accent-pink;
  }

  &--ready {
    background: rgba($color-accent-teal, 0.1);
    border-color: rgba($color-accent-teal, 0.25);
    color: $color-accent-teal;
  }
}

.equip-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}

.equip-toast {
  position: absolute;
  bottom: $spacing-md;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  font-weight: 600;
  color: white;
  background: rgba($color-success, 0.9);
  white-space: nowrap;
  box-shadow: $shadow-md;
  z-index: 1;
}

.equip-toast-enter-active,
.equip-toast-leave-active {
  transition: all 300ms ease;
}

.equip-toast-enter-from,
.equip-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
