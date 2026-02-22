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
import type { CharacterType } from '~/types/character'
import { DEFAULT_STARTING_MONEY } from '~/composables/useCharacterCreation'

interface Props {
  creating: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
}>()

const localForm = reactive({
  name: '',
  characterType: 'npc' as CharacterType,
  level: 1,
  location: '',
  hp: 10,
  attack: 5,
  defense: 5,
  specialAttack: 5,
  specialDefense: 5,
  speed: 5,
  notes: ''
})

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
</style>
