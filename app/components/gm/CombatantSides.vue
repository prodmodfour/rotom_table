<template>
  <div class="combatants-panel">
    <!-- Current Turn Indicator -->
    <div
      v-if="currentCombatant && isActive"
      class="current-turn"
      :class="{
        'current-turn--player': currentCombatant.side === 'players',
        'current-turn--ally': currentCombatant.side === 'allies',
        'current-turn--enemy': currentCombatant.side === 'enemies'
      }"
    >
      <h3>
        Current Turn
        <span v-if="currentPhaseLabel" class="phase-indicator">{{ currentPhaseLabel }}</span>
      </h3>
      <CombatantCard
        :combatant="currentCombatant"
        :is-current="true"
        :is-gm="true"
        @action="(id, action) => emit('action', id, action)"
        @damage="(id, damage) => emit('damage', id, damage)"
        @heal="(id, amount, temp, injuries) => emit('heal', id, amount, temp, injuries)"
        @stages="(id, changes, absolute) => emit('stages', id, changes, absolute)"
        @status="(id, add, remove, override) => emit('status', id, add, remove, override)"
        @openActions="(id) => emit('openActions', id)"
        @switchPokemon="(id) => emit('switchPokemon', id)"
        @faintedSwitch="(id) => emit('faintedSwitch', id)"
        @forceSwitch="(id) => emit('forceSwitch', id)"
      />
    </div>

    <!-- Sides Grid -->
    <div class="sides-grid">
      <!-- Players -->
      <div class="side side--players">
        <div class="side__header">
          <h3>Players</h3>
          <button class="btn btn--sm btn--secondary" @click="emit('addCombatant', 'players')">
            + Add
          </button>
        </div>
        <div class="side__combatants">
          <CombatantCard
            v-for="combatant in playerCombatants"
            :key="combatant.id"
            :combatant="combatant"
            :is-current="combatant.id === currentCombatant?.id"
            :is-gm="true"
            @action="(id, action) => emit('action', id, action)"
            @damage="(id, damage) => emit('damage', id, damage)"
            @heal="(id, amount, temp, injuries) => emit('heal', id, amount, temp, injuries)"
            @remove="(id) => emit('remove', id)"
            @stages="(id, changes, absolute) => emit('stages', id, changes, absolute)"
            @status="(id, add, remove, override) => emit('status', id, add, remove, override)"
            @openActions="(id) => emit('openActions', id)"
            @switchPokemon="(id) => emit('switchPokemon', id)"
            @faintedSwitch="(id) => emit('faintedSwitch', id)"
            @forceSwitch="(id) => emit('forceSwitch', id)"
          />
          <p v-if="playerCombatants.length === 0" class="side__empty">
            No players added
          </p>
        </div>
      </div>

      <!-- Allies -->
      <div class="side side--allies">
        <div class="side__header">
          <h3>Allies</h3>
          <button class="btn btn--sm btn--secondary" @click="emit('addCombatant', 'allies')">
            + Add
          </button>
        </div>
        <div class="side__combatants">
          <CombatantCard
            v-for="combatant in allyCombatants"
            :key="combatant.id"
            :combatant="combatant"
            :is-current="combatant.id === currentCombatant?.id"
            :is-gm="true"
            @action="(id, action) => emit('action', id, action)"
            @damage="(id, damage) => emit('damage', id, damage)"
            @heal="(id, amount, temp, injuries) => emit('heal', id, amount, temp, injuries)"
            @remove="(id) => emit('remove', id)"
            @stages="(id, changes, absolute) => emit('stages', id, changes, absolute)"
            @status="(id, add, remove, override) => emit('status', id, add, remove, override)"
            @openActions="(id) => emit('openActions', id)"
            @switchPokemon="(id) => emit('switchPokemon', id)"
            @faintedSwitch="(id) => emit('faintedSwitch', id)"
            @forceSwitch="(id) => emit('forceSwitch', id)"
          />
          <p v-if="allyCombatants.length === 0" class="side__empty">
            No allies
          </p>
        </div>
      </div>

      <!-- Enemies -->
      <div class="side side--enemies">
        <div class="side__header">
          <h3>Enemies</h3>
          <button class="btn btn--sm btn--secondary" @click="emit('addCombatant', 'enemies')">
            + Add
          </button>
        </div>
        <div class="side__combatants">
          <CombatantCard
            v-for="combatant in enemyCombatants"
            :key="combatant.id"
            :combatant="combatant"
            :is-current="combatant.id === currentCombatant?.id"
            :is-gm="true"
            @action="(id, action) => emit('action', id, action)"
            @damage="(id, damage) => emit('damage', id, damage)"
            @heal="(id, amount, temp, injuries) => emit('heal', id, amount, temp, injuries)"
            @remove="(id) => emit('remove', id)"
            @stages="(id, changes, absolute) => emit('stages', id, changes, absolute)"
            @status="(id, add, remove, override) => emit('status', id, add, remove, override)"
            @openActions="(id) => emit('openActions', id)"
            @switchPokemon="(id) => emit('switchPokemon', id)"
            @faintedSwitch="(id) => emit('faintedSwitch', id)"
            @forceSwitch="(id) => emit('forceSwitch', id)"
          />
          <p v-if="enemyCombatants.length === 0" class="side__empty">
            No enemies
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, CombatSide, StageModifiers, StatusCondition, TurnPhase } from '~/types'

const PHASE_LABELS: Record<string, string> = {
  trainer_declaration: 'Declaration (Low \u2192 High)',
  trainer_resolution: 'Resolution (High \u2192 Low)',
  pokemon: 'Pokemon Phase'
}

interface Props {
  playerCombatants: Combatant[]
  allyCombatants: Combatant[]
  enemyCombatants: Combatant[]
  currentCombatant: Combatant | null
  isActive: boolean
  currentPhase?: TurnPhase
}

const props = defineProps<Props>()

const currentPhaseLabel = computed(() => {
  if (!props.currentPhase) return ''
  return PHASE_LABELS[props.currentPhase] ?? ''
})

const emit = defineEmits<{
  action: [combatantId: string, action: { type: string; data: unknown }]
  damage: [combatantId: string, damage: number]
  heal: [combatantId: string, amount: number, tempHp?: number, healInjuries?: number]
  remove: [combatantId: string]
  stages: [combatantId: string, changes: Partial<StageModifiers>, absolute: boolean]
  status: [combatantId: string, add: StatusCondition[], remove: StatusCondition[], override: boolean]
  openActions: [combatantId: string]
  addCombatant: [side: CombatSide]
  switchPokemon: [combatantId: string]
  faintedSwitch: [combatantId: string]
  forceSwitch: [combatantId: string]
}>()
</script>

<style lang="scss" scoped>
.combatants-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.current-turn {
  border-radius: $border-radius-lg;
  padding: $spacing-lg;

  h3 {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    font-weight: 600;
  }

  // Player turn - green
  &--player {
    background: linear-gradient(135deg, rgba($color-side-player, 0.15) 0%, rgba($color-side-player, 0.05) 100%);
    border: 2px solid $color-side-player;
    box-shadow: 0 0 20px rgba($color-side-player, 0.3);

    h3 {
      color: $color-side-player;
    }
  }

  // Ally turn - blue
  &--ally {
    background: linear-gradient(135deg, rgba($color-side-ally, 0.15) 0%, rgba($color-side-ally, 0.05) 100%);
    border: 2px solid $color-side-ally;
    box-shadow: 0 0 20px rgba($color-side-ally, 0.3);

    h3 {
      color: $color-side-ally;
    }
  }

  // Enemy turn - red
  &--enemy {
    background: linear-gradient(135deg, rgba($color-side-enemy, 0.15) 0%, rgba($color-side-enemy, 0.05) 100%);
    border: 2px solid $color-side-enemy;
    box-shadow: 0 0 20px rgba($color-side-enemy, 0.3);

    h3 {
      color: $color-side-enemy;
    }
  }
}

.sides-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.side {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;

  &--players {
    border-top: 3px solid $color-side-player;
  }

  &--allies {
    border-top: 3px solid $color-side-ally;
  }

  &--enemies {
    border-top: 3px solid $color-side-enemy;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-md;
      font-weight: 600;
    }
  }

  &__combatants {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__empty {
    color: $color-text-muted;
    font-size: $font-size-sm;
    text-align: center;
    padding: $spacing-lg;
    font-style: italic;
  }
}

.phase-indicator {
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: linear-gradient(135deg, $color-accent-violet 0%, $color-accent-violet-light 100%);
  color: #fff;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
}
</style>
