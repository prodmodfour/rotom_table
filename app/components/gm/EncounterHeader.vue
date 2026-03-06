<template>
  <div class="encounter-header">
    <div class="encounter-header__info">
      <h2>{{ encounter.name }}</h2>
      <div class="encounter-header__meta">
        <span class="badge" :class="encounter.battleType === 'trainer' ? 'badge--blue' : 'badge--red'">
          {{ encounter.battleType === 'trainer' ? 'Trainer Battle' : 'Full Contact' }}
        </span>
        <span class="badge badge--gray">Round {{ encounter.currentRound }}</span>
        <span
          v-if="encounter.battleType === 'trainer' && encounter.isActive"
          class="badge badge--phase"
          :title="phaseTooltip"
        >
          {{ phaseLabel }}
        </span>
        <span v-if="encounter.isPaused" class="badge badge--yellow">Paused</span>
        <span v-if="encounter.isServed" class="badge badge--green">
          <img src="/icons/phosphor/monitor.svg" alt="" class="badge-icon" /> Served to Group
        </span>

        <!-- Weather Badge -->
        <span v-if="encounter.weather" class="badge badge--weather" :title="weatherTooltip">
          <img src="/icons/phosphor/cloud.svg" alt="" class="badge-icon" />
          {{ weatherLabel }}
          <span v-if="encounter.weatherDuration > 0" class="weather-counter">
            ({{ encounter.weatherDuration }}r)
          </span>
          <span v-else-if="encounter.weatherSource === 'manual'" class="weather-counter">
            (manual)
          </span>
        </span>
      </div>
    </div>

    <div class="encounter-header__actions">
      <!-- Weather Condition Control (PTU p.341: game Weather Conditions, not natural weather) -->
      <div class="weather-control">
        <select
          class="weather-select"
          :value="encounter.weather ?? ''"
          @change="handleWeatherChange"
          title="Set game Weather Condition (PTU p.341) — has mechanical combat effects. Not the same as natural weather."
        >
          <option value="">No Weather Condition</option>
          <option value="sunny">Sunny</option>
          <option value="rain">Rain</option>
          <option value="sandstorm">Sandstorm</option>
          <option value="hail">Hail</option>
          <option value="snow">Snow</option>
          <option value="fog">Fog</option>
          <option value="harsh_sunlight">Harsh Sunlight</option>
          <option value="heavy_rain">Heavy Rain</option>
          <option value="strong_winds">Strong Winds</option>
        </select>
        <select
          v-if="encounter.weather"
          class="weather-source-select"
          :value="encounter.weatherSource ?? 'manual'"
          @change="handleSourceChange"
          title="Weather source (determines duration)"
        >
          <option value="manual">Manual</option>
          <option value="move">Move (5 rounds)</option>
          <option value="ability">Ability (5 rounds)</option>
        </select>
      </div>

      <!-- Serve/Unserve Buttons -->
      <button
        v-if="!encounter.isServed"
        class="btn btn--secondary btn--with-icon"
        @click="$emit('serve')"
        title="Display this encounter on Group View"
      >
        <img src="/icons/phosphor/monitor.svg" alt="" class="btn-svg" />
        Serve to Group
      </button>
      <button
        v-else
        class="btn btn--warning btn--with-icon"
        @click="$emit('unserve')"
        title="Stop displaying this encounter on Group View"
      >
        <img src="/icons/phosphor/monitor.svg" alt="" class="btn-svg" />
        Unserve
      </button>

      <!-- Undo/Redo Buttons -->
      <div class="undo-redo-group">
        <button
          class="btn btn--secondary btn--icon btn--with-icon"
          :disabled="!undoRedoState.canUndo"
          :title="undoRedoState.canUndo ? `Undo: ${undoRedoState.lastActionName}` : 'Nothing to undo'"
          @click="$emit('undo')"
        >
          <img src="/icons/phosphor/arrow-counter-clockwise.svg" alt="" class="btn-svg" />
          Undo
        </button>
        <button
          class="btn btn--secondary btn--icon btn--with-icon"
          :disabled="!undoRedoState.canRedo"
          :title="undoRedoState.canRedo ? `Redo: ${undoRedoState.nextActionName}` : 'Nothing to redo'"
          @click="$emit('redo')"
        >
          <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="btn-svg" />
          Redo
        </button>
      </div>

      <button
        v-if="!encounter.isActive"
        class="btn btn--success"
        @click="$emit('start')"
        :disabled="encounter.combatants.length === 0"
      >
        Start Combat
      </button>
      <button
        v-else
        class="btn btn--primary"
        @click="$emit('nextTurn')"
      >
        Next Turn
      </button>
      <button class="btn btn--danger" @click="$emit('end')">
        End Encounter
      </button>
      <button
        class="btn btn--ghost btn--with-icon"
        @click="$emit('saveTemplate')"
        title="Save current setup as a reusable template"
      >
        <img src="/icons/phosphor/floppy-disk.svg" alt="" class="btn-svg" />
        Save Template
      </button>
      <button
        class="btn btn--ghost btn--icon-only"
        @click="$emit('showHelp')"
        title="Keyboard shortcuts (?)"
        data-testid="help-btn"
      >
        <img src="/icons/phosphor/question.svg" alt="" class="btn-svg btn-svg--icon-only" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Encounter } from '~/types'

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'Sunny',
  rain: 'Rain',
  sandstorm: 'Sandstorm',
  hail: 'Hail',
  snow: 'Snow',
  fog: 'Fog',
  harsh_sunlight: 'Harsh Sunlight',
  heavy_rain: 'Heavy Rain',
  strong_winds: 'Strong Winds'
}

interface UndoRedoState {
  canUndo: boolean
  canRedo: boolean
  lastActionName: string | null
  nextActionName: string | null
}

const props = defineProps<{
  encounter: Encounter
  undoRedoState: UndoRedoState
}>()

const emit = defineEmits<{
  serve: []
  unserve: []
  undo: []
  redo: []
  start: []
  nextTurn: []
  end: []
  saveTemplate: []
  showHelp: []
  setWeather: [weather: string | null, source: string]
}>()

const PHASE_LABELS: Record<string, string> = {
  trainer_declaration: 'Declaration (Low \u2192 High)',
  trainer_resolution: 'Resolution (High \u2192 Low)',
  pokemon: 'Pokemon Phase'
}

const PHASE_TOOLTIPS: Record<string, string> = {
  trainer_declaration: 'Trainers declare actions from lowest to highest speed (decree-021)',
  trainer_resolution: 'Declared actions resolve from highest to lowest speed (decree-021)',
  pokemon: 'Pokemon act in initiative order (fastest first)'
}

const phaseLabel = computed(() => {
  const phase = props.encounter.currentPhase ?? 'pokemon'
  return PHASE_LABELS[phase] ?? phase
})

const phaseTooltip = computed(() => {
  const phase = props.encounter.currentPhase ?? 'pokemon'
  return PHASE_TOOLTIPS[phase] ?? ''
})

const weatherLabel = computed(() => {
  if (!props.encounter.weather) return ''
  return WEATHER_LABELS[props.encounter.weather] ?? props.encounter.weather
})

const weatherTooltip = computed(() => {
  if (!props.encounter.weather) return ''
  const source = props.encounter.weatherSource ?? 'manual'
  const duration = props.encounter.weatherDuration
  const weather = props.encounter.weather

  let tooltip = weatherLabel.value
  if (duration > 0) {
    tooltip += ` - ${duration} round${duration === 1 ? '' : 's'} remaining (${source})`
  } else {
    tooltip += ` - indefinite (${source})`
  }

  // P2: Add weather effect summary for PTU weather conditions
  if (weather === 'hail') {
    tooltip += '\nDamage: 1/10 max HP to non-Ice types'
    tooltip += '\nImmune: Ice Body, Snow Cloak, Snow Warning, Overcoat, Magic Guard'
    tooltip += '\nSnow Cloak: +2 Evasion'
    tooltip += '\nIce Body: heals 1/10 max HP'
    tooltip += '\nThermosensitive: halved movement'
  } else if (weather === 'sandstorm') {
    tooltip += '\nDamage: 1/10 max HP to non-Ground/Rock/Steel types'
    tooltip += '\nImmune: Sand Veil, Sand Rush, Sand Force, Sand Stream, Desert Weather, Overcoat, Magic Guard'
    tooltip += '\nSand Veil: +2 Evasion'
    tooltip += '\nSand Rush: +4 Speed CS'
    tooltip += '\nSand Force: +5 damage (Ground/Rock/Steel moves)'
  } else if (weather === 'rain') {
    tooltip += '\nFire moves: -5 DB | Water moves: +5 DB'
    tooltip += '\nSwift Swim: +4 Speed CS'
    tooltip += '\nRain Dish: heals 1/10 max HP'
    tooltip += '\nHydration: cures one status'
    tooltip += '\nDry Skin: heals 1/10 max HP'
  } else if (weather === 'sunny') {
    tooltip += '\nFire moves: +5 DB | Water moves: -5 DB'
    tooltip += '\nChlorophyll: +4 Speed CS'
    tooltip += '\nSun Blanket: heals 1/10 max HP'
    tooltip += '\nSolar Power: +2 SpAtk CS, loses 1/16 max HP'
    tooltip += '\nLeaf Guard: cures one status'
    tooltip += '\nThermosensitive: +2 Atk/SpAtk CS'
    tooltip += '\nFlower Gift: distribute +2 CS (manual)'
  }

  return tooltip
})

const handleWeatherChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const weather = value || null
  const source = weather ? (props.encounter.weatherSource ?? 'manual') : 'manual'
  emit('setWeather', weather, source)
}

const handleSourceChange = (event: Event) => {
  const source = (event.target as HTMLSelectElement).value
  emit('setWeather', props.encounter.weather ?? null, source)
}
</script>

<style lang="scss" scoped>
.encounter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $glass-border;

  &__info {
    h2 {
      margin-bottom: $spacing-sm;
      color: $color-text;
    }
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
    align-items: center;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
    flex-wrap: wrap;
  }
}

.weather-control {
  display: flex;
  gap: $spacing-xs;
  align-items: center;
  padding-right: $spacing-sm;
  border-right: 1px solid $glass-border;
}

.weather-select,
.weather-source-select {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-xs;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.weather-source-select {
  max-width: 130px;
}

.weather-counter {
  font-size: $font-size-xs;
  opacity: 0.8;
}

.undo-redo-group {
  display: flex;
  gap: $spacing-xs;
  padding: 0 $spacing-sm;
  border-left: 1px solid $glass-border;
  border-right: 1px solid $glass-border;
  margin: 0 $spacing-xs;

  .btn {
    min-width: auto;
    padding: $spacing-xs $spacing-sm;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.btn-svg {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;

  &--icon-only {
    width: 18px;
    height: 18px;
  }
}

.btn--with-icon {
  @include btn-with-icon;
}

.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-primary;
    color: $color-text;
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &--blue {
    background: $gradient-scarlet;
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
  }
  &--red {
    background: $gradient-scarlet;
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
  }
  &--gray {
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
  }
  &--phase {
    background: linear-gradient(135deg, $color-accent-violet 0%, $color-accent-violet-light 100%);
    color: #fff;
    box-shadow: 0 0 8px rgba($color-accent-violet, 0.4);
  }
  &--yellow {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: $color-text-dark;
  }
  &--green {
    background: linear-gradient(135deg, $color-success 0%, #34d399 100%);
    box-shadow: 0 0 8px rgba($color-success, 0.4);
  }
  &--weather {
    background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
    color: #fff;
    box-shadow: 0 0 8px rgba(#29b6f6, 0.4);
  }
}

.badge-icon {
  width: 12px;
  height: 12px;
  filter: brightness(0) invert(1);
}
</style>
