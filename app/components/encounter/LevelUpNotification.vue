<template>
  <div class="levelup-notification">
    <div class="levelup-notification__header">
      <img src="/icons/phosphor/star.svg" alt="" class="levelup-icon" />
      <h3 class="levelup-notification__title">Level Up!</h3>
    </div>

    <div class="levelup-entries">
      <div
        v-for="entry in levelUpEntries"
        :key="entry.pokemonId"
        class="levelup-entry"
      >
        <div class="levelup-entry__header">
          <span class="levelup-entry__name">{{ entry.species }}</span>
          <span class="levelup-entry__levels">
            Lv.{{ entry.previousLevel }}
            <img src="/icons/phosphor/arrow-right.svg" alt="->" class="arrow-icon" />
            Lv.{{ entry.newLevel }}
          </span>
        </div>

        <div class="levelup-entry__details">
          <!-- Stat Points -->
          <div class="levelup-detail-item levelup-detail-item--stat">
            <img src="/icons/phosphor/chart-bar.svg" alt="" class="detail-icon" />
            <span>+{{ entry.totalStatPoints }} Stat {{ entry.totalStatPoints === 1 ? 'Point' : 'Points' }}</span>
          </div>

          <!-- Tutor Points -->
          <div
            v-if="entry.totalTutorPoints > 0"
            class="levelup-detail-item levelup-detail-item--tutor"
          >
            <img src="/icons/phosphor/graduation-cap.svg" alt="" class="detail-icon" />
            <span>+{{ entry.totalTutorPoints }} Tutor {{ entry.totalTutorPoints === 1 ? 'Point' : 'Points' }}</span>
          </div>

          <!-- New Moves -->
          <div
            v-for="(move, index) in entry.allNewMoves"
            :key="'move-' + index"
            class="levelup-detail-item levelup-detail-item--move"
          >
            <img src="/icons/phosphor/sword.svg" alt="" class="detail-icon" />
            <span>New Move: {{ move }}</span>
          </div>

          <!-- Ability Milestones -->
          <div
            v-for="milestone in entry.abilityMilestones"
            :key="`ability-${milestone.level}`"
            class="levelup-detail-item levelup-detail-item--ability"
          >
            <img src="/icons/phosphor/lightning.svg" alt="" class="detail-icon" />
            <span>{{ milestone.message }}</span>
          </div>

          <!-- Evolution Eligibility -->
          <div
            v-for="evoLevel in entry.evolutionLevels"
            :key="`evo-${evoLevel}`"
            class="levelup-detail-item levelup-detail-item--evolution"
          >
            <img src="/icons/phosphor/arrow-circle-up.svg" alt="" class="detail-icon" />
            <span>Evolution may be available at Level {{ evoLevel }}!</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XpApplicationResult } from '~/utils/experienceCalculation'

interface LevelUpEntryDisplay {
  pokemonId: string
  species: string
  previousLevel: number
  newLevel: number
  totalStatPoints: number
  totalTutorPoints: number
  allNewMoves: string[]
  abilityMilestones: Array<{ level: number; type: 'second' | 'third'; message: string }>
  evolutionLevels: number[]
}

const props = defineProps<{
  results: XpApplicationResult[]
}>()

/**
 * Transform XpApplicationResult[] into display-friendly entries.
 * Only includes Pokemon that actually leveled up.
 */
const levelUpEntries = computed((): LevelUpEntryDisplay[] => {
  return props.results
    .filter(r => r.levelsGained > 0)
    .map(result => {
      const totalStatPoints = result.levelUps.reduce(
        (sum, lu) => sum + lu.statPointsGained, 0
      )
      const totalTutorPoints = result.levelUps.filter(
        lu => lu.tutorPointGained
      ).length
      const allNewMoves = result.levelUps.flatMap(
        lu => lu.newMovesAvailable
      )
      const abilityMilestones = result.levelUps
        .filter(lu => lu.newAbilitySlot !== null)
        .map(lu => ({
          level: lu.newLevel,
          type: lu.newAbilitySlot!,
          message: lu.newAbilitySlot === 'second'
            ? `Level ${lu.newLevel}: Second Ability unlocked (Basic or Advanced)`
            : `Level ${lu.newLevel}: Third Ability unlocked (any category)`
        }))
      const evolutionLevels = result.levelUps
        .filter(lu => lu.canEvolve)
        .map(lu => lu.newLevel)

      return {
        pokemonId: result.pokemonId,
        species: result.species,
        previousLevel: result.previousLevel,
        newLevel: result.newLevel,
        totalStatPoints,
        totalTutorPoints,
        allNewMoves,
        abilityMilestones,
        evolutionLevels
      }
    })
})
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/level-up-notification';
</style>
