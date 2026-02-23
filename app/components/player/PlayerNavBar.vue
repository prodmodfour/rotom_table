<template>
  <nav class="player-nav-bar" role="navigation" aria-label="Player navigation">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="player-nav-bar__tab"
      :class="{
        'player-nav-bar__tab--active': activeTab === tab.id,
        'player-nav-bar__tab--badge': tab.id === 'encounter' && hasActiveEncounter
      }"
      :aria-label="tab.label"
      :aria-current="activeTab === tab.id ? 'page' : undefined"
      @click="$emit('change', tab.id)"
    >
      <component :is="tab.icon" :size="22" class="player-nav-bar__icon" />
      <span class="player-nav-bar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { PhUser, PhPawPrint, PhSword } from '@phosphor-icons/vue'
import type { PlayerTab } from '~/types/player'

defineProps<{
  activeTab: PlayerTab
  hasActiveEncounter?: boolean
}>()

defineEmits<{
  change: [tab: PlayerTab]
}>()

const tabs = [
  { id: 'character' as PlayerTab, label: 'Character', icon: PhUser },
  { id: 'team' as PlayerTab, label: 'Team', icon: PhPawPrint },
  { id: 'encounter' as PlayerTab, label: 'Encounter', icon: PhSword }
]
</script>

<style lang="scss" scoped>
.player-nav-bar {
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: rgba($color-bg-primary, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid $border-color-default;
  z-index: $z-index-sticky;
  padding-bottom: env(safe-area-inset-bottom, 0);

  &__tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: none;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    transition: color $transition-fast;
    position: relative;
    min-width: 0;
    padding: $spacing-xs;

    // Touch target: at least 48px wide (flex fills the space)
    min-height: 48px;

    &:hover {
      color: $color-text-secondary;
    }

    &--active {
      color: $color-accent-scarlet;

      .player-nav-bar__icon {
        filter: drop-shadow(0 0 6px rgba($color-accent-scarlet, 0.4));
      }
    }

    &--badge::after {
      content: '';
      position: absolute;
      top: 6px;
      right: calc(50% - 18px);
      width: 8px;
      height: 8px;
      background: $color-accent-scarlet;
      border-radius: 50%;
      border: 2px solid $color-bg-primary;
    }
  }

  &__label {
    font-size: $font-size-xs;
    font-weight: 500;
    white-space: nowrap;
  }
}
</style>
