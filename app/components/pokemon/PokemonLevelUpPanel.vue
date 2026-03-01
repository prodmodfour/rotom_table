<template>
  <div v-if="levelUpInfo" class="level-up-panel">
    <div class="level-up-panel__header">
      <img src="/icons/phosphor/arrow-fat-line-up.svg" alt="" class="level-up-icon" />
      <h4>Level Up: {{ currentLevel }} → {{ targetLevel }}</h4>
    </div>
    <div class="level-up-panel__content">
      <div class="level-up-item">
        <strong>Stat Points:</strong> +{{ levelUpInfo.totalStatPoints }} (assign following Base Relations)
        <button
          v-if="pokemon && !showAllocationPanel"
          class="btn btn--sm btn--accent allocate-btn"
          @click="showAllocationPanel = true"
        >
          <PhSliders :size="14" />
          Allocate Stats
        </button>
      </div>
      <div v-if="levelUpInfo.totalTutorPoints > 0" class="level-up-item">
        <strong>Tutor Points:</strong> +{{ levelUpInfo.totalTutorPoints }}
      </div>

      <!-- New moves — show as actionable item -->
      <div v-if="levelUpInfo.allNewMoves.length > 0" class="level-up-item level-up-item--highlight">
        <strong>New Moves Available:</strong>
        <span>{{ levelUpInfo.allNewMoves.join(', ') }}</span>
        <button
          v-if="pokemon && !showMovePanel"
          class="btn btn--sm btn--accent action-btn"
          @click="showMovePanel = true"
        >
          <PhSword :size="14" />
          Learn Moves
        </button>
      </div>

      <!-- Ability milestones — show as actionable item -->
      <div v-if="levelUpInfo.abilityMilestones.length > 0" class="level-up-item level-up-item--milestone">
        <div v-for="milestone in levelUpInfo.abilityMilestones" :key="milestone.level">
          <strong>Lv. {{ milestone.level }}:</strong> {{ milestone.message }}
          <button
            v-if="pokemon && !showAbilityPanel && canAssignAbility(milestone.type)"
            class="btn btn--sm btn--accent action-btn"
            @click="openAbilityPanel(milestone.type as 'second' | 'third')"
          >
            <PhLightning :size="14" />
            Assign Ability
          </button>
        </div>
      </div>

      <div class="level-up-item level-up-item--reminder">
        Use the <strong>Evolve</strong> button in the header to check evolution eligibility.
      </div>
    </div>

    <!-- Error state -->
    <div v-if="errorMsg" class="level-up-panel__error">
      <PhWarning :size="16" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Inline stat allocation panel -->
    <StatAllocationPanel
      v-if="showAllocationPanel && pokemon"
      :pokemon="pokemon"
      :points-to-allocate="levelUpInfo.totalStatPoints"
      @allocated="handleAllocated"
      @cancelled="showAllocationPanel = false"
    />

    <!-- Inline ability assignment panel -->
    <AbilityAssignmentPanel
      v-if="showAbilityPanel && pokemon && activeMilestone && speciesData"
      :pokemon="pokemon"
      :milestone="activeMilestone"
      :species-abilities="speciesData.abilities"
      :num-basic-abilities="speciesData.numBasicAbilities"
      @assigned="handleAbilityAssigned"
      @cancelled="showAbilityPanel = false"
    />

    <!-- Inline move learning panel -->
    <MoveLearningPanel
      v-if="showMovePanel && pokemon && levelUpInfo"
      :pokemon="pokemon"
      :available-moves="levelUpInfo.allNewMoves"
      @learned="handleMoveLearned"
      @skipped="showMovePanel = false"
    />
  </div>
</template>

<script setup lang="ts">
import { PhSliders, PhSword, PhLightning, PhWarning } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'

interface LevelUpSummary {
  totalStatPoints: number
  allNewMoves: string[]
  abilityMilestones: Array<{ level: number; type: string; message: string }>
  totalTutorPoints: number
}

interface SpeciesAbilityData {
  abilities: string[]
  numBasicAbilities: number
}

const props = defineProps<{
  pokemonId: string
  currentLevel: number
  targetLevel: number | undefined
  /** Pokemon data for stat allocation (optional — allocation button hidden without it) */
  pokemon?: Pokemon | null
}>()

const emit = defineEmits<{
  allocated: []
}>()

const levelUpInfo = ref<LevelUpSummary | null>(null)
const showAllocationPanel = ref(false)
const showAbilityPanel = ref(false)
const showMovePanel = ref(false)
const activeMilestone = ref<'second' | 'third' | null>(null)
const speciesData = ref<SpeciesAbilityData | null>(null)
const errorMsg = ref<string | null>(null)

/** Check if the Pokemon can still assign an ability at this milestone */
function canAssignAbility(type: string): boolean {
  if (!props.pokemon) return false
  const abilities = props.pokemon.abilities || []
  if (type === 'second') return abilities.length < 2
  if (type === 'third') return abilities.length < 3
  return false
}

/** Open the ability panel, fetching species data if needed */
async function openAbilityPanel(milestone: 'second' | 'third') {
  activeMilestone.value = milestone

  // Fetch species data for ability list if not already loaded
  if (!speciesData.value && props.pokemon) {
    try {
      const response = await $fetch<{
        success: boolean
        data: { abilities: string; numBasicAbilities: number }
      }>(`/api/species/${props.pokemon.species}`)

      if (response.success) {
        speciesData.value = {
          abilities: JSON.parse(response.data.abilities),
          numBasicAbilities: response.data.numBasicAbilities
        }
      }
    } catch {
      errorMsg.value = 'Failed to load species ability data.'
      return
    }
  }

  showAbilityPanel.value = true
}

function handleAllocated() {
  showAllocationPanel.value = false
  emit('allocated')
}

function handleAbilityAssigned() {
  showAbilityPanel.value = false
  emit('allocated') // Trigger parent refresh
}

function handleMoveLearned() {
  // Keep panel open for learning additional moves
  // Parent can refresh on next save
}

// Watch for level changes — fetch level-up info from server
watch(() => props.targetLevel, async (newLevel) => {
  if (!newLevel || newLevel <= props.currentLevel) {
    levelUpInfo.value = null
    showAllocationPanel.value = false
    showAbilityPanel.value = false
    showMovePanel.value = false
    return
  }
  try {
    const response = await $fetch<{ success: boolean; data: LevelUpSummary }>(
      `/api/pokemon/${props.pokemonId}/level-up-check`,
      { method: 'POST', body: { targetLevel: newLevel } }
    )
    if (response.success) {
      levelUpInfo.value = response.data
    }
  } catch {
    levelUpInfo.value = null
  }
})
</script>

<style lang="scss" scoped>
.level-up-panel {
  background: linear-gradient(135deg, rgba($color-success, 0.1) 0%, rgba($color-accent-teal, 0.05) 100%);
  border: 1px solid rgba($color-success, 0.3);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-lg;
  animation: slideDown 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;

    h4 {
      margin: 0;
      color: $color-success;
      font-size: $font-size-md;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-sm;
    color: $color-danger;
    font-size: $font-size-sm;
    margin-top: $spacing-sm;
  }
}

.level-up-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(67%) sepia(59%) saturate(403%) hue-rotate(93deg) brightness(101%) contrast(87%);
}

.level-up-item {
  font-size: $font-size-sm;
  color: $color-text;

  ul {
    margin: $spacing-xs 0 0 $spacing-md;
    padding: 0;
  }

  li {
    margin-bottom: 2px;
  }

  &--highlight {
    padding: $spacing-sm;
    background: rgba($color-accent-teal, 0.1);
    border-radius: $border-radius-sm;
  }

  &--milestone {
    padding: $spacing-sm;
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: $border-radius-sm;
    color: $color-warning;
  }

  &--reminder {
    font-style: italic;
    color: $color-text-muted;
    font-size: $font-size-xs;
  }
}

.allocate-btn,
.action-btn {
  margin-left: $spacing-sm;
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  vertical-align: middle;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
