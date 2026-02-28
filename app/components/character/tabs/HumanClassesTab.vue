<template>
  <div class="tab-content">
    <div v-if="trainerClasses?.length" class="info-section">
      <h4>Trainer Classes</h4>
      <div class="tag-list">
        <span v-for="tc in trainerClasses" :key="tc" class="tag tag--class">{{ tc }}</span>
      </div>
    </div>

    <div v-if="features?.length" class="info-section">
      <h4>Features</h4>
      <div class="tag-list">
        <span v-for="feat in features" :key="feat" class="tag tag--feature">{{ feat }}</span>
      </div>
    </div>

    <div v-if="edges?.length" class="info-section">
      <h4>Edges</h4>
      <div class="tag-list">
        <span v-for="edge in edges" :key="edge" class="tag tag--edge">{{ edge }}</span>
      </div>
    </div>

    <div v-if="capabilities?.length" class="info-section">
      <h4>Capabilities</h4>
      <div class="tag-list">
        <span v-for="cap in capabilities" :key="cap" class="tag tag--capability">{{ cap }}</span>
      </div>
    </div>

    <p v-if="!trainerClasses?.length && !features?.length && !edges?.length && !capabilities?.length" class="empty-state">
      No classes, features, edges, or capabilities recorded
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  trainerClasses?: string[]
  features?: string[]
  edges?: string[]
  capabilities?: string[]
}>()
</script>

<style lang="scss" scoped>
.info-section {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

// Tag base + variant modifiers provided by global _tags.scss partial

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
