<template>
  <div class="player-encounter">
    <!-- No Active Encounter -->
    <div v-if="!encounter || !encounter.isActive" class="encounter-waiting">
      <PhSword :size="48" />
      <p>No active encounter</p>
      <p class="encounter-waiting__hint">
        An encounter will appear here when the GM starts one.
      </p>
    </div>

    <!-- Active Encounter -->
    <div v-else class="encounter-active">
      <!-- Encounter Header -->
      <div class="encounter-header">
        <div class="encounter-header__info">
          <h2 class="encounter-header__name">{{ encounter.name }}</h2>
          <span class="encounter-header__round">Round {{ encounter.currentRound }}</span>
        </div>
        <div v-if="currentCombatant" class="encounter-header__turn">
          <span class="encounter-header__turn-label">Current Turn:</span>
          <span class="encounter-header__turn-name">{{ getCombatantName(currentCombatant) }}</span>
        </div>
        <div v-if="isMyTurn" class="encounter-header__my-turn">
          Your Turn
        </div>
      </div>

      <!-- Combatants by Side -->
      <div class="encounter-sides">
        <!-- Players -->
        <section v-if="playerCombatants.length > 0" class="encounter-side">
          <h3 class="encounter-side__title encounter-side__title--players">Players</h3>
          <div class="encounter-side__list">
            <PlayerCombatantInfo
              v-for="combatant in playerCombatants"
              :key="combatant.id"
              :combatant="combatant"
              :is-current-turn="combatant.id === currentCombatant?.id"
              :my-character-id="myCharacterId"
              :my-pokemon-ids="myPokemonIds"
            />
          </div>
        </section>

        <!-- Allies -->
        <section v-if="allyCombatants.length > 0" class="encounter-side">
          <h3 class="encounter-side__title encounter-side__title--allies">Allies</h3>
          <div class="encounter-side__list">
            <PlayerCombatantInfo
              v-for="combatant in allyCombatants"
              :key="combatant.id"
              :combatant="combatant"
              :is-current-turn="combatant.id === currentCombatant?.id"
              :my-character-id="myCharacterId"
              :my-pokemon-ids="myPokemonIds"
            />
          </div>
        </section>

        <!-- Enemies -->
        <section v-if="enemyCombatants.length > 0" class="encounter-side">
          <h3 class="encounter-side__title encounter-side__title--enemies">Enemies</h3>
          <div class="encounter-side__list">
            <PlayerCombatantInfo
              v-for="combatant in enemyCombatants"
              :key="combatant.id"
              :combatant="combatant"
              :is-current-turn="combatant.id === currentCombatant?.id"
              :my-character-id="myCharacterId"
              :my-pokemon-ids="myPokemonIds"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSword } from '@phosphor-icons/vue'

const props = defineProps<{
  myCharacterId: string
  myPokemonIds: string[]
}>()

const encounterStore = useEncounterStore()
const { getCombatantName } = useCombatantDisplay()

const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const playerCombatants = computed(() => encounterStore.playerCombatants)
const allyCombatants = computed(() => encounterStore.allyCombatants)
const enemyCombatants = computed(() => encounterStore.enemyCombatants)

// Determine if it is the player's turn
const isMyTurn = computed(() => {
  const current = currentCombatant.value
  if (!current) return false

  return (
    current.entityId === props.myCharacterId ||
    props.myPokemonIds.includes(current.entityId)
  )
})
</script>

<style lang="scss" scoped>
.player-encounter {
  padding: $spacing-md;
  padding-bottom: $player-nav-clearance;
}

.encounter-waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-xxl $spacing-md;
  color: $color-text-muted;
  text-align: center;

  p {
    font-size: $font-size-md;
    margin: 0;
  }

  &__hint {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.encounter-active {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.encounter-header {
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-md;
    font-weight: 600;
    margin: 0;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__round {
    background: $gradient-sv-cool;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    font-weight: 700;
    white-space: nowrap;
  }

  &__turn {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
  }

  &__turn-label {
    color: $color-text-muted;
  }

  &__turn-name {
    font-weight: 600;
    color: $color-text;
  }

  &__my-turn {
    margin-top: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: rgba($color-accent-scarlet, 0.15);
    border: 1px solid rgba($color-accent-scarlet, 0.4);
    border-radius: $border-radius-md;
    color: $color-accent-scarlet;
    font-weight: 700;
    font-size: $font-size-sm;
    text-align: center;
    animation: pulse-turn 2s ease-in-out infinite;
  }
}

@keyframes pulse-turn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.encounter-sides {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.encounter-side {
  &__title {
    font-size: $font-size-sm;
    font-weight: 600;
    margin-bottom: $spacing-xs;
    padding-left: $spacing-sm;
    border-left: 3px solid;

    &--players {
      border-color: $color-side-player;
      color: $color-side-player;
    }

    &--allies {
      border-color: $color-side-ally;
      color: $color-side-ally;
    }

    &--enemies {
      border-color: $color-side-enemy;
      color: $color-side-enemy;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}
</style>
