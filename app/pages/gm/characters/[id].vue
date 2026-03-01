<template>
  <div class="character-sheet-page">
    <div class="sheet-header">
      <NuxtLink to="/gm/sheets" class="back-link">
        ← Back to Sheets
      </NuxtLink>
      <div class="sheet-header__actions">
        <template v-if="!isEditing">
          <button class="btn btn--primary" @click="startEditing">
            Edit
          </button>
        </template>
        <template v-else>
          <button class="btn btn--secondary" @click="cancelEditing">
            Cancel
          </button>
          <button class="btn btn--primary" @click="saveChanges" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="sheet-loading">
      Loading...
    </div>

    <div v-else-if="error" class="sheet-error">
      <p>{{ error }}</p>
      <NuxtLink to="/gm/sheets" class="btn btn--primary">
        Return to Sheets
      </NuxtLink>
    </div>

    <div v-else-if="character" class="sheet human-sheet">
      <!-- Header -->
      <div class="sheet__header">
        <div
          class="sheet__avatar"
          :class="{ 'sheet__avatar--clickable': isEditing }"
          @click="isEditing ? showSpritePicker = true : undefined"
        >
          <img
            v-if="resolvedAvatarUrl"
            :src="resolvedAvatarUrl"
            :alt="character.name"
            @error="handleAvatarError"
          />
          <span v-else>{{ character.name.charAt(0) }}</span>
        </div>

        <TrainerSpritePicker
          v-model="editData.avatarUrl"
          :show="showSpritePicker"
          @close="showSpritePicker = false"
        />
        <div class="sheet__title">
          <div class="form-row">
            <div class="form-group">
              <label>Name</label>
              <input v-model="editData.name" type="text" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group">
              <label>Played By</label>
              <input v-model="editData.playedBy" type="text" class="form-input" :disabled="!isEditing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group--sm">
              <label>Level</label>
              <input v-model.number="editData.level" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Age</label>
              <input v-model.number="editData.age" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Gender</label>
              <input v-model="editData.gender" type="text" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Type</label>
              <select v-model="editData.characterType" class="form-select" :disabled="!isEditing">
                <option value="player">Player</option>
                <option value="npc">NPC</option>
              </select>
            </div>
          </div>
          <div v-if="editData.characterType !== 'player'" class="form-row">
            <div class="form-group">
              <label>Location</label>
              <input v-model="editData.location" type="text" class="form-input" :disabled="!isEditing" placeholder="e.g., Mesagoza" />
            </div>
          </div>
        </div>
      </div>

      <!-- Trainer XP Panel -->
      <TrainerXpPanel
        :character="character"
        :disabled="isCharacterInEncounter"
        @level-up="handleXpLevelUp"
        @xp-changed="handleXpChanged"
      />

      <!-- Tabs -->
      <div class="sheet__tabs">
        <button
          v-for="tab in humanTabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="sheet__content">
        <!-- Stats Tab -->
        <div v-if="activeTab === 'stats'" class="tab-content">
          <div class="stats-grid">
            <div class="stat-block">
              <label>HP</label>
              <div class="stat-values">
                <span class="stat-base">{{ character.stats?.hp || 0 }}</span>
                <span class="stat-current">{{ editData.currentHp }} / {{ character.maxHp }}</span>
              </div>
              <div v-if="isEditing" class="stat-edit">
                <input v-model.number="editData.currentHp" type="number" class="form-input form-input--sm" />
              </div>
            </div>
            <div class="stat-block">
              <label>Attack</label>
              <span class="stat-current">{{ character.stats?.attack || 0 }}</span>
            </div>
            <div class="stat-block">
              <label>Defense</label>
              <span class="stat-current">{{ character.stats?.defense || 0 }}</span>
            </div>
            <div class="stat-block">
              <label>Sp. Atk</label>
              <span class="stat-current">{{ character.stats?.specialAttack || 0 }}</span>
            </div>
            <div class="stat-block">
              <label>Sp. Def</label>
              <span class="stat-current">{{ character.stats?.specialDefense || 0 }}</span>
            </div>
            <div class="stat-block">
              <label>Speed</label>
              <span class="stat-current">{{ character.stats?.speed || 0 }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group form-group--sm">
              <label>Height (cm)</label>
              <input v-model.number="editData.height" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Weight (kg)</label>
              <input v-model.number="editData.weight" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Money</label>
              <input v-model.number="editData.money" type="number" class="form-input" :disabled="!isEditing" />
            </div>
          </div>

          <!-- Derived Trainer Capabilities -->
          <CapabilitiesDisplay :derived-stats="derivedStats" />
        </div>

        <!-- Classes Tab -->
        <div v-if="activeTab === 'classes'" class="tab-content">
          <div v-if="character.trainerClasses?.length" class="info-section info-section--no-border">
            <h4>Trainer Classes</h4>
            <div class="tag-list">
              <span v-for="tc in character.trainerClasses" :key="tc" class="tag tag--class">{{ tc }}</span>
            </div>
          </div>

          <div v-if="character.features?.length" class="info-section">
            <h4>Features</h4>
            <div class="tag-list">
              <span v-for="feat in character.features" :key="feat" class="tag tag--feature">{{ feat }}</span>
            </div>
          </div>

          <div v-if="character.edges?.length" class="info-section">
            <h4>Edges</h4>
            <div class="tag-list">
              <span v-for="edge in character.edges" :key="edge" class="tag tag--edge">{{ edge }}</span>
            </div>
          </div>

          <div v-if="character.capabilities?.length || isEditing" class="info-section">
            <h4>Capabilities</h4>
            <template v-if="isEditing">
              <p class="info-section__hint">
                Comma-separated list of trainer capabilities (e.g. Naturewalk (Forest), Naturewalk (Mountain))
              </p>
              <input
                type="text"
                class="form-input"
                :value="(editData.capabilities || []).join(', ')"
                @change="onCapabilitiesChange($event)"
                placeholder="Naturewalk (Forest), Naturewalk (Ocean)"
              />
            </template>
            <div v-else class="tag-list">
              <span v-for="cap in character.capabilities" :key="cap" class="tag tag--capability">{{ cap }}</span>
            </div>
          </div>

          <p v-if="!character.trainerClasses?.length && !character.features?.length && !character.edges?.length && !character.capabilities?.length" class="empty-state">
            No classes, features, edges, or capabilities recorded
          </p>
        </div>

        <!-- Skills Tab -->
        <div v-if="activeTab === 'skills'" class="tab-content">
          <div v-if="character.skills && Object.keys(character.skills).length" class="skills-grid skills-grid--human">
            <div v-for="(rank, skill) in character.skills" :key="skill" class="skill-item" :class="`skill-item--${rank.toLowerCase()}`">
              <label>{{ skill }}</label>
              <span class="skill-rank">{{ rank }}</span>
            </div>
          </div>
          <p v-else class="empty-state">No skills recorded</p>
        </div>

        <!-- Equipment Tab -->
        <div v-if="activeTab === 'equipment'" class="tab-content">
          <HumanEquipmentTab
            v-if="character"
            :character-id="character.id"
            :equipment="localEquipment"
            :is-in-encounter="isCharacterInEncounter"
            @equipment-changed="onEquipmentChanged"
            @equipment-changed-in-encounter="onEquipmentChangedInEncounter"
          />
        </div>

        <!-- Pokemon Tab -->
        <div v-if="activeTab === 'pokemon'" class="tab-content">
          <div v-if="character.pokemon?.length" class="pokemon-team">
            <NuxtLink
              v-for="poke in character.pokemon"
              :key="poke.id"
              :to="`/gm/pokemon/${poke.id}`"
              class="team-pokemon"
            >
              <img :src="getSpriteUrl(poke.species, poke.shiny)" :alt="poke.species" />
              <div class="team-pokemon__info">
                <span class="team-pokemon__name">{{ poke.nickname || poke.species }}</span>
                <span class="team-pokemon__level">Lv. {{ poke.level }}</span>
              </div>
            </NuxtLink>
          </div>
          <p v-else class="empty-state">No Pokemon linked to this trainer</p>
        </div>

        <!-- Healing Tab -->
        <div v-if="activeTab === 'healing'" class="tab-content">
          <HealingTab
            entity-type="character"
            :entity-id="character.id"
            :entity="character"
            @healed="loadCharacter"
          />
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="form-group">
            <label>Background</label>
            <textarea v-model="editData.background" class="form-input" rows="3" :disabled="!isEditing"></textarea>
          </div>
          <div class="form-group">
            <label>Personality</label>
            <textarea v-model="editData.personality" class="form-input" rows="3" :disabled="!isEditing"></textarea>
          </div>
          <div class="form-group">
            <label>Goals</label>
            <textarea v-model="editData.goals" class="form-input" rows="3" :disabled="!isEditing"></textarea>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="editData.notes" class="form-input" rows="3" :disabled="!isEditing"></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Level-Up Modal -->
    <LevelUpModal
      v-if="showLevelUpModal && character"
      :character="character"
      :target-level="levelUpTargetLevel"
      @complete="onLevelUpComplete"
      @cancel="onLevelUpCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { HumanCharacter } from '~/types'
import type { EquipmentSlots } from '~/types/character'
import { computeTrainerDerivedStats } from '~/utils/trainerDerivedStats'

definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const { getSpriteUrl } = usePokemonSprite()

const { getTrainerSpriteUrl } = useTrainerSprite()

const characterId = computed(() => route.params.id as string)

// State
const character = ref<HumanCharacter | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const editData = ref<Partial<HumanCharacter>>({})
const activeTab = ref('stats')
const showSpritePicker = ref(false)

// --- Level-Up Modal State ---
const showLevelUpModal = ref(false)
const levelUpTargetLevel = ref(0)
const isApplyingLevelUp = ref(false)

// Watch for level increase in edit mode — intercept and open level-up modal
watch(() => editData.value.level, (newVal, oldVal) => {
  if (isApplyingLevelUp.value) return
  if (!isEditing.value) return
  if (typeof newVal !== 'number' || typeof oldVal !== 'number') return
  if (newVal <= oldVal) return

  // Revert the raw input change — the modal will handle it
  editData.value = { ...editData.value, level: oldVal }
  levelUpTargetLevel.value = newVal
  showLevelUpModal.value = true
})

// Handle XP-triggered level-up
function handleXpLevelUp(payload: { oldLevel: number; newLevel: number; character: HumanCharacter }) {
  levelUpTargetLevel.value = payload.newLevel
  showLevelUpModal.value = true
}

// Handle XP change (refresh character data)
async function handleXpChanged(_payload: { newXp: number; newLevel: number }) {
  await loadCharacter()
}

// Handle level-up completion
async function onLevelUpComplete(updatedData: Partial<HumanCharacter>) {
  isApplyingLevelUp.value = true
  editData.value = {
    ...editData.value,
    ...updatedData
  }
  showLevelUpModal.value = false
  await nextTick()
  isApplyingLevelUp.value = false
}

function onLevelUpCancel() {
  showLevelUpModal.value = false
}

// Resolved avatar URL — uses editData when editing for live preview, else character
const avatarBroken = ref(false)
const resolvedAvatarUrl = computed(() => {
  if (avatarBroken.value) return null
  const key = isEditing.value ? editData.value.avatarUrl : character.value?.avatarUrl
  return getTrainerSpriteUrl(key ?? null)
})

const handleAvatarError = () => {
  avatarBroken.value = true
}

// Equipment state (tracked locally for reactivity on equip/unequip)
const localEquipment = ref<EquipmentSlots>({})

watch(character, (char) => {
  if (char) {
    localEquipment.value = { ...(char.equipment ?? {}) }
  }
}, { immediate: true })

const onEquipmentChanged = (equipment: EquipmentSlots) => {
  localEquipment.value = equipment
}

// WebSocket broadcast for equipment changes during encounters
const { send } = useWebSocket()
const onEquipmentChangedInEncounter = (equipment: EquipmentSlots) => {
  if (!character.value) return
  send({
    type: 'character_update',
    data: { ...character.value, equipment }
  })
}

// Check if character is in an active encounter
const encounterStore = useEncounterStore()
const isCharacterInEncounter = computed(() => {
  if (!encounterStore.encounter?.isActive || !character.value) return false
  return encounterStore.encounter.combatants.some(
    c => c.entityId === character.value!.id
  )
})

// Derived trainer capabilities (computed from skills + weight)
const derivedStats = computed(() =>
  computeTrainerDerivedStats({
    skills: character.value?.skills || {},
    weightKg: character.value?.weight
  })
)

// Check for edit mode from query param
onMounted(async () => {
  if (route.query.edit === 'true') {
    isEditing.value = true
  }
  await loadCharacter()
})

// Watch for route param changes — reset avatar state since Nuxt reuses the page component
watch(characterId, async () => {
  avatarBroken.value = false
  await loadCharacter()
})

const loadCharacter = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{ success: boolean; data: HumanCharacter }>(`/api/characters/${characterId.value}`)
    character.value = response.data
    editData.value = { ...response.data }

    useHead({
      title: `GM - ${response.data.name}`
    })
  } catch (e) {
    error.value = 'Character not found'
    console.error('Failed to load character:', e)
  } finally {
    loading.value = false
  }
}

// Tabs
const humanTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'classes', label: 'Classes' },
  { id: 'skills', label: 'Skills' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'pokemon', label: 'Pokemon' },
  { id: 'healing', label: 'Healing' },
  { id: 'notes', label: 'Notes' }
]

// Edit mode
const startEditing = () => {
  editData.value = { ...character.value }
  isEditing.value = true
  router.replace({ query: { edit: 'true' } })
}

const cancelEditing = () => {
  editData.value = { ...character.value }
  isEditing.value = false
  router.replace({ query: {} })
}

/**
 * Parse comma-separated capabilities string into a clean array.
 * Uses parentheses-aware split so multi-terrain entries like
 * "Naturewalk (Forest, Grassland)" are not mangled by inner commas.
 */
const onCapabilitiesChange = (event: Event) => {
  const input = (event.target as HTMLInputElement).value
  const parsed = input
    .split(/,(?![^(]*\))/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  editData.value = { ...editData.value, capabilities: parsed }
}

const saveChanges = async () => {
  if (!character.value) return

  saving.value = true
  try {
    await libraryStore.updateHuman(character.value.id, editData.value)
    // Reload to get fresh data
    await loadCharacter()
    isEditing.value = false
    router.replace({ query: {} })
  } catch (e) {
    console.error('Failed to save character:', e)
    alert('Failed to save changes')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.character-sheet-page {
  @include sheet-page;
}

.sheet-header {
  @include sheet-header;
}

.back-link {
  @include sheet-back-link;
}

.sheet-loading,
.sheet-error {
  @include sheet-loading-error;
}

.sheet {
  @include sheet-card;

  &__header {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $glass-border;
  }

  &__avatar {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-lg;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }

    span {
      font-size: 3rem;
      font-weight: 700;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    &--clickable {
      cursor: pointer;
      transition: border-color $transition-fast;

      &:hover {
        border-color: $color-accent-teal;
      }
    }
  }

  &__title {
    flex: 1;
  }
}

.tab-btn {
  @include sheet-tab-btn;
}

.tab-content {
  @include sheet-tab-content;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.stat-block {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
    text-transform: uppercase;
  }

  .stat-values {
    display: flex;
    justify-content: center;
    gap: $spacing-sm;
    align-items: baseline;
  }

  .stat-base {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  .stat-current {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-text;
  }

  .stat-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    margin-top: $spacing-sm;

    .form-input--sm {
      width: 60px;
      padding: $spacing-xs;
      text-align: center;
    }
  }
}

.info-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $glass-border;

  &--no-border {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.info-section__hint {
  font-size: $font-size-xs;
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
  font-style: italic;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;

  &--human {
    grid-template-columns: repeat(3, 1fr);
  }
}

.skill-item {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;

  label {
    font-size: $font-size-sm;
  }

  span {
    font-weight: 500;
    font-size: $font-size-sm;
  }

  .skill-rank {
    text-transform: capitalize;
  }

  &--pathetic .skill-rank { color: $color-danger; }
  &--untrained .skill-rank { color: $color-text-muted; }
  &--novice .skill-rank { color: $color-text; }
  &--adept .skill-rank { color: $color-success; }
  &--expert .skill-rank { color: $color-info; }
  &--master .skill-rank { color: gold; }
}

.pokemon-team {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: $spacing-md;
}

.team-pokemon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border-radius: $border-radius-md;
  text-decoration: none;
  color: $color-text;
  transition: all $transition-fast;

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
    background: $color-bg-tertiary;
  }

  img {
    width: 64px;
    height: 64px;
    image-rendering: pixelated;
  }

  &__info {
    text-align: center;
    margin-top: $spacing-sm;
  }

  &__name {
    display: block;
    font-weight: 600;
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.empty-state {
  @include sheet-empty-state;
}

.form-row {
  @include sheet-form-row;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
