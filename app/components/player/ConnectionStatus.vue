<template>
  <div class="conn-status">
    <!-- Connection indicator dot -->
    <span
      class="conn-status__dot"
      :class="dotClass"
      :title="statusTitle"
    ></span>

    <!-- Connection details (shown on tap/click) -->
    <div v-if="showDetails" class="conn-status__details">
      <div class="conn-status__detail-row">
        <PhWifiHigh :size="14" />
        <span>{{ connectionTypeLabel }}</span>
      </div>

      <div class="conn-status__detail-row">
        <PhCircle :size="14" :class="stateColorClass" />
        <span>{{ stateLabel }}</span>
      </div>

      <div v-if="latencyMs !== null && isConnected" class="conn-status__detail-row">
        <PhTimer :size="14" />
        <span>{{ latencyMs }}ms</span>
      </div>

      <div v-if="isReconnecting" class="conn-status__detail-row conn-status__detail-row--warn">
        <PhArrowsClockwise :size="14" class="conn-status__spin" />
        <span>Reconnecting ({{ reconnectAttempt }}/{{ maxReconnectAttempts }})</span>
      </div>

      <button
        v-if="showRetry"
        class="conn-status__retry"
        @click="handleRetry"
      >
        <PhArrowsClockwise :size="14" />
        <span>Retry Connection</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhWifiHigh,
  PhCircle,
  PhTimer,
  PhArrowsClockwise
} from '@phosphor-icons/vue'

const props = defineProps<{
  isConnected: boolean
  isReconnecting: boolean
  reconnectAttempt: number
  maxReconnectAttempts: number
  latencyMs: number | null
  lastError: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const showDetails = ref(false)

// Toggle details on click
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// Determine connection type from current hostname
const connectionType = computed((): 'tunnel' | 'lan' => {
  if (typeof window === 'undefined') return 'lan'
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return 'lan'
  // Check if it looks like a LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))/.test(hostname)) return 'lan'
  return 'tunnel'
})

const connectionTypeLabel = computed(() =>
  connectionType.value === 'tunnel' ? 'Tunnel (Remote)' : 'LAN (Local)'
)

const stateLabel = computed(() => {
  if (props.isConnected) return 'Connected'
  if (props.isReconnecting) return 'Reconnecting...'
  if (props.lastError) return 'Disconnected'
  return 'Connecting...'
})

const statusTitle = computed(() => {
  const parts = [stateLabel.value, connectionTypeLabel.value]
  if (props.latencyMs !== null && props.isConnected) {
    parts.push(`${props.latencyMs}ms`)
  }
  return parts.join(' - ')
})

const dotClass = computed(() => ({
  'conn-status__dot--connected': props.isConnected,
  'conn-status__dot--reconnecting': props.isReconnecting,
  'conn-status__dot--disconnected': !props.isConnected && !props.isReconnecting
}))

const stateColorClass = computed(() => ({
  'conn-status__state--connected': props.isConnected,
  'conn-status__state--warn': props.isReconnecting,
  'conn-status__state--error': !props.isConnected && !props.isReconnecting
}))

const showRetry = computed(() =>
  !props.isConnected && !props.isReconnecting && props.lastError !== null
)

const handleRetry = () => {
  emit('retry')
}

// Click-outside to dismiss details
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.conn-status')) {
    showDetails.value = false
  }
}

watch(showDetails, (visible) => {
  if (visible) {
    document.addEventListener('click', handleClickOutside, true)
  } else {
    document.removeEventListener('click', handleClickOutside, true)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style lang="scss" scoped>
.conn-status {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background $transition-fast;

    &--connected {
      background: $color-success;
      box-shadow: 0 0 4px rgba($color-success, 0.5);
    }

    &--reconnecting {
      background: $color-warning;
      box-shadow: 0 0 4px rgba($color-warning, 0.5);
      animation: pulse 1.5s ease-in-out infinite;
    }

    &--disconnected {
      background: $color-danger;
    }
  }

  &__details {
    position: absolute;
    top: calc(100% + $spacing-sm);
    right: 0;
    min-width: 200px;
    background: $color-bg-secondary;
    border: 1px solid $glass-border;
    border-radius: $border-radius-md;
    padding: $spacing-sm;
    box-shadow: $shadow-lg;
    z-index: $z-index-dropdown;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__detail-row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text-secondary;

    &--warn {
      color: $color-warning;
    }
  }

  &__state {
    &--connected { color: $color-success; }
    &--warn { color: $color-warning; }
    &--error { color: $color-danger; }
  }

  &__spin {
    animation: spin 1s linear infinite;
  }

  &__retry {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    margin-top: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-accent-teal;
    background: transparent;
    border: 1px solid $color-accent-teal;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: rgba($color-accent-teal, 0.1);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
