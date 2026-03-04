<template>
  <div class="scene-manager">
    <header class="scene-manager__header">
      <div class="header-left">
        <h1>Scene Manager</h1>
        <p class="subtitle">Create and manage narrative scenes for Group View</p>
      </div>
      <div class="header-actions">
        <button class="btn btn--primary" @click="createScene">
          <PhPlus :size="18" />
          <span>New Scene</span>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <PhSpinner class="spinner" :size="32" />
      <span>Loading scenes...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="scenes.length === 0" class="empty-state">
      <PhFilmSlate class="empty-icon" :size="64" />
      <h2>No Scenes Yet</h2>
      <p>Create your first scene to set up narrative views for your players.</p>
      <button class="btn btn--primary" @click="createScene">
        <PhPlus :size="18" />
        <span>Create First Scene</span>
      </button>
    </div>

    <!-- Scenes Grid -->
    <div v-else class="scenes-grid">
      <div
        v-for="scene in scenes"
        :key="scene.id"
        class="scene-card"
        :class="{ 'scene-card--active': scene.isActive }"
      >
        <!-- Scene Thumbnail -->
        <div class="scene-card__thumbnail">
          <img
            v-if="scene.locationImage"
            :src="scene.locationImage"
            :alt="scene.name"
          />
          <div v-else class="scene-card__placeholder">
            <PhFilmSlate :size="48" />
          </div>
          <div v-if="scene.isActive" class="scene-card__active-badge">
            <PhBroadcast :size="14" />
            <span>Active</span>
          </div>
        </div>

        <!-- Scene Info -->
        <div class="scene-card__content">
          <h3 class="scene-card__name">{{ scene.name }}</h3>
          <p v-if="scene.locationName" class="scene-card__location">
            <PhMapPin :size="14" />
            {{ scene.locationName }}
          </p>

          <!-- Stats -->
          <div class="scene-card__stats">
            <span v-if="scene.pokemon.length > 0" class="stat">
              <PhPawPrint :size="14" />
              {{ scene.pokemon.length }}
            </span>
            <span v-if="scene.characters.length > 0" class="stat">
              <PhUsers :size="14" />
              {{ scene.characters.length }}
            </span>
            <span v-if="scene.weather" class="stat">
              <PhCloud :size="14" />
              {{ formatWeather(scene.weather) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="scene-card__actions">
          <button
            v-if="!scene.isActive"
            class="btn btn--sm btn--primary"
            @click="activateScene(scene.id)"
            :disabled="activating === scene.id"
          >
            <PhBroadcast :size="16" />
            <span>{{ activating === scene.id ? 'Activating...' : 'Activate' }}</span>
          </button>
          <button
            v-else
            class="btn btn--sm btn--ghost"
            @click="deactivateScene(scene.id)"
          >
            <PhStop :size="16" />
            <span>Deactivate</span>
          </button>
          <NuxtLink :to="`/gm/scenes/${scene.id}`" class="btn btn--sm btn--secondary">
            <PhPencil :size="16" />
            <span>Edit</span>
          </NuxtLink>
          <button
            class="btn btn--sm btn--ghost btn--danger"
            @click="confirmDelete(scene)"
          >
            <PhTrash :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="sceneToDelete" class="modal-backdrop" @click.self="sceneToDelete = null">
        <div class="modal">
          <h2>Delete Scene</h2>
          <p>Are you sure you want to delete "{{ sceneToDelete.name }}"? This cannot be undone.</p>
          <div class="modal__actions">
            <button class="btn btn--ghost" @click="sceneToDelete = null">Cancel</button>
            <button class="btn btn--danger" @click="deleteScene" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete Scene' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  PhPlus,
  PhSpinner,
  PhFilmSlate,
  PhBroadcast,
  PhMapPin,
  PhPawPrint,
  PhUsers,
  PhCloud,
  PhPencil,
  PhTrash,
  PhStop
} from '@phosphor-icons/vue'
import type { Scene } from '~/types/scene'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'Scene Manager - Rotom Table'
})

const router = useRouter()
const groupViewTabsStore = useGroupViewTabsStore()

// State
const loading = ref(true)
const activating = ref<string | null>(null)
const deleting = ref(false)
const sceneToDelete = ref<Scene | null>(null)

// Scenes from store
const scenes = computed(() => groupViewTabsStore.scenes)

// Fetch scenes on mount
onMounted(async () => {
  groupViewTabsStore.setupCrossTabSync()
  await groupViewTabsStore.fetchScenes()
  loading.value = false
})

// Create new scene
const createScene = async () => {
  try {
    const scene = await groupViewTabsStore.createScene({
      name: 'New Scene'
    })
    if (scene) {
      router.push(`/gm/scenes/${scene.id}`)
    }
  } catch (error) {
    alert('Failed to create scene')
  }
}

// Activate scene
const activateScene = async (id: string) => {
  activating.value = id
  try {
    await groupViewTabsStore.activateScene(id)
    // Also switch tab to scene
    await groupViewTabsStore.setActiveTab('scene', id)
  } catch (error) {
    alert('Failed to activate scene')
  } finally {
    activating.value = null
  }
}

// Deactivate scene
const deactivateScene = async (id: string) => {
  try {
    await groupViewTabsStore.deactivateScene(id)
  } catch (error) {
    alert('Failed to deactivate scene')
  }
}

// Confirm delete
const confirmDelete = (scene: Scene) => {
  sceneToDelete.value = scene
}

// Delete scene
const deleteScene = async () => {
  if (!sceneToDelete.value) return

  deleting.value = true
  try {
    await groupViewTabsStore.deleteScene(sceneToDelete.value.id)
    sceneToDelete.value = null
  } catch (error) {
    alert('Failed to delete scene')
  } finally {
    deleting.value = false
  }
}

// Format weather for display
const formatWeather = (weather: string): string => {
  return weather
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style lang="scss" scoped>
.scene-manager {
  max-width: 1400px;
  margin: 0 auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-xl;

    h1 {
      margin: 0;
      font-size: $font-size-xxl;
    }

    .subtitle {
      margin: $spacing-xs 0 0;
      color: $color-text-muted;
    }
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xxl;
  text-align: center;
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  gap: $spacing-md;

  h2 {
    margin: 0;
    color: $color-text;
  }

  p {
    margin: 0;
    color: $color-text-muted;
    max-width: 400px;
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-icon {
  color: $color-text-muted;
  opacity: 0.5;
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.scene-card {
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  overflow: hidden;
  border: 1px solid $border-color-default;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-primary;
    box-shadow: $shadow-lg;
  }

  &--active {
    border-color: $color-success;
    box-shadow: 0 0 20px rgba($color-success, 0.3);
  }

  &__thumbnail {
    position: relative;
    height: 160px;
    background: $color-bg-tertiary;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: $color-text-muted;
    opacity: 0.5;
  }

  &__active-badge {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: $color-success;
    color: white;
    font-size: $font-size-xs;
    font-weight: 600;
    border-radius: $border-radius-sm;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  &__content {
    padding: $spacing-md;
  }

  &__name {
    margin: 0 0 $spacing-xs;
    font-size: $font-size-lg;
    color: $color-text;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin: 0 0 $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__stats {
    display: flex;
    gap: $spacing-md;

    .stat {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: $font-size-sm;
      color: $color-text-muted;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md $spacing-md;
    border-top: 1px solid $border-color-default;
  }
}

.btn--danger {
  color: $color-danger;

  &:hover {
    background: rgba($color-danger, 0.1);
  }
}

// Modal
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
}

.modal {
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  max-width: 400px;
  width: 90%;

  h2 {
    margin: 0 0 $spacing-md;
  }

  p {
    margin: 0 0 $spacing-lg;
    color: $color-text-muted;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}
</style>
