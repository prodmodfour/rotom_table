<template>
  <div class="pokemon-sheet-page">
    <div class="sheet-header">
      <NuxtLink to="/gm/sheets" class="back-link">
        ← Back to Sheets
      </NuxtLink>
      <div class="sheet-header__actions">
        <template v-if="!isEditing">
          <button
            v-if="pokemon && canUndo(pokemon.id)"
            class="btn btn--secondary"
            @click="handleUndoEvolution"
          >
            Undo Evolution
          </button>
          <button class="btn btn--warning" @click="checkEvolution" :disabled="checkingEvolution">
            <PhArrowCircleUp :size="16" />
            Evolve
          </button>
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

    <div v-else-if="pokemon" class="sheet pokemon-sheet">
      <!-- Header with sprite and basic info -->
      <PokemonEditForm
        :pokemon="pokemon"
        :edit-data="editData"
        :is-editing="isEditing"
        :sprite-url="spriteUrl"
        @update:edit-data="editData = $event"
      />

      <!-- Level-Up Info Panel (shown when level increases in edit mode) -->
      <PokemonLevelUpPanel
        v-if="isEditing"
        :pokemon-id="pokemon.id"
        :current-level="pokemon.level"
        :target-level="editData.level"
        :pokemon="pokemon"
        @allocated="loadPokemon"
        @ability-assigned="loadPokemon"
        @move-learned="loadPokemon"
      />

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
        <!-- Stats Tab -->
        <PokemonStatsTab
          v-if="activeTab === 'stats'"
          :pokemon="pokemon"
          :edit-data="editData"
          :is-editing="isEditing"
          @update:edit-data="editData = { ...editData, ...$event }"
        />

        <!-- Moves Tab -->
        <PokemonMovesTab
          v-if="activeTab === 'moves'"
          :pokemon="pokemon"
          :last-move-roll="lastMoveRoll"
          :get-move-damage-formula="getMoveDamageFormula"
          @roll-attack="rollAttack"
          @roll-damage="(move, isCrit) => rollDamage(move, isCrit)"
        />

        <!-- Abilities Tab -->
        <div v-if="activeTab === 'abilities'" class="tab-content">
          <div class="abilities-list">
            <div v-for="(ability, idx) in pokemon.abilities" :key="idx" class="ability-card">
              <div class="ability-card__header">
                <span class="ability-name">{{ ability.name }}</span>
                <span v-if="ability.trigger" class="ability-trigger">{{ ability.trigger }}</span>
              </div>
              <p class="ability-effect">{{ ability.effect }}</p>
            </div>
            <p v-if="!pokemon.abilities?.length" class="empty-state">No abilities recorded</p>
          </div>
        </div>

        <!-- Capabilities Tab -->
        <PokemonCapabilitiesTab
          v-if="activeTab === 'capabilities'"
          :pokemon="pokemon"
        />

        <!-- Skills Tab -->
        <PokemonSkillsTab
          v-if="activeTab === 'skills'"
          :pokemon="pokemon"
          :last-skill-roll="lastSkillRoll"
          @roll-skill="(skill, notation) => rollSkill(skill, notation)"
        />

        <!-- Healing Tab -->
        <div v-if="activeTab === 'healing'" class="tab-content">
          <HealingTab
            entity-type="pokemon"
            :entity-id="pokemon.id"
            :entity="pokemon"
            @healed="loadPokemon"
          />
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="editData.notes" class="form-input" rows="6" :disabled="!isEditing"></textarea>
          </div>
          <div class="form-group">
            <label>Held Item</label>
            <input v-model="editData.heldItem" type="text" class="form-input" :disabled="!isEditing" />
          </div>
        </div>
      </div>
    </div>

    <!-- Evolution Selection Modal (branching evolutions) -->
    <Teleport to="body">
      <div v-if="evolutionSelection.visible" class="modal-overlay" @click.self="evolutionSelection.visible = false">
        <div class="modal evolution-select-modal">
          <div class="modal__header">
            <h3>
              <PhArrowCircleUp :size="20" class="header-icon" />
              Choose Evolution
            </h3>
            <button class="modal__close" @click="evolutionSelection.visible = false">&times;</button>
          </div>
          <div class="modal__body">
            <p class="evolution-select-prompt">{{ pokemon?.nickname || pokemon?.species }} can evolve into multiple forms. Select one:</p>
            <div class="evolution-options">
              <button
                v-for="option in evolutionSelection.options"
                :key="option.toSpecies"
                class="evolution-option"
                @click="selectEvolution(option)"
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
      v-if="evolutionModal.visible && pokemon"
      :pokemon-id="pokemon.id"
      :pokemon-name="pokemon.nickname || pokemon.species"
      :current-species="pokemon.species"
      :current-types="pokemon.types"
      :target-species="evolutionModal.targetSpecies"
      :target-types="evolutionModal.targetTypes"
      :current-level="pokemon.level"
      :current-max-hp="pokemon.maxHp"
      :old-base-stats="pokemon.baseStats"
      :target-raw-base-stats="evolutionModal.targetRawBaseStats"
      :nature-name="pokemon.nature.name"
      :required-item="evolutionModal.requiredItem"
      :item-must-be-held="evolutionModal.itemMustBeHeld"
      :current-moves="evolutionModal.currentMoves"
      :ability-remap="evolutionModal.abilityRemap"
      :evolution-moves="evolutionModal.evolutionMoves"
      :owner-id="pokemon.ownerId"
      @close="evolutionModal.visible = false"
      @evolved="handleEvolved"
    />
  </div>
</template>

<script setup lang="ts">
import { PhArrowCircleUp } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'
import type { EvolutionStats as Stats, EvolutionMoveResult } from '~/utils/evolutionCheck'
import type { AbilityRemapResult } from '~/server/services/evolution.service'

definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const { getSpriteUrl } = usePokemonSprite()

const pokemonId = computed(() => route.params.id as string)

// State
const pokemon = ref<Pokemon | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const editData = ref<Partial<Pokemon>>({})
const activeTab = ref('stats')

// Dice rolling (extracted composable)
const { lastSkillRoll, lastMoveRoll, rollSkill, rollAttack, rollDamage, getMoveDamageFormula } = usePokemonSheetRolls(pokemon)

// Check for edit mode from query param
onMounted(async () => {
  if (route.query.edit === 'true') {
    isEditing.value = true
  }
  await loadPokemon()
})

// Watch for route param changes
watch(pokemonId, async () => {
  await loadPokemon()
})

const loadPokemon = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{ success: boolean; data: Pokemon }>(`/api/pokemon/${pokemonId.value}`)
    pokemon.value = response.data
    editData.value = { ...response.data }

    useHead({
      title: `GM - ${response.data.nickname || response.data.species}`
    })
  } catch (e) {
    error.value = 'Pokemon not found'
    console.error('Failed to load Pokemon:', e)
  } finally {
    loading.value = false
  }
}

const spriteUrl = computed(() => {
  if (!pokemon.value) return ''
  return getSpriteUrl(pokemon.value.species, pokemon.value.shiny)
})

// Tabs
const pokemonTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'moves', label: 'Moves' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'healing', label: 'Healing' },
  { id: 'notes', label: 'Notes' }
]

// Edit mode
const startEditing = () => {
  editData.value = { ...pokemon.value }
  isEditing.value = true
  // Update URL without navigation
  router.replace({ query: { edit: 'true' } })
}

const cancelEditing = () => {
  editData.value = { ...pokemon.value }
  isEditing.value = false
  router.replace({ query: {} })
}

// Evolution
const checkingEvolution = ref(false)

const emptyAbilityRemap: AbilityRemapResult = {
  remappedAbilities: [], needsResolution: [], preservedAbilities: []
}
const emptyEvolutionMoves: EvolutionMoveResult = {
  availableMoves: [], currentMoveCount: 0, maxMoves: 6, slotsAvailable: 6
}

const evolutionModal = reactive({
  visible: false,
  targetSpecies: '',
  targetTypes: [] as string[],
  targetRawBaseStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 } as Stats,
  requiredItem: null as string | null,
  itemMustBeHeld: false,
  currentMoves: [] as Array<Record<string, unknown>>,
  abilityRemap: emptyAbilityRemap as AbilityRemapResult,
  evolutionMoves: emptyEvolutionMoves as EvolutionMoveResult
})

interface EvolutionOption {
  toSpecies: string
  requiredItem: string | null
  itemMustBeHeld: boolean
  targetBaseStats: Stats | null
  targetTypes: string[]
  abilityRemap?: AbilityRemapResult
  evolutionMoves?: EvolutionMoveResult
}

const evolutionSelection = reactive({
  visible: false,
  options: [] as EvolutionOption[]
})

function openEvolutionModal(evo: EvolutionOption, checkData?: EvolutionCheckData): void {
  if (!evo.targetBaseStats) {
    alert('Target species data not found.')
    return
  }
  evolutionModal.targetSpecies = evo.toSpecies
  evolutionModal.targetTypes = evo.targetTypes
  evolutionModal.targetRawBaseStats = evo.targetBaseStats
  evolutionModal.requiredItem = evo.requiredItem
  evolutionModal.itemMustBeHeld = evo.itemMustBeHeld
  evolutionModal.currentMoves = checkData?.currentMoves || pokemon.value?.moves || []
  evolutionModal.abilityRemap = evo.abilityRemap || emptyAbilityRemap
  evolutionModal.evolutionMoves = evo.evolutionMoves || emptyEvolutionMoves
  evolutionModal.visible = true
}

interface EvolutionCheckData {
  currentMoves: Array<Record<string, unknown>>
}

// Stash the check data so we can pass it through to the modal
const lastCheckData = ref<EvolutionCheckData | null>(null)

function selectEvolution(option: EvolutionOption): void {
  evolutionSelection.visible = false
  openEvolutionModal(option, lastCheckData.value || undefined)
}

const checkEvolution = async () => {
  if (!pokemon.value) return
  checkingEvolution.value = true

  try {
    const response = await $fetch<{
      success: boolean
      data: {
        currentMoves: Array<Record<string, unknown>>
        preventedByItem: string | null
        available: EvolutionOption[]
        ineligible: Array<{
          toSpecies: string
          reason: string
        }>
      }
    }>(`/api/pokemon/${pokemon.value.id}/evolution-check`, { method: 'POST' })

    if (!response.success) {
      alert('Failed to check evolution eligibility.')
      return
    }

    // P2: Check for prevention items (Everstone/Eviolite)
    if (response.data.preventedByItem) {
      alert(`This Pokemon cannot evolve while holding an ${response.data.preventedByItem}.`)
      return
    }

    // Stash P1 check data
    lastCheckData.value = {
      currentMoves: response.data.currentMoves
    }

    if (response.data.available.length === 0) {
      if (response.data.ineligible.length > 0) {
        const reasons = response.data.ineligible
          .map(i => `${i.toSpecies}: ${i.reason}`)
          .join('\n')
        alert(`No evolutions currently available.\n\n${reasons}`)
      } else {
        alert('This Pokemon has no evolution paths.')
      }
      return
    }

    if (response.data.available.length === 1) {
      openEvolutionModal(response.data.available[0], lastCheckData.value)
    } else {
      evolutionSelection.options = response.data.available
      evolutionSelection.visible = true
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check evolution'
    alert(`Evolution check failed: ${message}`)
  } finally {
    checkingEvolution.value = false
  }
}

// P2: Evolution undo support
const { recordEvolution, canUndo, undoEvolution } = useEvolutionUndo()

const handleEvolved = async (result: Record<string, unknown>) => {
  // P2: Record undo snapshot if available
  if (result?.undoSnapshot && pokemon.value) {
    recordEvolution(
      pokemon.value.id,
      result.undoSnapshot as Record<string, unknown> as import('~/server/services/evolution.service').PokemonSnapshot
    )
  }
  // Reload Pokemon data after evolution
  await loadPokemon()
}

const handleUndoEvolution = async () => {
  if (!pokemon.value) return
  if (!confirm('Undo this evolution? The Pokemon will be reverted to its previous form.')) return
  const success = await undoEvolution(pokemon.value.id)
  if (success) {
    await loadPokemon()
  }
}

const saveChanges = async () => {
  if (!pokemon.value) return

  saving.value = true
  try {
    await libraryStore.updatePokemon(pokemon.value.id, editData.value)
    // Reload to get fresh data
    await loadPokemon()
    isEditing.value = false
    router.replace({ query: {} })
  } catch (e) {
    console.error('Failed to save Pokemon:', e)
    alert('Failed to save changes')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.pokemon-sheet-page {
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
}

.tab-btn {
  @include sheet-tab-btn;
}

.tab-content {
  @include sheet-tab-content;
}

.abilities-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.ability-card {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .ability-name {
      font-weight: 600;
    }

    .ability-trigger {
      font-size: $font-size-xs;
      padding: $spacing-xs $spacing-sm;
      background: $color-bg-tertiary;
      border-radius: $border-radius-sm;
      color: $color-text-muted;
    }
  }

  .ability-effect {
    font-size: $font-size-sm;
    line-height: 1.5;
    margin: 0;
  }
}

.empty-state {
  @include sheet-empty-state;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Evolution selection modal
.modal-overlay {
  @include modal-overlay-enhanced;
}

.evolution-select-modal {
  @include modal-container-enhanced;
  max-width: 520px;

  .header-icon {
    color: $color-warning;
    vertical-align: middle;
  }
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
