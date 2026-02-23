<template>
  <div class="canvas-panel">
    <div class="canvas-container" ref="canvasContainer">
      <!-- Background -->
      <div
        class="canvas-background"
        :style="scene.locationImage ? { backgroundImage: `url(${scene.locationImage})` } : {}"
      >
        <!-- Groups -->
        <div
          v-for="group in scene.groups"
          :key="group.id"
          class="canvas-group"
          :class="{
            'canvas-group--selected': selectedGroupId === group.id,
            'canvas-group--drop-target': hoveredGroupId === group.id
          }"
          :style="{
            left: `${group.position.x}%`,
            top: `${group.position.y}%`,
            width: `${group.width}px`,
            height: `${group.height}px`
          }"
          @click="emit('select-group', group.id)"
          @mousedown="startDragGroup($event, group)"
        >
          <span class="group-label">{{ group.name }}</span>
          <button class="group-delete" @click.stop="emit('delete-group', group.id)">
            <PhX :size="12" />
          </button>
          <!-- Resize handles -->
          <div class="resize-handle resize-handle--tl" @mousedown.stop="startResize($event, group, -1, -1)" />
          <div class="resize-handle resize-handle--tr" @mousedown.stop="startResize($event, group, 1, -1)" />
          <div class="resize-handle resize-handle--bl" @mousedown.stop="startResize($event, group, -1, 1)" />
          <div class="resize-handle resize-handle--br" @mousedown.stop="startResize($event, group, 1, 1)" />
        </div>

        <!-- Pokemon Sprites -->
        <div
          v-for="pokemon in scene.pokemon"
          :key="pokemon.id"
          class="canvas-sprite canvas-sprite--pokemon"
          :data-group-id="pokemon.groupId || undefined"
          :style="{
            left: `${pokemon.position.x}%`,
            top: `${pokemon.position.y}%`
          }"
          @mousedown="startDragSprite($event, 'pokemon', pokemon)"
        >
          <img
            :src="getSpriteUrl(pokemon.species)"
            :alt="pokemon.nickname || pokemon.species"
          />
          <span class="sprite-label">{{ pokemon.nickname || pokemon.species }}</span>
          <button class="sprite-delete" @click.stop="emit('remove-pokemon', pokemon.id)">
            <PhX :size="10" />
          </button>
        </div>

        <!-- Character Avatars -->
        <div
          v-for="character in scene.characters"
          :key="character.id"
          class="canvas-sprite canvas-sprite--character"
          :data-group-id="character.groupId || undefined"
          :style="{
            left: `${character.position.x}%`,
            top: `${character.position.y}%`
          }"
          @mousedown="startDragSprite($event, 'character', character)"
        >
          <div class="avatar-circle">
            <img
              v-if="getTrainerSpriteUrl(character.avatarUrl)"
              :src="getTrainerSpriteUrl(character.avatarUrl)!"
              :alt="character.name"
              class="avatar-sprite"
            />
            <PhUser v-else :size="24" />
          </div>
          <span class="sprite-label">{{ character.name }}</span>
          <button class="sprite-delete" @click.stop="emit('remove-character', character.id)">
            <PhX :size="10" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhX, PhUser } from '@phosphor-icons/vue'
import type { Scene, ScenePokemon, SceneCharacter, SceneGroup, ScenePosition } from '~/types/scene'

const props = defineProps<{
  scene: Scene
  selectedGroupId: string | null
}>()

const emit = defineEmits<{
  'update:positions': [type: 'pokemon' | 'character' | 'group', id: string, position: ScenePosition, groupId?: string | null]
  'resize-group': [id: string, position: ScenePosition, width: number, height: number]
  'select-group': [id: string]
  'delete-group': [id: string]
  'remove-pokemon': [id: string]
  'remove-character': [id: string]
}>()

// Canvas drag state
const canvasContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragTarget = ref<{ type: 'pokemon' | 'character' | 'group'; id: string } | null>(null)
const hoveredGroupId = ref<string | null>(null)

// Hit-test: find group at a given position (in %)
const findGroupAtPosition = (x: number, y: number): string | null => {
  if (!canvasContainer.value) return null
  const rect = canvasContainer.value.getBoundingClientRect()

  for (const group of props.scene.groups) {
    const halfWidthPct = (group.width / 2 / rect.width) * 100
    const halfHeightPct = (group.height / 2 / rect.height) * 100

    if (
      x >= group.position.x - halfWidthPct &&
      x <= group.position.x + halfWidthPct &&
      y >= group.position.y - halfHeightPct &&
      y <= group.position.y + halfHeightPct
    ) {
      return group.id
    }
  }
  return null
}

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

// Drag and drop for sprites
const startDragSprite = (event: MouseEvent, type: 'pokemon' | 'character', item: ScenePokemon | SceneCharacter) => {
  event.preventDefault()
  if (!canvasContainer.value) return
  isDragging.value = true
  dragTarget.value = { type, id: item.id }

  const el = event.currentTarget as HTMLElement
  const startPos = { x: item.position.x, y: item.position.y }
  let finalPos = { ...startPos }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !canvasContainer.value) return

    const rect = canvasContainer.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    finalPos = { x: clampedX, y: clampedY }

    // Hit-test for group drop target
    hoveredGroupId.value = findGroupAtPosition(clampedX, clampedY)

    // Visual feedback via direct DOM manipulation (bypasses reactivity)
    const deltaXPx = ((clampedX - startPos.x) / 100) * rect.width
    const deltaYPx = ((clampedY - startPos.y) / 100) * rect.height
    el.style.transform = `translate(calc(-50% + ${deltaXPx}px), calc(-50% + ${deltaYPx}px))`
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    isDragging.value = false
    dragTarget.value = null

    // Determine group assignment
    const droppedGroupId = findGroupAtPosition(finalPos.x, finalPos.y)
    hoveredGroupId.value = null

    // Reset inline transform so :style binding takes over
    el.style.transform = ''

    emit('update:positions', type, item.id, { x: finalPos.x, y: finalPos.y }, droppedGroupId)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// Drag and drop for groups (moves member sprites along with the group)
const startDragGroup = (event: MouseEvent, group: SceneGroup) => {
  event.preventDefault()
  if (!canvasContainer.value) return
  isDragging.value = true
  dragTarget.value = { type: 'group', id: group.id }

  const el = event.currentTarget as HTMLElement
  const startPos = { x: group.position.x, y: group.position.y }
  let finalPos = { ...startPos }

  // Collect member sprite DOM elements for visual dragging
  const memberEls = canvasContainer.value.querySelectorAll<HTMLElement>(
    `[data-group-id="${group.id}"]`
  )

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !canvasContainer.value) return

    const rect = canvasContainer.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    finalPos = { x: clampedX, y: clampedY }

    // Visual feedback via direct DOM manipulation (bypasses reactivity)
    const deltaXPx = ((clampedX - startPos.x) / 100) * rect.width
    const deltaYPx = ((clampedY - startPos.y) / 100) * rect.height
    el.style.transform = `translate(calc(-50% + ${deltaXPx}px), calc(-50% + ${deltaYPx}px))`

    // Move member sprites visually by the same pixel delta
    memberEls.forEach(memberEl => {
      memberEl.style.transform = `translate(calc(-50% + ${deltaXPx}px), calc(-50% + ${deltaYPx}px))`
    })
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    isDragging.value = false
    dragTarget.value = null

    // Reset inline transforms so :style bindings take over
    el.style.transform = ''
    memberEls.forEach(memberEl => {
      memberEl.style.transform = ''
    })

    emit('update:positions', 'group', group.id, { x: finalPos.x, y: finalPos.y })
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// Resize group from corner handle
const startResize = (event: MouseEvent, group: SceneGroup, signX: number, signY: number) => {
  event.preventDefault()
  if (!canvasContainer.value) return

  const groupEl = (event.currentTarget as HTMLElement).parentElement as HTMLElement
  const startMouseX = event.clientX
  const startMouseY = event.clientY
  const startWidth = group.width
  const startHeight = group.height
  const startPos = { x: group.position.x, y: group.position.y }

  const MIN_WIDTH = 60
  const MIN_HEIGHT = 40

  let finalWidth = startWidth
  let finalHeight = startHeight
  let finalPosOffsetX = 0
  let finalPosOffsetY = 0

  const onMouseMove = (e: MouseEvent) => {
    if (!canvasContainer.value) return
    const rect = canvasContainer.value.getBoundingClientRect()

    const deltaX = e.clientX - startMouseX
    const deltaY = e.clientY - startMouseY

    // Dimensions use sign multipliers, position tracks half raw delta
    finalWidth = Math.max(MIN_WIDTH, startWidth + signX * deltaX)
    finalHeight = Math.max(MIN_HEIGHT, startHeight + signY * deltaY)

    // Clamp deltas based on actual size change (accounts for min size clamping)
    const actualDeltaX = (finalWidth - startWidth) / signX || 0
    const actualDeltaY = (finalHeight - startHeight) / signY || 0

    finalPosOffsetX = (actualDeltaX / 2 / rect.width) * 100
    finalPosOffsetY = (actualDeltaY / 2 / rect.height) * 100

    // Visual feedback via direct DOM manipulation
    const posOffsetPx = (actualDeltaX / 2)
    const posOffsetPyPx = (actualDeltaY / 2)
    groupEl.style.width = `${finalWidth}px`
    groupEl.style.height = `${finalHeight}px`
    groupEl.style.transform = `translate(calc(-50% + ${posOffsetPx}px), calc(-50% + ${posOffsetPyPx}px))`
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // Reset inline styles so :style binding takes over
    groupEl.style.width = ''
    groupEl.style.height = ''
    groupEl.style.transform = ''

    emit('resize-group', group.id, {
      x: startPos.x + finalPosOffsetX,
      y: startPos.y + finalPosOffsetY
    }, finalWidth, finalHeight)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style lang="scss" scoped>
.canvas-panel {
  flex: 1;
  padding: $spacing-lg;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-lg;
}

.canvas-background {
  position: relative;
  width: 100%;
  height: 100%;
  background: $color-bg-tertiary;
  background-size: cover;
  background-position: center;
  user-select: none;
}

.canvas-group {
  position: absolute;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: $border-radius-lg;
  background: rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
  cursor: move;

  &--selected {
    border-color: $color-primary;
    background: rgba($color-primary, 0.1);
  }

  &--drop-target {
    border-color: $color-success;
    border-style: solid;
    background: rgba($color-success, 0.15);
    box-shadow: 0 0 12px rgba($color-success, 0.3);
  }

  .group-label {
    position: absolute;
    top: -20px;
    left: 0;
    padding: 2px $spacing-sm;
    background: rgba(0, 0, 0, 0.7);
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    color: white;
  }

  .group-delete {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: $color-danger;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: none;
  }

  &:hover .group-delete {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: white;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 2px;
    opacity: 0;
    transition: opacity $transition-fast;

    &--tl { top: -4px; left: -4px; cursor: nwse-resize; }
    &--tr { top: -4px; right: -4px; cursor: nesw-resize; }
    &--bl { bottom: -4px; left: -4px; cursor: nesw-resize; }
    &--br { bottom: -4px; right: -4px; cursor: nwse-resize; }
  }

  &:hover .resize-handle {
    opacity: 1;
  }
}

.canvas-sprite {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: move;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;

  &--pokemon {
    img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5));
    }
  }

  &--character {
    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: $color-bg-secondary;
      border: 2px solid $color-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  .sprite-label {
    padding: 2px $spacing-sm;
    background: rgba(0, 0, 0, 0.8);
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    color: white;
    white-space: nowrap;
  }

  .sprite-delete {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: $color-danger;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: none;
  }

  &:hover .sprite-delete {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
