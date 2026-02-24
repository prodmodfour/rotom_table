<template>
  <div class="gm-layout">
    <header class="gm-header">
      <div class="gm-header__brand">
        <div class="gm-header__logo">
          <img src="/icons/ui/encounter.svg" alt="" class="gm-header__logo-icon" />
        </div>
        <div class="gm-header__title">
          <h1>PTU Session Helper</h1>
          <span class="gm-header__badge">GM View</span>
        </div>
      </div>

      <nav class="gm-header__nav">
        <NuxtLink to="/gm" class="gm-nav-link" active-class="gm-nav-link--active" :class="{ 'gm-nav-link--active': $route.path === '/gm' }">
          <img src="/icons/ui/encounter.svg" alt="" class="gm-nav-link__icon" />
          <span>Encounter</span>
        </NuxtLink>
        <NuxtLink to="/gm/encounters" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/phosphor/books.svg" alt="" class="gm-nav-link__icon" />
          <span>Encounters</span>
        </NuxtLink>
        <NuxtLink to="/gm/scenes" class="gm-nav-link" active-class="gm-nav-link--active">
          <PhFilmSlate class="gm-nav-link__icon-component" :size="20" />
          <span>Scenes</span>
        </NuxtLink>
        <NuxtLink to="/gm/habitats" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/phosphor/tree.svg" alt="" class="gm-nav-link__icon" />
          <span>Habitats</span>
        </NuxtLink>
        <NuxtLink to="/gm/sheets" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/ui/library.svg" alt="" class="gm-nav-link__icon" />
          <span>Sheets</span>
        </NuxtLink>
        <NuxtLink to="/gm/create" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/ui/create.svg" alt="" class="gm-nav-link__icon" />
          <span>Create</span>
        </NuxtLink>
        <NuxtLink to="/gm/map" class="gm-nav-link" active-class="gm-nav-link--active">
          <img src="/icons/phosphor/target.svg" alt="" class="gm-nav-link__icon" />
          <span>Map</span>
        </NuxtLink>
      </nav>

      <div class="gm-header__actions">
        <!-- Server Address for Players -->
        <ServerAddressDisplay />

        <!-- Group View Tab Selector -->
        <div class="tab-selector">
          <label class="tab-selector__label">Group View:</label>
          <div class="tab-selector__buttons">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === tab.id }"
              @click="setTab(tab.id)"
              :title="tab.label"
            >
              <component :is="tab.icon" :size="16" />
            </button>
          </div>
        </div>

        <button
          class="btn btn--ghost btn--sm gm-header__day-btn"
          :disabled="advancingDay"
          @click="handleAdvanceDay"
        >
          <img src="/icons/phosphor/sun.svg" alt="" class="btn-icon" />
          <span>{{ advancingDay ? 'Advancing...' : 'Advance Day' }}</span>
        </button>
        <NuxtLink to="/group" target="_blank" class="btn btn--secondary btn--sm gm-header__group-btn">
          <img src="/icons/ui/player-view.svg" alt="" class="btn-icon" />
          <span>Group View</span>
        </NuxtLink>
      </div>
    </header>
    <main class="gm-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { PhUsers, PhFilmSlate, PhSword, PhMapTrifold } from '@phosphor-icons/vue'
import type { GroupViewTab } from '~/types/scene'

const { newDayGlobal, loading: advancingDay } = useRestHealing()
const groupViewTabsStore = useGroupViewTabsStore()

// Tab configuration
const tabs = [
  { id: 'lobby' as GroupViewTab, label: 'Lobby', icon: PhUsers },
  { id: 'scene' as GroupViewTab, label: 'Scene', icon: PhFilmSlate },
  { id: 'encounter' as GroupViewTab, label: 'Encounter', icon: PhSword },
  { id: 'map' as GroupViewTab, label: 'Map', icon: PhMapTrifold }
]

// Active tab from store
const activeTab = computed(() => groupViewTabsStore.activeTab)

// Set active tab
const setTab = async (tab: GroupViewTab) => {
  try {
    await groupViewTabsStore.setActiveTab(tab)
  } catch (error) {
    alert('Failed to switch group view tab')
  }
}

// Fetch initial tab state on mount
onMounted(async () => {
  await groupViewTabsStore.fetchTabState()
})

const handleAdvanceDay = async () => {
  if (confirm('Advance to a new day? This will reset daily healing limits for all characters and Pokemon.')) {
    const result = await newDayGlobal()
    if (result?.success) {
      alert(result.message)
    }
  }
}
</script>

<style lang="scss" scoped>
.gm-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $gradient-bg-radial;
}

.gm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-xl;
  background: rgba($color-bg-primary, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-color-default;
  position: sticky;
  top: 0;
  z-index: $z-index-sticky;

  // Gradient accent line
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: $gradient-sv-cool;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__logo {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-md;
    box-shadow: $shadow-glow-scarlet;
  }

  &__logo-icon {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    h1 {
      font-size: $font-size-lg;
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__badge {
    background: $gradient-sv-primary;
    color: $color-text;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__nav {
    display: flex;
    gap: $spacing-sm;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__group-btn {
    .btn-icon {
      @include btn-icon-img(18px);
    }
  }

  &__day-btn {
    .btn-icon {
      @include btn-icon-img(18px);
    }
  }
}

.gm-nav-link {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  color: $color-text-muted;
  font-weight: 500;
  font-size: $font-size-sm;
  border-radius: $border-radius-md;
  transition: all $transition-fast;
  text-decoration: none;
  position: relative;

  &__icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(0.7);
    transition: filter $transition-fast;
  }

  &__icon-component {
    opacity: 0.7;
    transition: opacity $transition-fast;
  }


  &:hover {
    color: $color-text;
    background: $color-bg-hover;

    .gm-nav-link__icon {
      filter: brightness(0) invert(1);
    }

    .gm-nav-link__icon-component {
      opacity: 1;
    }
  }

  &--active {
    color: $color-text;
    background: $gradient-sv-cool;
    box-shadow: $shadow-glow-scarlet;

    .gm-nav-link__icon {
      filter: brightness(0) invert(1);
    }

    .gm-nav-link__icon-component {
      opacity: 1;
    }

    &:hover {
      background: $gradient-sv-cool;
    }
  }
}

.tab-selector {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  border: 1px solid $border-color-default;

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 500;
    white-space: nowrap;
  }

  &__buttons {
    display: flex;
    gap: 2px;
  }
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: $color-text-muted;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    color: $color-text;
  }

  &--active {
    background: $gradient-sv-cool;
    color: white;
    box-shadow: $shadow-glow-scarlet;

    &:hover {
      background: $gradient-sv-cool;
    }
  }
}

.gm-main {
  flex: 1;
  padding: $spacing-xl;
  overflow-y: auto;
}
</style>
