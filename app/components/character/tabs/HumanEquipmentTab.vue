<template>
  <div class="tab-content">
    <div class="equipment-slots">
      <div
        v-for="slotDef in slotDefinitions"
        :key="slotDef.key"
        class="equipment-slot"
      >
        <div class="slot-label">
          <component :is="slotDef.icon" :size="16" weight="bold" />
          <span>{{ slotDef.label }}</span>
        </div>

        <!-- Equipped item display -->
        <div v-if="equippedItem(slotDef.key)" class="slot-equipped">
          <span class="item-name">{{ equippedItem(slotDef.key)!.name }}</span>
          <button
            class="btn-remove"
            title="Unequip item"
            @click="unequipSlot(slotDef.key)"
            :disabled="saving"
          >
            <PhX :size="14" weight="bold" />
          </button>
        </div>

        <!-- Empty slot: dropdown selector -->
        <div v-else class="slot-empty">
          <select
            class="slot-select"
            :disabled="saving"
            @change="onSelectItem(slotDef.key, $event)"
          >
            <option value="">-- Empty --</option>
            <option
              v-for="item in catalogItemsForSlot(slotDef.key)"
              :key="item.name"
              :value="item.name"
            >
              {{ item.name }}
            </option>
            <option value="__custom__">Custom...</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Custom item form (shown when user selects "Custom...") -->
    <div v-if="customSlot" class="custom-item-form">
      <h4>Custom Item for {{ customSlotLabel }}</h4>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input
            v-model="customForm.name"
            type="text"
            class="form-input"
            placeholder="Item name"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group form-group--sm">
          <label>DR</label>
          <input v-model.number="customForm.damageReduction" type="number" class="form-input" min="0" max="100" />
        </div>
        <div class="form-group form-group--sm">
          <label>Evasion</label>
          <input v-model.number="customForm.evasionBonus" type="number" class="form-input" min="0" max="100" />
        </div>
        <div class="form-group form-group--sm">
          <label>Speed CS</label>
          <input v-model.number="customForm.speedDefaultCS" type="number" class="form-input" min="-6" max="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Description</label>
          <input
            v-model="customForm.description"
            type="text"
            class="form-input"
            placeholder="Optional description"
          />
        </div>
      </div>
      <div class="custom-form-actions">
        <button class="btn btn--secondary btn--sm" @click="cancelCustom">Cancel</button>
        <button
          class="btn btn--primary btn--sm"
          :disabled="!customForm.name || saving"
          @click="confirmCustomItem"
        >
          Equip
        </button>
      </div>
    </div>

    <!-- Browse Catalog Button -->
    <div class="catalog-action">
      <button class="btn btn--secondary btn--sm" @click="showCatalog = true">
        <PhList :size="14" weight="bold" />
        Browse Full Catalog
      </button>
    </div>

    <!-- Catalog Browser Modal -->
    <EquipmentCatalogBrowser
      v-if="showCatalog"
      :target-character-id="characterId"
      @close="showCatalog = false"
      @equipped="onCatalogEquipped"
    />

    <!-- Combat Bonuses Summary -->
    <div class="bonuses-section">
      <h4>Combat Bonuses</h4>
      <div v-if="hasBonuses" class="bonuses-grid">
        <div v-if="bonuses.damageReduction > 0" class="bonus-tag bonus-tag--dr">
          <PhShield :size="14" weight="bold" />
          <span>DR: {{ bonuses.damageReduction }}</span>
        </div>
        <div v-if="bonuses.evasionBonus > 0" class="bonus-tag bonus-tag--evasion">
          <PhEye :size="14" weight="bold" />
          <span>Evasion: +{{ bonuses.evasionBonus }}</span>
        </div>
        <div v-if="bonuses.speedDefaultCS < 0" class="bonus-tag bonus-tag--speed">
          <PhSpeedometer :size="14" weight="bold" />
          <span>Speed CS: {{ bonuses.speedDefaultCS }}</span>
        </div>
        <div
          v-for="(value, stat) in bonuses.statBonuses"
          :key="stat"
          class="bonus-tag bonus-tag--focus"
        >
          <PhTarget :size="14" weight="bold" />
          <span>{{ formatStatName(stat) }}: +{{ value }} (post-stage)</span>
        </div>
        <div
          v-for="cdr in bonuses.conditionalDR"
          :key="cdr.condition"
          class="bonus-tag bonus-tag--conditional"
        >
          <PhWarning :size="14" weight="bold" />
          <span>{{ cdr.amount }} DR vs {{ cdr.condition }}</span>
        </div>
      </div>
      <p v-else class="empty-state">No equipment bonuses active</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhX, PhShield, PhEye, PhSpeedometer, PhTarget, PhWarning, PhList } from '@phosphor-icons/vue'
import { EQUIPMENT_CATALOG, EQUIPMENT_SLOTS, SLOT_LABELS, SLOT_ICONS, STAT_LABELS } from '~/constants/equipment'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import type { EquipmentSlots, EquipmentSlot, EquippedItem } from '~/types/character'

const props = defineProps<{
  characterId: string
  equipment: EquipmentSlots
  isInEncounter: boolean
}>()

const emit = defineEmits<{
  'equipment-changed': [equipment: EquipmentSlots]
  'equipment-changed-in-encounter': [equipment: EquipmentSlots]
}>()

const saving = ref(false)
const showCatalog = ref(false)
const customSlot = ref<EquipmentSlot | null>(null)
const customForm = ref({
  name: '',
  damageReduction: 0,
  evasionBonus: 0,
  speedDefaultCS: 0,
  description: ''
})

const slotDefinitions = EQUIPMENT_SLOTS.map(key => ({
  key,
  label: SLOT_LABELS[key],
  icon: SLOT_ICONS[key]
}))

const bonuses = computed(() => computeEquipmentBonuses(props.equipment))

const hasBonuses = computed(() => {
  const b = bonuses.value
  return (
    b.damageReduction > 0 ||
    b.evasionBonus > 0 ||
    b.speedDefaultCS < 0 ||
    Object.keys(b.statBonuses).length > 0 ||
    b.conditionalDR.length > 0
  )
})

const customSlotLabel = computed(() => {
  if (!customSlot.value) return ''
  return slotDefinitions.find(s => s.key === customSlot.value)?.label ?? customSlot.value
})

function equippedItem(slot: EquipmentSlot): EquippedItem | undefined {
  return props.equipment[slot]
}

function catalogItemsForSlot(slot: EquipmentSlot): EquippedItem[] {
  return Object.values(EQUIPMENT_CATALOG).filter(item => item.slot === slot)
}

function formatStatName(stat: string): string {
  return STAT_LABELS[stat] ?? stat
}

async function equipItem(slot: EquipmentSlot, item: EquippedItem) {
  saving.value = true
  try {
    const response = await $fetch(`/api/characters/${props.characterId}/equipment`, {
      method: 'PUT',
      body: { slots: { [slot]: item } }
    })
    if (response.success) {
      emit('equipment-changed', response.data.slots)
      if (props.isInEncounter) {
        emit('equipment-changed-in-encounter', response.data.slots)
      }
    }
  } catch (error: any) {
    alert(`Failed to equip ${item.name}: ${error.data?.message || error.message || 'Unknown error'}`)
  } finally {
    saving.value = false
  }
}

async function unequipSlot(slot: EquipmentSlot) {
  saving.value = true
  try {
    const response = await $fetch(`/api/characters/${props.characterId}/equipment`, {
      method: 'PUT',
      body: { slots: { [slot]: null } }
    })
    if (response.success) {
      emit('equipment-changed', response.data.slots)
      if (props.isInEncounter) {
        emit('equipment-changed-in-encounter', response.data.slots)
      }
    }
  } catch (error: any) {
    alert(`Failed to unequip item: ${error.data?.message || error.message || 'Unknown error'}`)
  } finally {
    saving.value = false
  }
}

function onSelectItem(slot: EquipmentSlot, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (!value) return

  // Reset select to empty after selection
  ;(event.target as HTMLSelectElement).value = ''

  if (value === '__custom__') {
    customSlot.value = slot
    customForm.value = { name: '', damageReduction: 0, evasionBonus: 0, speedDefaultCS: 0, description: '' }
    return
  }

  const catalogItem = EQUIPMENT_CATALOG[value]
  if (catalogItem) {
    equipItem(slot, catalogItem)
  }
}

function cancelCustom() {
  customSlot.value = null
}

function confirmCustomItem() {
  if (!customSlot.value || !customForm.value.name) return

  const item: EquippedItem = {
    name: customForm.value.name,
    slot: customSlot.value,
    ...(customForm.value.damageReduction > 0 && { damageReduction: customForm.value.damageReduction }),
    ...(customForm.value.evasionBonus > 0 && { evasionBonus: customForm.value.evasionBonus }),
    ...(customForm.value.speedDefaultCS < 0 && { speedDefaultCS: customForm.value.speedDefaultCS }),
    ...(customForm.value.description && { description: customForm.value.description })
  }

  equipItem(customSlot.value, item)
  customSlot.value = null
}

function onCatalogEquipped(equipment: EquipmentSlots) {
  emit('equipment-changed', equipment)
  showCatalog.value = false
  if (props.isInEncounter) {
    emit('equipment-changed-in-encounter', equipment)
  }
}
</script>

<style lang="scss" scoped>
.equipment-slots {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.equipment-slot {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
}

.slot-label {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  min-width: 110px;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.slot-equipped {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
}

.item-name {
  font-size: $font-size-sm;
  color: $color-text;
  font-weight: 500;
}

.btn-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xs;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  cursor: pointer;
  transition: all $transition-fast;
  margin-left: auto;

  &:hover {
    background: rgba($color-danger, 0.15);
    border-color: rgba($color-danger, 0.3);
    color: $color-danger;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.slot-empty {
  flex: 1;
}

.slot-select {
  width: 100%;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-sm;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: $color-bg-secondary;
    color: $color-text;
  }
}

.custom-item-form {
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid rgba($color-accent-teal, 0.3);
  border-radius: $border-radius-md;
  margin-bottom: $spacing-lg;

  h4 {
    font-size: $font-size-sm;
    color: $color-accent-teal;
    margin-bottom: $spacing-md;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.form-row {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
}

.form-group {
  flex: 1;

  &--sm {
    flex: 0 0 auto;
    min-width: 80px;
  }

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }
}

.form-input {
  width: 100%;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }
}

.custom-form-actions {
  display: flex;
  gap: $spacing-sm;
  justify-content: flex-end;
  margin-top: $spacing-md;
}

.catalog-action {
  display: flex;
  justify-content: flex-end;
  margin-bottom: $spacing-md;

  .btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
  }
}

.bonuses-section {
  padding-top: $spacing-md;
  border-top: 1px solid $glass-border;

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.bonuses-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.bonus-tag {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
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
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  font-size: $font-size-sm;
  text-align: center;
  padding: $spacing-md;
}
</style>
