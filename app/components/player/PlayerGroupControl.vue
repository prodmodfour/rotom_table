<template>
  <div class="group-control">
    <div class="group-control__header">
      <PhTelevision :size="20" />
      <span class="group-control__title">Group View</span>
    </div>

    <div class="group-control__status">
      <span class="group-control__label">Current Tab:</span>
      <span class="group-control__tab-name">{{ currentTabLabel }}</span>
    </div>

    <!-- Waiting state -->
    <div v-if="isPending" class="group-control__waiting">
      <div class="group-control__spinner"></div>
      <span>Waiting for GM...</span>
    </div>

    <!-- Cooldown state -->
    <div v-else-if="isOnCooldown" class="group-control__cooldown">
      <PhClock :size="16" />
      <span>Wait {{ cooldownRemaining }}s</span>
    </div>

    <!-- Request buttons -->
    <div v-else class="group-control__actions">
      <button
        v-if="currentTab !== 'scene'"
        class="btn btn--sm btn--ghost"
        :disabled="!canRequest"
        @click="requestTabChange('scene')"
      >
        <PhMapPin :size="16" />
        Request Scene
      </button>
      <button
        v-if="currentTab !== 'lobby'"
        class="btn btn--sm btn--ghost"
        :disabled="!canRequest"
        @click="requestTabChange('lobby')"
      >
        <PhHouse :size="16" />
        Request Lobby
      </button>
    </div>

    <!-- Last response feedback -->
    <div
      v-if="lastResponse"
      class="group-control__feedback"
      :class="`group-control__feedback--${lastResponse.status}`"
    >
      {{ lastResponse.status === 'approved' ? 'Request approved' : 'Request dismissed' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhTelevision, PhClock, PhMapPin, PhHouse } from '@phosphor-icons/vue'
import type { WebSocketEvent } from '~/types/api'
import type { GroupViewRequest, GroupViewResponse } from '~/types/player-sync'

const COOLDOWN_MS = 30_000
const REQUEST_TIMEOUT_MS = 30_000

const props = defineProps<{
  currentTab: string
  send: (event: WebSocketEvent) => void
  onMessage: (listener: (msg: WebSocketEvent) => void) => (() => void)
}>()

const playerStore = usePlayerIdentityStore()

// State
const isPending = ref(false)
const pendingRequestId = ref<string | null>(null)
const cooldownUntil = ref(0)
const cooldownRemaining = ref(0)
const lastResponse = ref<{ status: 'approved' | 'rejected' } | null>(null)

let cooldownTimer: ReturnType<typeof setInterval> | null = null
let timeoutTimer: ReturnType<typeof setTimeout> | null = null

// Computed
const isOnCooldown = computed(() => Date.now() < cooldownUntil.value)
const canRequest = computed(() => !isPending.value && !isOnCooldown.value)

const TAB_LABELS: Record<string, string> = {
  lobby: 'Lobby',
  scene: 'Scene',
  encounter: 'Encounter',
  map: 'Map'
}

const currentTabLabel = computed(() => TAB_LABELS[props.currentTab] ?? props.currentTab)

// Methods
const generateRequestId = (): string =>
  `gv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const requestTabChange = (tab: string): void => {
  if (!canRequest.value) return

  const requestId = generateRequestId()
  pendingRequestId.value = requestId
  isPending.value = true
  lastResponse.value = null

  const request: GroupViewRequest = {
    requestId,
    playerId: playerStore.characterId ?? '',
    playerName: playerStore.characterName ?? 'Player',
    requestType: 'tab_change',
    tab
  }

  props.send({ type: 'group_view_request', data: request })

  // Auto-timeout after 30s
  timeoutTimer = setTimeout(() => {
    if (pendingRequestId.value === requestId) {
      handleTimeout()
    }
  }, REQUEST_TIMEOUT_MS)
}

const handleResponse = (response: GroupViewResponse): void => {
  if (response.requestId !== pendingRequestId.value) return

  isPending.value = false
  pendingRequestId.value = null

  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }

  lastResponse.value = { status: response.status }
  startCooldown()

  // Clear feedback after 3 seconds
  setTimeout(() => {
    lastResponse.value = null
  }, 3000)
}

const handleTimeout = (): void => {
  isPending.value = false
  pendingRequestId.value = null
  lastResponse.value = { status: 'rejected' }
  startCooldown()

  setTimeout(() => {
    lastResponse.value = null
  }, 3000)
}

const startCooldown = (): void => {
  cooldownUntil.value = Date.now() + COOLDOWN_MS
  cooldownRemaining.value = Math.ceil(COOLDOWN_MS / 1000)

  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    const remaining = Math.ceil((cooldownUntil.value - Date.now()) / 1000)
    if (remaining <= 0) {
      cooldownRemaining.value = 0
      if (cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    } else {
      cooldownRemaining.value = remaining
    }
  }, 1000)
}

// Listen for group_view_response messages
let removeListener: (() => void) | null = null

onMounted(() => {
  removeListener = props.onMessage((msg: WebSocketEvent) => {
    if (msg.type === 'group_view_response') {
      handleResponse(msg.data as GroupViewResponse)
    }
  })
})

onUnmounted(() => {
  if (removeListener) {
    removeListener()
    removeListener = null
  }
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
})
</script>

<style lang="scss" scoped>
.group-control {
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text-muted;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
  }

  &__label {
    color: $color-text-muted;
  }

  &__tab-name {
    font-weight: 600;
    color: $color-text;
    text-transform: capitalize;
  }

  &__waiting {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text-muted;
    padding: $spacing-xs 0;
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid $glass-border;
    border-top-color: $color-accent-scarlet;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__cooldown {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
    padding: $spacing-xs 0;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }

  &__feedback {
    font-size: $font-size-xs;
    font-weight: 500;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;

    &--approved {
      color: $color-success;
      background: rgba($color-success, 0.1);
    }

    &--rejected {
      color: $color-danger;
      background: rgba($color-danger, 0.1);
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
