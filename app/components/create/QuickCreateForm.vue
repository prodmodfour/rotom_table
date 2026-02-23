<template>
  <form class="create-form" @submit.prevent="handleSubmit">
    <div class="create-form__section">
      <h3>Quick Create</h3>

      <div class="form-row">
        <div class="form-group">
          <label>Name *</label>
          <input v-model="localForm.name" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label>Character Type</label>
          <select v-model="localForm.characterType" class="form-select">
            <option value="player">Player Character</option>
            <option value="npc">NPC</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Level</label>
          <input v-model.number="localForm.level" type="number" class="form-input" min="1" max="100" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input v-model="localForm.location" type="text" class="form-input" placeholder="e.g., Mesagoza" />
        </div>
      </div>

      <!-- Trainer Sprite -->
      <div class="form-group">
        <label>Trainer Sprite</label>
        <div class="sprite-preview">
          <div class="sprite-preview__avatar" @click="showSpritePicker = true">
            <img
              v-if="resolvedAvatarUrl"
              :src="resolvedAvatarUrl"
              alt="Selected sprite"
              class="sprite-preview__img"
              @error="handleAvatarError"
            />
            <span v-else class="sprite-preview__placeholder">
              {{ localForm.name ? localForm.name.charAt(0).toUpperCase() : '?' }}
            </span>
          </div>
          <button type="button" class="btn btn--sm btn--secondary" @click="showSpritePicker = true">
            Choose Sprite
          </button>
        </div>
      </div>

      <TrainerSpritePicker
        v-model="localForm.avatarUrl"
        :show="showSpritePicker"
        @close="showSpritePicker = false"
      />
    </div>

    <div class="create-form__section">
      <h3>Raw Stats</h3>
      <div class="stats-grid">
        <div class="form-group">
          <label>HP</label>
          <input v-model.number="localForm.hp" type="number" class="form-input" min="1" />
        </div>
        <div class="form-group">
          <label>Attack</label>
          <input v-model.number="localForm.attack" type="number" class="form-input" min="1" />
        </div>
        <div class="form-group">
          <label>Defense</label>
          <input v-model.number="localForm.defense" type="number" class="form-input" min="1" />
        </div>
        <div class="form-group">
          <label>Sp. Attack</label>
          <input v-model.number="localForm.specialAttack" type="number" class="form-input" min="1" />
        </div>
        <div class="form-group">
          <label>Sp. Defense</label>
          <input v-model.number="localForm.specialDefense" type="number" class="form-input" min="1" />
        </div>
        <div class="form-group">
          <label>Speed</label>
          <input v-model.number="localForm.speed" type="number" class="form-input" min="1" />
        </div>
      </div>
    </div>

    <div class="create-form__section">
      <h3>Notes</h3>
      <textarea v-model="localForm.notes" class="form-input" rows="3" placeholder="Additional notes..."></textarea>
    </div>

    <div class="create-form__actions">
      <button type="submit" class="btn btn--primary" :disabled="creating">
        {{ creating ? 'Creating...' : 'Create Human' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { CharacterType, QuickCreatePayload } from '~/types/character'
import { DEFAULT_STARTING_MONEY } from '~/composables/useCharacterCreation'

interface Props {
  creating: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  submit: [payload: QuickCreatePayload]
}>()

const { getTrainerSpriteUrl } = useTrainerSprite()

const showSpritePicker = ref(false)

const localForm = reactive({
  name: '',
  characterType: 'npc' as CharacterType,
  level: 1,
  location: '',
  avatarUrl: null as string | null,
  hp: 10,
  attack: 5,
  defense: 5,
  specialAttack: 5,
  specialDefense: 5,
  speed: 5,
  notes: ''
})

const avatarBroken = ref(false)
const resolvedAvatarUrl = computed(() => {
  if (avatarBroken.value) return null
  return getTrainerSpriteUrl(localForm.avatarUrl)
})

const handleAvatarError = () => {
  avatarBroken.value = true
}

/** Build and emit the creation payload */
function handleSubmit(): void {
  const level = localForm.level
  const hpStat = localForm.hp
  // PTU Trainer HP formula: Level * 2 + HP Stat * 3 + 10
  const maxHp = level * 2 + hpStat * 3 + 10

  // PCs get PTU standard starting money; NPCs default to 0 (no inventory tracking)
  const money = localForm.characterType === 'player'
    ? DEFAULT_STARTING_MONEY
    : 0

  emit('submit', {
    name: localForm.name,
    characterType: localForm.characterType,
    level,
    location: localForm.location || undefined,
    avatarUrl: localForm.avatarUrl || undefined,
    stats: {
      hp: hpStat,
      attack: localForm.attack,
      defense: localForm.defense,
      specialAttack: localForm.specialAttack,
      specialDefense: localForm.specialDefense,
      speed: localForm.speed
    },
    maxHp,
    currentHp: maxHp,
    money,
    notes: localForm.notes || undefined
  })
}
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.sprite-preview {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: $border-radius-lg;
    overflow: hidden;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover {
      border-color: $color-accent-teal;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }

  &__placeholder {
    font-size: $font-size-xl;
    font-weight: 700;
    background: $gradient-sv-cool;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
</style>
