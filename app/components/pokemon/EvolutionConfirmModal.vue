<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal evolution-modal">
        <div class="modal__header">
          <h3>
            <PhArrowCircleUp :size="20" class="header-icon" />
            Evolve {{ pokemonName }}
          </h3>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal__body">
          <!-- Species change summary -->
          <div class="evolution-summary">
            <div class="evolution-summary__from">
              <span class="species-name">{{ currentSpecies }}</span>
              <div class="type-badges">
                <span
                  v-for="t in currentTypes"
                  :key="t"
                  :class="['type-badge', `type-badge--${t.toLowerCase()}`]"
                >{{ t }}</span>
              </div>
            </div>
            <PhArrowRight :size="24" class="evolution-arrow" />
            <div class="evolution-summary__to">
              <span class="species-name">{{ targetSpecies }}</span>
              <div class="type-badges">
                <span
                  v-for="t in targetTypes"
                  :key="t"
                  :class="['type-badge', `type-badge--${t.toLowerCase()}`]"
                >{{ t }}</span>
              </div>
            </div>
          </div>

          <!-- Item requirement note -->
          <div v-if="requiredItem" class="evolution-item-note">
            <PhInfo :size="16" />
            <span>Requires: {{ requiredItem }}{{ itemMustBeHeld ? ' (must be held)' : '' }}</span>
          </div>

          <!-- Stat comparison and redistribution -->
          <div class="stat-section">
            <h4 class="stat-section__title">
              Stat Point Redistribution
              <span class="stat-section__total" :class="{ 'stat-section__total--invalid': !isPointTotalValid }">
                {{ currentPointTotal }} / {{ requiredPointTotal }}
              </span>
            </h4>

            <div class="stat-grid">
              <div class="stat-grid__header">
                <span>Stat</span>
                <span>Old Base</span>
                <span>New Base</span>
                <span>Points</span>
                <span>Final</span>
              </div>

              <div
                v-for="stat in statKeys"
                :key="stat"
                class="stat-row"
                :class="{ 'stat-row--violation': statHasViolation(stat) }"
              >
                <span class="stat-row__label">{{ STAT_LABELS[stat] }}</span>
                <span class="stat-row__old-base">{{ oldBaseStats[stat] }}</span>
                <span class="stat-row__new-base" :class="{
                  'stat-row__new-base--up': newNatureAdjustedBase[stat] > oldBaseStats[stat],
                  'stat-row__new-base--down': newNatureAdjustedBase[stat] < oldBaseStats[stat]
                }">
                  {{ newNatureAdjustedBase[stat] }}
                </span>
                <div class="stat-row__points">
                  <button
                    class="btn btn--sm btn--danger"
                    :disabled="statPointInputs[stat] <= 0"
                    @click="decrementStat(stat)"
                  >-</button>
                  <span class="stat-row__point-value">{{ statPointInputs[stat] }}</span>
                  <button
                    class="btn btn--sm btn--success"
                    @click="incrementStat(stat)"
                  >+</button>
                </div>
                <span class="stat-row__final">
                  {{ newNatureAdjustedBase[stat] + statPointInputs[stat] }}
                </span>
              </div>
            </div>

            <!-- HP display -->
            <div class="hp-preview">
              <span class="hp-preview__label">Max HP:</span>
              <span class="hp-preview__old">{{ currentMaxHp }}</span>
              <PhArrowRight :size="14" />
              <span class="hp-preview__new" :class="{
                'hp-preview__new--up': newMaxHp > currentMaxHp,
                'hp-preview__new--down': newMaxHp < currentMaxHp
              }">
                {{ newMaxHp }}
              </span>
            </div>
          </div>

          <!-- Base Relations violations -->
          <div v-if="violations.length > 0" class="violations-section">
            <h4 class="violations-section__title">
              <PhWarning :size="16" />
              Base Relations Violations
            </h4>
            <ul>
              <li v-for="(v, i) in violations" :key="i">{{ v }}</li>
            </ul>
            <label class="violations-override">
              <input v-model="skipBaseRelations" type="checkbox" />
              Override Base Relations (GM discretion)
            </label>
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn btn--secondary" @click="$emit('close')">Cancel</button>
          <button
            class="btn btn--primary"
            :disabled="!canEvolve"
            @click="handleEvolve"
          >
            <PhArrowCircleUp :size="16" />
            Evolve
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  PhArrowCircleUp,
  PhArrowRight,
  PhInfo,
  PhWarning
} from '@phosphor-icons/vue'
import { applyNatureToBaseStats } from '~/constants/natures'
import { validateBaseRelations } from '~/server/services/evolution.service'
import type { Stats } from '~/server/services/evolution.service'

const props = defineProps<{
  pokemonId: string
  pokemonName: string
  currentSpecies: string
  currentTypes: string[]
  targetSpecies: string
  /** Target species types from evolution-check endpoint */
  targetTypes: string[]
  currentLevel: number
  currentMaxHp: number
  /** Nature-adjusted base stats (from Pokemon record) */
  oldBaseStats: Stats
  /** Raw base stats of the target species (from evolution-check endpoint) */
  targetRawBaseStats: Stats
  /** Pokemon's nature name */
  natureName: string
  /** Required item for this evolution (null if level-only) */
  requiredItem: string | null
  /** Whether the item must be held */
  itemMustBeHeld: boolean
}>()

const emit = defineEmits<{
  close: []
  evolved: [result: Record<string, unknown>]
}>()

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp. Atk',
  specialDefense: 'Sp. Def',
  speed: 'Speed'
}

const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const

// State
const skipBaseRelations = ref(false)
const evolving = ref(false)

// Stat point inputs — initialized with even distribution
const statPointInputs = reactive<Record<string, number>>({
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0
})

// Initialize stat points on mount
onMounted(() => {
  const totalPoints = props.currentLevel + 10
  const perStat = Math.floor(totalPoints / 6)
  const remainder = totalPoints - (perStat * 6)

  statPointInputs.hp = perStat + (remainder > 0 ? 1 : 0)
  statPointInputs.attack = perStat + (remainder > 1 ? 1 : 0)
  statPointInputs.defense = perStat + (remainder > 2 ? 1 : 0)
  statPointInputs.specialAttack = perStat + (remainder > 3 ? 1 : 0)
  statPointInputs.specialDefense = perStat + (remainder > 4 ? 1 : 0)
  statPointInputs.speed = perStat
})

// Computed: new base stats with nature applied
const newNatureAdjustedBase = computed((): Stats => {
  return applyNatureToBaseStats(props.targetRawBaseStats, props.natureName)
})

// Computed: required point total
const requiredPointTotal = computed(() => props.currentLevel + 10)

// Computed: current point total
const currentPointTotal = computed(() => {
  return statKeys.reduce((sum, key) => sum + statPointInputs[key], 0)
})

// Computed: is point total valid
const isPointTotalValid = computed(() => currentPointTotal.value === requiredPointTotal.value)

// Computed: new max HP
const newMaxHp = computed(() => {
  const hpStat = newNatureAdjustedBase.value.hp + statPointInputs.hp
  return props.currentLevel + (hpStat * 3) + 10
})

// Computed: Base Relations violations
const violations = computed((): string[] => {
  const points: Stats = {
    hp: statPointInputs.hp,
    attack: statPointInputs.attack,
    defense: statPointInputs.defense,
    specialAttack: statPointInputs.specialAttack,
    specialDefense: statPointInputs.specialDefense,
    speed: statPointInputs.speed
  }
  return validateBaseRelations(newNatureAdjustedBase.value, points)
})

// Computed: can evolve
const canEvolve = computed(() => {
  if (!isPointTotalValid.value) return false
  if (violations.value.length > 0 && !skipBaseRelations.value) return false
  if (evolving.value) return false
  return true
})

// Check if a specific stat has a violation
function statHasViolation(stat: string): boolean {
  return violations.value.some(v => v.includes(stat))
}

// Stat point controls
function incrementStat(stat: string): void {
  statPointInputs[stat]++
}

function decrementStat(stat: string): void {
  if (statPointInputs[stat] > 0) {
    statPointInputs[stat]--
  }
}

// Perform evolution
async function handleEvolve(): Promise<void> {
  if (!canEvolve.value) return

  evolving.value = true
  try {
    const response = await $fetch<{ success: boolean; data: Record<string, unknown> }>(
      `/api/pokemon/${props.pokemonId}/evolve`,
      {
        method: 'POST',
        body: {
          targetSpecies: props.targetSpecies,
          statPoints: {
            hp: statPointInputs.hp,
            attack: statPointInputs.attack,
            defense: statPointInputs.defense,
            specialAttack: statPointInputs.specialAttack,
            specialDefense: statPointInputs.specialDefense,
            speed: statPointInputs.speed
          },
          skipBaseRelations: skipBaseRelations.value
        }
      }
    )

    if (response.success) {
      emit('evolved', response.data)
      emit('close')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evolution failed'
    alert(`Evolution failed: ${message}`)
  } finally {
    evolving.value = false
  }
}
</script>

<style lang="scss" scoped>
.evolution-modal {
  max-width: 600px;

  .header-icon {
    color: $color-warning;
    vertical-align: middle;
  }
}

.evolution-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  background: rgba($color-bg-tertiary, 0.5);
  border-radius: $border-radius-md;

  &__from,
  &__to {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
  }

  .species-name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
  }

  .type-badges {
    display: flex;
    gap: $spacing-xs;
  }

  .type-badge {
    font-size: $font-size-xs;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-full;
    font-weight: 600;
    text-transform: uppercase;
    color: $color-text;

    &--fire { background: $type-fire; }
    &--water { background: $type-water; }
    &--grass { background: $type-grass; }
    &--electric { background: $type-electric; }
    &--ice { background: $type-ice; }
    &--fighting { background: $type-fighting; }
    &--poison { background: $type-poison; }
    &--ground { background: $type-ground; }
    &--flying { background: $type-flying; }
    &--psychic { background: $type-psychic; }
    &--bug { background: $type-bug; }
    &--rock { background: $type-rock; }
    &--ghost { background: $type-ghost; }
    &--dragon { background: $type-dragon; }
    &--dark { background: $type-dark; }
    &--steel { background: $type-steel; }
    &--fairy { background: $type-fairy; }
    &--normal { background: $type-normal; }
  }
}

.evolution-arrow {
  color: $color-warning;
  flex-shrink: 0;
}

.evolution-item-note {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-md;
  background: rgba($color-info, 0.1);
  border: 1px solid rgba($color-info, 0.3);
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  color: $color-info;
}

.stat-section {
  &__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
    margin-bottom: $spacing-sm;
  }

  &__total {
    font-weight: 700;
    color: $color-success;

    &--invalid {
      color: $color-danger;
    }
  }
}

.stat-grid {
  border: 1px solid $border-color-subtle;
  border-radius: $border-radius-md;
  overflow: hidden;

  &__header {
    display: grid;
    grid-template-columns: 1fr 0.7fr 0.7fr 1.2fr 0.7fr;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    text-transform: uppercase;
  }
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 0.7fr 0.7fr 1.2fr 0.7fr;
  gap: $spacing-xs;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  border-top: 1px solid $border-color-subtle;
  font-size: $font-size-sm;

  &--violation {
    background: rgba($color-danger, 0.08);
  }

  &__label {
    font-weight: 500;
    color: $color-text;
  }

  &__old-base {
    color: $color-text-muted;
    text-align: center;
  }

  &__new-base {
    text-align: center;
    font-weight: 600;

    &--up { color: $color-success; }
    &--down { color: $color-danger; }
  }

  &__points {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  &__point-value {
    min-width: 28px;
    text-align: center;
    font-weight: 600;
    color: $color-accent-teal;
  }

  &__final {
    text-align: center;
    font-weight: 700;
    color: $color-text;
  }
}

.hp-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-bg-tertiary, 0.5);
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &__label {
    font-weight: 600;
    color: $color-text;
  }

  &__old {
    color: $color-text-muted;
  }

  &__new {
    font-weight: 700;

    &--up { color: $color-success; }
    &--down { color: $color-danger; }
  }
}

.violations-section {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: rgba($color-danger, 0.08);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-md;

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-danger;
    margin-bottom: $spacing-sm;
  }

  ul {
    margin: 0;
    padding-left: $spacing-lg;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.6;
  }
}

.violations-override {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $color-text-muted;
  cursor: pointer;

  input[type="checkbox"] {
    accent-color: $color-warning;
  }
}
</style>
