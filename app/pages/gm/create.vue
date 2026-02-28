<template>
  <div class="create-page">
    <div class="create-page__header">
      <NuxtLink to="/gm/sheets" class="btn btn--secondary btn--sm">
        ← Back to Sheets
      </NuxtLink>
      <h2>Create Character</h2>
    </div>

    <!-- Inline Error Banner (replaces window.alert) -->
    <div v-if="errorMessage" class="create-error-banner">
      <span class="create-error-banner__message">{{ errorMessage }}</span>
      <button class="create-error-banner__dismiss" @click="errorMessage = ''">&times;</button>
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

          <!-- Trainer Sprite -->
          <div class="form-group">
            <label>Trainer Sprite</label>
            <div class="sprite-preview">
              <div class="sprite-preview__avatar" @click="showFullCreateSpritePicker = true">
                <img
                  v-if="fullCreateResolvedAvatar"
                  :src="fullCreateResolvedAvatar"
                  alt="Selected sprite"
                  class="sprite-preview__img"
                  @error="handleFullCreateAvatarError"
                />
                <span v-else class="sprite-preview__placeholder">
                  {{ creation.form.name ? creation.form.name.charAt(0).toUpperCase() : '?' }}
                </span>
              </div>
              <button type="button" class="btn btn--sm btn--secondary" @click="showFullCreateSpritePicker = true">
                Choose Sprite
              </button>
            </div>
          </div>

          <TrainerSpritePicker
            v-model="creation.form.avatarUrl"
            :show="showFullCreateSpritePicker"
            @close="showFullCreateSpritePicker = false"
          />
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
            @set-skill-rank="handleSetSkillRank"
            @add-pathetic-skill="creation.addPatheticSkill"
            @remove-pathetic-skill="handleRemovePatheticSkill"
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
            :add-edge-fn="creation.addEdge"
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
            :expected-features="creation.expectedFeatures.value"
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
import type { PokemonType, QuickCreatePayload, SkillRank } from '~/types'
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
const { getTrainerSpriteUrl } = useTrainerSprite()

const createType = ref<'human' | 'pokemon'>('human')
const humanCreateMode = ref<CreateMode>('quick')
const creating = ref(false)
const errorMessage = ref('')

/** Biography section expanded state — expanded for PCs, collapsed for NPCs by default */
const biographyExpanded = ref(false)

/** Full Create sprite picker state */
const showFullCreateSpritePicker = ref(false)
const fullCreateAvatarBroken = ref(false)
const fullCreateResolvedAvatar = computed(() => {
  if (fullCreateAvatarBroken.value) return null
  return getTrainerSpriteUrl(creation.form.avatarUrl)
})
const handleFullCreateAvatarError = () => {
  fullCreateAvatarBroken.value = true
}

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
    errorMessage.value = error
  }
}

/** Handle skill rank set -- composable returns error string or null (Pathetic enforcement) */
function handleSetSkillRank(skill: PtuSkillName, rank: SkillRank): void {
  const error = creation.setSkillRank(skill, rank)
  if (error) {
    errorMessage.value = error
  }
}

/** Handle Pathetic skill removal -- blocks if Skill Edges reference the skill (CRITICAL-01 fix) */
function handleRemovePatheticSkill(skill: PtuSkillName): void {
  const error = creation.removePatheticSkill(skill)
  if (error) {
    errorMessage.value = error
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
const createHumanQuick = async (payload: QuickCreatePayload) => {
  creating.value = true
  errorMessage.value = ''
  try {
    await libraryStore.createHuman(payload)
    router.push('/gm/sheets')
  } catch (e) {
    errorMessage.value = 'Failed to create human character. Check the console for details.'
  } finally {
    creating.value = false
  }
}

/** Full Create submission — uses composable payload with all sections */
const createHuman = async () => {
  creating.value = true
  errorMessage.value = ''
  try {
    const data = creation.buildCreatePayload()
    await libraryStore.createHuman(data)
    router.push('/gm/sheets')
  } catch (e) {
    errorMessage.value = 'Failed to create human character. Check the console for details.'
  } finally {
    creating.value = false
  }
}

const createPokemon = async () => {
  creating.value = true
  errorMessage.value = ''
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
    errorMessage.value = 'Failed to create Pokemon. Check the console for details.'
  } finally {
    creating.value = false
  }
}
</script>

