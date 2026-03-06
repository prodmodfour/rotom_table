<template>
  <div class="healing-tab">
    <!-- Last Healing Result -->
    <div v-if="lastHealingResult" class="healing-result" :class="lastHealingResult.success ? 'healing-result--success' : 'healing-result--error'">
      {{ lastHealingResult.message }}
    </div>

    <!-- Current Status -->
    <div class="healing-status">
      <div class="healing-status__item">
        <span class="healing-status__label">Current HP</span>
        <span class="healing-status__value">{{ currentHp }} / {{ maxHp }}</span>
      </div>
      <div class="healing-status__item">
        <span class="healing-status__label">Injuries</span>
        <span class="healing-status__value" :class="{ 'text-danger': injuries >= 5 }">
          {{ injuries }}
          <span v-if="injuries >= 5" class="healing-status__warning">(Cannot rest-heal)</span>
        </span>
      </div>
      <div v-if="healingInfo" class="healing-status__item">
        <span class="healing-status__label">Rest Today</span>
        <span class="healing-status__value">
          {{ formatRestTime(480 - healingInfo.restMinutesRemaining) }} / 8h
        </span>
      </div>
      <div v-if="healingInfo" class="healing-status__item">
        <span class="healing-status__label">HP per Rest</span>
        <span class="healing-status__value">{{ healingInfo.hpPerRest }} HP</span>
      </div>
      <div v-if="healingInfo" class="healing-status__item">
        <span class="healing-status__label">Injuries Healed Today</span>
        <span class="healing-status__value">{{ healingInfo.injuriesHealedToday }} / 3</span>
      </div>
      <div v-if="entityType === 'character'" class="healing-status__item">
        <span class="healing-status__label">Current AP</span>
        <span class="healing-status__value" :class="{ 'text-danger': currentAp < 2 }">{{ currentAp }}</span>
      </div>
      <div v-if="entityType === 'character'" class="healing-status__item">
        <span class="healing-status__label">Drained AP</span>
        <span class="healing-status__value">{{ drainedAp }}</span>
      </div>
      <div v-if="healingInfo && healingInfo.hoursSinceLastInjury !== null" class="healing-status__item">
        <span class="healing-status__label">Time Since Last Injury</span>
        <span class="healing-status__value">
          {{ Math.floor(healingInfo.hoursSinceLastInjury) }}h
          <span v-if="healingInfo.canHealInjuryNaturally" class="text-success">(Can heal naturally)</span>
          <span v-else-if="healingInfo.hoursUntilNaturalHeal" class="text-muted">
            ({{ Math.ceil(healingInfo.hoursUntilNaturalHeal) }}h until natural heal)
          </span>
        </span>
      </div>
    </div>

    <!-- Healing Actions -->
    <div class="healing-actions">
      <div class="healing-action">
        <h4>Rest (30 min)</h4>
        <p>Heal {{ healingInfo?.hpPerRest || 0 }} HP. Requires less than 5 injuries and under 8 hours rest today.</p>
        <button
          class="btn btn--primary"
          :disabled="healingLoading || !healingInfo?.canRestHeal || currentHp >= maxHp"
          @click="handleRest"
        >
          {{ healingLoading ? 'Resting...' : 'Rest 30 min' }}
        </button>
      </div>

      <div class="healing-action">
        <h4>Extended Rest (4–8 hours)</h4>
        <p>{{ extendedRestDescription }}</p>
        <div class="healing-action__duration">
          <label class="healing-action__duration-label" for="extended-rest-duration">Duration (hours)</label>
          <input
            id="extended-rest-duration"
            v-model.number="extendedRestDuration"
            type="number"
            class="healing-action__duration-input"
            min="4"
            max="8"
            step="1"
          />
        </div>
        <button
          class="btn btn--primary"
          :disabled="healingLoading"
          @click="handleExtendedRest"
        >
          {{ healingLoading ? 'Resting...' : `Extended Rest (${extendedRestDuration}h)` }}
        </button>
      </div>

      <div class="healing-action">
        <h4>Pokemon Center</h4>
        <p>{{ pokemonCenterDescription }}</p>
        <button
          class="btn btn--accent"
          :disabled="healingLoading"
          @click="handlePokemonCenter"
        >
          {{ healingLoading ? 'Healing...' : 'Pokemon Center' }}
        </button>
      </div>

      <div v-if="injuries > 0" class="healing-action">
        <h4>Natural Injury Healing</h4>
        <p>Heal 1 injury after 24 hours without gaining new injuries. Max 3 injuries healed per day from all sources.</p>
        <button
          class="btn btn--secondary"
          :disabled="healingLoading || !healingInfo?.canHealInjuryNaturally || healingInfo?.injuriesRemainingToday <= 0"
          @click="handleHealInjury('natural')"
        >
          {{ healingLoading ? 'Healing...' : 'Heal Injury Naturally' }}
        </button>
      </div>

      <div v-if="entityType === 'character' && injuries > 0" class="healing-action">
        <h4>Drain AP to Heal Injury</h4>
        <p>Drain 2 AP to heal 1 injury as an Extended Action. Subject to daily injury limit.</p>
        <button
          class="btn btn--secondary"
          :disabled="healingLoading || healingInfo?.injuriesRemainingToday <= 0 || currentAp < 2"
          @click="handleHealInjury('drain_ap')"
        >
          {{ healingLoading ? 'Healing...' : 'Drain 2 AP' }}
        </button>
      </div>

      <div class="healing-action healing-action--new-day">
        <h4>New Day</h4>
        <p>{{ newDayDescription }}</p>
        <button
          class="btn btn--ghost"
          :disabled="healingLoading"
          @click="handleNewDay"
        >
          {{ healingLoading ? 'Resetting...' : 'New Day' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon, HumanCharacter } from '~/types'

const props = defineProps<{
  entityType: 'pokemon' | 'character'
  entityId: string
  entity: Pokemon | HumanCharacter
}>()

const emit = defineEmits<{
  healed: []
}>()

const { rest, extendedRest, pokemonCenter, healInjury, newDay, getHealingInfo, formatRestTime, loading: healingLoading } = useRestHealing()
const lastHealingResult = ref<{ success: boolean; message: string } | null>(null)
const extendedRestDuration = ref(4)

const currentHp = computed(() => props.entity.currentHp)
const maxHp = computed(() => props.entity.maxHp)
const injuries = computed(() => props.entity.injuries || 0)
const drainedAp = computed(() => {
  if (props.entityType === 'character') {
    return (props.entity as HumanCharacter).drainedAp || 0
  }
  return 0
})
const currentAp = computed(() => {
  if (props.entityType === 'character') {
    return (props.entity as HumanCharacter).currentAp || 0
  }
  return 0
})

const healingInfo = computed(() => {
  return getHealingInfo({
    maxHp: props.entity.maxHp,
    injuries: props.entity.injuries || 0,
    restMinutesToday: props.entity.restMinutesToday || 0,
    lastInjuryTime: props.entity.lastInjuryTime || null,
    injuriesHealedToday: props.entity.injuriesHealedToday || 0
  })
})

const extendedRestDescription = computed(() => {
  if (props.entityType === 'character') {
    return 'Heal HP over the chosen duration, clear persistent status conditions, restore drained AP. Each 30 min heals 1/16th max HP. Subject to daily 8h cap.'
  }
  return 'Heal HP over the chosen duration, clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned), restore daily moves. Each 30 min heals 1/16th max HP. Subject to daily 8h cap.'
})

const pokemonCenterDescription = computed(() => {
  if (props.entityType === 'character') {
    return 'Full HP, all status cleared, AP restored. Heals up to 3 injuries/day. Time: 1 hour + 30min per injury.'
  }
  return 'Full HP, all status cleared, daily moves restored. Heals up to 3 injuries/day. Time: 1 hour + 30min per injury.'
})

const newDayDescription = computed(() => {
  if (props.entityType === 'character') {
    return 'Reset daily healing limits: rest time, injuries healed counter, drained AP.'
  }
  return 'Reset daily healing limits: rest time, injuries healed counter.'
})

const applyResult = async (result: { success: boolean; message: string } | null) => {
  if (result) {
    lastHealingResult.value = { success: result.success, message: result.message }
    emit('healed')
  }
}

const handleRest = async () => {
  const result = await rest(props.entityType, props.entityId)
  await applyResult(result)
}

const handleExtendedRest = async () => {
  const duration = Math.min(8, Math.max(4, extendedRestDuration.value || 4))
  const result = await extendedRest(props.entityType, props.entityId, duration)
  await applyResult(result)
}

const handlePokemonCenter = async () => {
  const result = await pokemonCenter(props.entityType, props.entityId)
  await applyResult(result)
}

const handleHealInjury = async (method: 'natural' | 'drain_ap' = 'natural') => {
  const result = await healInjury(props.entityType, props.entityId, method)
  await applyResult(result)
}

const handleNewDay = async () => {
  const result = await newDay(props.entityType, props.entityId)
  await applyResult(result)
}
</script>

<style lang="scss" scoped>
.healing-result {
  padding: $spacing-md;
  border-radius: $border-radius-md;
  margin-bottom: $spacing-lg;
  text-align: center;
  font-weight: 500;

  &--success {
    background: rgba($color-success, 0.15);
    border: 1px solid $color-success;
    color: $color-success;
  }

  &--error {
    background: rgba($color-danger, 0.15);
    border: 1px solid $color-danger;
    color: $color-danger;
  }
}

.healing-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;

  &__item {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: $font-size-md;
    font-weight: 600;
  }

  &__warning {
    font-size: $font-size-xs;
    color: $color-danger;
    font-weight: normal;
  }
}

.healing-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
}

.healing-action {
  padding: $spacing-lg;
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  border: 1px solid $glass-border;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-md;
    color: $color-text;
  }

  p {
    margin: 0 0 $spacing-md 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
  }

  .btn {
    width: 100%;
  }

  &__duration {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__duration-label {
    font-size: $font-size-sm;
    color: $color-text-muted;
    white-space: nowrap;
  }

  &__duration-input {
    width: 64px;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    font-size: $font-size-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $color-accent-teal;
    }
  }
}

.text-danger {
  color: $color-danger;
}

.text-success {
  color: $color-success;
}

.text-muted {
  color: $color-text-muted;
}
</style>
