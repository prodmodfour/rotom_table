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
                  class="form-select-compact"
                >
                  <option v-for="(value, key) in SIGNIFICANCE_PRESETS" :key="key" :value="key">
                    {{ SIGNIFICANCE_PRESET_LABELS[key] }} (x{{ value }})
                  </option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  v-if="selectedPreset === 'custom'"
                  v-model.number="customMultiplier"
                  type="number"
                  class="form-input-compact"
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
                class="form-input-compact"
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
            <span class="xp-summary__label">/ {{ safePlayerCount }} players</span>
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
                      class="form-input-compact"
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

        <!-- Trainer XP Section (after Pokemon XP, before Apply) -->
        <TrainerXpSection
          v-if="calculationResult && participatingTrainers.length > 0"
          :participating-trainers="participatingTrainers"
          :suggested-xp="suggestedTrainerXp"
          @update:allocations="trainerXpAllocations = $event"
        />

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
        <XpDistributionResults
          :results="distributionResults"
          :total-xp-distributed="totalDistributed"
          @pokemon-evolved="handlePokemonEvolved"
        />
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
  SIGNIFICANCE_PRESET_LABELS,
  resolvePresetFromMultiplier,
  getLevelForXp,
  type SignificancePreset,
  type XpCalculationResult,
  type XpApplicationResult
} from '~/utils/experienceCalculation'
import { SIGNIFICANCE_TO_TRAINER_XP } from '~/utils/trainerExperience'
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
  'pokemon-evolved': [result: Record<string, unknown>]
}>()

const encounterStore = useEncounterStore()
const encounterXpStore = useEncounterXpStore()

// Phase: 'configure' or 'results'
const phase = ref<'configure' | 'results'>('configure')

// Guard flag: suppress watcher-triggered recalculations during initialization
const initialized = ref(false)

// Configuration state — default from the encounter's persisted significance
const persistedSignificance = props.encounter.significanceMultiplier ?? 1.0
const selectedPreset = ref<SignificancePreset | 'custom'>(resolvePresetFromMultiplier(persistedSignificance))
const customMultiplier = ref(persistedSignificance)
const isBossEncounter = ref(false)
const isCalculating = ref(false)
const isDistributing = ref(false)
const calculationError = ref<string | null>(null)

// Calculation & distribution results
const calculationResult = ref<{
  totalXpPerPlayer: number
  breakdown: XpCalculationResult['breakdown']
  participatingPokemon: ParticipatingPokemon[]
} | null>(null)
const distributionResults = ref<XpApplicationResult[]>([])
const totalDistributed = ref(0)
const xpAllocations = ref<Map<string, number>>(new Map())

// Trainer XP allocation state
const trainerXpAllocations = ref<Map<string, number>>(new Map())

// Fresh trainer data fetched from API (avoids stale combatant entity snapshots)
const freshTrainerData = ref<Map<string, { level: number; trainerXp: number }>>(new Map())

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

// NaN-safe accessors — Vue 3.4+ v-model.number returns '' when input is cleared
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))

// Effective significance multiplier
const effectiveMultiplier = computed(() => {
  if (selectedPreset.value === 'custom') return safeCustomMultiplier.value
  return SIGNIFICANCE_PRESETS[selectedPreset.value]
})

// XP per player from the latest calculation
const xpPerPlayer = computed(() => calculationResult.value?.totalXpPerPlayer ?? 0)

// Participating trainers (player-side human combatants)
// Uses fresh API data when available, falls back to combatant entity snapshot
const participatingTrainers = computed(() => {
  return props.encounter.combatants
    .filter(c => c.side === 'players' && c.type === 'human')
    .map(c => {
      const fresh = freshTrainerData.value.get(c.entityId)
      return {
        id: c.entityId,
        name: c.name,
        level: fresh?.level ?? (c.entity as { level?: number }).level ?? 1,
        trainerXp: fresh?.trainerXp ?? (c.entity as { trainerXp?: number }).trainerXp ?? 0
      }
    })
})

// Suggested trainer XP based on encounter significance tier
const suggestedTrainerXp = computed(() => {
  const tier = props.encounter.significanceTier
  if (tier && tier in SIGNIFICANCE_TO_TRAINER_XP) {
    return SIGNIFICANCE_TO_TRAINER_XP[tier]
  }
  // Fallback: map from multiplier using closest tier
  const preset = selectedPreset.value
  if (preset !== 'custom' && preset in SIGNIFICANCE_TO_TRAINER_XP) {
    return SIGNIFICANCE_TO_TRAINER_XP[preset]
  }
  return 1
})

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

// Can apply: has at least some XP allocated (Pokemon or trainer) and no over-allocations
const canApply = computed(() => {
  if (isDistributing.value || isCalculating.value) return false
  if (hasOverAllocation.value) return false

  const totalPokemonXp = Array.from(xpAllocations.value.values()).reduce(
    (sum, val) => sum + val, 0
  )
  const totalTrainerXp = Array.from(trainerXpAllocations.value.values()).reduce(
    (sum, val) => sum + val, 0
  )
  return totalPokemonXp > 0 || totalTrainerXp > 0
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

// Stale response protection: only the latest request applies its result
let requestVersion = 0

// Recalculate XP from the server
const recalculate = async () => {
  const thisRequest = ++requestVersion
  isCalculating.value = true
  calculationError.value = null

  try {
    const result = await encounterXpStore.calculateXp({
      encounterId: encounterStore.encounter!.id,
      significanceMultiplier: effectiveMultiplier.value,
      playerCount: safePlayerCount.value,
      isBossEncounter: isBossEncounter.value
    })

    // Only apply if this is still the latest request
    if (thisRequest !== requestVersion) return

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
    if (thisRequest !== requestVersion) return
    const message = e instanceof Error ? e.message : 'Failed to calculate XP'
    calculationError.value = message
  } finally {
    if (thisRequest === requestVersion) {
      isCalculating.value = false
    }
  }
}

// Handle Apply XP
const handleApply = async () => {
  if (!canApply.value) return

  isDistributing.value = true

  try {
    // Build Pokemon distribution array (only Pokemon with XP > 0)
    const distribution = Array.from(xpAllocations.value.entries())
      .filter(([, xp]) => xp > 0)
      .map(([pokemonId, xpAmount]) => ({ pokemonId, xpAmount }))

    let pokemonResult = { results: [] as XpApplicationResult[], totalXpDistributed: 0 }

    // Distribute Pokemon XP first (if any)
    if (distribution.length > 0) {
      pokemonResult = await encounterXpStore.distributeXp({
        encounterId: encounterStore.encounter!.id,
        significanceMultiplier: effectiveMultiplier.value,
        playerCount: safePlayerCount.value,
        isBossEncounter: isBossEncounter.value,
        distribution
      })
    }

    // Distribute trainer XP (if any allocated)
    if (trainerXpAllocations.value.size > 0) {
      const trainerDistribution = Array.from(trainerXpAllocations.value.entries())
        .filter(([, xp]) => xp > 0)
        .map(([characterId, xpAmount]) => ({ characterId, xpAmount }))

      if (trainerDistribution.length > 0) {
        await encounterXpStore.distributeTrainerXp({
          encounterId: encounterStore.encounter!.id,
          distribution: trainerDistribution
        })
      }
    }

    distributionResults.value = pokemonResult.results
    totalDistributed.value = pokemonResult.totalXpDistributed
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

// Handle pokemon-evolved event from XpDistributionResults
const handlePokemonEvolved = async (result: Record<string, unknown>) => {
  // Refresh encounter data so parent has fresh state
  if (encounterStore.encounter) {
    await encounterStore.fetchEncounter(encounterStore.encounter.id)
  }
  // Emit upward so the parent page can react (e.g., refresh combatant list)
  emit('pokemon-evolved', result)
}

// Watch multiplier/playerCount/boss and recalculate (guarded by initialized flag)
watch(effectiveMultiplier, () => { if (initialized.value) recalculate() })
watch(playerCount, () => { if (initialized.value) recalculate() })
watch(isBossEncounter, () => { if (initialized.value) recalculate() })
watch(customMultiplier, () => {
  if (initialized.value && selectedPreset.value === 'custom') recalculate()
})

// Fetch fresh trainer XP data from API (avoids stale combatant entity snapshots)
const fetchFreshTrainerData = async () => {
  const trainerCombatants = props.encounter.combatants.filter(
    c => c.side === 'players' && c.type === 'human'
  )
  if (trainerCombatants.length === 0) return

  const newMap = new Map<string, { level: number; trainerXp: number }>()

  await Promise.all(
    trainerCombatants.map(async (c) => {
      try {
        const response = await $fetch<{
          success: boolean
          data: { trainerXp: number; level: number }
        }>(`/api/characters/${c.entityId}/xp-history`)
        if (response.success) {
          newMap.set(c.entityId, {
            level: response.data.level,
            trainerXp: response.data.trainerXp
          })
        }
      } catch {
        // Silently fall back to combatant snapshot on fetch failure
      }
    })
  )

  freshTrainerData.value = newMap
}

// Initial calculation on mount
onMounted(async () => {
  // Set detected player count before first API call to avoid double-fetch
  playerCount.value = detectedPlayerCount.value
  // Fetch fresh trainer data in parallel with XP recalculation
  await Promise.all([recalculate(), fetchFreshTrainerData()])
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
    .form-input-compact {
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
</style>
