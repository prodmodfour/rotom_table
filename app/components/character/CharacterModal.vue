<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal--fullsheet">
      <div class="modal__header">
        <h2>{{ isEditing ? 'Edit' : 'View' }} {{ characterName }}</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <div class="modal__body">
        <!-- Pokemon View/Edit -->
        <template v-if="isPokemon">
          <div class="sheet pokemon-sheet">
            <!-- Header with sprite and basic info -->
            <div class="sheet__header">
              <div class="sheet__sprite">
                <img :src="spriteUrl" :alt="pokemonData.species" />
                <PhStar v-if="pokemonData.shiny" class="shiny-badge" :size="20" weight="fill" />
              </div>
              <div class="sheet__title">
                <div class="form-row">
                  <div class="form-group">
                    <label>Species</label>
                    <input v-model="editData.species" type="text" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group">
                    <label>Nickname</label>
                    <input v-model="editData.nickname" type="text" class="form-input" :disabled="!isEditing" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group form-group--sm">
                    <label>Level</label>
                    <input v-model.number="editData.level" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>EXP</label>
                    <input v-model.number="editData.experience" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>Gender</label>
                    <input v-model="editData.gender" type="text" class="form-input" :disabled="!isEditing" />
                  </div>
                </div>
                <div class="type-badges">
                  <span v-for="t in pokemonData.types" :key="t" class="type-badge" :class="`type-badge--${t.toLowerCase()}`">
                    {{ t }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="sheet__tabs">
              <button
                v-for="tab in pokemonTabs"
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
              <PokemonStatsTab
                v-if="activeTab === 'stats'"
                :pokemon="pokemonData"
                :current-hp="editData.currentHp"
                :max-hp="editData.maxHp"
              />
              <PokemonMovesTab
                v-if="activeTab === 'moves'"
                :moves="pokemonData.moves || []"
              />
              <PokemonAbilitiesTab
                v-if="activeTab === 'abilities'"
                :abilities="pokemonData.abilities || []"
              />
              <PokemonCapabilitiesTab
                v-if="activeTab === 'capabilities'"
                :capabilities="pokemonData.capabilities || null"
              />
              <PokemonSkillsTab
                v-if="activeTab === 'skills'"
                :skills="pokemonData.skills"
                :tutor-points="pokemonData.tutorPoints"
                :training-exp="pokemonData.trainingExp"
                :egg-groups="pokemonData.eggGroups"
              />
              <NotesTab
                v-if="activeTab === 'notes'"
                :is-pokemon="true"
                :is-editing="isEditing"
                :notes="editData.notes"
                :held-item="pokemonData.heldItem"
                @update:notes="editData.notes = $event"
              />
            </div>
          </div>
        </template>

        <!-- Human View/Edit -->
        <template v-else>
          <div class="sheet human-sheet">
            <!-- Header -->
            <div class="sheet__header">
              <div class="sheet__avatar">
                <img v-if="humanData.avatarUrl" :src="humanData.avatarUrl" :alt="characterName" />
                <span v-else>{{ characterName.charAt(0) }}</span>
              </div>
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
              </div>
            </div>

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
              <HumanStatsTab
                v-if="activeTab === 'stats'"
                :human="humanData"
                :current-hp="editData.currentHp"
                :max-hp="humanData.maxHp"
                :edit-data="editData"
                :is-editing="isEditing"
                @update:edit-data="editData = $event"
              />
              <HumanClassesTab
                v-if="activeTab === 'classes'"
                :trainer-classes="humanData.trainerClasses"
                :features="humanData.features"
                :edges="humanData.edges"
              />
              <HumanSkillsTab
                v-if="activeTab === 'skills'"
                :skills="humanData.skills"
              />
              <HumanEquipmentTab
                v-if="activeTab === 'equipment'"
                :character-id="humanData.id"
                :equipment="localEquipment"
                :is-in-encounter="isInEncounter"
                @equipment-changed="onEquipmentChanged"
                @equipment-changed-in-encounter="onEquipmentChangedInEncounter"
              />
              <HumanPokemonTab
                v-if="activeTab === 'pokemon'"
                :pokemon="humanData.pokemon"
              />
              <NotesTab
                v-if="activeTab === 'notes'"
                :is-pokemon="false"
                :is-editing="isEditing"
                :notes="editData.notes"
                :background="editData.background"
                :personality="editData.personality"
                :goals="editData.goals"
                @update:notes="editData.notes = $event"
                @update:background="editData.background = $event"
                @update:personality="editData.personality = $event"
                @update:goals="editData.goals = $event"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          {{ isEditing ? 'Cancel' : 'Close' }}
        </button>
        <button v-if="isEditing" class="btn btn--primary" @click="save">
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon, HumanCharacter } from '~/types'
import type { EquipmentSlots } from '~/types/character'

const props = defineProps<{
  character: Pokemon | HumanCharacter
  mode: 'view' | 'edit'
}>()

const emit = defineEmits<{
  close: []
  save: [data: Partial<Pokemon> | Partial<HumanCharacter>]
}>()

const { getSpriteUrl } = usePokemonSprite()

const isPokemon = computed(() => 'species' in props.character)
const isEditing = computed(() => props.mode === 'edit')

const pokemonData = computed(() => props.character as Pokemon)
const humanData = computed(() => props.character as HumanCharacter)

const characterName = computed(() => {
  if (isPokemon.value) {
    return pokemonData.value.nickname || pokemonData.value.species
  }
  return humanData.value.name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    return getSpriteUrl(pokemonData.value.species, pokemonData.value.shiny)
  }
  return ''
})

// Tabs
const pokemonTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'moves', label: 'Moves' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'notes', label: 'Notes' }
]

const humanTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'classes', label: 'Classes' },
  { id: 'skills', label: 'Skills' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'pokemon', label: 'Pokemon' },
  { id: 'notes', label: 'Notes' }
]

const activeTab = ref('stats')

// Edit data (reactive copy)
const editData = ref<any>({})

// Initialize edit data
onMounted(() => {
  editData.value = { ...props.character }
})

// Reset tab when character changes
watch(() => props.character, () => {
  activeTab.value = 'stats'
  editData.value = { ...props.character }
})

const save = () => {
  emit('save', editData.value)
}

// Equipment state (tracked locally for reactivity on equip/unequip)
const localEquipment = ref<EquipmentSlots>({})

watch(() => props.character, () => {
  if (!isPokemon.value) {
    localEquipment.value = { ...(humanData.value.equipment ?? {}) }
  }
}, { immediate: true })

const onEquipmentChanged = (equipment: EquipmentSlots) => {
  localEquipment.value = equipment
}

// WebSocket broadcast for equipment changes during encounters
const { send } = useWebSocket()
const onEquipmentChangedInEncounter = (equipment: EquipmentSlots) => {
  send({
    type: 'character_update',
    data: { ...humanData.value, equipment }
  })
}

// Check if the character is in an active encounter
const encounterStore = useEncounterStore()
const isInEncounter = computed(() => {
  if (!encounterStore.encounter?.isActive) return false
  return encounterStore.encounter.combatants.some(
    c => c.entityId === props.character.id
  )
})
</script>

<style lang="scss" scoped>
.close-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}

.modal-overlay {
  @include modal-overlay-enhanced;
}

.modal {
  @include modal-container-enhanced;

  &--fullsheet {
    max-width: 900px;
  }

  &__header {
    background: linear-gradient(135deg, rgba($color-accent-violet, 0.1) 0%, transparent 100%);
  }

  &__footer {
    background: rgba($color-bg-primary, 0.5);
  }
}

.sheet {
  &__header {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $glass-border;
  }

  &__sprite, &__avatar {
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
    position: relative;

    img {
      max-width: 100%;
      max-height: 100%;
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

    .shiny-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      color: gold;
    }
  }

  &__title {
    flex: 1;
  }

  &__tabs {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;
    overflow-x: auto;
  }

  &__content {
    min-height: 300px;
  }
}

.tab-btn {
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: none;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  border-radius: $border-radius-md;
  transition: all $transition-fast;
  white-space: nowrap;

  &:hover {
    background: $color-bg-hover;
    color: $color-text;
  }

  &--active {
    background: $gradient-sv-cool;
    color: $color-text;
  }
}

.type-badges {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.type-badge {
  @include pokemon-sheet-type-badge;
}

.form-row {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  .form-group {
    flex: 1;

    &--sm {
      flex: 0 0 auto;
      min-width: 100px;
    }

    label {
      display: block;
      font-size: $font-size-xs;
      color: $color-text-muted;
      margin-bottom: $spacing-xs;
    }
  }
}

.form-input, .form-select {
  width: 100%;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }
}

</style>
