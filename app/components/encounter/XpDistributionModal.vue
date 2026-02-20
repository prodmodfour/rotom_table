<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="xp-modal">
      <div class="xp-modal__header">
        <h2>Post-Combat XP Distribution</h2>
        <button class="btn btn--icon btn--secondary" @click="handleClose">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <!-- Distribution Phase -->
      <div v-if="phase === 'configure'" class="xp-modal__body">
        <!-- XP Already Distributed Warning -->
        <div v-if="xpAlreadyDistributed" class="xp-warning">
          <img src="/icons/phosphor/warning.svg" alt="" class="warning-icon" />
          <span>XP has already been distributed for this encounter. Distributing again will add additional XP.</span>
        </div>

        <!-- Defeated Enemies Section -->
        <div class="section">
          <h3 class="section__title">Defeated Enemies</h3>
          <div class="enemies-list">
            <div
              v-for="(enemy, index) in defeatedEnemies"
              :key="index"
              class="enemy-tag"
            >
              <span class="enemy-tag__name">{{ enemy.species }}</span>
              <span class="enemy-tag__level">Lv.{{ enemy.level }}</span>
              <span
                class="enemy-tag__type"
                :class="enemy.type === 'human' ? 'enemy-tag__type--trainer' : 'enemy-tag__type--pokemon'"
              >
                {{ enemy.type === 'human' ? 'Trainer' : 'Pokemon' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Configuration Section -->
        <div class="section">
          <h3 class="section__title">XP Parameters</h3>
          <div class="config-grid">
            <!-- Significance Multiplier -->
            <div class="config-field">
              <label class="config-field__label">Significance</label>
              <div class="config-field__row">
                <select
                  v-model="selectedPreset"
                  class="form-select"
                >
                  <option v-for="(value, key) in SIGNIFICANCE_PRESETS" :key="key" :value="key">
                    {{ formatPresetLabel(key) }} (x{{ value }})
                  </option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  v-if="selectedPreset === 'custom'"
                  v-model.number="customMultiplier"
                  type="number"
                  class="form-input form-input--sm"
                  min="0.5"
                  max="10"
                  step="0.5"
                  placeholder="x2"
                />
              </div>
            </div>

            <!-- Player Count -->
            <div class="config-field">
              <label class="config-field__label">Players</label>
              <input
                v-model.number="playerCount"
                type="number"
                class="form-input form-input--sm"
                min="1"
                max="20"
              />
            </div>

            <!-- Boss Encounter -->
            <div class="config-field">
              <label class="config-field__label">Boss Encounter</label>
              <label class="toggle">
                <input v-model="isBossEncounter" type="checkbox" />
                <span class="toggle__text">{{ isBossEncounter ? 'Yes (no division)' : 'No' }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- XP Calculation Summary -->
        <div class="section xp-summary">
          <div class="xp-summary__row">
            <span class="xp-summary__label">Base XP (enemy levels)</span>
            <span class="xp-summary__value">{{ calculationResult?.breakdown.enemyLevelsTotal ?? 0 }}</span>
          </div>
          <div class="xp-summary__row">
            <span class="xp-summary__label">x{{ effectiveMultiplier }} significance</span>
            <span class="xp-summary__value">{{ calculationResult?.breakdown.multipliedXp ?? 0 }}</span>
          </div>
          <div v-if="!isBossEncounter" class="xp-summary__row">
            <span class="xp-summary__label">/ {{ playerCount }} players</span>
            <span class="xp-summary__value">{{ calculationResult?.totalXpPerPlayer ?? 0 }}</span>
          </div>
          <div class="xp-summary__row xp-summary__row--total">
            <span class="xp-summary__label">XP Per Player</span>
            <span class="xp-summary__value xp-summary__value--highlight">
              {{ calculationResult?.totalXpPerPlayer ?? 0 }}
            </span>
          </div>
        </div>

        <!-- Per-Player Distribution -->
        <div v-if="calculationResult && playerGroups.length > 0" class="section">
          <h3 class="section__title">Distribution</h3>
          <div class="player-groups">
            <div
              v-for="group in playerGroups"
              :key="group.ownerId"
              class="player-group"
            >
              <div class="player-group__header">
                <span class="player-group__name">{{ group.ownerName }}</span>
                <span
                  class="player-group__remaining"
                  :class="{
                    'player-group__remaining--over': getPlayerRemaining(group.ownerId) < 0,
                    'player-group__remaining--exact': getPlayerRemaining(group.ownerId) === 0
                  }"
                >
                  {{ getPlayerRemaining(group.ownerId) }} / {{ xpPerPlayer }} remaining
                </span>
              </div>
              <div class="player-group__pokemon">
                <div
                  v-for="pokemon in group.pokemon"
                  :key="pokemon.id"
                  class="pokemon-xp-row"
                >
                  <div class="pokemon-xp-row__info">
                    <span class="pokemon-xp-row__name">
                      {{ pokemon.nickname || pokemon.species }}
                    </span>
                    <span class="pokemon-xp-row__level">Lv.{{ pokemon.currentLevel }}</span>
                  </div>
                  <div class="pokemon-xp-row__input">
                    <input
                      :value="getXpAllocation(pokemon.id)"
                      type="number"
                      class="form-input form-input--sm"
                      min="0"
                      :max="xpPerPlayer"
                      @input="handleXpInput(pokemon.id, $event)"
                    />
                  </div>
                  <div class="pokemon-xp-row__preview">
                    <span class="pokemon-xp-row__exp">
                      {{ pokemon.currentExperience }} + {{ getXpAllocation(pokemon.id) }}
                    </span>
                    <span
                      v-if="getLevelUpPreview(pokemon)"
                      class="pokemon-xp-row__levelup"
                    >
                      LEVEL UP! -> {{ getLevelUpPreview(pokemon) }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Even split button -->
              <button
                class="btn btn--ghost btn--sm"
                @click="splitEvenly(group)"
              >
                Split Evenly
              </button>
            </div>
          </div>
        </div>

        <!-- No participating Pokemon warning -->
        <div v-if="calculationResult && playerGroups.length === 0" class="empty-state">
          <p>No player-side Pokemon found in this encounter.</p>
          <p class="empty-state__hint">XP can only be distributed to Pokemon that participated.</p>
        </div>

        <!-- Loading state -->
        <div v-if="isCalculating" class="loading-state">
          Calculating XP...
        </div>

        <!-- Calculation error -->
        <div v-if="calculationError" class="error-state">
          {{ calculationError }}
        </div>
      </div>

      <!-- Results Phase -->
      <div v-if="phase === 'results'" class="xp-modal__body">
        <div class="results-section">
          <h3 class="section__title">XP Distribution Complete</h3>
          <div class="results-list">
            <div
              v-for="result in distributionResults"
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
              <!-- Level-up details -->
              <div v-if="result.levelUps.length > 0" class="result-row__details">
                <div v-for="lu in result.levelUps" :key="lu.newLevel" class="levelup-detail">
                  <span class="levelup-detail__level">Level {{ lu.newLevel }}:</span>
                  <span class="levelup-detail__stat">+1 Stat Point</span>
                  <span v-if="lu.tutorPointGained" class="levelup-detail__tutor">+1 Tutor Point</span>
                  <span
                    v-for="move in lu.newMovesAvailable"
                    :key="move"
                    class="levelup-detail__move"
                  >
                    New Move: {{ move }}
                  </span>
                  <span v-if="lu.newAbilitySlot" class="levelup-detail__ability">
                    {{ lu.newAbilitySlot === 'second' ? '2nd Ability Slot' : '3rd Ability Slot' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="results-total">
            Total XP Distributed: {{ totalDistributed }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="xp-modal__footer">
        <template v-if="phase === 'configure'">
          <button class="btn btn--secondary" @click="handleSkip">
            Skip XP
          </button>
          <button
            class="btn btn--primary"
            :disabled="!canApply"
            @click="handleApply"
          >
            {{ isDistributing ? 'Distributing...' : 'Apply XP' }}
          </button>
        </template>
        <template v-else>
          <button class="btn btn--primary" @click="handleFinish">
            Continue
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  SIGNIFICANCE_PRESETS,
  getLevelForXp
} from '~/utils/experienceCalculation'
import type {
  SignificancePreset,
  XpCalculationResult,
  XpApplicationResult
} from '~/utils/experienceCalculation'
import type { Encounter } from '~/types'

interface ParticipatingPokemon {
  id: string
  species: string
  nickname: string | null
  currentLevel: number
  currentExperience: number
  ownerId: string | null
  ownerName: string | null
}

interface PlayerGroup {
  ownerId: string
  ownerName: string
  pokemon: ParticipatingPokemon[]
}

const props = defineProps<{
  encounter: Encounter
}>()

const emit = defineEmits<{
  skip: []
  complete: []
  close: []
}>()

const encounterStore = useEncounterStore()

// Phase: 'configure' or 'results'
const phase = ref<'configure' | 'results'>('configure')

// Guard flag: suppress watcher-triggered recalculations during initialization
const initialized = ref(false)

// Configuration state
const selectedPreset = ref<SignificancePreset | 'custom'>('average')
const customMultiplier = ref(2)
const isBossEncounter = ref(false)
const isCalculating = ref(false)
const isDistributing = ref(false)
const calculationError = ref<string | null>(null)

// Calculation results
const calculationResult = ref<{
  totalXpPerPlayer: number
  breakdown: XpCalculationResult['breakdown']
  participatingPokemon: ParticipatingPokemon[]
} | null>(null)

// Distribution results
const distributionResults = ref<XpApplicationResult[]>([])
const totalDistributed = ref(0)

// XP allocation map: pokemonId -> xpAmount
const xpAllocations = ref<Map<string, number>>(new Map())

// Defeated enemies from encounter
const defeatedEnemies = computed(() => props.encounter.defeatedEnemies)

// Whether XP was already distributed
const xpAlreadyDistributed = computed(() => props.encounter.xpDistributed === true)

// Auto-detect player count from unique owners of player-side Pokemon combatants
const detectedPlayerCount = computed(() => {
  const playerPokemon = props.encounter.combatants.filter(
    c => c.side === 'players' && c.type === 'pokemon'
  )
  const ownerIds = new Set(
    playerPokemon
      .map(c => (c.entity as { ownerId?: string }).ownerId)
      .filter(Boolean)
  )
  return Math.max(1, ownerIds.size)
})

const playerCount = ref(1)

// Effective significance multiplier
const effectiveMultiplier = computed(() => {
  if (selectedPreset.value === 'custom') return customMultiplier.value
  return SIGNIFICANCE_PRESETS[selectedPreset.value]
})

// XP per player from the latest calculation
const xpPerPlayer = computed(() => calculationResult.value?.totalXpPerPlayer ?? 0)

// Group participating Pokemon by owner
const playerGroups = computed((): PlayerGroup[] => {
  if (!calculationResult.value) return []

  const groups = new Map<string, PlayerGroup>()

  for (const pokemon of calculationResult.value.participatingPokemon) {
    const ownerId = pokemon.ownerId ?? 'unowned'
    const ownerName = pokemon.ownerName ?? 'Unowned'

    if (!groups.has(ownerId)) {
      groups.set(ownerId, {
        ownerId,
        ownerName,
        pokemon: []
      })
    }
    groups.get(ownerId)!.pokemon.push(pokemon)
  }

  return Array.from(groups.values())
})

// Per-player validation: remaining XP for a given owner
const getPlayerRemaining = (ownerId: string): number => {
  const group = playerGroups.value.find(g => g.ownerId === ownerId)
  if (!group) return 0

  const totalAllocated = group.pokemon.reduce(
    (sum, p) => sum + (xpAllocations.value.get(p.id) ?? 0),
    0
  )
  return xpPerPlayer.value - totalAllocated
}

// Check if any player exceeds their allocation
const hasOverAllocation = computed(() => {
  return playerGroups.value.some(group => getPlayerRemaining(group.ownerId) < 0)
})

// Can apply: has at least some XP allocated and no over-allocations
const canApply = computed(() => {
  if (isDistributing.value || isCalculating.value) return false
  if (hasOverAllocation.value) return false

  const totalAllocated = Array.from(xpAllocations.value.values()).reduce(
    (sum, val) => sum + val, 0
  )
  return totalAllocated > 0
})

// Get XP allocation for a specific Pokemon
const getXpAllocation = (pokemonId: string): number => {
  return xpAllocations.value.get(pokemonId) ?? 0
}

// Handle XP input change for a Pokemon
const handleXpInput = (pokemonId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = Math.max(0, Math.floor(Number(input.value) || 0))
  const newMap = new Map(xpAllocations.value)
  newMap.set(pokemonId, value)
  xpAllocations.value = newMap
}

// Preview level-up for a Pokemon (returns new level or null if no change)
const getLevelUpPreview = (pokemon: ParticipatingPokemon): number | null => {
  const xpToAdd = getXpAllocation(pokemon.id)
  if (xpToAdd <= 0) return null

  const newXp = pokemon.currentExperience + xpToAdd
  const newLevel = getLevelForXp(newXp)
  if (newLevel > pokemon.currentLevel) return newLevel
  return null
}

// Split XP evenly among a player's Pokemon
const splitEvenly = (group: PlayerGroup) => {
  const perPokemon = Math.floor(xpPerPlayer.value / group.pokemon.length)
  const remainder = xpPerPlayer.value - (perPokemon * group.pokemon.length)

  const newMap = new Map(xpAllocations.value)
  group.pokemon.forEach((pokemon, index) => {
    // Give the remainder to the first Pokemon
    newMap.set(pokemon.id, index === 0 ? perPokemon + remainder : perPokemon)
  })
  xpAllocations.value = newMap
}

// Format preset label for display
const formatPresetLabel = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Recalculate XP from the server
const recalculate = async () => {
  isCalculating.value = true
  calculationError.value = null

  try {
    const result = await encounterStore.calculateXp({
      significanceMultiplier: effectiveMultiplier.value,
      playerCount: playerCount.value,
      isBossEncounter: isBossEncounter.value
    })

    calculationResult.value = result

    // Initialize allocations for new Pokemon (don't overwrite existing)
    const newMap = new Map(xpAllocations.value)
    for (const pokemon of result.participatingPokemon) {
      if (!newMap.has(pokemon.id)) {
        newMap.set(pokemon.id, 0)
      }
    }
    xpAllocations.value = newMap
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to calculate XP'
    calculationError.value = message
  } finally {
    isCalculating.value = false
  }
}

// Handle Apply XP
const handleApply = async () => {
  if (!canApply.value) return

  isDistributing.value = true

  try {
    // Build distribution array (only Pokemon with XP > 0)
    const distribution = Array.from(xpAllocations.value.entries())
      .filter(([, xp]) => xp > 0)
      .map(([pokemonId, xpAmount]) => ({ pokemonId, xpAmount }))

    const result = await encounterStore.distributeXp({
      significanceMultiplier: effectiveMultiplier.value,
      playerCount: playerCount.value,
      isBossEncounter: isBossEncounter.value,
      distribution
    })

    distributionResults.value = result.results
    totalDistributed.value = result.totalXpDistributed
    phase.value = 'results'
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to distribute XP'
    alert(`XP distribution failed: ${message}`)
  } finally {
    isDistributing.value = false
  }
}

// Handle Skip XP
const handleSkip = () => {
  emit('skip')
}

// Handle Finish (after viewing results)
const handleFinish = () => {
  emit('complete')
}

// Handle close (X button)
const handleClose = () => {
  if (phase.value === 'results') {
    emit('complete')
  } else {
    emit('close')
  }
}

// Watch multiplier/playerCount/boss and recalculate (guarded by initialized flag)
watch(effectiveMultiplier, () => { if (initialized.value) recalculate() })
watch(playerCount, () => { if (initialized.value) recalculate() })
watch(isBossEncounter, () => { if (initialized.value) recalculate() })
watch(customMultiplier, () => {
  if (initialized.value && selectedPreset.value === 'custom') recalculate()
})

// Initial calculation on mount
onMounted(async () => {
  // Set detected player count before first API call to avoid double-fetch
  playerCount.value = detectedPlayerCount.value
  await recalculate()
  initialized.value = true
})
</script>

<style lang="scss" scoped>
.close-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}

.warning-icon {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.modal-overlay {
  @include modal-overlay-enhanced;
}

.xp-modal {
  @include modal-container-enhanced;
  max-width: 680px;
  max-height: 85vh;

  &__header {
    background: linear-gradient(135deg, rgba($color-accent-teal, 0.1) 0%, transparent 100%);
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-top: 1px solid $glass-border;
    background: rgba($color-bg-primary, 0.5);
  }
}

// Sections
.section {
  margin-bottom: $spacing-lg;

  &__title {
    font-size: $font-size-sm;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }
}

// XP Warning Banner
.xp-warning {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-lg;
  background: rgba($color-warning, 0.15);
  border: 1px solid rgba($color-warning, 0.3);
  border-radius: $border-radius-md;
  color: $color-warning;
  font-size: $font-size-sm;
}

// Defeated Enemies
.enemies-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.enemy-tag {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &__name {
    font-weight: 500;
    color: $color-text;
  }

  &__level {
    color: $color-text-muted;
    font-size: $font-size-xs;
  }

  &__type {
    font-size: $font-size-xs;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px $spacing-xs;
    border-radius: 3px;

    &--pokemon {
      background: rgba($color-accent-teal, 0.2);
      color: $color-accent-teal;
    }

    &--trainer {
      background: rgba($color-accent-scarlet, 0.2);
      color: $color-accent-scarlet;
    }
  }
}

// Configuration Grid
.config-grid {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: $spacing-md;
  align-items: end;
}

.config-field {
  &__label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 500;
    margin-bottom: $spacing-xs;
  }

  &__row {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }
}

.form-select {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }
}

.form-input--sm {
  width: 80px;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }
}

// Toggle
.toggle {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;

  input {
    accent-color: $color-accent-teal;
    width: 16px;
    height: 16px;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

// XP Summary
.xp-summary {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-xs 0;

    &--total {
      border-top: 1px solid $border-color-default;
      margin-top: $spacing-xs;
      padding-top: $spacing-sm;
    }
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__value {
    font-weight: 600;
    color: $color-text;

    &--highlight {
      font-size: $font-size-lg;
      color: $color-accent-teal;
    }
  }
}

// Player Groups
.player-groups {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.player-group {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $border-color-subtle;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__remaining {
    font-size: $font-size-xs;
    color: $color-text-muted;

    &--over {
      color: $color-danger;
      font-weight: 700;
    }

    &--exact {
      color: $color-success;
    }
  }

  &__pokemon {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
  }
}

// Pokemon XP Row
.pokemon-xp-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: $spacing-sm;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  transition: background $transition-fast;

  &:hover {
    background: rgba($color-bg-hover, 0.5);
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-weight: 500;
    color: $color-text;
    font-size: $font-size-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__input {
    .form-input--sm {
      width: 70px;
      text-align: center;
    }
  }

  &__preview {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 0;
  }

  &__exp {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__levelup {
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-success;
    animation: pulse 1.5s ease-in-out infinite;
  }
}

// Results Section
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

  &__details {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-color-subtle;
  }
}

.levelup-detail {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  font-size: $font-size-xs;
  color: $color-text-muted;
  padding: 2px 0;

  &__level {
    font-weight: 600;
    color: $color-text;
  }

  &__stat {
    color: $color-accent-teal;
  }

  &__tutor {
    color: $color-accent-violet;
  }

  &__move {
    color: $color-success;
  }

  &__ability {
    color: $color-accent-pink;
    font-weight: 600;
  }
}

.results-total {
  text-align: center;
  padding: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-accent-teal;
}

// Empty/Loading/Error States
.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-muted;

  &__hint {
    font-size: $font-size-sm;
    font-style: italic;
    margin-top: $spacing-xs;
  }
}

.loading-state {
  text-align: center;
  padding: $spacing-lg;
  color: $color-text-muted;
  font-style: italic;
}

.error-state {
  text-align: center;
  padding: $spacing-md;
  color: $color-danger;
  font-size: $font-size-sm;
  background: rgba($color-danger, 0.1);
  border-radius: $border-radius-md;
}

// Button variants used in the modal
.btn--sm {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
}

.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-accent-teal;
    color: $color-text;
  }
}

// Animations
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
