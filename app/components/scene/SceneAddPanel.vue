<template>
  <div class="add-panel" :class="{ 'add-panel--collapsed': collapsed }">
    <!-- Collapsed State -->
    <div v-if="collapsed" class="collapsed-strip" @click="emit('toggle-collapse')">
      <PhPlusCircle :size="20" />
    </div>

    <!-- Expanded State -->
    <template v-else>
      <div class="panel-header">
        <h3>Add to Scene</h3>
        <button class="btn btn--sm btn--ghost" @click="emit('toggle-collapse')">
          <PhCaretRight :size="16" />
        </button>
      </div>

      <div class="panel-content">
        <div class="add-tabs">
          <button
            class="add-tab"
            :class="{ 'add-tab--active': activeTab === 'characters' }"
            @click="activeTab = 'characters'"
          >
            Characters
          </button>
          <button
            class="add-tab"
            :class="{ 'add-tab--active': activeTab === 'pokemon' }"
            @click="activeTab = 'pokemon'"
          >
            Pokemon
          </button>
        </div>

        <!-- Characters List -->
        <div v-if="activeTab === 'characters'" class="add-list">
          <div
            v-for="char in availableCharacters"
            :key="char.id"
            class="add-item"
            @click="emit('add-character', char)"
          >
            <!-- deliberate: lightweight function in v-for, no per-item computed available -->
            <div class="add-item__avatar">
              <img v-if="getTrainerSpriteUrl(char.avatarUrl)" :src="getTrainerSpriteUrl(char.avatarUrl)!" :alt="char.name" />
              <PhUser v-else :size="20" />
            </div>
            <div class="add-item__info">
              <span class="name">{{ char.name }}</span>
              <span class="detail">{{ char.characterType }}</span>
            </div>
            <PhPlus :size="16" class="add-icon" />
          </div>
          <div v-if="availableCharacters.length === 0" class="empty-list">
            All characters are in the scene.
          </div>
        </div>

        <!-- Pokemon Tab -->
        <div v-if="activeTab === 'pokemon'" class="add-list">
          <ScenePokemonList
            :characters-with-pokemon="charactersWithPokemon"
            @add-pokemon="(species, level) => emit('add-pokemon', species, level)"
          />

          <!-- Manual Add Wild Pokemon -->
          <div class="wild-section">
            <label class="wild-label">Add Wild Pokemon</label>
            <div class="add-pokemon-form">
              <input
                v-model="species"
                type="text"
                placeholder="Species..."
                @keyup.enter="addPokemon"
              />
              <input
                v-model.number="level"
                type="number"
                min="1"
                max="100"
                placeholder="Lv"
                class="level-input"
              />
              <button class="btn btn--sm btn--primary" @click="addPokemon">
                <PhPlus :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhPlusCircle, PhCaretRight, PhUser, PhPlus } from '@phosphor-icons/vue'

interface AvailableCharacter {
  id: string
  name: string
  avatarUrl: string | null
  characterType: string
}

interface CharacterWithPokemon {
  id: string
  name: string
  characterType: string
  pokemon: Array<{
    id: string
    species: string
    nickname: string | null
    level: number
    shiny: boolean
  }>
}

defineProps<{
  availableCharacters: AvailableCharacter[]
  charactersWithPokemon: CharacterWithPokemon[]
  collapsed: boolean
}>()

const emit = defineEmits<{
  'add-character': [char: AvailableCharacter]
  'add-pokemon': [species: string, level: number]
  'toggle-collapse': []
}>()

const { getTrainerSpriteUrl } = useTrainerSprite()

const activeTab = ref<'characters' | 'pokemon'>('characters')
const species = ref('')
const level = ref(5)

const addPokemon = () => {
  if (!species.value) return
  emit('add-pokemon', species.value, level.value || 5)
  species.value = ''
  level.value = 5
}
</script>

<style lang="scss" scoped>
.add-panel {
  width: 280px;
  background: $color-bg-secondary;
  border-left: 1px solid $border-color-default;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;

  &--collapsed {
    width: 40px;
  }
}

.collapsed-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md $spacing-xs;
  gap: $spacing-sm;
  cursor: pointer;
  color: $color-text-muted;

  &:hover {
    color: $color-text;
    background: $color-bg-tertiary;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-default;

  h3 {
    margin: 0;
    font-size: $font-size-md;
    color: $color-text;
  }
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: $spacing-md;
}

.add-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  padding: 2px;
  flex-shrink: 0;
}

.add-tab {
  flex: 1;
  padding: $spacing-sm;
  background: transparent;
  border: none;
  color: $color-text-muted;
  font-size: $font-size-sm;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: all $transition-fast;

  &--active {
    background: $color-primary;
    color: white;
  }
}

.add-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.add-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: background $transition-fast;

  &:hover {
    background: $color-bg-tertiary;

    .add-icon {
      opacity: 1;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $color-bg-tertiary;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
  }

  &__info {
    flex: 1;

    .name {
      display: block;
      font-size: $font-size-sm;
      color: $color-text;
    }

    .detail {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }

  .add-icon {
    opacity: 0;
    color: $color-primary;
  }
}

.empty-list {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.wild-section {
  flex-shrink: 0;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color-default;
  margin-top: $spacing-md;
}

.wild-label {
  display: block;
  margin-bottom: $spacing-sm;
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-pokemon-form {
  display: flex;
  gap: $spacing-sm;

  input {
    flex: 1;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  .level-input {
    width: 50px;
    flex: none;
  }
}
</style>
