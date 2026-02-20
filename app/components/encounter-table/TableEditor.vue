<template>
  <div class="table-editor">
    <div class="table-editor__header">
      <NuxtLink :to="backLink" class="btn btn--secondary btn--sm">
        &larr; {{ backLabel }}
      </NuxtLink>
      <h2 v-if="editor.table">{{ editor.table.name }}</h2>
      <div class="table-editor__actions" v-if="editor.table">
        <button class="btn btn--secondary btn--with-icon" @click="editor.showSettingsModal = true">
          <img src="/icons/phosphor/gear.svg" alt="" class="btn-icon" />
          Settings
        </button>
        <slot name="header-actions" :table="editor.table" />
      </div>
    </div>

    <div v-if="editor.loading" class="table-editor__loading">
      Loading...
    </div>

    <div v-else-if="!editor.table" class="table-editor__not-found">
      <p>Table not found</p>
      <NuxtLink :to="backLink" class="btn btn--primary">
        {{ backLabel }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Table Info -->
      <div class="table-info">
        <div class="info-row">
          <span class="info-label">Description:</span>
          <span class="info-value">{{ editor.table.description || 'No description' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Level Range:</span>
          <span class="info-value">{{ editor.table.levelRange.min }} - {{ editor.table.levelRange.max }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Population Density:</span>
          <span class="info-value">
            <span class="density-badge" :class="`density--${editor.table.density}`">
              {{ editor.getDensityLabel(editor.table.density) }}
            </span>
            <span class="spawn-preview">{{ editor.getDensityDescription(editor.table.density) }}</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Weight:</span>
          <span class="info-value">{{ editor.totalWeight }}</span>
        </div>
      </div>

      <div class="table-editor__content">
        <!-- Entries Section -->
        <section class="editor-section">
          <div class="section-header">
            <h3>Pokemon Entries ({{ editor.table.entries.length }})</h3>
            <button class="btn btn--primary btn--sm" @click="editor.showAddEntryModal = true">
              + Add Pokemon
            </button>
          </div>

          <div v-if="editor.table.entries.length === 0" class="section-empty">
            <p>No Pokemon in this table yet</p>
            <button class="btn btn--primary" @click="editor.showAddEntryModal = true">
              Add your first Pokemon
            </button>
          </div>

          <div v-else class="entries-list">
            <div class="entries-header">
              <span class="col-name">Pokemon</span>
              <span class="col-weight">Weight</span>
              <span class="col-chance">Chance</span>
              <span class="col-level">Level Range</span>
              <span class="col-actions">Actions</span>
            </div>
            <EntryRow
              v-for="entry in editor.sortedEntries"
              :key="entry.id"
              :entry="entry"
              :total-weight="editor.totalWeight"
              :table-level-range="editor.table.levelRange"
              @remove="editor.removeEntry"
              @update-weight="editor.updateEntryWeight"
              @update-level-range="editor.updateEntryLevelRange"
            />
          </div>
        </section>

        <!-- Modifications Section -->
        <section class="editor-section">
          <div class="section-header">
            <h3>Sub-habitats ({{ editor.table.modifications.length }})</h3>
            <button class="btn btn--primary btn--sm" @click="editor.showAddModModal = true">
              + Add Sub-habitat
            </button>
          </div>

          <div v-if="editor.table.modifications.length === 0" class="section-empty">
            <p>No sub-habitats defined</p>
            <p class="section-hint">
              Sub-habitats let you create variations of this table (e.g., "Deep Forest" as a variant of "Forest")
            </p>
          </div>

          <div v-else class="modifications-list">
            <ModificationCard
              v-for="mod in editor.table.modifications"
              :key="mod.id"
              :modification="mod"
              :parent-entries="editor.table.entries"
              :table-id="editor.table.id"
              @edit="editor.editModification"
              @delete="editor.deleteModification"
            />
          </div>
        </section>
      </div>
    </template>

    <!-- Add Entry Modal -->
    <div v-if="editor.showAddEntryModal" class="modal-overlay" @click.self="editor.showAddEntryModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Add Pokemon</h3>
          <button class="modal__close" @click="editor.showAddEntryModal = false">&times;</button>
        </div>
        <form @submit.prevent="editor.addEntry">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Pokemon Species *</label>
              <PokemonSearchInput
                v-model="editor.newEntry.speciesName"
                @select="editor.handleSpeciesSelect"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Rarity</label>
              <select v-model="editor.newEntry.rarity" class="form-select">
                <option value="common">Common (Weight: 10)</option>
                <option value="uncommon">Uncommon (Weight: 5)</option>
                <option value="rare">Rare (Weight: 3)</option>
                <option value="very-rare">Very Rare (Weight: 1)</option>
                <option value="legendary">Legendary (Weight: 0.1)</option>
                <option value="custom">Custom Weight</option>
              </select>
            </div>
            <div v-if="editor.newEntry.rarity === 'custom'" class="form-group">
              <label class="form-label">Custom Weight</label>
              <input
                v-model.number="editor.newEntry.customWeight"
                type="number"
                class="form-input"
                min="0.1"
                step="0.1"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Level Range Override (optional)</label>
              <div class="level-range-inputs">
                <input
                  v-model.number="editor.newEntry.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  v-model.number="editor.newEntry.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Max"
                />
              </div>
              <p class="form-hint">Leave blank to use table's default range</p>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="editor.showAddEntryModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!editor.newEntry.speciesId">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Modification Modal -->
    <div v-if="editor.showAddModModal" class="modal-overlay" @click.self="editor.showAddModModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Create Sub-habitat</h3>
          <button class="modal__close" @click="editor.showAddModModal = false">&times;</button>
        </div>
        <form @submit.prevent="editor.addModification">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="editor.newMod.name"
                type="text"
                class="form-input"
                placeholder="e.g., Deep Canopy"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="editor.newMod.description"
                class="form-input"
                rows="2"
                placeholder="Describe this sub-habitat..."
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Level Range Override (optional)</label>
              <div class="level-range-inputs">
                <input
                  v-model.number="editor.newMod.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  v-model.number="editor.newMod.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="editor.showAddModModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!editor.newMod.name">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modification Modal -->
    <div v-if="editor.showEditModModal" class="modal-overlay" @click.self="editor.showEditModModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Edit Sub-habitat</h3>
          <button class="modal__close" @click="editor.showEditModModal = false">&times;</button>
        </div>
        <form @submit.prevent="editor.saveModification">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="editor.editMod.name"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="editor.editMod.description"
                class="form-input"
                rows="2"
                placeholder="Describe this sub-habitat..."
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Level Range Override (optional)</label>
              <div class="level-range-inputs">
                <input
                  v-model.number="editor.editMod.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  v-model.number="editor.editMod.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="editor.showEditModModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!editor.editMod.name">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="editor.showSettingsModal && editor.table" class="modal-overlay" @click.self="editor.showSettingsModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Table Settings</h3>
          <button class="modal__close" @click="editor.showSettingsModal = false">&times;</button>
        </div>
        <form @submit.prevent="editor.saveSettings">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input
                v-model="editor.editSettings.name"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="editor.editSettings.description"
                class="form-input"
                rows="3"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Min Level</label>
                <input
                  v-model.number="editor.editSettings.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Max Level</label>
                <input
                  v-model.number="editor.editSettings.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Population Density</label>
              <select v-model="editor.editSettings.density" class="form-select">
                <option v-for="opt in densityOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <p class="form-hint">
                Describes the habitat's population density (informational -- does not control spawn count)
              </p>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="editor.showSettingsModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Slot for page-specific modals/extras -->
    <slot name="after" :table="editor.table" />
  </div>
</template>

<script setup lang="ts">
import { DENSITY_SUGGESTIONS, type DensityTier } from '~/types'

const props = defineProps<{
  tableId: string
  backLink: string
  backLabel: string
}>()

const editor = reactive(useTableEditor(computed(() => props.tableId)))

const densityOptions = Object.entries(DENSITY_SUGGESTIONS).map(([tier, info]) => ({
  value: tier as DensityTier,
  label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} -- ${info.description}`,
}))
</script>

<style lang="scss" scoped>
.table-editor {
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    h2 {
      flex: 1;
      margin: 0;
      color: $color-text;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.btn--with-icon {
  @include btn-with-icon;
}

.btn-icon {
  @include btn-icon-img;
}

.table-editor__loading,
.table-editor__not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: $color-text-muted;

  p {
    margin-bottom: $spacing-md;
  }
}

.table-editor__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.table-info {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
}

.info-row {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-xs 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba($glass-border, 0.5);
  }
}

.info-label {
  color: $color-text-muted;
  min-width: 120px;
}

.info-value {
  color: $color-text;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.density-badge {
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  font-weight: 500;

  &.density--sparse {
    background: rgba(158, 158, 158, 0.2);
    color: #bdbdbd;
  }

  &.density--moderate {
    background: rgba(33, 150, 243, 0.2);
    color: #64b5f6;
  }

  &.density--dense {
    background: rgba(255, 152, 0, 0.2);
    color: #ffb74d;
  }

  &.density--abundant {
    background: rgba(244, 67, 54, 0.2);
    color: #ef5350;
  }
}

.spawn-preview {
  font-size: 0.75rem;
  color: $color-text-muted;
}

.editor-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $glass-border;

  h3 {
    margin: 0;
    color: $color-text;
  }
}

.section-empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-muted;

  p {
    margin-bottom: $spacing-md;
  }
}

.section-hint {
  font-size: 0.875rem;
  color: $color-text-muted;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.entries-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-muted;
  border-bottom: 1px solid $glass-border;
}

.modifications-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.modal-overlay {
  @include modal-overlay-base;
}

.modal {
  @include modal-container-base;
}

.form-group {
  margin-bottom: $spacing-md;
}

.form-label {
  display: block;
  margin-bottom: $spacing-xs;
  color: $color-text-muted;
  font-size: 0.875rem;
}

.form-hint {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $color-text-muted;
}

.form-row {
  display: flex;
  gap: $spacing-md;

  .form-group {
    flex: 1;
  }
}

.level-range-inputs {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  input {
    width: 80px;
  }

  span {
    color: $color-text-muted;
  }
}
</style>
