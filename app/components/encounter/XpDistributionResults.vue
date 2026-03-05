<template>
  <div class="results-section">
    <h3 class="section__title">XP Distribution Complete</h3>
    <div class="results-list">
      <div
        v-for="result in results"
        :key="result.pokemonId"
        class="result-row"
        :class="{ 'result-row--leveled': result.levelsGained > 0 }"
      >
        <div class="result-row__info">
          <span class="result-row__name">{{ result.species }}</span>
          <span class="result-row__xp">+{{ result.xpGained }} XP</span>
        </div>
        <div class="result-row__level">
          <span v-if="result.levelsGained > 0" class="result-row__levelup">
            Lv.{{ result.previousLevel }} -> Lv.{{ result.newLevel }}
          </span>
          <span v-else class="result-row__no-change">
            Lv.{{ result.newLevel }}
          </span>
        </div>
      </div>
    </div>
    <div class="results-total">
      Total XP Distributed: {{ totalXpDistributed }}
    </div>

    <!-- Level-Up Notification (detailed view for leveled Pokemon) -->
    <LevelUpNotification
      v-if="hasLevelUps"
      :results="results"
      @evolve-click="handleEvolveClick"
      @assign-ability="navigateToPokemonSheet"
      @learn-move="navigateToPokemonSheet"
    />

    <!-- Evolution Selection Modal (branching evolutions) -->
    <Teleport to="body">
      <div v-if="evolutionSelectionVisible" class="modal-overlay" @click.self="evolutionSelectionVisible = false">
        <div class="modal evolution-select-modal">
          <div class="modal__header">
            <h3>Choose Evolution</h3>
            <button class="modal__close" @click="evolutionSelectionVisible = false">&times;</button>
          </div>
          <div class="modal__body">
            <p class="evolution-select-prompt">This Pokemon can evolve into multiple forms. Select one:</p>
            <div class="evolution-options">
              <button
                v-for="option in pendingEvolutionOptions"
                :key="option.toSpecies"
                class="evolution-option"
                @click="selectEvolutionOption(option)"
              >
                <img
                  :src="getSpriteUrl(option.toSpecies, false)"
                  :alt="option.toSpecies"
                  class="evolution-option__sprite"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <span class="evolution-option__name">{{ option.toSpecies }}</span>
                <div class="evolution-option__types">
                  <span
                    v-for="t in option.targetTypes"
                    :key="t"
                    :class="['type-badge', `type-badge--${t.toLowerCase()}`]"
                  >{{ t }}</span>
                </div>
                <span v-if="option.requiredItem" class="evolution-option__item">
                  Requires: {{ option.requiredItem }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Evolution Confirmation Modal -->
    <EvolutionConfirmModal
      v-if="evolutionModal.visible"
      :pokemon-id="evolutionModal.pokemonId"
      :pokemon-name="evolutionModal.pokemonName"
      :current-species="evolutionModal.currentSpecies"
      :current-types="evolutionModal.currentTypes"
      :target-species="evolutionModal.targetSpecies"
      :target-types="evolutionModal.targetTypes"
      :current-level="evolutionModal.currentLevel"
      :current-max-hp="evolutionModal.currentMaxHp"
      :old-base-stats="evolutionModal.oldBaseStats"
      :target-raw-base-stats="evolutionModal.targetRawBaseStats"
      :nature-name="evolutionModal.natureName"
      :required-item="evolutionModal.requiredItem"
      :item-must-be-held="evolutionModal.itemMustBeHeld"
      :current-moves="evolutionModal.currentMoves"
      :ability-remap="evolutionModal.abilityRemap"
      :evolution-moves="evolutionModal.evolutionMoves"
      :owner-id="evolutionModal.ownerId"
      @close="evolutionModal.visible = false"
      @evolved="handleEvolved"
    />
  </div>
</template>

<script setup lang="ts">
import type { XpApplicationResult } from '~/utils/experienceCalculation'
import type { EvolutionStats as Stats, EvolutionMoveResult } from '~/utils/evolutionCheck'
import type { AbilityRemapResult } from '~/server/services/evolution.service'

const props = defineProps<{
  results: XpApplicationResult[]
  totalXpDistributed: number
}>()

const emit = defineEmits<{
  'pokemon-evolved': [result: Record<string, unknown>]
}>()

const router = useRouter()
const { showToast } = useGmToast()
const { getSpriteUrl } = usePokemonSprite()

const hasLevelUps = computed(() =>
  props.results.some(r => r.levelsGained > 0)
)

const emptyAbilityRemap: AbilityRemapResult = {
  remappedAbilities: [], needsResolution: [], preservedAbilities: []
}
const emptyEvolutionMoves: EvolutionMoveResult = {
  availableMoves: [], currentMoveCount: 0, maxMoves: 6, slotsAvailable: 6
}

// Evolution modal state
const evolutionModal = reactive({
  visible: false,
  pokemonId: '',
  pokemonName: '',
  currentSpecies: '',
  currentTypes: [] as string[],
  targetSpecies: '',
  targetTypes: [] as string[],
  currentLevel: 0,
  currentMaxHp: 0,
  oldBaseStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 } as Stats,
  targetRawBaseStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 } as Stats,
  natureName: '',
  requiredItem: null as string | null,
  itemMustBeHeld: false,
  currentMoves: [] as Array<Record<string, unknown>>,
  abilityRemap: emptyAbilityRemap as AbilityRemapResult,
  evolutionMoves: emptyEvolutionMoves as EvolutionMoveResult,
  ownerId: null as string | null
})

// Evolution selection state (branching evolutions)
interface EvolutionOptionData {
  toSpecies: string
  targetStage: number
  minimumLevel: number | null
  requiredItem: string | null
  itemMustBeHeld: boolean
  targetBaseStats: Stats | null
  targetTypes: string[]
  abilityRemap?: AbilityRemapResult
  evolutionMoves?: EvolutionMoveResult
}

const evolutionSelectionVisible = ref(false)
const pendingEvolutionOptions = ref<EvolutionOptionData[]>([])
const pendingPokemonData = ref<{
  id: string; species: string; nickname: string | null
  types: string[]; level: number; maxHp: number
  baseStats: Stats; nature: { name: string }
  ownerId?: string | null
} | null>(null)

// Stash check data for branching evolution selection
const lastCheckData = ref<{
  currentMoves: Array<Record<string, unknown>>
} | null>(null)

function openEvolutionConfirmModal(
  pokemon: typeof pendingPokemonData.value,
  evo: EvolutionOptionData
): void {
  if (!pokemon || !evo.targetBaseStats) {
    showToast('Target species data not found.', 'error')
    return
  }
  evolutionModal.pokemonId = pokemon.id
  evolutionModal.pokemonName = pokemon.nickname || pokemon.species
  evolutionModal.currentSpecies = pokemon.species
  evolutionModal.currentTypes = pokemon.types
  evolutionModal.targetSpecies = evo.toSpecies
  evolutionModal.targetTypes = evo.targetTypes
  evolutionModal.currentLevel = pokemon.level
  evolutionModal.currentMaxHp = pokemon.maxHp
  evolutionModal.oldBaseStats = pokemon.baseStats
  evolutionModal.targetRawBaseStats = evo.targetBaseStats
  evolutionModal.natureName = pokemon.nature.name
  evolutionModal.requiredItem = evo.requiredItem
  evolutionModal.itemMustBeHeld = evo.itemMustBeHeld
  evolutionModal.currentMoves = lastCheckData.value?.currentMoves || []
  evolutionModal.abilityRemap = evo.abilityRemap || emptyAbilityRemap
  evolutionModal.evolutionMoves = evo.evolutionMoves || emptyEvolutionMoves
  evolutionModal.ownerId = pokemon.ownerId || null
  evolutionModal.visible = true
}

function selectEvolutionOption(option: EvolutionOptionData): void {
  evolutionSelectionVisible.value = false
  openEvolutionConfirmModal(pendingPokemonData.value, option)
}

/**
 * Handle click on evolution entry in LevelUpNotification.
 * Fetches evolution check data and Pokemon details, then opens the modal.
 */
async function handleEvolveClick(payload: { pokemonId: string; species: string }): Promise<void> {
  try {
    // Fetch evolution check to get available evolutions with P1 data
    const checkResponse = await $fetch<{
      success: boolean
      data: {
        currentSpecies: string
        currentLevel: number
        heldItem: string | null
        preventedByItem: string | null
        currentMoves: Array<Record<string, unknown>>
        available: EvolutionOptionData[]
      }
    }>(`/api/pokemon/${payload.pokemonId}/evolution-check`, { method: 'POST' })

    // P2: Check for prevention items
    if (checkResponse.data.preventedByItem) {
      showToast(`This Pokemon cannot evolve while holding an ${checkResponse.data.preventedByItem}.`, 'warning')
      return
    }

    if (!checkResponse.success || checkResponse.data.available.length === 0) {
      showToast('No evolutions currently available for this Pokemon.', 'warning')
      return
    }

    // Stash P1 check data
    lastCheckData.value = {
      currentMoves: checkResponse.data.currentMoves
    }

    // Fetch Pokemon details for current stats (serialized format)
    const pokemonResponse = await $fetch<{
      success: boolean
      data: {
        id: string; species: string; nickname: string | null
        types: string[]
        level: number; maxHp: number
        baseStats: Stats
        nature: { name: string }
        ownerId?: string | null
      }
    }>(`/api/pokemon/${payload.pokemonId}`)

    if (!pokemonResponse.success) {
      showToast('Failed to load Pokemon data.', 'error')
      return
    }

    const pokemon = pokemonResponse.data

    if (checkResponse.data.available.length === 1) {
      openEvolutionConfirmModal(pokemon, checkResponse.data.available[0])
    } else {
      pendingPokemonData.value = pokemon
      pendingEvolutionOptions.value = checkResponse.data.available
      evolutionSelectionVisible.value = true
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check evolution'
    showToast(`Evolution check failed: ${message}`, 'error')
  }
}

function handleEvolved(result: Record<string, unknown>): void {
  emit('pokemon-evolved', result)
}

/** Navigate to the Pokemon sheet in edit mode for ability/move actions */
function navigateToPokemonSheet(payload: { pokemonId: string }): void {
  router.push(`/gm/pokemon/${payload.pokemonId}?edit=true`)
}
</script>

<style lang="scss" scoped>
.results-section {
  padding: $spacing-sm 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.result-row {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &--leveled {
    border-color: rgba($color-success, 0.4);
    background: linear-gradient(135deg, rgba($color-success, 0.05) 0%, $color-bg-tertiary 100%);
  }

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__xp {
    font-size: $font-size-sm;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__level {
    margin-bottom: $spacing-xs;
  }

  &__levelup {
    font-weight: 700;
    color: $color-success;
  }

  &__no-change {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.results-total {
  text-align: center;
  padding: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-accent-teal;
}

// Evolution selection modal
.modal-overlay {
  @include modal-overlay-enhanced;
}

.evolution-select-modal {
  @include modal-container-enhanced;
  max-width: 520px;
}

.evolution-select-prompt {
  font-size: $font-size-sm;
  color: $color-text-muted;
  margin-bottom: $spacing-md;
}

.evolution-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.evolution-option {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: border-color $transition-fast, background $transition-fast;
  text-align: left;
  width: 100%;
  color: $color-text;
  font: inherit;

  &:hover {
    border-color: rgba($color-warning, 0.5);
    background: rgba($color-warning, 0.05);
  }

  &__sprite {
    width: 48px;
    height: 48px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
    flex: 1;
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
  }

  &__item {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
  }
}

.type-badge {
  font-size: $font-size-xs;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-full;
  font-weight: 600;
  text-transform: uppercase;
  color: $color-text;

  &--fire { background: $type-fire; }
  &--water { background: $type-water; }
  &--grass { background: $type-grass; }
  &--electric { background: $type-electric; }
  &--ice { background: $type-ice; }
  &--fighting { background: $type-fighting; }
  &--poison { background: $type-poison; }
  &--ground { background: $type-ground; }
  &--flying { background: $type-flying; }
  &--psychic { background: $type-psychic; }
  &--bug { background: $type-bug; }
  &--rock { background: $type-rock; }
  &--ghost { background: $type-ghost; }
  &--dragon { background: $type-dragon; }
  &--dark { background: $type-dark; }
  &--steel { background: $type-steel; }
  &--fairy { background: $type-fairy; }
  &--normal { background: $type-normal; }
}
</style>
