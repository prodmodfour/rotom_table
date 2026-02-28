<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal switch-modal">
      <div class="modal__header">
        <h2>Switch Pokemon</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <div class="modal__body">
        <!-- Current Pokemon being recalled -->
        <div class="switch-modal__section">
          <h3 class="switch-modal__label">Recalling</h3>
          <div class="switch-modal__recalled">
            <img
              :src="getSpriteUrl(recalledPokemonName, false)"
              :alt="recalledPokemonName"
              class="switch-modal__sprite"
            />
            <span class="switch-modal__name">{{ recalledDisplayName }}</span>
          </div>
        </div>

        <!-- Arrow indicator -->
        <div class="switch-modal__arrow">
          <img src="/icons/phosphor/arrow-clockwise.svg" alt="Switch" class="switch-modal__arrow-icon" />
        </div>

        <!-- Bench Pokemon selection -->
        <div class="switch-modal__section">
          <h3 class="switch-modal__label">Select Replacement</h3>

          <div v-if="loadingBench" class="switch-modal__loading">
            Loading bench Pokemon...
          </div>

          <div v-else-if="benchPokemon.length === 0" class="switch-modal__empty">
            No available Pokemon to switch in.
          </div>

          <div v-else class="switch-modal__bench">
            <div
              v-for="pokemon in benchPokemon"
              :key="pokemon.id"
              class="bench-card"
              :class="{ 'bench-card--selected': selectedReleaseId === pokemon.id }"
              @click="selectedReleaseId = pokemon.id"
            >
              <div class="bench-card__sprite">
                <img
                  :src="getSpriteUrl(pokemon.species, pokemon.shiny)"
                  :alt="pokemon.nickname || pokemon.species"
                />
              </div>
              <div class="bench-card__info">
                <span class="bench-card__name">{{ pokemon.nickname || pokemon.species }}</span>
                <span class="bench-card__level">Lv.{{ pokemon.level }}</span>
                <HealthBar
                  :current-hp="pokemon.currentHp"
                  :max-hp="pokemon.maxHp"
                  :show-exact-values="true"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Error display -->
        <div v-if="switchError" class="switch-modal__error">
          {{ switchError }}
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn--primary"
          :disabled="!selectedReleaseId || switchLoading"
          @click="confirmSwitch"
        >
          {{ switchLoading ? 'Switching...' : 'Confirm Switch' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types/character'

const props = defineProps<{
  trainerId: string
  pokemonCombatantId: string
  trainerEntityId: string
}>()

const emit = defineEmits<{
  close: []
  switched: []
}>()

const encounterStore = useEncounterStore()
const { getSpriteUrl } = usePokemonSprite()
const { getBenchPokemon, executeSwitch, loading: switchLoading, error: switchError } = useSwitching()

const selectedReleaseId = ref<string | null>(null)
const loadingBench = ref(true)
const benchPokemon = ref<Pokemon[]>([])

// Get the recalled Pokemon's display info
const recalledCombatant = computed(() =>
  encounterStore.encounter?.combatants.find(c => c.id === props.pokemonCombatantId)
)

const recalledPokemonName = computed(() => {
  if (!recalledCombatant.value || recalledCombatant.value.type !== 'pokemon') return ''
  return (recalledCombatant.value.entity as Pokemon).species
})

const recalledDisplayName = computed(() => {
  if (!recalledCombatant.value || recalledCombatant.value.type !== 'pokemon') return ''
  const entity = recalledCombatant.value.entity as Pokemon
  return entity.nickname || entity.species
})

// Load bench Pokemon on mount
onMounted(async () => {
  loadingBench.value = true
  benchPokemon.value = await getBenchPokemon(props.trainerEntityId)
  loadingBench.value = false
})

async function confirmSwitch() {
  if (!selectedReleaseId.value) return

  try {
    await executeSwitch(
      props.trainerId,
      props.pokemonCombatantId,
      selectedReleaseId.value
    )
    emit('switched')
    emit('close')
  } catch {
    // Error is already set by useSwitching composable
  }
}
</script>

<style lang="scss" scoped>
.switch-modal {
  max-width: 480px;
  width: 90vw;
}

.switch-modal__section {
  margin-bottom: $spacing-md;
}

.switch-modal__label {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: $spacing-sm;
}

.switch-modal__recalled {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-md;
}

.switch-modal__sprite {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}

.switch-modal__name {
  font-weight: 600;
  font-size: $font-size-md;
  color: $color-text;
}

.switch-modal__arrow {
  display: flex;
  justify-content: center;
  padding: $spacing-sm 0;
}

.switch-modal__arrow-icon {
  width: 24px;
  height: 24px;
  opacity: 0.6;
  filter: invert(1);
}

.switch-modal__loading,
.switch-modal__empty {
  padding: $spacing-lg;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.switch-modal__bench {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  max-height: 300px;
  overflow-y: auto;
}

.switch-modal__error {
  margin-top: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.15);
  border: 1px solid rgba($color-danger, 0.4);
  border-radius: $border-radius-sm;
  color: $color-danger;
  font-size: $font-size-sm;
}

// Bench Pokemon card
.bench-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $glass-bg;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-normal;

  &:hover {
    background: rgba($color-accent-scarlet, 0.05);
    border-color: rgba($color-accent-scarlet, 0.3);
  }

  &--selected {
    background: rgba($color-accent-scarlet, 0.1);
    border-color: $color-accent-scarlet;
  }

  &__sprite {
    width: 48px;
    height: 48px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-weight: 600;
    font-size: $font-size-md;
    color: $color-text;
    margin-bottom: 2px;
  }

  &__level {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }
}
</style>
