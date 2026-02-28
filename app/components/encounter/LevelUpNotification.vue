<template>
  <div class="levelup-notification">
    <div class="levelup-notification__header">
      <PhStar :size="20" class="levelup-icon" />
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
            <PhArrowRight :size="14" class="arrow-icon" />
            Lv.{{ entry.newLevel }}
          </span>
        </div>

        <div class="levelup-entry__details">
          <!-- Stat Points -->
          <div class="levelup-detail-item levelup-detail-item--stat">
            <PhChartBar :size="14" class="detail-icon" />
            <span>+{{ entry.totalStatPoints }} Stat {{ entry.totalStatPoints === 1 ? 'Point' : 'Points' }}</span>
            <NuxtLink
              :to="`/gm/pokemon/${entry.pokemonId}?edit=true`"
              class="allocate-link"
            >
              <PhSliders :size="12" />
              Allocate
              <PhCaretRight :size="10" />
            </NuxtLink>
          </div>

          <!-- Tutor Points -->
          <div
            v-if="entry.totalTutorPoints > 0"
            class="levelup-detail-item levelup-detail-item--tutor"
          >
            <PhGraduationCap :size="14" class="detail-icon" />
            <span>+{{ entry.totalTutorPoints }} Tutor {{ entry.totalTutorPoints === 1 ? 'Point' : 'Points' }}</span>
          </div>

          <!-- New Moves -->
          <div
            v-for="(move, index) in entry.allNewMoves"
            :key="'move-' + index"
            class="levelup-detail-item levelup-detail-item--move"
          >
            <PhSword :size="14" class="detail-icon" />
            <span>New Move: {{ move }}</span>
          </div>

          <!-- Ability Milestones -->
          <div
            v-for="milestone in entry.abilityMilestones"
            :key="`ability-${milestone.level}`"
            class="levelup-detail-item levelup-detail-item--ability"
          >
            <PhLightning :size="14" class="detail-icon" />
            <span>{{ milestone.message }}</span>
          </div>

          <!-- Evolution Eligibility — now clickable -->
          <button
            v-for="evoLevel in entry.evolutionLevels"
            :key="`evo-${evoLevel}`"
            class="levelup-detail-item levelup-detail-item--evolution levelup-detail-item--clickable"
            @click="$emit('evolve-click', { pokemonId: entry.pokemonId, species: entry.species })"
          >
            <PhArrowCircleUp :size="14" class="detail-icon" />
            <span>Evolution available at Level {{ evoLevel }}!</span>
            <PhCaretRight :size="12" class="action-icon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhStar,
  PhArrowRight,
  PhChartBar,
  PhGraduationCap,
  PhSword,
  PhLightning,
  PhArrowCircleUp,
  PhCaretRight,
  PhSliders,
} from '@phosphor-icons/vue'
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

defineEmits<{
  'evolve-click': [payload: { pokemonId: string; species: string }]
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
