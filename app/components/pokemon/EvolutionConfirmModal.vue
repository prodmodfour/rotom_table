<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal evolution-modal">
        <div class="modal__header">
          <h3>
            <PhArrowCircleUp :size="20" class="header-icon" />
            Evolve {{ pokemonName }}
            <span class="step-indicator">Step {{ currentStep }} / {{ totalSteps }}</span>
          </h3>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal__body">
          <!-- Species change summary (always visible) -->
          <div class="evolution-summary">
            <div class="evolution-summary__from">
              <span class="species-name">{{ currentSpecies }}</span>
              <div class="type-badges">
                <span
                  v-for="t in currentTypes"
                  :key="t"
                  :class="['type-badge', `type-badge--${t.toLowerCase()}`]"
                >{{ t }}</span>
              </div>
            </div>
            <PhArrowRight :size="24" class="evolution-arrow" />
            <div class="evolution-summary__to">
              <span class="species-name">{{ targetSpecies }}</span>
              <div class="type-badges">
                <span
                  v-for="t in targetTypes"
                  :key="t"
                  :class="['type-badge', `type-badge--${t.toLowerCase()}`]"
                >{{ t }}</span>
              </div>
            </div>
          </div>

          <!-- Item requirement note -->
          <div v-if="requiredItem" class="evolution-item-note">
            <PhInfo :size="16" />
            <span>Requires: {{ requiredItem }}{{ itemMustBeHeld ? ' (must be held)' : '' }}</span>
          </div>

          <!-- STEP 1: Stat Redistribution -->
          <div v-if="currentStep === 1" class="step-content">
            <EvolutionStatStep
              :old-base-stats="oldBaseStats"
              :new-nature-adjusted-base="newNatureAdjustedBase"
              :stat-point-inputs="statPointInputs"
              :current-max-hp="currentMaxHp"
              :new-max-hp="newMaxHp"
              :required-point-total="requiredPointTotal"
              :current-point-total="currentPointTotal"
              :is-point-total-valid="isPointTotalValid"
              :violations="violations"
              :skip-base-relations="skipBaseRelations"
              @increment="incrementStat"
              @decrement="decrementStat"
              @update:skip-base-relations="skipBaseRelations = $event"
            />
          </div>

          <!-- STEP 2: Ability Resolution -->
          <div v-if="currentStep === 2" class="step-content">
            <EvolutionAbilityStep
              :ability-remap="abilityRemap"
              :ability-resolutions="abilityResolutions"
              @update:resolutions="abilityResolutions = $event"
            />
          </div>

          <!-- STEP 3: Move Learning -->
          <div v-if="currentStep === 3" class="step-content">
            <EvolutionMoveStep
              :current-moves="currentMoves"
              :evolution-moves="evolutionMoves"
              :added-moves="addedMoves"
              :removed-moves="removedMoves"
              :evolution-move-details="evolutionMoveDetails"
              @add-move="addEvolutionMove"
              @remove-move="removeNewMove"
              @replace-move="handleReplaceMove"
            />
          </div>

          <!-- STEP 4: Summary -->
          <div v-if="currentStep === 4" class="step-content">
            <h4 class="step-title">
              <PhClipboardText :size="16" />
              Evolution Summary
            </h4>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-item__label">Species</span>
                <span>{{ currentSpecies }} -> {{ targetSpecies }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-item__label">Max HP</span>
                <span>{{ currentMaxHp }} -> {{ newMaxHp }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-item__label">Abilities</span>
                <span>{{ finalAbilities.map(a => a.name).join(', ') || 'None' }}</span>
              </div>
              <div v-if="addedMoveNames.length > 0" class="summary-item">
                <span class="summary-item__label">New Moves</span>
                <span>{{ addedMoveNames.join(', ') }}</span>
              </div>
              <div v-if="removedMoveNames.length > 0" class="summary-item">
                <span class="summary-item__label">Replaced Moves</span>
                <span>{{ removedMoveNames.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn btn--secondary" @click="$emit('close')">Cancel</button>
          <button
            v-if="currentStep > 1"
            class="btn btn--secondary"
            @click="currentStep--"
          >Back</button>
          <button
            v-if="currentStep < totalSteps"
            class="btn btn--primary"
            :disabled="!canProceed"
            @click="currentStep++"
          >Next</button>
          <button
            v-if="currentStep === totalSteps"
            class="btn btn--primary"
            :disabled="!canEvolve || evolving"
            @click="handleEvolve"
          >
            <PhArrowCircleUp :size="16" />
            {{ evolving ? 'Evolving...' : 'Confirm Evolution' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  PhArrowCircleUp,
  PhArrowRight,
  PhInfo,
  PhClipboardText
} from '@phosphor-icons/vue'
import { applyNatureToBaseStats } from '~/constants/natures'
import { validateBaseRelations, buildSelectedMoveList } from '~/utils/evolutionCheck'
import type { EvolutionStats as Stats, EvolutionMoveDetail } from '~/utils/evolutionCheck'
import type { AbilityRemapResult } from '~/server/services/evolution.service'

type MoveDetail = EvolutionMoveDetail

interface EvolutionMoveWithDetail {
  name: string
  level: number
  detail: MoveDetail | null
}

/** Evolution moves result enriched with MoveData detail from the endpoint */
interface EnrichedEvolutionMoves {
  availableMoves: EvolutionMoveWithDetail[]
  currentMoveCount: number
  maxMoves: number
  slotsAvailable: number
}

const props = defineProps<{
  pokemonId: string
  pokemonName: string
  currentSpecies: string
  currentTypes: string[]
  targetSpecies: string
  targetTypes: string[]
  currentLevel: number
  currentMaxHp: number
  oldBaseStats: Stats
  targetRawBaseStats: Stats
  natureName: string
  requiredItem: string | null
  itemMustBeHeld: boolean
  // P1 props
  currentMoves: MoveDetail[]
  abilityRemap: AbilityRemapResult
  evolutionMoves: EnrichedEvolutionMoves
  // P2 props
  ownerId?: string | null
}>()

const emit = defineEmits<{
  close: []
  evolved: [result: Record<string, unknown>]
}>()

const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const

// Step management
const currentStep = ref(1)
const totalSteps = 4

// State
const skipBaseRelations = ref(false)
const evolving = ref(false)

// Stat point inputs
const statPointInputs = reactive<Record<string, number>>({
  hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0
})

// Ability resolution selections
const abilityResolutions = ref<string[]>([])

// Move management
const addedMoves = ref<EvolutionMoveWithDetail[]>([])
const removedMoves = ref<string[]>([])

// Build detail map from the enriched evolution moves (pre-fetched by endpoint)
const evolutionMoveDetails = computed(() => {
  const details = new Map<string, MoveDetail>()
  for (const move of props.evolutionMoves.availableMoves) {
    if (move.detail) {
      details.set(move.name, move.detail)
    }
  }
  return details
})

// Initialize on mount
onMounted(() => {
  const totalPoints = props.currentLevel + 10
  const perStat = Math.floor(totalPoints / 6)
  const remainder = totalPoints - (perStat * 6)

  statPointInputs.hp = perStat + (remainder > 0 ? 1 : 0)
  statPointInputs.attack = perStat + (remainder > 1 ? 1 : 0)
  statPointInputs.defense = perStat + (remainder > 2 ? 1 : 0)
  statPointInputs.specialAttack = perStat + (remainder > 3 ? 1 : 0)
  statPointInputs.specialDefense = perStat + (remainder > 4 ? 1 : 0)
  statPointInputs.speed = perStat

  abilityResolutions.value = props.abilityRemap.needsResolution.map(() => '')
})

// Computed values
const newNatureAdjustedBase = computed((): Stats => {
  return applyNatureToBaseStats(props.targetRawBaseStats, props.natureName)
})

const requiredPointTotal = computed(() => props.currentLevel + 10)

const currentPointTotal = computed(() => {
  return statKeys.reduce((sum, key) => sum + statPointInputs[key], 0)
})

const isPointTotalValid = computed(() => currentPointTotal.value === requiredPointTotal.value)

const newMaxHp = computed(() => {
  const hpStat = newNatureAdjustedBase.value.hp + statPointInputs.hp
  return props.currentLevel + (hpStat * 3) + 10
})

const violations = computed((): string[] => {
  const points: Stats = {
    hp: statPointInputs.hp, attack: statPointInputs.attack,
    defense: statPointInputs.defense, specialAttack: statPointInputs.specialAttack,
    specialDefense: statPointInputs.specialDefense, speed: statPointInputs.speed
  }
  return validateBaseRelations(newNatureAdjustedBase.value, points)
})

const finalAbilities = computed((): Array<{ name: string; effect: string }> => {
  const result: Array<{ name: string; effect: string }> = []
  for (const ability of props.abilityRemap.remappedAbilities) {
    result.push({ ...ability })
  }
  for (let i = 0; i < props.abilityRemap.needsResolution.length; i++) {
    const selectedName = abilityResolutions.value[i]
    if (selectedName) {
      result.push({ name: selectedName, effect: '' })
    }
  }
  for (const ability of props.abilityRemap.preservedAbilities) {
    result.push({ ...ability })
  }
  return result
})

const selectedMoveList = computed((): MoveDetail[] =>
  buildSelectedMoveList({
    currentMoves: props.currentMoves,
    removedMoves: removedMoves.value,
    addedMoves: addedMoves.value,
    evolutionMoveDetails: evolutionMoveDetails.value
  })
)

const allAbilitiesResolved = computed(() => {
  return props.abilityRemap.needsResolution.every(
    (_, i) => abilityResolutions.value[i] !== ''
  )
})

const addedMoveNames = computed(() => addedMoves.value.map(m => m.name))
const removedMoveNames = computed(() => removedMoves.value)

const canProceed = computed((): boolean => {
  if (currentStep.value === 1) {
    return isPointTotalValid.value && (violations.value.length === 0 || skipBaseRelations.value)
  }
  if (currentStep.value === 2) return allAbilitiesResolved.value
  if (currentStep.value === 3) return selectedMoveList.value.length <= 6
  return true
})

const canEvolve = computed(() => {
  if (!isPointTotalValid.value) return false
  if (violations.value.length > 0 && !skipBaseRelations.value) return false
  if (!allAbilitiesResolved.value) return false
  if (selectedMoveList.value.length > 6) return false
  if (evolving.value) return false
  return true
})

function incrementStat(stat: string): void { statPointInputs[stat]++ }
function decrementStat(stat: string): void {
  if (statPointInputs[stat] > 0) statPointInputs[stat]--
}

function addEvolutionMove(move: EvolutionMoveWithDetail): void {
  if (selectedMoveList.value.length >= 6) return
  addedMoves.value = [...addedMoves.value, move]
}

function removeNewMove(moveName: string): void {
  addedMoves.value = addedMoves.value.filter(
    m => m.name.toLowerCase() !== moveName.toLowerCase()
  )
}

function handleReplaceMove(payload: { oldMoveName: string; newMove: EvolutionMoveWithDetail }): void {
  removedMoves.value = [...removedMoves.value, payload.oldMoveName]
  addedMoves.value = [...addedMoves.value, payload.newMove]
}

async function handleEvolve(): Promise<void> {
  if (!canEvolve.value) return
  evolving.value = true
  try {
    const response = await $fetch<{ success: boolean; data: Record<string, unknown> }>(
      `/api/pokemon/${props.pokemonId}/evolve`,
      {
        method: 'POST',
        body: {
          targetSpecies: props.targetSpecies,
          statPoints: {
            hp: statPointInputs.hp, attack: statPointInputs.attack,
            defense: statPointInputs.defense, specialAttack: statPointInputs.specialAttack,
            specialDefense: statPointInputs.specialDefense, speed: statPointInputs.speed
          },
          skipBaseRelations: skipBaseRelations.value,
          abilities: finalAbilities.value,
          moves: addedMoves.value.length > 0 || removedMoves.value.length > 0
            ? selectedMoveList.value
            : undefined,
          // P2: Item consumption
          ...(props.requiredItem && !props.itemMustBeHeld && props.ownerId ? {
            consumeItem: {
              ownerId: props.ownerId,
              itemName: props.requiredItem,
              skipInventoryCheck: false
            }
          } : {}),
          // P2: Held item consumption (default true for held-item evolutions)
          ...(props.itemMustBeHeld ? { consumeHeldItem: true } : {})
        }
      }
    )
    if (response.success) {
      emit('evolved', response.data)
      emit('close')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evolution failed'
    alert(`Evolution failed: ${message}`)
  } finally {
    evolving.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/evolution-modal';
@import '~/assets/scss/components/type-badges';
</style>
