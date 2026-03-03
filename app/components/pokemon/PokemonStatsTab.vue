<template>
  <div class="tab-content">
    <div class="stats-grid">
      <div class="stat-block">
        <label>HP</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.hp || 0 }}</span>
          <span class="stat-current">{{ editData.currentHp }} / {{ editData.maxHp }}</span>
        </div>
        <div v-if="isEditing" class="stat-edit">
          <input v-model.number="localCurrentHp" type="number" class="form-input form-input--sm" />
          <span>/</span>
          <input v-model.number="localMaxHp" type="number" class="form-input form-input--sm" />
        </div>
      </div>
      <div class="stat-block">
        <label>Attack</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.attack || 0 }}</span>
          <span class="stat-current">{{ pokemon.currentStats?.attack || 0 }}</span>
        </div>
      </div>
      <div class="stat-block">
        <label>Defense</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.defense || 0 }}</span>
          <span class="stat-current">{{ pokemon.currentStats?.defense || 0 }}</span>
        </div>
      </div>
      <div class="stat-block">
        <label>Sp. Atk</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.specialAttack || 0 }}</span>
          <span class="stat-current">{{ pokemon.currentStats?.specialAttack || 0 }}</span>
        </div>
      </div>
      <div class="stat-block">
        <label>Sp. Def</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.specialDefense || 0 }}</span>
          <span class="stat-current">{{ pokemon.currentStats?.specialDefense || 0 }}</span>
        </div>
      </div>
      <div class="stat-block">
        <label>Speed</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.speed || 0 }}</span>
          <span class="stat-current">{{ pokemon.currentStats?.speed || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Combat State Section -->
    <div class="combat-state">
      <!-- Status Conditions -->
      <div v-if="statusConditions.length > 0" class="combat-state__section">
        <h4>Status Conditions</h4>
        <div class="status-list">
          <span
            v-for="status in statusConditions"
            :key="status"
            class="status-badge"
            :class="`status-badge--${status.toLowerCase().replace(' ', '-')}`"
          >
            {{ status }}
          </span>
        </div>
      </div>

      <!-- Injuries -->
      <div v-if="pokemon.injuries > 0" class="combat-state__section">
        <h4>Injuries</h4>
        <div class="injury-display">
          <span class="injury-count">{{ pokemon.injuries }}</span>
          <span class="injury-label">Injur{{ pokemon.injuries === 1 ? 'y' : 'ies' }}</span>
        </div>
      </div>

      <!-- Stage Modifiers -->
      <div v-if="hasStageModifiers" class="combat-state__section">
        <h4>Combat Stages</h4>
        <div class="stage-grid">
          <div v-if="pokemon.stageModifiers?.attack !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.attack)">
            <span class="stage-stat">ATK</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.attack) }}</span>
          </div>
          <div v-if="pokemon.stageModifiers?.defense !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.defense)">
            <span class="stage-stat">DEF</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.defense) }}</span>
          </div>
          <div v-if="pokemon.stageModifiers?.specialAttack !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.specialAttack)">
            <span class="stage-stat">SP.ATK</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.specialAttack) }}</span>
          </div>
          <div v-if="pokemon.stageModifiers?.specialDefense !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.specialDefense)">
            <span class="stage-stat">SP.DEF</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.specialDefense) }}</span>
          </div>
          <div v-if="pokemon.stageModifiers?.speed !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.speed)">
            <span class="stage-stat">SPD</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.speed) }}</span>
          </div>
          <div v-if="pokemon.stageModifiers?.accuracy !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.accuracy)">
            <span class="stage-stat">ACC</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.accuracy) }}</span>
          </div>
          <div v-if="pokemon.stageModifiers?.evasion !== 0" class="stage-item" :class="getStageClass(pokemon.stageModifiers?.evasion)">
            <span class="stage-stat">EVA+</span>
            <span class="stage-value">{{ formatStageValue(pokemon.stageModifiers?.evasion) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h4>Nature</h4>
      <p v-if="pokemon.nature">
        {{ pokemon.nature.name }}
        <span v-if="pokemon.nature.raisedStat" class="nature-mod nature-mod--up">
          +{{ formatStatName(pokemon.nature.raisedStat) }}
        </span>
        <span v-if="pokemon.nature.loweredStat" class="nature-mod nature-mod--down">
          -{{ formatStatName(pokemon.nature.loweredStat) }}
        </span>
      </p>
    </div>

    <!-- Loyalty Section (PTU Chapter 10) -->
    <div class="info-section">
      <h4>
        <PhHandshake :size="16" class="loyalty-icon" />
        Loyalty
      </h4>
      <div v-if="isEditing" class="loyalty-edit">
        <select
          :value="editData.loyalty ?? pokemon.loyalty ?? 3"
          class="form-input loyalty-select"
          @change="updateLoyalty(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="rank in loyaltyRanks" :key="rank.value" :value="rank.value">
            {{ rank.value }} - {{ rank.label }}
          </option>
        </select>
      </div>
      <div v-else class="loyalty-display">
        <span class="loyalty-value" :class="loyaltyClass">{{ currentLoyalty }}</span>
        <span class="loyalty-rank" :class="loyaltyClass">{{ loyaltyRankName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhHandshake } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'

const props = defineProps<{
  pokemon: Pokemon
  editData: Partial<Pokemon>
  isEditing: boolean
}>()

const emit = defineEmits<{
  'update:editData': [data: Partial<Pokemon>]
}>()

// Two-way binding for HP edit fields
const localCurrentHp = computed({
  get: () => props.editData.currentHp,
  set: (val) => emit('update:editData', { ...props.editData, currentHp: val })
})

const localMaxHp = computed({
  get: () => props.editData.maxHp,
  set: (val) => emit('update:editData', { ...props.editData, maxHp: val })
})

const statusConditions = computed(() => {
  if (!props.pokemon?.statusConditions) return []
  return Array.isArray(props.pokemon.statusConditions)
    ? props.pokemon.statusConditions
    : []
})

const hasStageModifiers = computed(() => {
  if (!props.pokemon?.stageModifiers) return false
  const mods = props.pokemon.stageModifiers
  return mods.attack !== 0 || mods.defense !== 0 ||
         mods.specialAttack !== 0 || mods.specialDefense !== 0 ||
         mods.speed !== 0 || mods.accuracy !== 0 || mods.evasion !== 0
})

const formatStageValue = (value: number | undefined): string => {
  if (value === undefined || value === 0) return '0'
  return value > 0 ? `+${value}` : `${value}`
}

const getStageClass = (value: number | undefined): string => {
  if (value === undefined || value === 0) return ''
  return value > 0 ? 'stage-item--positive' : 'stage-item--negative'
}

// Loyalty ranks (PTU Chapter 10)
const loyaltyRanks = [
  { value: 0, label: 'Hostile' },
  { value: 1, label: 'Resistant' },
  { value: 2, label: 'Wary' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Friendly' },
  { value: 5, label: 'Loyal' },
  { value: 6, label: 'Devoted' }
]

const currentLoyalty = computed(() => props.pokemon.loyalty ?? 3)

const loyaltyRankName = computed(() => {
  const rank = loyaltyRanks.find(r => r.value === currentLoyalty.value)
  return rank?.label ?? 'Neutral'
})

const loyaltyClass = computed(() => {
  const val = currentLoyalty.value
  if (val <= 1) return 'loyalty--low'
  if (val <= 2) return 'loyalty--wary'
  if (val === 3) return 'loyalty--neutral'
  if (val <= 5) return 'loyalty--high'
  return 'loyalty--devoted'
})

const updateLoyalty = (value: number) => {
  emit('update:editData', { ...props.editData, loyalty: value })
}

const formatStatName = (stat: string) => {
  const names: Record<string, string> = {
    'hp': 'HP',
    'attack': 'Atk',
    'defense': 'Def',
    'specialAttack': 'SpAtk',
    'specialDefense': 'SpDef',
    'speed': 'Spd'
  }
  return names[stat] || stat
}
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.stat-block {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
    text-transform: uppercase;
  }

  .stat-values {
    display: flex;
    justify-content: center;
    gap: $spacing-sm;
    align-items: baseline;
  }

  .stat-base {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  .stat-current {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-text;
  }

  .stat-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    margin-top: $spacing-sm;

    .form-input--sm {
      width: 60px;
      padding: $spacing-xs;
      text-align: center;
    }
  }
}

// Combat state styles
.combat-state {
  margin-bottom: $spacing-lg;

  &__section {
    margin-bottom: $spacing-md;
    padding: $spacing-md;
    background: $color-bg-secondary;
    border-radius: $border-radius-md;

    h4 {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-sm;
      color: $color-text-muted;
      text-transform: uppercase;
    }
  }
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.status-badge {
  padding: 4px 8px;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  // Persistent conditions
  &--burned { background: #ff6b35; color: #fff; }
  &--frozen { background: #7dd3fc; color: #000; }
  &--paralyzed { background: #facc15; color: #000; }
  &--poisoned { background: #a855f7; color: #fff; }
  &--badly-poisoned { background: #7c3aed; color: #fff; }
  &--asleep { background: #6b7280; color: #fff; }
  &--fainted { background: #1f2937; color: #9ca3af; }

  // Volatile conditions
  &--confused { background: #f472b6; color: #000; }
  &--flinched { background: #fbbf24; color: #000; }
  &--infatuated { background: #ec4899; color: #fff; }
  &--cursed { background: #581c87; color: #fff; }
  &--disabled { background: #64748b; color: #fff; }
  &--encored { background: #22d3ee; color: #000; }
  &--taunted { background: #ef4444; color: #fff; }
  &--tormented { background: #991b1b; color: #fff; }
  &--enraged { background: #dc2626; color: #fff; }
  &--suppressed { background: #475569; color: #fff; }

  // Movement conditions
  &--stuck { background: #92400e; color: #fff; }
  &--trapped { background: #78350f; color: #fff; }
  &--slowed { background: #0369a1; color: #fff; }

  // Default
  background: $color-bg-tertiary;
  color: $color-text;
}

.injury-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .injury-count {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: $color-danger;
    color: #fff;
    border-radius: 50%;
    font-size: $font-size-lg;
    font-weight: 700;
  }

  .injury-label {
    color: $color-danger;
    font-weight: 500;
  }
}

.stage-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  min-width: 50px;

  .stage-stat {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
  }

  .stage-value {
    font-size: $font-size-md;
    font-weight: 700;
  }

  &--positive {
    border: 1px solid $color-success;
    .stage-value { color: $color-success; }
  }

  &--negative {
    border: 1px solid $color-danger;
    .stage-value { color: $color-danger; }
  }
}

.info-section {
  @include pokemon-info-section;
}

.nature-mod {
  font-size: $font-size-sm;
  margin-left: $spacing-sm;

  &--up { color: $color-success; }
  &--down { color: $color-danger; }
}

// Loyalty styles
.loyalty-icon {
  vertical-align: middle;
  margin-right: $spacing-xs;
}

.loyalty-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.loyalty-value {
  font-size: $font-size-lg;
  font-weight: 700;
}

.loyalty-rank {
  font-size: $font-size-sm;
  font-weight: 500;
}

.loyalty--low {
  color: $color-danger;
}

.loyalty--wary {
  color: $color-warning;
}

.loyalty--neutral {
  color: $color-text-muted;
}

.loyalty--high {
  color: $color-success;
}

.loyalty--devoted {
  color: $color-accent-violet;
}

.loyalty-edit {
  margin-top: $spacing-xs;
}

.loyalty-select {
  max-width: 200px;
}

.tab-content {
  @include pokemon-tab-content;
}

@include pokemon-sheet-keyframes;
</style>
