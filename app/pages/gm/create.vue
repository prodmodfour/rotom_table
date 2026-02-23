<template>
  <div class="create-page">
    <div class="create-page__header">
      <NuxtLink to="/gm/sheets" class="btn btn--secondary btn--sm">
        ← Back to Sheets
      </NuxtLink>
      <h2>Create Character</h2>
    </div>

    <!-- Type Selection -->
    <div class="create-page__type-select">
      <button
        class="type-btn"
        :class="{ 'type-btn--active': createType === 'human' }"
        @click="createType = 'human'"
      >
        <span class="type-btn__icon">
          <img src="/icons/phosphor/user.svg" alt="" class="type-btn__svg" />
        </span>
        <span>Human Character</span>
      </button>
      <button
        class="type-btn"
        :class="{ 'type-btn--active': createType === 'pokemon' }"
        @click="createType = 'pokemon'"
      >
        <span class="type-btn__icon">
          <img src="/icons/phosphor/circle.svg" alt="" class="type-btn__svg type-btn__svg--pokemon" />
        </span>
        <span>Pokemon</span>
      </button>
    </div>

    <!-- Human Form -->
    <template v-if="createType === 'human'">
      <!-- Mode Toggle -->
      <div class="mode-toggle">
        <button
          class="mode-toggle__btn"
          :class="{ 'mode-toggle__btn--active': humanCreateMode === 'quick' }"
          @click="humanCreateMode = 'quick'"
        >
          <img src="/icons/phosphor/lightbulb.svg" alt="" class="mode-toggle__icon" />
          <div class="mode-toggle__text">
            <span class="mode-toggle__label">Quick Create</span>
            <span class="mode-toggle__desc">Minimal NPC scaffolding</span>
          </div>
        </button>
        <button
          class="mode-toggle__btn"
          :class="{ 'mode-toggle__btn--active': humanCreateMode === 'full' }"
          @click="humanCreateMode = 'full'"
        >
          <img src="/icons/phosphor/books.svg" alt="" class="mode-toggle__icon" />
          <div class="mode-toggle__text">
            <span class="mode-toggle__label">Full Create</span>
            <span class="mode-toggle__desc">PTU-compliant multi-section</span>
          </div>
        </button>
      </div>

      <!-- Quick Create Form -->
      <QuickCreateForm
        v-if="humanCreateMode === 'quick'"
        :creating="creating"
        @submit="createHumanQuick"
      />

      <!-- Full Create Form -->
      <form v-if="humanCreateMode === 'full'" class="create-form" @submit.prevent="createHuman">
        <!-- Section Progress Indicators -->
        <div class="section-progress">
          <div
            v-for="(section, key) in creation.sectionCompletion.value"
            :key="key"
            class="section-progress__item"
            :class="{ 'section-progress__item--complete': section.complete }"
          >
            <span class="section-progress__check">
              <template v-if="section.complete">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
              </template>
              <template v-else>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="3" />
                </svg>
              </template>
            </span>
            <span class="section-progress__label">{{ section.label }}</span>
            <span v-if="section.detail" class="section-progress__detail">{{ section.detail }}</span>
          </div>
        </div>

        <!-- Section 1: Basic Info -->
        <div class="create-form__section">
          <h3>Basic Info</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="creation.form.name" type="text" class="form-input" required />
            </div>

            <div class="form-group">
              <label>Character Type</label>
              <select v-model="creation.form.characterType" class="form-select">
                <option value="player">Player Character</option>
                <option value="npc">NPC</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Level</label>
              <input v-model.number="creation.form.level" type="number" class="form-input" min="1" max="100" />
            </div>
            <div v-if="creation.form.characterType === 'npc'" class="form-group">
              <label>Location</label>
              <input v-model="creation.form.location" type="text" class="form-input" placeholder="e.g., Mesagoza" />
            </div>
          </div>
        </div>

        <!-- Section 2: Background & Skills -->
        <div class="create-form__section">
          <SkillBackgroundSection
            :skills="creation.form.skills"
            :background-name="creation.form.backgroundName"
            :is-custom-background="creation.form.isCustomBackground"
            :warnings="creation.skillWarnings.value"
            @apply-background="creation.applyBackground"
            @clear-background="creation.clearBackground"
            @enable-custom-background="creation.enableCustomBackground"
            @set-skill-rank="creation.setSkillRank"
            @update:background-name="(name: string) => creation.form.backgroundName = name"
          />
        </div>

        <!-- Section 3: Edges -->
        <div class="create-form__section">
          <EdgeSelectionSection
            :edges="creation.form.edges"
            :skills="creation.form.skills"
            :starting-edges="creation.STARTING_EDGES"
            :level="creation.form.level"
            :warnings="creation.classFeatureEdgeWarnings.value"
            @add-edge="creation.addEdge"
            @remove-edge="creation.removeEdge"
            @add-skill-edge="handleSkillEdge"
          />
        </div>

        <!-- Section 4: Classes & Features -->
        <div class="create-form__section">
          <ClassFeatureSection
            :trainer-classes="creation.form.trainerClasses"
            :features="creation.form.features"
            :training-feature="creation.form.trainingFeature"
            :max-classes="creation.MAX_TRAINER_CLASSES"
            :max-features="creation.MAX_FEATURES"
            :warnings="creation.classFeatureEdgeWarnings.value"
            @add-class="creation.addClass"
            @remove-class="creation.removeClass"
            @add-feature="creation.addFeature"
            @remove-feature="creation.removeFeature"
            @update:training-feature="creation.setTrainingFeature"
          />
        </div>

        <!-- Section 5: Combat Stats -->
        <div class="create-form__section">
          <StatAllocationSection
            :stat-points="creation.form.statPoints"
            :computed-stats="creation.computedStats.value"
            :stat-points-remaining="creation.statPointsRemaining.value"
            :stat-points-total="getStatPointsForLevel(creation.form.level)"
            :level="creation.form.level"
            :max-hp="creation.maxHp.value"
            :evasions="creation.evasions.value"
            :warnings="creation.statWarnings.value"
            @increment="creation.incrementStat"
            @decrement="creation.decrementStat"
          />
        </div>

        <!-- Section 6: Biography (collapsible, optional) -->
        <div class="create-form__section">
          <BiographySection
            :expanded="biographyExpanded"
            :age="creation.form.age"
            :gender="creation.form.gender"
            :height="creation.form.height"
            :weight="creation.form.weight"
            :background-story="creation.form.backgroundStory"
            :personality="creation.form.personality"
            :goals="creation.form.goals"
            :money="creation.form.money"
            :default-money="creation.DEFAULT_STARTING_MONEY"
            @toggle="biographyExpanded = !biographyExpanded"
            @update:age="(v) => creation.form.age = v"
            @update:gender="(v) => creation.form.gender = v"
            @update:height="(v) => creation.form.height = v"
            @update:weight="(v) => creation.form.weight = v"
            @update:background-story="(v) => creation.form.backgroundStory = v"
            @update:personality="(v) => creation.form.personality = v"
            @update:goals="(v) => creation.form.goals = v"
            @update:money="(v) => creation.form.money = v"
          />
        </div>

        <!-- Notes -->
        <div class="create-form__section">
          <h3>Notes</h3>
          <textarea v-model="creation.form.notes" class="form-input" rows="3" placeholder="Additional notes..."></textarea>
        </div>

        <!-- Validation Summary -->
        <div v-if="creation.allWarnings.value.length" class="create-form__section create-form__section--warnings">
          <h3>Validation Summary</h3>
          <div class="validation-summary">
            <div
              v-for="(w, i) in creation.allWarnings.value"
              :key="i"
              class="validation-item"
              :class="`validation-item--${w.severity}`"
            >
              <span class="validation-item__section">{{ w.section }}</span>
              {{ w.message }}
            </div>
          </div>
        </div>

        <div class="create-form__actions">
          <button type="submit" class="btn btn--primary" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Human' }}
          </button>
        </div>
      </form>
    </template>

    <!-- Pokemon Form -->
    <form v-if="createType === 'pokemon'" class="create-form" @submit.prevent="createPokemon">
      <div class="create-form__section">
        <h3>Basic Info</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Species *</label>
            <input v-model="pokemonForm.species" type="text" class="form-input" required placeholder="Pikachu" />
          </div>

          <div class="form-group">
            <label>Nickname</label>
            <input v-model="pokemonForm.nickname" type="text" class="form-input" placeholder="Optional" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Level</label>
            <input v-model.number="pokemonForm.level" type="number" class="form-input" min="1" max="100" />
          </div>

          <div class="form-group">
            <label>Gender</label>
            <select v-model="pokemonForm.gender" class="form-select">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Genderless">Genderless</option>
            </select>
          </div>

          <div class="form-group">
            <label>Shiny</label>
            <select v-model="pokemonForm.shiny" class="form-select">
              <option :value="false">No</option>
              <option :value="true">Yes</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Location</label>
          <input v-model="pokemonForm.location" type="text" class="form-input" placeholder="e.g., Route 1" />
        </div>
      </div>

      <div class="create-form__section">
        <h3>Types</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Primary Type *</label>
            <select v-model="pokemonForm.type1" class="form-select" required>
              <option v-for="type in pokemonTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Secondary Type</label>
            <select v-model="pokemonForm.type2" class="form-select">
              <option value="">None</option>
              <option v-for="type in pokemonTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="create-form__section">
        <h3>Base Stats</h3>

        <div class="stats-grid">
          <div class="form-group">
            <label>HP</label>
            <input v-model.number="pokemonForm.baseHp" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Attack</label>
            <input v-model.number="pokemonForm.baseAttack" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Defense</label>
            <input v-model.number="pokemonForm.baseDefense" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Sp. Attack</label>
            <input v-model.number="pokemonForm.baseSpAtk" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Sp. Defense</label>
            <input v-model.number="pokemonForm.baseSpDef" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Speed</label>
            <input v-model.number="pokemonForm.baseSpeed" type="number" class="form-input" min="1" />
          </div>
        </div>
      </div>

      <div class="create-form__section">
        <h3>Notes</h3>
        <textarea v-model="pokemonForm.notes" class="form-input" rows="3" placeholder="Additional notes..."></textarea>
      </div>

      <div class="create-form__actions">
        <button type="submit" class="btn btn--primary" :disabled="creating">
          {{ creating ? 'Creating...' : 'Create Pokemon' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { PokemonType } from '~/types'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { CreateMode } from '~/composables/useCharacterCreation'
import { getStatPointsForLevel } from '~/constants/trainerStats'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Create Character'
})

const router = useRouter()
const libraryStore = useLibraryStore()

const createType = ref<'human' | 'pokemon'>('human')
const humanCreateMode = ref<CreateMode>('quick')
const creating = ref(false)

/** Biography section expanded state — expanded for PCs, collapsed for NPCs by default */
const biographyExpanded = ref(false)

const pokemonTypes: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
]

// Full Create form via composable
const creation = useCharacterCreation()

// Auto-expand biography for Player Characters, collapse for NPCs
watch(() => creation.form.characterType, (newType) => {
  biographyExpanded.value = newType === 'player'
})

/** Handle Skill Edge add -- composable returns error string or null */
function handleSkillEdge(skill: PtuSkillName): void {
  const error = creation.addSkillEdge(skill)
  if (error) {
    alert(error)
  }
}

// Pokemon form (unchanged)
const pokemonForm = ref({
  species: '',
  nickname: '',
  level: 1,
  location: '',
  gender: 'Genderless' as 'Male' | 'Female' | 'Genderless',
  shiny: false,
  type1: 'Normal' as PokemonType,
  type2: '' as PokemonType | '',
  baseHp: 50,
  baseAttack: 50,
  baseDefense: 50,
  baseSpAtk: 50,
  baseSpDef: 50,
  baseSpeed: 50,
  notes: ''
})

/** Quick Create submission — receives pre-built payload from QuickCreateForm */
const createHumanQuick = async (payload: Record<string, unknown>) => {
  creating.value = true
  try {
    await libraryStore.createHuman(payload)
    router.push('/gm/sheets')
  } catch (e) {
    alert('Failed to create human character. Check the console for details.')
  } finally {
    creating.value = false
  }
}

/** Full Create submission — uses composable payload with all sections */
const createHuman = async () => {
  creating.value = true
  try {
    const data = creation.buildCreatePayload()
    await libraryStore.createHuman(data)
    router.push('/gm/sheets')
  } catch (e) {
    alert('Failed to create human character. Check the console for details.')
  } finally {
    creating.value = false
  }
}

const createPokemon = async () => {
  creating.value = true
  try {
    // PTU HP formula: Level + (HP Base * 3) + 10
    const maxHp = pokemonForm.value.level + (pokemonForm.value.baseHp * 3) + 10

    const data = {
      species: pokemonForm.value.species,
      nickname: pokemonForm.value.nickname || undefined,
      level: pokemonForm.value.level,
      location: pokemonForm.value.location || undefined,
      gender: pokemonForm.value.gender,
      shiny: pokemonForm.value.shiny,
      types: (pokemonForm.value.type2
        ? [pokemonForm.value.type1, pokemonForm.value.type2] as [PokemonType, PokemonType]
        : [pokemonForm.value.type1] as [PokemonType]),
      baseStats: {
        hp: pokemonForm.value.baseHp,
        attack: pokemonForm.value.baseAttack,
        defense: pokemonForm.value.baseDefense,
        specialAttack: pokemonForm.value.baseSpAtk,
        specialDefense: pokemonForm.value.baseSpDef,
        speed: pokemonForm.value.baseSpeed
      },
      currentStats: {
        hp: pokemonForm.value.baseHp,
        attack: pokemonForm.value.baseAttack,
        defense: pokemonForm.value.baseDefense,
        specialAttack: pokemonForm.value.baseSpAtk,
        specialDefense: pokemonForm.value.baseSpDef,
        speed: pokemonForm.value.baseSpeed
      },
      currentHp: maxHp,
      maxHp: maxHp,
      notes: pokemonForm.value.notes
    }

    await libraryStore.createPokemon(data)
    router.push('/gm/sheets')
  } catch (e) {
    alert('Failed to create Pokemon. Check the console for details.')
  } finally {
    creating.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-page {
  max-width: 800px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;

    h2 {
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__type-select {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }
}

.mode-toggle {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  &__btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 2px solid $glass-border;
    border-radius: $border-radius-md;
    color: $color-text;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $color-accent-teal;
      box-shadow: 0 0 12px rgba($color-accent-teal, 0.15);
    }

    &--active {
      border-color: $color-accent-teal;
      background: linear-gradient(135deg, rgba($color-accent-teal, 0.1) 0%, rgba($color-accent-violet, 0.05) 100%);
      box-shadow: $shadow-glow-teal;
    }
  }

  &__icon {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  &__label {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__desc {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}

.section-progress {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-xl;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    background: $color-bg-secondary;
    border: 1px solid $border-color-subtle;
    transition: all $transition-fast;

    &--complete {
      color: $color-success;
      border-color: rgba($color-success, 0.3);
      background: rgba($color-success, 0.08);
    }
  }

  &__check {
    display: flex;
    align-items: center;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  &__label {
    font-weight: 500;
  }

  &__detail {
    font-size: $font-size-xs;
    opacity: 0.7;
    margin-left: $spacing-xs;
  }
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 2px solid $glass-border;
  border-radius: $border-radius-lg;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-accent-scarlet;
    box-shadow: 0 0 15px rgba($color-accent-scarlet, 0.2);
  }

  &--active {
    border-color: $color-accent-scarlet;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    box-shadow: $shadow-glow-scarlet;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-md;
  }

  &__svg {
    width: 28px;
    height: 28px;
    filter: brightness(0) invert(1);

    &--pokemon {
      filter: brightness(0) saturate(100%) invert(33%) sepia(98%) saturate(7407%) hue-rotate(355deg) brightness(91%) contrast(118%);
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.validation-summary {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.validation-item {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &__section {
    font-weight: 600;
    text-transform: uppercase;
    margin-right: $spacing-xs;
  }

  &--warning {
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    color: $color-warning;
  }

  &--info {
    background: rgba($color-info, 0.1);
    border: 1px solid rgba($color-info, 0.3);
    color: $color-info;
  }
}
</style>
