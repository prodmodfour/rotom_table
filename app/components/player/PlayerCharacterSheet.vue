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
        <div v-for="stat in statEntries" :key="stat.key" class="player-stat-cell" :title="stat.tooltip">
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
        <div v-if="(character.statusConditions ?? []).length > 0" class="combat-statuses">
          <span class="combat-item__label">Status</span>
          <div class="status-badges">
            <span
              v-for="status in character.statusConditions ?? []"
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
  const stages = props.character.stageModifiers ?? {}
  const hpTooltip = `Max HP = Level (${props.character.level}) x2 + HP Base (${stats.hp}) x3 + 10 = ${props.character.maxHp}`
  return [
    { key: 'hp', label: 'HP Base', value: stats.hp, stage: stages.hp ?? 0, tooltip: hpTooltip },
    { key: 'attack', label: 'ATK', value: stats.attack, stage: stages.attack ?? 0, tooltip: undefined },
    { key: 'defense', label: 'DEF', value: stats.defense, stage: stages.defense ?? 0, tooltip: undefined },
    { key: 'specialAttack', label: 'SPA', value: stats.specialAttack, stage: stages.specialAttack ?? 0, tooltip: undefined },
    { key: 'specialDefense', label: 'SPD', value: stats.specialDefense, stage: stages.specialDefense ?? 0, tooltip: undefined },
    { key: 'speed', label: 'SPE', value: stats.speed, stage: stages.speed ?? 0, tooltip: undefined }
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
  return calculateEvasion(props.character.stats.defense, (props.character.stageModifiers ?? {}).defense ?? 0, evasionBonus, defBonus)
})
const specEvasion = computed(() => {
  const { evasionBonus, statBonuses } = equipBonuses.value
  const spDefBonus = statBonuses.specialDefense ?? 0
  return calculateEvasion(props.character.stats.specialDefense, (props.character.stageModifiers ?? {}).specialDefense ?? 0, evasionBonus, spDefBonus)
})
const spdEvasion = computed(() => {
  const { evasionBonus, statBonuses } = equipBonuses.value
  const spdBonus = statBonuses.speed ?? 0
  return calculateEvasion(props.character.stats.speed, (props.character.stageModifiers ?? {}).speed ?? 0, evasionBonus, spdBonus)
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
