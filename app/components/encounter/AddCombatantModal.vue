<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h2>Add {{ sideLabel }}</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <div class="modal__body">
        <!-- Tab Selection -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ 'tab--active': activeTab === 'pokemon' }"
            @click="activeTab = 'pokemon'"
          >
            Pokemon
          </button>
          <button
            class="tab"
            :class="{ 'tab--active': activeTab === 'human' }"
            @click="activeTab = 'human'"
          >
            Humans
          </button>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Search..."
          />
        </div>

        <!-- Entity List -->
        <div class="entity-list">
          <template v-if="activeTab === 'pokemon'">
            <div
              v-for="pokemon in filteredPokemon"
              :key="pokemon.id"
              class="entity-item"
              :class="{ 'entity-item--selected': selectedId === pokemon.id }"
              @click="selectEntity(pokemon.id, 'pokemon')"
            >
              <div class="entity-item__sprite">
                <img :src="getSpriteUrl(pokemon.species, pokemon.shiny)" :alt="pokemon.species" />
              </div>
              <div class="entity-item__info">
                <span class="entity-item__name">{{ pokemon.nickname || pokemon.species }}</span>
                <span class="entity-item__level">Lv.{{ pokemon.level }}</span>
              </div>
              <div class="entity-item__types">
                <span
                  v-for="type in pokemon.types"
                  :key="type"
                  class="type-badge type-badge--sm"
                  :class="`type-badge--${type.toLowerCase()}`"
                >
                  {{ type }}
                </span>
              </div>
            </div>
            <p v-if="filteredPokemon.length === 0" class="empty-message">
              No Pokemon found
            </p>
          </template>

          <template v-else>
            <div
              v-for="human in filteredHumans"
              :key="human.id"
              class="entity-item"
              :class="{ 'entity-item--selected': selectedId === human.id }"
              @click="selectEntity(human.id, 'human')"
            >
              <!-- deliberate: lightweight function in v-for, no per-item computed available -->
              <div class="entity-item__avatar">
                <img v-if="getTrainerSpriteUrl(human.avatarUrl)" :src="getTrainerSpriteUrl(human.avatarUrl)!" :alt="human.name" />
                <span v-else>{{ human.name.charAt(0) }}</span>
              </div>
              <div class="entity-item__info">
                <span class="entity-item__name">{{ human.name }}</span>
                <span class="entity-item__level">Lv.{{ human.level }}</span>
              </div>
              <span class="entity-item__type-badge" :class="`entity-item__type-badge--${human.characterType}`">
                {{ human.characterType }}
              </span>
            </div>
            <p v-if="filteredHumans.length === 0" class="empty-message">
              No characters found
            </p>
          </template>
        </div>

        <!-- Initiative Bonus -->
        <div v-if="selectedId" class="initiative-input">
          <label>Initiative Bonus</label>
          <input
            v-model.number="initiativeBonus"
            type="number"
            class="form-input"
            placeholder="0"
          />
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">Cancel</button>
        <button
          class="btn btn--primary"
          :disabled="!selectedId"
          @click="confirmAdd"
        >
          Add to Battle
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CombatSide } from '~/types'

const props = defineProps<{
  side: CombatSide
}>()

const emit = defineEmits<{
  close: []
  add: [entityId: string, entityType: 'pokemon' | 'human', initiativeBonus: number]
}>()

const libraryStore = useLibraryStore()
const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

const activeTab = ref<'pokemon' | 'human'>('pokemon')
const searchQuery = ref('')
const selectedId = ref<string | null>(null)
const selectedType = ref<'pokemon' | 'human'>('pokemon')
const initiativeBonus = ref(0)

const sideLabel = computed(() => {
  switch (props.side) {
    case 'players': return 'Player'
    case 'allies': return 'Ally'
    case 'enemies': return 'Enemy'
  }
})

const filteredPokemon = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return libraryStore.pokemon.filter(p =>
    p.species.toLowerCase().includes(query) ||
    (p.nickname?.toLowerCase().includes(query) ?? false)
  )
})

const filteredHumans = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return libraryStore.humans.filter(h =>
    h.name.toLowerCase().includes(query)
  )
})

const selectEntity = (id: string, type: 'pokemon' | 'human') => {
  selectedId.value = id
  selectedType.value = type
}

const confirmAdd = () => {
  if (selectedId.value) {
    emit('add', selectedId.value, selectedType.value, initiativeBonus.value)
  }
}
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
  max-height: 80vh;

  &__header {
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.1) 0%, transparent 100%);
  }

  &__footer {
    background: rgba($color-bg-primary, 0.5);
  }
}

.tabs {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  background: $color-bg-tertiary;
  padding: $spacing-xs;
  border-radius: $border-radius-md;
}

.tab {
  flex: 1;
  padding: $spacing-sm;
  background: transparent;
  border: none;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  cursor: pointer;
  transition: all $transition-fast;
  font-weight: 500;

  &:hover {
    color: $color-text;
    background: rgba($color-accent-scarlet, 0.1);
  }

  &--active {
    background: $gradient-sv-cool;
    color: $color-text;
    box-shadow: $shadow-sm;
  }
}

.search-bar {
  margin-bottom: $spacing-md;
}

.entity-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: $spacing-md;
  border-radius: $border-radius-md;
}

.entity-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  border: 1px solid transparent;
  margin-bottom: $spacing-xs;

  &:hover {
    background: $color-bg-hover;
  }

  &--selected {
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    border-color: $color-accent-scarlet;
    box-shadow: 0 0 10px rgba($color-accent-scarlet, 0.2);
  }

  &__sprite,
  &__avatar {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 1px solid $border-color-default;
    border-radius: $border-radius-md;
    overflow: hidden;

    img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }

    span {
      font-size: $font-size-lg;
      font-weight: 700;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-weight: 500;
    color: $color-text;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__types {
    display: flex;
    gap: $spacing-xs;

    .type-badge--sm {
      font-size: 0.6rem;
      padding: 1px 3px;
    }
  }

  &__type-badge {
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    text-transform: uppercase;
    font-weight: 700;

    &--player {
      background: linear-gradient(135deg, $color-side-player 0%, darken($color-side-player, 10%) 100%);
      box-shadow: 0 0 8px rgba($color-side-player, 0.3);
    }

    &--npc {
      background: linear-gradient(135deg, $color-side-enemy 0%, darken($color-side-enemy, 10%) 100%);
      box-shadow: 0 0 8px rgba($color-side-enemy, 0.3);
    }
  }
}

.empty-message {
  text-align: center;
  color: $color-text-muted;
  padding: $spacing-xl;
  font-style: italic;
}

.initiative-input {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  border: 1px solid $border-color-default;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 500;
  }

  input {
    width: 100px;
  }
}

</style>
