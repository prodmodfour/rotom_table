<template>
  <div class="player-pokemon-team">
    <div v-if="pokemon.length === 0" class="team-empty">
      <PhPawPrint :size="48" />
      <p>No Pokemon on this team.</p>
    </div>
    <div v-else class="team-list">
      <PlayerPokemonCard
        v-for="poke in pokemon"
        :key="poke.id"
        :pokemon="poke"
        :is-active="poke.id === activePokemonId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhPawPrint } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'

defineProps<{
  pokemon: Pokemon[]
  activePokemonId?: string
}>()
</script>

<style lang="scss" scoped>
.player-pokemon-team {
  padding: $spacing-md;
  padding-bottom: $player-nav-clearance;
}

.team-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-xxl $spacing-md;
  color: $color-text-muted;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
</style>
