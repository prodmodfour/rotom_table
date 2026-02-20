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

// Stale response protection: only the latest request applies its result
let requestVersion = 0

// Recalculate XP from the server
const recalculate = async () => {
  const thisRequest = ++requestVersion
  isCalculating.value = true
  calculationError.value = null

  try {
    const result = await encounterStore.calculateXp({
      significanceMultiplier: effectiveMultiplier.value,
      playerCount: playerCount.value,
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
@import '~/assets/scss/components/xp-distribution-modal';
</style>
