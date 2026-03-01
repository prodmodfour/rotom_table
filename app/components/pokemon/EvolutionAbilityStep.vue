<template>
  <div>
    <h4 class="step-title">
      <PhLightning :size="16" />
      Ability Changes
    </h4>

    <!-- Auto-remapped abilities -->
    <div v-if="abilityRemap.remappedAbilities.length > 0" class="ability-section">
      <p class="ability-section__label">Auto-remapped (positional):</p>
      <div
        v-for="(ability, idx) in abilityRemap.remappedAbilities"
        :key="'remap-' + idx"
        class="ability-change"
      >
        <span class="ability-change__old">{{ ability.oldName }}</span>
        <PhArrowRight :size="14" />
        <span class="ability-change__new">{{ ability.name }}</span>
      </div>
    </div>

    <!-- Preserved abilities -->
    <div v-if="abilityRemap.preservedAbilities.length > 0" class="ability-section">
      <p class="ability-section__label">Preserved (non-species):</p>
      <div
        v-for="(ability, idx) in abilityRemap.preservedAbilities"
        :key="'preserved-' + idx"
        class="ability-preserved"
      >
        <PhCheck :size="14" />
        <span>{{ ability.name }}</span>
      </div>
    </div>

    <!-- Abilities needing GM resolution -->
    <div v-if="abilityRemap.needsResolution.length > 0" class="ability-section ability-section--resolution">
      <p class="ability-section__label">Needs GM decision:</p>
      <div
        v-for="(item, idx) in abilityRemap.needsResolution"
        :key="'resolve-' + idx"
        class="ability-resolve"
      >
        <div class="ability-resolve__old">
          <span class="ability-resolve__old-name">{{ item.oldAbility }}</span>
          <span class="ability-resolve__reason">{{ item.reason }}</span>
        </div>
        <select
          :value="abilityResolutions[idx]"
          class="form-input ability-resolve__select"
          @change="handleResolutionChange(idx, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">-- Select replacement --</option>
          <option
            v-for="opt in item.options"
            :key="opt.name"
            :value="opt.name"
          >{{ opt.name }}{{ opt.effect ? ' — ' + truncateEffect(opt.effect) : '' }}</option>
        </select>
      </div>
    </div>

    <div v-if="noChanges" class="empty-abilities">
      No ability changes needed.
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhLightning, PhArrowRight, PhCheck } from '@phosphor-icons/vue'
import type { AbilityRemapResult } from '~/server/services/evolution.service'

const props = defineProps<{
  abilityRemap: AbilityRemapResult
  abilityResolutions: string[]
}>()

const emit = defineEmits<{
  'update:resolutions': [value: string[]]
}>()

const noChanges = computed(() => {
  return props.abilityRemap.remappedAbilities.length === 0
    && props.abilityRemap.preservedAbilities.length === 0
    && props.abilityRemap.needsResolution.length === 0
})

function truncateEffect(effect: string, maxLength = 80): string {
  if (effect.length <= maxLength) return effect
  return effect.slice(0, maxLength) + '...'
}

function handleResolutionChange(idx: number, value: string): void {
  const updated = [...props.abilityResolutions]
  updated[idx] = value
  emit('update:resolutions', updated)
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/evolution-modal';
</style>
