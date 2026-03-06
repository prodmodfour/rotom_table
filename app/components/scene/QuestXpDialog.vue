<template>
  <div class="quest-xp-dialog">
    <div class="quest-xp-dialog__header">
      <h4>Award Quest XP</h4>
      <button class="btn btn--icon btn--ghost" @click="emit('close')">
        <PhX :size="16" />
      </button>
    </div>
    <p class="quest-xp-dialog__desc">
      Award trainer XP to all {{ characters.length }} character{{ characters.length !== 1 ? 's' : '' }} in this scene.
    </p>

    <div class="quest-xp-dialog__form">
      <div class="quest-xp-dialog__field">
        <label>XP Amount</label>
        <input
          v-model.number="xpAmount"
          type="number"
          class="form-input form-input--sm"
          min="1"
          max="20"
        />
      </div>
      <div class="quest-xp-dialog__field quest-xp-dialog__field--wide">
        <label>Reason (optional)</label>
        <input
          v-model="reason"
          type="text"
          class="form-input form-input--sm"
          placeholder="Completed quest, milestone, etc."
        />
      </div>
    </div>

    <div class="quest-xp-dialog__preview">
      <div
        v-for="char in characters"
        :key="char.id"
        class="quest-xp-preview-row"
      >
        <span class="quest-xp-preview-row__info">
          {{ char.name }} (Lv.{{ char.level }}, Bank: {{ char.trainerXp }}/10)
        </span>
        <span
          v-if="getLevelUpPreview(char)"
          class="quest-xp-preview-row__levelup"
        >
          -> Lv.{{ getLevelUpPreview(char) }}
        </span>
        <span
          v-if="getMilestonePreview(char).length > 0"
          class="quest-xp-preview-row__milestone"
        >
          Milestone at Lv.{{ getMilestonePreview(char).join(', ') }}
        </span>
      </div>
    </div>

    <div class="quest-xp-dialog__actions">
      <button class="btn btn--secondary" @click="emit('close')">Cancel</button>
      <button
        class="btn btn--primary"
        @click="handleAward"
        :disabled="isAwarding || !xpAmount || xpAmount < 1 || characters.length === 0"
      >
        {{ isAwarding ? 'Awarding...' : 'Award' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'
import { applyTrainerXp } from '~/utils/trainerExperience'

interface SceneCharacterXp {
  id: string
  name: string
  level: number
  trainerXp: number
}

const props = defineProps<{
  characters: SceneCharacterXp[]
  sceneName: string
}>()

const emit = defineEmits<{
  close: []
  awarded: []
}>()

const { showToast } = useGmToast()
const xpAmount = ref<number>(1)
const reason = ref('')
const isAwarding = ref(false)

function getLevelUpPreview(char: { level: number; trainerXp: number }): number | null {
  const amount = xpAmount.value
  if (!amount || amount <= 0) return null

  const result = applyTrainerXp({
    currentXp: char.trainerXp,
    currentLevel: char.level,
    xpToAdd: amount
  })

  return result.levelsGained > 0 ? result.newLevel : null
}

function getMilestonePreview(char: { level: number; trainerXp: number }): number[] {
  const amount = xpAmount.value
  if (!amount || amount <= 0) return []

  const result = applyTrainerXp({
    currentXp: char.trainerXp,
    currentLevel: char.level,
    xpToAdd: amount
  })

  return result.milestoneLevelsCrossed
}

async function handleAward() {
  if (!xpAmount.value || xpAmount.value < 1 || props.characters.length === 0) return

  isAwarding.value = true
  const { awardXp } = useTrainerXp()
  const milestoneNames: string[] = []

  for (const char of props.characters) {
    try {
      const result = await awardXp(
        char.id,
        xpAmount.value,
        reason.value || `Quest XP from scene: ${props.sceneName}`
      )
      if (result.milestoneLevelsCrossed.length > 0) {
        milestoneNames.push(char.name)
      }
    } catch (e) {
      showToast(`Failed to award XP to ${char.name}: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
    }
  }

  if (milestoneNames.length > 0) {
    showToast(
      `${milestoneNames.join(', ')} crossed milestone level(s) — visit character sheet to complete level-up choices`,
      'warning'
    )
  }

  isAwarding.value = false
  reason.value = ''
  emit('awarded')
}
</script>

<style lang="scss" scoped>
.quest-xp-dialog {
  padding: $spacing-md $spacing-xl;
  background: $color-bg-tertiary;
  border-bottom: 1px solid $border-color-default;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    h4 {
      margin: 0;
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-text;
    }
  }

  &__desc {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin: 0 0 $spacing-md;
  }

  &__form {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    label {
      display: block;
      font-size: $font-size-xs;
      color: $color-text-muted;
      font-weight: 500;
      margin-bottom: $spacing-xs;
    }

    .form-input--sm {
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
    }
  }

  &__field {
    &--wide {
      flex: 1;
    }
  }

  &__preview {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    padding: $spacing-sm;
    background: $color-bg-primary;
    border-radius: $border-radius-sm;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}

.quest-xp-preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs 0;
  font-size: $font-size-sm;

  &__info {
    color: $color-text;
  }

  &__levelup {
    font-weight: 700;
    color: $color-success;
  }

  &__milestone {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-warning;
  }
}
</style>
