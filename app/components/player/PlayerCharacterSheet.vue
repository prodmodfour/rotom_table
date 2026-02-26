<template>
  <div class="player-sheet" role="region" aria-label="Character sheet">
    <!-- Header: Name, Level, HP -->
    <section class="player-sheet__header" aria-label="Character identity and HP">
      <div class="player-sheet__identity">
        <div class="player-sheet__avatar">
          <span>{{ character.name.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="player-sheet__name-block">
          <h2 class="player-sheet__name">{{ character.name }}</h2>
          <span class="player-sheet__level">Lv. {{ character.level }}</span>
          <span v-if="character.trainerClasses.length > 0" class="player-sheet__classes">
            {{ character.trainerClasses.join(' / ') }}
          </span>
        </div>
      </div>
      <div class="player-sheet__hp-bar">
        <div class="player-hp-bar-track">
          <div
            class="player-hp-bar-fill"
            :class="hpColorClass"
            :style="{ width: hpPercent + '%' }"
          ></div>
        </div>
        <span class="player-hp-bar-label">{{ character.currentHp }} / {{ character.maxHp }} HP</span>
      </div>
    </section>

    <!-- Export / Import Actions -->
    <section class="player-sheet__actions" aria-label="Character data actions">
      <button
        class="player-sheet__action-btn"
        :disabled="exporting"
        :aria-label="exporting ? 'Exporting character data' : 'Export character data as JSON'"
        @click="handleExport"
      >
        <PhDownloadSimple :size="16" />
        <span>{{ exporting ? 'Exporting...' : 'Export Character' }}</span>
      </button>
      <button
        class="player-sheet__action-btn"
        :disabled="importing"
        :aria-label="importing ? 'Importing character data' : 'Import character data from JSON'"
        @click="triggerImport"
      >
        <PhUploadSimple :size="16" />
        <span>{{ importing ? 'Importing...' : 'Import Character' }}</span>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="player-sheet__file-input"
        @change="handleImportFile"
      />
    </section>

    <!-- Import Result Banner -->
    <div v-if="operationResult" class="player-sheet__import-result" :class="operationResultClass">
      <div class="import-result__message">
        <PhCheckCircle v-if="operationResult.success && !operationResult.hasConflicts" :size="18" />
        <PhWarningCircle v-else-if="operationResult.hasConflicts" :size="18" />
        <PhXCircle v-else :size="18" />
        <span>{{ operationResult.message }}</span>
      </div>
      <ul v-if="operationResult.conflicts && operationResult.conflicts.length > 0" class="import-result__conflicts">
        <li v-for="(conflict, idx) in operationResult.conflicts" :key="idx">
          {{ conflict.entityName }}: "{{ conflict.field }}" was changed on the server (server version kept)
        </li>
      </ul>
      <button class="import-result__dismiss" @click="clearOperationResult">
        <PhX :size="14" />
      </button>
    </div>

    <!-- Stats Grid -->
    <section class="player-sheet__section">
      <button class="player-sheet__section-header" :aria-expanded="openSections.stats" aria-controls="section-stats" @click="toggleSection('stats')">
        <span>Stats</span>
        <PhCaretDown :size="16" :class="{ 'rotated': !openSections.stats }" />
      </button>
      <div v-if="openSections.stats" id="section-stats" class="player-sheet__stats-grid">
        <div v-for="stat in statEntries" :key="stat.key" class="player-stat-cell">
          <span class="player-stat-cell__label">{{ stat.label }}</span>
          <span class="player-stat-cell__value">{{ stat.value }}</span>
          <span
            v-if="stat.stage !== 0"
            class="player-stat-cell__stage"
            :class="stat.stage > 0 ? 'player-stat-cell__stage--positive' : 'player-stat-cell__stage--negative'"
          >
            {{ stat.stage > 0 ? '+' : '' }}{{ stat.stage }}
          </span>
        </div>
      </div>
    </section>

    <!-- Combat Info -->
    <section class="player-sheet__section">
      <button class="player-sheet__section-header" :aria-expanded="openSections.combat" aria-controls="section-combat" @click="toggleSection('combat')">
        <span>Combat Info</span>
        <PhCaretDown :size="16" :class="{ 'rotated': !openSections.combat }" />
      </button>
      <div v-if="openSections.combat" id="section-combat" class="player-sheet__combat">
        <div class="combat-row">
          <div class="combat-item">
            <span class="combat-item__label">Phys Evasion</span>
            <span class="combat-item__value">{{ physEvasion }}</span>
          </div>
          <div class="combat-item">
            <span class="combat-item__label">Spec Evasion</span>
            <span class="combat-item__value">{{ specEvasion }}</span>
          </div>
          <div class="combat-item">
            <span class="combat-item__label">Spd Evasion</span>
            <span class="combat-item__value">{{ spdEvasion }}</span>
          </div>
        </div>
        <div class="combat-row">
          <div class="combat-item">
            <span class="combat-item__label">AP</span>
            <span class="combat-item__value">
              {{ character.currentAp ?? 0 }}
              <template v-if="character.drainedAp"> ({{ character.drainedAp }} drained)</template>
            </span>
          </div>
          <div class="combat-item">
            <span class="combat-item__label">Injuries</span>
            <span class="combat-item__value" :class="{ 'text-danger': character.injuries > 0 }">
              {{ character.injuries }}
            </span>
          </div>
          <div class="combat-item">
            <span class="combat-item__label">Temp HP</span>
            <span class="combat-item__value">{{ character.temporaryHp ?? 0 }}</span>
          </div>
        </div>
        <div v-if="character.statusConditions.length > 0" class="combat-statuses">
          <span class="combat-item__label">Status</span>
          <div class="status-badges">
            <span
              v-for="status in character.statusConditions"
              :key="status.name"
              class="player-status-badge"
            >
              {{ status.name }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills -->
    <section class="player-sheet__section">
      <button class="player-sheet__section-header" :aria-expanded="openSections.skills" aria-controls="section-skills" @click="toggleSection('skills')">
        <span>Skills</span>
        <PhCaretDown :size="16" :class="{ 'rotated': !openSections.skills }" />
      </button>
      <div v-if="openSections.skills" id="section-skills" class="player-sheet__skills">
        <div
          v-for="[skillName, rank] in sortedSkills"
          :key="skillName"
          class="skill-row"
        >
          <span class="skill-row__name">{{ skillName }}</span>
          <span class="skill-row__rank" :class="`skill-rank--${rank.toLowerCase()}`">
            {{ rank }}
          </span>
        </div>
      </div>
    </section>

    <!-- Features & Edges -->
    <section class="player-sheet__section">
      <button class="player-sheet__section-header" :aria-expanded="openSections.features" aria-controls="section-features" @click="toggleSection('features')">
        <span>Features & Edges</span>
        <PhCaretDown :size="16" :class="{ 'rotated': !openSections.features }" />
      </button>
      <div v-if="openSections.features" id="section-features" class="player-sheet__list">
        <template v-if="character.features.length > 0">
          <h4 class="list-subheader">Features</h4>
          <div class="tag-list">
            <span v-for="feat in character.features" :key="feat" class="tag">
              {{ feat }}
            </span>
          </div>
        </template>
        <template v-if="character.edges.length > 0">
          <h4 class="list-subheader">Edges</h4>
          <div class="tag-list">
            <span v-for="edge in character.edges" :key="edge" class="tag tag--edge">
              {{ edge }}
            </span>
          </div>
        </template>
        <p v-if="character.features.length === 0 && character.edges.length === 0" class="empty-text">
          No features or edges.
        </p>
      </div>
    </section>

    <!-- Equipment -->
    <section class="player-sheet__section">
      <button class="player-sheet__section-header" :aria-expanded="openSections.equipment" aria-controls="section-equipment" @click="toggleSection('equipment')">
        <span>Equipment</span>
        <PhCaretDown :size="16" :class="{ 'rotated': !openSections.equipment }" />
      </button>
      <div v-if="openSections.equipment" id="section-equipment" class="player-sheet__equipment">
        <div
          v-for="slot in equipmentSlots"
          :key="slot.key"
          class="equipment-slot"
        >
          <span class="equipment-slot__label">{{ slot.label }}</span>
          <span class="equipment-slot__value">
            {{ slot.item ? slot.item.name : '-- Empty --' }}
          </span>
        </div>
      </div>
    </section>

    <!-- Inventory -->
    <section class="player-sheet__section">
      <button class="player-sheet__section-header" :aria-expanded="openSections.inventory" aria-controls="section-inventory" @click="toggleSection('inventory')">
        <span>Inventory ({{ character.money }}P)</span>
        <PhCaretDown :size="16" :class="{ 'rotated': !openSections.inventory }" />
      </button>
      <div v-if="openSections.inventory" id="section-inventory" class="player-sheet__inventory">
        <div
          v-for="item in character.inventory"
          :key="item.id"
          class="inventory-row"
        >
          <span class="inventory-row__name">{{ item.name }}</span>
          <span class="inventory-row__qty">x{{ item.quantity }}</span>
        </div>
        <p v-if="character.inventory.length === 0" class="empty-text">
          No items.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  PhCaretDown,
  PhDownloadSimple,
  PhUploadSimple,
  PhCheckCircle,
  PhWarningCircle,
  PhXCircle,
  PhX
} from '@phosphor-icons/vue'
import type { HumanCharacter, EquippedItem, EquipmentSlots } from '~/types'
import { calculateEvasion } from '~/utils/damageCalculation'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'

const props = defineProps<{
  character: HumanCharacter
}>()

const emit = defineEmits<{
  imported: []
}>()

// Export/Import composable
const characterId = computed(() => props.character.id)
const characterName = computed(() => props.character.name)

const {
  exporting,
  importing,
  operationResult,
  operationResultClass,
  handleExport,
  handleImportFile: processImportFile,
  clearOperationResult
} = useCharacterExportImport(characterId, characterName)

const fileInput = ref<HTMLInputElement | null>(null)

/** Open the file picker for import. */
const triggerImport = () => {
  fileInput.value?.click()
}

/** Handle the selected import file from the file input. */
const handleImportFile = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset file input so the same file can be selected again
  target.value = ''

  const updated = await processImportFile(file)
  if (updated) {
    emit('imported')
  }
}

// Section collapse state
const openSections = reactive({
  stats: true,
  combat: true,
  skills: false,
  features: false,
  equipment: false,
  inventory: false
})

const toggleSection = (section: keyof typeof openSections) => {
  openSections[section] = !openSections[section]
}

// HP calculations
const hpPercent = computed(() => {
  if (props.character.maxHp <= 0) return 0
  return Math.max(0, Math.min(100, (props.character.currentHp / props.character.maxHp) * 100))
})

const hpColorClass = computed(() => {
  const pct = hpPercent.value
  if (pct > 50) return 'player-hp-bar-fill--healthy'
  if (pct > 25) return 'player-hp-bar-fill--warning'
  return 'player-hp-bar-fill--critical'
})

// Stats
const statEntries = computed(() => {
  const stats = props.character.stats
  const stages = props.character.stageModifiers
  return [
    { key: 'hp', label: 'HP', value: stats.hp, stage: stages.hp ?? 0 },
    { key: 'attack', label: 'ATK', value: stats.attack, stage: stages.attack ?? 0 },
    { key: 'defense', label: 'DEF', value: stats.defense, stage: stages.defense ?? 0 },
    { key: 'specialAttack', label: 'SPA', value: stats.specialAttack, stage: stages.specialAttack ?? 0 },
    { key: 'specialDefense', label: 'SPD', value: stats.specialDefense, stage: stages.specialDefense ?? 0 },
    { key: 'speed', label: 'SPE', value: stats.speed, stage: stages.speed ?? 0 }
  ]
})

// Equipment combat bonuses (evasion, stat bonuses from Focus items, etc.)
const equipBonuses = computed(() =>
  computeEquipmentBonuses((props.character.equipment ?? {}) as EquipmentSlots)
)

// Evasions (use calculated stats per PTU rules, with equipment bonuses)
const physEvasion = computed(() => {
  const { evasionBonus, statBonuses } = equipBonuses.value
  const defBonus = statBonuses.defense ?? 0
  return calculateEvasion(props.character.stats.defense, props.character.stageModifiers.defense ?? 0, evasionBonus, defBonus)
})
const specEvasion = computed(() => {
  const { evasionBonus, statBonuses } = equipBonuses.value
  const spDefBonus = statBonuses.specialDefense ?? 0
  return calculateEvasion(props.character.stats.specialDefense, props.character.stageModifiers.specialDefense ?? 0, evasionBonus, spDefBonus)
})
const spdEvasion = computed(() => {
  const { evasionBonus, statBonuses } = equipBonuses.value
  const spdBonus = statBonuses.speed ?? 0
  return calculateEvasion(props.character.stats.speed, props.character.stageModifiers.speed ?? 0, evasionBonus, spdBonus)
})

// Skills sorted alphabetically
const sortedSkills = computed((): [string, string][] => {
  const skills = props.character.skills
  return Object.entries(skills).sort(([a], [b]) => a.localeCompare(b))
})

// Equipment slots
const equipmentSlots = computed(() => {
  const eq = props.character.equipment || {}
  return [
    { key: 'head', label: 'Head', item: eq.head as EquippedItem | undefined },
    { key: 'body', label: 'Body', item: eq.body as EquippedItem | undefined },
    { key: 'mainHand', label: 'Main Hand', item: eq.mainHand as EquippedItem | undefined },
    { key: 'offHand', label: 'Off Hand', item: eq.offHand as EquippedItem | undefined },
    { key: 'feet', label: 'Feet', item: eq.feet as EquippedItem | undefined },
    { key: 'accessory', label: 'Accessory', item: eq.accessory as EquippedItem | undefined }
  ]
})
</script>

<style lang="scss" scoped>
.player-sheet {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-md;
  padding-bottom: $player-nav-clearance;

  &__header {
    background: $glass-bg;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
    padding: $spacing-md;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: $border-radius-full;
    background: $gradient-sv-cool;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      font-size: $font-size-lg;
      font-weight: 700;
      color: white;
    }
  }

  &__name-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-lg;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__classes {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__hp-bar {
    display: flex;
    flex-direction: column;
    gap: 4px;

    :deep(.player-hp-bar-label) {
      text-align: right;
    }
  }

  &__section {
    background: $glass-bg;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
    overflow: hidden;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: $spacing-sm $spacing-md;
    background: transparent;
    border: none;
    color: $color-text;
    font-size: $font-size-sm;
    font-weight: 600;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-bg-hover;
    }

    :deep(svg) {
      transition: transform $transition-fast;
      color: $color-text-muted;

      &.rotated {
        transform: rotate(-90deg);
      }
    }
  }

  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    padding: 0 $spacing-sm $spacing-sm;

    @media (max-width: 320px) {
      grid-template-columns: repeat(2, 1fr);
    }

    // Character sheet uses larger stat values than default
    :deep(.player-stat-cell__value) {
      font-size: $font-size-md;
    }
  }

  &__combat {
    padding: 0 $spacing-md $spacing-sm;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__skills {
    padding: 0 $spacing-md $spacing-sm;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__list {
    padding: $spacing-sm $spacing-md;
  }

  &__equipment {
    padding: 0 $spacing-md $spacing-sm;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__inventory {
    padding: 0 $spacing-md $spacing-sm;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 300px;
    overflow-y: auto;
  }
}

// Combat
.combat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-xs;
}

.combat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xs;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  &__label {
    font-size: 10px;
    color: $color-text-muted;
    text-transform: uppercase;
    font-weight: 600;
  }

  &__value {
    font-size: $font-size-sm;
    font-weight: 600;
  }
}

.text-danger {
  color: $color-danger;
}

.combat-statuses {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

// Skills
.skill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px $spacing-xs;
  border-radius: $border-radius-sm;

  &:nth-child(odd) {
    background: rgba(255, 255, 255, 0.02);
  }

  &__name {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__rank {
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 1px $spacing-xs;
    border-radius: $border-radius-sm;
  }
}

.skill-rank {
  &--pathetic { color: $color-text-muted; }
  &--untrained { color: $color-text-secondary; }
  &--novice { color: $color-info; }
  &--adept { color: $color-success; }
  &--expert { color: $color-warning; }
  &--master { color: $color-accent-scarlet; }
}

// Features & Edges
.list-subheader {
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-transform: uppercase;
  margin-bottom: $spacing-xs;
  margin-top: $spacing-sm;

  &:first-child {
    margin-top: 0;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  padding: 2px $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  color: $color-text;

  &--edge {
    border-color: rgba($color-accent-teal, 0.3);
    color: $color-accent-teal;
  }
}

// Equipment
.equipment-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px $spacing-xs;

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    font-weight: 600;
    min-width: 80px;
  }

  &__value {
    font-size: $font-size-sm;
    color: $color-text;
    text-align: right;
  }
}

// Inventory
.inventory-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px $spacing-xs;
  border-radius: $border-radius-sm;

  &:nth-child(odd) {
    background: rgba(255, 255, 255, 0.02);
  }

  &__name {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__qty {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 600;
  }
}

.empty-text {
  font-size: $font-size-sm;
  color: $color-text-muted;
  text-align: center;
  padding: $spacing-sm;
}
</style>
