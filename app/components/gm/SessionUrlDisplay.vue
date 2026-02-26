<template>
  <div ref="containerRef" class="session-url">
    <button
      class="session-url__toggle"
      :title="expanded ? 'Hide connection info' : 'Show connection info for players'"
      @click="expanded = !expanded"
    >
      <PhWifiHigh :size="16" />
      <span class="session-url__label">Connect</span>
    </button>

    <div v-if="expanded" class="session-url__panel">
      <!-- Header -->
      <div class="session-url__header">
        <PhWifiHigh :size="16" />
        <span>Player Connection</span>
        <button
          class="session-url__qr-toggle"
          :title="showQrCodes ? 'Hide QR codes' : 'Show QR codes'"
          @click="showQrCodes = !showQrCodes"
        >
          <PhQrCode :size="14" />
        </button>
      </div>

      <div v-if="loading" class="session-url__loading">
        Loading...
      </div>

      <div v-else-if="error" class="session-url__error">
        {{ error }}
      </div>

      <template v-else>
        <!-- Tunnel URL Section -->
        <div class="session-url__section">
          <div class="session-url__section-label">
            <PhGlobe :size="14" />
            <span>Tunnel (Remote)</span>
          </div>

          <div v-if="tunnelUrl" class="session-url__entry">
            <div class="session-url__url-row">
              <code class="session-url__url session-url__url--tunnel">{{ tunnelUrl }}</code>
              <button
                class="session-url__copy"
                title="Copy tunnel URL"
                @click="copyToClipboard(tunnelUrl)"
              >
                <PhCopy v-if="copiedUrl !== tunnelUrl" :size="14" />
                <PhCheck v-else :size="14" />
              </button>
            </div>
            <div
              v-if="showQrCodes && tunnelPlayerUrl"
              class="session-url__qr"
              v-html="generateQrSvg(tunnelPlayerUrl, qrOptions)"
            />
          </div>

          <div v-else class="session-url__unconfigured">
            <span>No tunnel configured</span>
            <button class="session-url__configure-btn" @click="showTunnelConfig = true">
              <PhGear :size="12" />
              <span>Configure</span>
            </button>
          </div>
        </div>

        <!-- LAN Section -->
        <div class="session-url__section">
          <div class="session-url__section-label">
            <PhWifiHigh :size="14" />
            <span>LAN (Local Network)</span>
          </div>

          <div
            v-for="addr in addresses"
            :key="addr.address"
            class="session-url__entry"
          >
            <span class="session-url__interface">{{ addr.interface }}</span>
            <div class="session-url__url-row">
              <code class="session-url__url">{{ addr.url }}</code>
              <button
                class="session-url__copy"
                :title="'Copy ' + addr.url"
                @click="copyToClipboard(addr.url)"
              >
                <PhCopy v-if="copiedUrl !== addr.url" :size="14" />
                <PhCheck v-else :size="14" />
              </button>
            </div>
            <div
              v-if="showQrCodes"
              class="session-url__qr"
              v-html="generateQrSvg(toPlayerUrl(addr.url), qrOptions)"
            />
          </div>

          <p v-if="addresses.length === 0" class="session-url__empty">
            No LAN addresses found
          </p>
        </div>

        <!-- Fallback copy prompt (non-HTTPS) -->
        <div v-if="fallbackUrl" class="session-url__fallback">
          <span class="session-url__fallback-label">Select and copy:</span>
          <div class="session-url__fallback-row">
            <input
              ref="fallbackInputRef"
              :value="fallbackUrl"
              class="session-url__fallback-input"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
            />
            <button
              class="session-url__fallback-dismiss"
              title="Dismiss"
              @click="dismissFallback"
            >
              <PhCheck :size="14" />
            </button>
          </div>
        </div>

        <!-- Tunnel Configuration (inline) -->
        <div v-if="showTunnelConfig || tunnelUrl" class="session-url__config">
          <div class="session-url__config-header">
            <PhGear :size="14" />
            <span>Tunnel URL</span>
          </div>
          <div class="session-url__config-row">
            <input
              v-model="tunnelInput"
              type="url"
              class="session-url__config-input"
              placeholder="https://ptu.example.com"
              @keydown.enter="saveTunnelUrl"
            />
            <button
              class="session-url__config-save"
              title="Save tunnel URL"
              :disabled="savingTunnel"
              @click="saveTunnelUrl"
            >
              <PhFloppyDisk :size="14" />
            </button>
            <button
              v-if="tunnelUrl"
              class="session-url__config-clear"
              title="Remove tunnel URL"
              :disabled="savingTunnel"
              @click="clearTunnelUrl"
            >
              <PhTrash :size="14" />
            </button>
          </div>
          <p v-if="tunnelError" class="session-url__config-error">{{ tunnelError }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhWifiHigh, PhGlobe, PhCopy, PhCheck, PhGear, PhFloppyDisk, PhTrash, PhQrCode } from '@phosphor-icons/vue'
import { generateQrSvg } from '~/utils/qrcode'
import type { QrSvgOptions } from '~/utils/qrcode'

interface ServerAddress {
  interface: string
  address: string
  url: string
}

const containerRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const addresses = ref<ServerAddress[]>([])
const tunnelUrl = ref<string | null>(null)
const copiedUrl = ref<string | null>(null)
const showTunnelConfig = ref(false)
const tunnelInput = ref('')
const savingTunnel = ref(false)
const tunnelError = ref<string | null>(null)
const showQrCodes = ref(false)
const fallbackUrl = ref<string | null>(null)
const fallbackInputRef = ref<HTMLInputElement | null>(null)

/** QR code styling options for the dark theme */
const qrOptions: QrSvgOptions = {
  moduleSize: 3,
  quietZone: 2,
  foreground: '#f0f0f5',
  background: 'transparent',
}

/** Append /player path to a base URL */
const toPlayerUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return `${trimmed}/player`
}

/** Tunnel URL with /player path appended */
const tunnelPlayerUrl = computed(() => {
  if (!tunnelUrl.value) return null
  return toPlayerUrl(tunnelUrl.value)
})

let copyTimeout: ReturnType<typeof setTimeout> | null = null

const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    const [serverInfoResponse, tunnelResponse] = await Promise.all([
      $fetch<{ success: boolean; data: { addresses: ServerAddress[] } }>('/api/settings/server-info'),
      $fetch<{ success: boolean; data: { tunnelUrl: string | null } }>('/api/settings/tunnel')
    ])

    addresses.value = serverInfoResponse.data.addresses
    tunnelUrl.value = tunnelResponse.data.tunnelUrl
    tunnelInput.value = tunnelResponse.data.tunnelUrl ?? ''
  } catch (err: any) {
    error.value = err.message || 'Failed to load connection info'
  } finally {
    loading.value = false
  }
}

const saveTunnelUrl = async () => {
  const trimmed = tunnelInput.value.trim()
  tunnelError.value = null
  savingTunnel.value = true

  try {
    const response = await $fetch<{ success: boolean; data: { tunnelUrl: string | null } }>('/api/settings/tunnel', {
      method: 'PUT',
      body: { tunnelUrl: trimmed || null }
    })

    tunnelUrl.value = response.data.tunnelUrl
    tunnelInput.value = response.data.tunnelUrl ?? ''
    showTunnelConfig.value = false
  } catch (err: any) {
    tunnelError.value = err.data?.message || err.message || 'Failed to save tunnel URL'
  } finally {
    savingTunnel.value = false
  }
}

const clearTunnelUrl = async () => {
  tunnelError.value = null
  savingTunnel.value = true

  try {
    await $fetch('/api/settings/tunnel', {
      method: 'PUT',
      body: { tunnelUrl: null }
    })

    tunnelUrl.value = null
    tunnelInput.value = ''
    showTunnelConfig.value = false
  } catch (err: any) {
    tunnelError.value = err.data?.message || err.message || 'Failed to clear tunnel URL'
  } finally {
    savingTunnel.value = false
  }
}

const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    copiedUrl.value = url

    if (copyTimeout) clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => {
      copiedUrl.value = null
    }, 2000)
  } catch {
    // Clipboard API unavailable (non-HTTPS / LAN context).
    // Show a pre-selected input so the user can manually copy.
    fallbackUrl.value = url
    nextTick(() => {
      fallbackInputRef.value?.select()
    })
  }
}

const dismissFallback = () => {
  fallbackUrl.value = null
}

// Click-outside handler to dismiss the panel
const handleClickOutside = (event: MouseEvent) => {
  if (!containerRef.value) return
  if (!containerRef.value.contains(event.target as Node)) {
    expanded.value = false
  }
}

watch(expanded, (isExpanded) => {
  if (isExpanded) {
    fetchData()
    document.addEventListener('click', handleClickOutside, true)
  } else {
    document.removeEventListener('click', handleClickOutside, true)
    showTunnelConfig.value = false
    showQrCodes.value = false
    tunnelError.value = null
    fallbackUrl.value = null
  }
})

onUnmounted(() => {
  if (copyTimeout) clearTimeout(copyTimeout)
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style lang="scss" scoped>
.session-url {
  position: relative;

  &__toggle {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-md;
    color: $color-text-muted;
    font-size: $font-size-xs;
    font-weight: 500;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-hover;
      color: $color-text;
      border-color: $color-accent-teal;
    }
  }

  &__label {
    white-space: nowrap;
  }

  &__panel {
    position: absolute;
    top: calc(100% + $spacing-xs);
    right: 0;
    width: 360px;
    background: $color-bg-secondary;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
    padding: $spacing-md;
    box-shadow: $shadow-lg;
    z-index: $z-index-dropdown;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-accent-teal;
    padding-bottom: $spacing-xs;
    border-bottom: 1px solid $border-color-default;
  }

  &__qr-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-left: auto;
    border: 1px solid $border-color-default;
    background: transparent;
    color: $color-text-muted;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-hover;
      color: $color-accent-teal;
      border-color: $color-accent-teal;
    }
  }

  &__qr {
    display: flex;
    justify-content: center;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
    margin-top: $spacing-xs;

    :deep(svg) {
      max-width: 120px;
      max-height: 120px;
      width: 100%;
      height: auto;
    }
  }

  &__loading,
  &__error,
  &__empty {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-sm;
  }

  &__error {
    color: $color-danger;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__section-label {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__entry {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__interface {
    font-size: 10px;
    color: $color-text-muted;
    text-transform: uppercase;
    font-weight: 600;
    padding-left: $spacing-xs;
  }

  &__url-row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__url {
    flex: 1;
    font-size: $font-size-sm;
    color: $color-text;
    background: $color-bg-tertiary;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--tunnel {
      color: $color-accent-teal;
    }
  }

  &__copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border: 1px solid $border-color-default;
    background: transparent;
    color: $color-text-muted;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-hover;
      color: $color-accent-teal;
      border-color: $color-accent-teal;
    }
  }

  &__unconfigured {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__configure-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px $spacing-sm;
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

  &__config {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding-top: $spacing-xs;
    border-top: 1px solid $border-color-default;
  }

  &__config-header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 600;
  }

  &__config-row {
    display: flex;
    gap: $spacing-xs;
  }

  &__config-input {
    flex: 1;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    font-family: monospace;
    color: $color-text;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    outline: none;
    transition: border-color $transition-fast;

    &:focus {
      border-color: $color-accent-teal;
    }

    &::placeholder {
      color: $color-text-muted;
      opacity: 0.5;
    }
  }

  &__config-save,
  &__config-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border: 1px solid $border-color-default;
    background: transparent;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__config-save {
    color: $color-success;

    &:hover:not(:disabled) {
      background: rgba($color-success, 0.1);
      border-color: $color-success;
    }
  }

  &__config-clear {
    color: $color-danger;

    &:hover:not(:disabled) {
      background: rgba($color-danger, 0.1);
      border-color: $color-danger;
    }
  }

  &__config-error {
    font-size: $font-size-xs;
    color: $color-danger;
    margin: 0;
  }

  &__fallback {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: $spacing-sm;
    background: rgba($color-accent-teal, 0.05);
    border: 1px solid rgba($color-accent-teal, 0.2);
    border-radius: $border-radius-sm;
  }

  &__fallback-label {
    font-size: $font-size-xs;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__fallback-row {
    display: flex;
    gap: $spacing-xs;
  }

  &__fallback-input {
    flex: 1;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    font-family: monospace;
    color: $color-text;
    background: $color-bg-tertiary;
    border: 1px solid $color-accent-teal;
    border-radius: $border-radius-sm;
    outline: none;
    cursor: text;
  }

  &__fallback-dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border: 1px solid $border-color-default;
    background: transparent;
    color: $color-success;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: rgba($color-success, 0.1);
      border-color: $color-success;
    }
  }
}
</style>
