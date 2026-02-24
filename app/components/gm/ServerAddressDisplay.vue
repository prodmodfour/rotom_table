<template>
  <div ref="containerRef" class="server-address">
    <button
      class="server-address__toggle"
      :title="expanded ? 'Hide server address' : 'Show server address for players'"
      @click="expanded = !expanded"
    >
      <PhWifiHigh :size="16" />
      <span class="server-address__label">LAN</span>
    </button>

    <div v-if="expanded" class="server-address__panel">
      <div class="server-address__header">
        <PhWifiHigh :size="16" />
        <span>Player Connection</span>
      </div>

      <div v-if="loading" class="server-address__loading">
        Loading...
      </div>

      <div v-else-if="error" class="server-address__error">
        {{ error }}
      </div>

      <template v-else>
        <div
          v-for="addr in addresses"
          :key="addr.address"
          class="server-address__entry"
        >
          <span class="server-address__interface">{{ addr.interface }}</span>
          <div class="server-address__url-row">
            <code class="server-address__url">{{ addr.url }}</code>
            <button
              class="server-address__copy"
              :title="'Copy ' + addr.url"
              @click="copyToClipboard(addr.url)"
            >
              <PhCopy v-if="copiedUrl !== addr.url" :size="14" />
              <PhCheck v-else :size="14" />
            </button>
          </div>
        </div>

        <p v-if="addresses.length === 0" class="server-address__empty">
          No LAN addresses found
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhWifiHigh, PhCopy, PhCheck } from '@phosphor-icons/vue'

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
const copiedUrl = ref<string | null>(null)

let copyTimeout: ReturnType<typeof setTimeout> | null = null

const fetchServerInfo = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{
      success: boolean
      data: { addresses: ServerAddress[] }
    }>('/api/settings/server-info')

    addresses.value = response.data.addresses
  } catch (err: any) {
    error.value = err.message || 'Failed to load server info'
  } finally {
    loading.value = false
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
    // Fallback for non-HTTPS contexts
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)

    copiedUrl.value = url
    if (copyTimeout) clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => {
      copiedUrl.value = null
    }, 2000)
  }
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
    fetchServerInfo()
    document.addEventListener('click', handleClickOutside, true)
  } else {
    document.removeEventListener('click', handleClickOutside, true)
  }
})

onUnmounted(() => {
  if (copyTimeout) clearTimeout(copyTimeout)
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style lang="scss" scoped>
.server-address {
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
    width: 320px;
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

  &__entry {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__interface {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    font-weight: 600;
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
}
</style>
