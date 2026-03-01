<template>
  <div class="move-learning-panel">
    <div class="move-learning-panel__header">
      <h4>
        <PhSword :size="16" class="header-icon" />
        New Moves Available
      </h4>
    </div>

    <!-- Current Moves -->
    <div class="move-learning-panel__current">
      <div class="current-moves-header">
        <span class="current-moves-label">Current Moves ({{ currentMoves.length }}/6):</span>
      </div>
      <div class="current-moves-list">
        <div
          v-for="(move, index) in displayMoves"
          :key="index"
          class="current-move"
          :class="{
            'current-move--empty': !move,
            'current-move--replaceable': move && isReplacing && replacingMoveIndex === null,
            'current-move--selected': isReplacing && replacingMoveIndex === index
          }"
          @click="move && isReplacing ? selectReplaceTarget(index) : undefined"
        >
          <span class="current-move__index">{{ index + 1 }}.</span>
          <template v-if="move">
            <span class="current-move__name">{{ move.name }}</span>
            <span
              class="current-move__type type-tag"
              :class="`type-tag--${(move.type || '').toLowerCase()}`"
            >
              {{ move.type }}
            </span>
            <span class="current-move__class">{{ move.damageClass }}</span>
            <span class="current-move__freq">{{ move.frequency }}</span>
            <span v-if="move.damageBase" class="current-move__db">DB {{ move.damageBase }}</span>
          </template>
          <span v-else class="current-move__empty">(empty)</span>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="move-learning-panel__loading">
      <PhSpinner :size="20" class="spinner-icon" />
      Loading move details...
    </div>

    <!-- Error state -->
    <div v-else-if="errorMsg" class="move-learning-panel__error">
      <PhWarning :size="16" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Available Moves -->
    <div v-else-if="moveDetails.length > 0" class="move-learning-panel__available">
      <p class="available-label">Available moves:</p>

      <div
        v-for="move in moveDetails"
        :key="move.name"
        class="available-move"
        :class="{ 'available-move--learned': learnedMoves.has(move.name) }"
      >
        <div class="available-move__header">
          <span class="available-move__name">{{ move.name }}</span>
          <span
            class="available-move__type type-tag"
            :class="`type-tag--${(move.type || '').toLowerCase()}`"
          >
            {{ move.type }}
          </span>
          <span class="available-move__class">{{ move.damageClass }}</span>
          <span class="available-move__freq">{{ move.frequency }}</span>
          <span v-if="move.damageBase" class="available-move__db">DB {{ move.damageBase }}</span>
          <span v-if="move.ac" class="available-move__ac">AC {{ move.ac }}</span>
        </div>
        <p v-if="move.effect" class="available-move__effect">{{ move.effect }}</p>

        <div class="available-move__actions">
          <template v-if="learnedMoves.has(move.name)">
            <span class="learned-badge">
              <PhCheck :size="14" />
              Learned
            </span>
          </template>
          <template v-else-if="isReplacing && replacingMoveName === move.name">
            <span class="replace-prompt">Select a move to replace above</span>
            <button
              class="btn btn--ghost btn--sm"
              @click="cancelReplace"
            >
              Cancel
            </button>
          </template>
          <template v-else>
            <button
              v-if="hasEmptySlots"
              class="btn btn--primary btn--sm"
              :disabled="saving"
              @click="learnMove(move.name, null)"
            >
              {{ saving ? 'Learning...' : `Add to Slot ${firstEmptySlot + 1}` }}
            </button>
            <button
              v-else
              class="btn btn--secondary btn--sm"
              :disabled="saving"
              @click="startReplace(move.name)"
            >
              Replace a Move
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="move-learning-panel__actions">
      <button class="btn btn--secondary btn--sm" @click="handleSkip">
        Skip - Learn No Moves
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSword, PhSpinner, PhWarning, PhCheck } from '@phosphor-icons/vue'
import type { Pokemon, Move } from '~/types'

interface MoveDetail {
  id?: string
  name: string
  type: string
  damageClass: string
  frequency: string
  ac: number | null
  damageBase: number | null
  range: string
  effect: string
}

const props = defineProps<{
  pokemon: Pokemon
  /** Move names available from learnset at the current level */
  availableMoves: string[]
}>()

const emit = defineEmits<{
  (e: 'learned', move: { name: string }): void
  (e: 'skipped'): void
}>()

const loading = ref(true)
const saving = ref(false)
const errorMsg = ref<string | null>(null)
const moveDetails = ref<MoveDetail[]>([])
const learnedMoves = ref<Set<string>>(new Set())

// Replace mode state
const isReplacing = ref(false)
const replacingMoveName = ref<string | null>(null)
const replacingMoveIndex = ref<number | null>(null)

// Live tracking of current moves (updates after each learn)
const currentMoves = ref<Move[]>([])

// currentMoves is initialized once on mount (see onMounted below).
// Not using watchEffect to prevent overwriting local optimistic state
// when parent re-renders during the replace-move workflow.

/** Display slots (always show 6 rows) */
const displayMoves = computed(() => {
  const moves = currentMoves.value
  const result: (Move | null)[] = []
  for (let i = 0; i < 6; i++) {
    result.push(i < moves.length ? moves[i] : null)
  }
  return result
})

const hasEmptySlots = computed(() => currentMoves.value.length < 6)

const firstEmptySlot = computed(() => currentMoves.value.length)

async function loadMoveDetails() {
  loading.value = true
  errorMsg.value = null

  try {
    // Filter out moves the Pokemon already knows
    const knownNames = new Set(currentMoves.value.map(m => m.name))
    const newMoveNames = props.availableMoves.filter(name => !knownNames.has(name))

    if (newMoveNames.length === 0) {
      moveDetails.value = []
      loading.value = false
      return
    }

    const response = await $fetch<{ success: boolean; data: MoveDetail[] }>(
      '/api/moves/batch',
      { method: 'POST', body: { names: newMoveNames } }
    )

    if (response.success) {
      moveDetails.value = response.data
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load move details'
    errorMsg.value = message
  } finally {
    loading.value = false
  }
}

function startReplace(moveName: string) {
  isReplacing.value = true
  replacingMoveName.value = moveName
  replacingMoveIndex.value = null
}

function cancelReplace() {
  isReplacing.value = false
  replacingMoveName.value = null
  replacingMoveIndex.value = null
}

function selectReplaceTarget(index: number) {
  if (!isReplacing.value || !replacingMoveName.value) return
  replacingMoveIndex.value = index
  learnMove(replacingMoveName.value, index)
}

async function learnMove(moveName: string, replaceIndex: number | null) {
  saving.value = true
  errorMsg.value = null

  try {
    const response = await $fetch<{
      success: boolean
      data: { learnedMove: MoveDetail; replacedIndex: number | null; totalMoves: number }
    }>(
      `/api/pokemon/${props.pokemon.id}/learn-move`,
      {
        method: 'POST',
        body: { moveName, replaceIndex }
      }
    )

    if (response.success) {
      // Update local move list — server returns a complete Move with real DB id
      const newMove = response.data.learnedMove as Move

      if (replaceIndex !== null) {
        currentMoves.value = currentMoves.value.map((m, i) =>
          i === replaceIndex ? newMove : m
        )
      } else {
        currentMoves.value = [...currentMoves.value, newMove]
      }

      // Track as learned
      learnedMoves.value = new Set([...learnedMoves.value, moveName])

      // Reset replace mode
      cancelReplace()

      emit('learned', { name: moveName })
    }
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    errorMsg.value = fetchError.data?.message || 'Failed to learn move'
  } finally {
    saving.value = false
  }
}

function handleSkip() {
  emit('skipped')
}

// Initialize on mount: set current moves from props and load available move details
onMounted(() => {
  currentMoves.value = [...(props.pokemon.moves || [])]
  loadMoveDetails()
})
</script>

<style lang="scss" scoped>
.move-learning-panel {
  background: linear-gradient(135deg, rgba($color-success, 0.08) 0%, rgba($color-accent-teal, 0.04) 100%);
  border: 1px solid rgba($color-success, 0.25);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-top: $spacing-md;
  animation: slideDown 0.3s ease-out;

  &__header {
    margin-bottom: $spacing-md;

    h4 {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin: 0;
      color: $color-success;
      font-size: $font-size-md;
    }
  }

  &__current {
    margin-bottom: $spacing-md;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-sm;
    color: $color-danger;
    font-size: $font-size-sm;
    margin-bottom: $spacing-md;
  }

  &__available {
    margin-bottom: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}

.header-icon {
  flex-shrink: 0;
}

.current-moves-header {
  margin-bottom: $spacing-sm;
}

.current-moves-label {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-text-muted;
}

.current-moves-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.current-move {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-bg-primary, 0.3);
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  border: 1px solid transparent;
  transition: all $transition-fast;

  &--empty {
    opacity: 0.4;
  }

  &--replaceable {
    cursor: pointer;

    &:hover {
      background: rgba($color-danger, 0.1);
      border-color: rgba($color-danger, 0.3);
    }
  }

  &--selected {
    background: rgba($color-danger, 0.15);
    border-color: rgba($color-danger, 0.4);
  }

  &__index {
    font-weight: 600;
    color: $color-text-muted;
    min-width: 20px;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
    min-width: 100px;
  }

  &__class,
  &__freq,
  &__db {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__empty {
    color: $color-text-muted;
    font-style: italic;
  }
}

.available-label {
  font-size: $font-size-sm;
  color: $color-text-muted;
  font-weight: 600;
  margin: 0;
}

.available-move {
  padding: $spacing-sm $spacing-md;
  background: rgba($color-bg-primary, 0.3);
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba($color-success, 0.3);
  }

  &--learned {
    opacity: 0.5;
    border-color: rgba($color-success, 0.3);
    background: rgba($color-success, 0.05);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
    margin-bottom: 2px;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__class,
  &__freq,
  &__db,
  &__ac {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__effect {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin: $spacing-xs 0;
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }
}

.type-tag {
  font-size: $font-size-xs;
  padding: 1px $spacing-xs;
  border-radius: $border-radius-sm;
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

.learned-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-success;
}

.replace-prompt {
  font-size: $font-size-xs;
  color: $color-warning;
  font-style: italic;
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
