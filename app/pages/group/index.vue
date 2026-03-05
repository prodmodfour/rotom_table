<template>
  <div class="group-view">
    <!-- Tab Content -->
    <Transition name="fade" mode="out-in">
      <component :is="activeTabComponent" :key="activeTab" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import LobbyView from './_components/LobbyView.vue'
import SceneView from './_components/SceneView.vue'
import EncounterView from './_components/EncounterView.vue'
import MapView from './_components/MapView.vue'

definePageMeta({
  layout: 'group'
})

useHead({
  title: 'PTU - Group View'
})

const groupViewTabsStore = useGroupViewTabsStore()
const { isConnected, send, onMessage, receivedFlankingMap } = useWebSocket()

// Provide flanking map to descendant encounter components
provide('receivedFlankingMap', receivedFlankingMap)

// WebSocket event handling for group view
useGroupViewWebSocket({ send, isConnected, onMessage })

// Active tab from store
const activeTab = computed(() => groupViewTabsStore.activeTab)

// Map tab names to components
const tabComponents = {
  lobby: LobbyView,
  scene: SceneView,
  encounter: EncounterView,
  map: MapView
}

const activeTabComponent = computed(() => {
  return tabComponents[activeTab.value] || LobbyView
})

// Poll for tab state as fallback
let pollInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await groupViewTabsStore.fetchTabState()
  pollInterval = setInterval(() => groupViewTabsStore.fetchTabState(), 5000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<style lang="scss" scoped>
.group-view {
  min-height: 100vh;
  background: $gradient-bg-radial;
}

// Tab transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
