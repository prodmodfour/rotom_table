---
design_id: design-trainer-sprites-001
ticket_id: feature-001
category: FEATURE_GAP
scope: SINGLE_PHASE
domain: character-lifecycle
status: design-complete
affected_files:
  - app/components/character/HumanCard.vue
  - app/components/character/CharacterModal.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/components/encounter/GroupCombatantCard.vue
  - app/components/encounter/AddCombatantModal.vue
  - app/components/encounter/GMActionModal.vue
  - app/components/group/PlayerLobbyView.vue
  - app/components/group/InitiativeTracker.vue
  - app/components/group/CombatantDetailsPanel.vue
  - app/components/vtt/VTTToken.vue
  - app/components/scene/SceneCanvas.vue
  - app/components/scene/SceneAddPanel.vue
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/create.vue
  - app/pages/group/_components/SceneView.vue
  - app/pages/group/_components/LobbyView.vue
new_files:
  - app/composables/useTrainerSprite.ts
  - app/components/character/TrainerSpritePicker.vue
  - app/constants/trainerSprites.ts
---

# Design: B2W2 Trainer Sprites for NPC/Player Avatars (feature-001)

## Overview

Human characters (NPCs and players) currently display letter-initial fallbacks because no avatar selection UI exists. The `avatarUrl` field on `HumanCharacter` already exists in both the Prisma schema and TypeScript types, and the API already serializes and persists it. This feature adds a trainer sprite picker that lets the GM assign B2W2-style trainer sprites to any human character, consistent with the existing Pokemon sprite aesthetic (Gen 1-5 Pokemon use B2W2 animated sprites via `usePokemonSprite.ts`).

### Goals

1. Provide a visual identity for every human character using the same B2W2 art style as Pokemon sprites
2. Sprite selection available during character creation (Quick Create and Full Create) and editing (character sheet page and CharacterModal)
3. All views (GM, Group, Player) render the selected sprite wherever avatars appear today
4. Letter-initial fallback remains for characters without a selected sprite
5. No schema migration required (the `avatarUrl` field already exists)

---

## Sprite Source

### Decision: Pokemon Showdown Trainer Sprites via CDN

**Primary source:** `https://play.pokemonshowdown.com/sprites/trainers/{name}.png`

**Rationale:**

| Criterion | Pokemon Showdown | PokeAPI | Bundled Assets |
|-----------|-----------------|---------|----------------|
| Trainer sprites available | 800+ (all gens, named + generic classes) | No trainer sprites (Pokemon only) | Would require manual download/hosting |
| B2W2 consistency | Has Gen 5/BW2-specific variants | N/A | Depends on sourced assets |
| CDN reliability | Hosted by Smogon, used by millions | GitHub raw (rate-limited) | Self-hosted (always available) |
| Licensing | Fan project, community standard | Official API, sprites from games | Same licensing concern |
| Already used in project | Yes (Pokemon sprites via Showdown) | Yes (B2W2 animated GIFs via PokeAPI GitHub) | No |
| Maintenance burden | Zero (Smogon maintains) | Zero | High (must download, store, serve) |

**PokeAPI does not provide trainer sprites** -- it only has Pokemon sprites. Pokemon Showdown is the clear choice because:
- The project already uses Showdown sprites for Gen 6+ Pokemon (`usePokemonSprite.ts` line 353-357)
- Showdown provides 800+ trainer sprites spanning all generations
- The sprites are 80x80 PNG files, consistent size and quality
- No hosting/bundling cost -- same CDN pattern as existing Pokemon sprites

**Fallback strategy:** If a sprite fails to load (CDN down, invalid name), fall back to the existing letter-initial placeholder. The `@error` handler on `<img>` tags will hide the broken image and show the initial. This mirrors the existing `handleSpriteError` pattern in `HumanCard.vue` and `VTTToken.vue`.

### Sprite Catalog

The Showdown trainer sprite collection includes 800+ sprites. For the picker UI, we organize them into PTU-relevant categories. The catalog is defined as a constant in `app/constants/trainerSprites.ts`.

**Categories and representative sprites:**

| Category | Description | Example Sprite Keys |
|----------|-------------|-------------------|
| Protagonists | Main game player characters | `red`, `leaf`, `ethan`, `lyra`, `brendan`, `may`, `lucas`, `dawn`, `hilbert`, `hilda`, `nate`, `rosa` |
| Gym Leaders | All gym leaders across gens | `brock`, `misty`, `erika`, `blaine`, `whitney`, `clair`, `roxanne`, `norman`, `elesa`, `skyla` |
| Elite Four & Champions | E4 members and champions | `lorelei`, `lance`, `cynthia`, `steven`, `alder`, `diantha`, `leon` |
| Villains & Admins | Team leaders and admins | `giovanni`, `archie`, `maxie`, `cyrus`, `ghetsis`, `lysandre`, `n` |
| Grunts | Team grunts (male/female) | `rocketgrunt`, `aquagrunt`, `magmagrunt`, `galacticgrunt`, `plasmagrunt`, `flaregrunt` |
| Generic Male | Generic male trainer classes | `acetrainer`, `blackbelt`, `biker`, `hiker`, `youngster`, `gentleman`, `fisherman`, `sailor`, `scientist` |
| Generic Female | Generic female trainer classes | `acetrainerf`, `beauty`, `lass`, `lady`, `battlegirl`, `parasollady`, `nurse`, `cowgirl` |
| Specialists | Type/skill specialists | `bugcatcher`, `birdkeeper`, `dragontamer`, `hexmaniac`, `pokemonbreeder`, `pokemonranger` |
| Other | Miscellaneous NPCs | `artist`, `baker`, `butler`, `chef`, `clown`, `jogger`, `musician`, `pilot` |

The constant file exports a `TRAINER_SPRITE_CATALOG` array where each entry has `{ key: string, label: string, category: string }`. The `key` maps directly to the Showdown filename (without `.png`).

---

## Data Model

### Storage Format

The `avatarUrl` field on `HumanCharacter` stores the **sprite key** (e.g., `"acetrainer"`), not the full URL.

**Rationale for storing the key instead of the full URL:**
1. If the CDN URL changes (domain migration, path restructure), we only update the composable, not every DB record
2. The key is shorter and more readable in the database
3. The composable constructs the full URL at render time, just like `usePokemonSprite.ts` does for Pokemon

**Backward compatibility:** The rendering code checks if `avatarUrl` starts with `http` -- if so, it is treated as a raw URL (legacy/external avatar). Otherwise, it is treated as a sprite key and resolved via the composable. This ensures any existing data with full URLs still works.

### No Schema Changes Required

The field already exists:

```prisma
model HumanCharacter {
  // ...
  avatarUrl     String?
  // ...
}
```

The TypeScript type already has it:

```typescript
export interface HumanCharacter {
  // ...
  avatarUrl?: string;
  // ...
}
```

The API already handles it:
- `POST /api/characters` accepts `avatarUrl` in the body (`index.post.ts` line 51)
- `PUT /api/characters/[id]` updates `avatarUrl` if provided (`[id].put.ts` line 24)
- All serializers include `avatarUrl` in the response (`serializers.ts` lines 110, 176)

---

## Composable: `useTrainerSprite.ts`

**File:** `app/composables/useTrainerSprite.ts`

Follows the same pattern as `usePokemonSprite.ts`: a composable function that returns URL-building helpers. Auto-imported by Nuxt.

```typescript
// Trainer sprite URL generator
// Uses Pokemon Showdown trainer sprites as the source

export function useTrainerSprite() {
  const BASE_URL = 'https://play.pokemonshowdown.com/sprites/trainers'

  /**
   * Get the full sprite URL for a trainer sprite key.
   * If the key looks like a full URL (starts with http), return it as-is.
   * If the key is empty/null, return null (caller should show fallback).
   */
  const getTrainerSpriteUrl = (spriteKey: string | null | undefined): string | null => {
    if (!spriteKey) return null
    if (spriteKey.startsWith('http')) return spriteKey
    return `${BASE_URL}/${spriteKey}.png`
  }

  /**
   * Check if a value is a sprite key (vs. a full URL or empty).
   */
  const isSpriteKey = (value: string | null | undefined): boolean => {
    return !!value && !value.startsWith('http')
  }

  return {
    getTrainerSpriteUrl,
    isSpriteKey,
    BASE_URL
  }
}
```

**Usage in components:**

```vue
<script setup>
const { getTrainerSpriteUrl } = useTrainerSprite()

const resolvedAvatarUrl = computed(() =>
  getTrainerSpriteUrl(character.avatarUrl)
)
</script>

<template>
  <img v-if="resolvedAvatarUrl" :src="resolvedAvatarUrl" :alt="character.name" />
  <span v-else>{{ character.name.charAt(0) }}</span>
</template>
```

---

## Constants: `trainerSprites.ts`

**File:** `app/constants/trainerSprites.ts`

Exports `TRAINER_SPRITE_CATALOG` and `TRAINER_SPRITE_CATEGORIES`.

```typescript
export interface TrainerSprite {
  key: string      // Showdown filename without .png (e.g., 'acetrainer')
  label: string    // Human-readable label (e.g., 'Ace Trainer')
  category: string // Category key (e.g., 'generic-male')
}

export interface TrainerSpriteCategory {
  key: string
  label: string
}

export const TRAINER_SPRITE_CATEGORIES: TrainerSpriteCategory[] = [
  { key: 'protagonists', label: 'Protagonists' },
  { key: 'gym-leaders', label: 'Gym Leaders' },
  { key: 'elite-champions', label: 'Elite Four & Champions' },
  { key: 'villains', label: 'Villains & Admins' },
  { key: 'grunts', label: 'Team Grunts' },
  { key: 'generic-male', label: 'Generic Male' },
  { key: 'generic-female', label: 'Generic Female' },
  { key: 'specialists', label: 'Specialists' },
  { key: 'other', label: 'Other' },
]

export const TRAINER_SPRITE_CATALOG: TrainerSprite[] = [
  // Protagonists
  { key: 'red', label: 'Red', category: 'protagonists' },
  { key: 'leaf', label: 'Leaf', category: 'protagonists' },
  { key: 'ethan', label: 'Ethan', category: 'protagonists' },
  { key: 'lyra', label: 'Lyra', category: 'protagonists' },
  { key: 'brendan', label: 'Brendan', category: 'protagonists' },
  { key: 'may', label: 'May', category: 'protagonists' },
  { key: 'lucas', label: 'Lucas', category: 'protagonists' },
  { key: 'dawn', label: 'Dawn', category: 'protagonists' },
  { key: 'hilbert', label: 'Hilbert', category: 'protagonists' },
  { key: 'hilda', label: 'Hilda', category: 'protagonists' },
  { key: 'nate', label: 'Nate', category: 'protagonists' },
  { key: 'rosa', label: 'Rosa', category: 'protagonists' },
  // ... (full catalog populated during implementation)

  // Gym Leaders (sample — full list during implementation)
  { key: 'brock', label: 'Brock', category: 'gym-leaders' },
  { key: 'misty', label: 'Misty', category: 'gym-leaders' },
  { key: 'erika', label: 'Erika', category: 'gym-leaders' },
  // ...

  // Generic Male trainers
  { key: 'acetrainer', label: 'Ace Trainer', category: 'generic-male' },
  { key: 'blackbelt', label: 'Black Belt', category: 'generic-male' },
  { key: 'hiker', label: 'Hiker', category: 'generic-male' },
  { key: 'youngster', label: 'Youngster', category: 'generic-male' },
  // ...

  // Generic Female trainers
  { key: 'acetrainerf', label: 'Ace Trainer (F)', category: 'generic-female' },
  { key: 'beauty', label: 'Beauty', category: 'generic-female' },
  { key: 'lass', label: 'Lass', category: 'generic-female' },
  // ...
]
```

The full catalog will contain 150-200 curated sprites (the most PTU-relevant subset of the 800+ available). During implementation, the complete list will be populated by cross-referencing the Showdown sprites directory listing against PTU trainer classes.

---

## Sprite Picker Component: `TrainerSpritePicker.vue`

**File:** `app/components/character/TrainerSpritePicker.vue`

A modal or inline panel that displays a grid of trainer sprites, organized by category, with search/filter capability.

### Props

```typescript
defineProps<{
  modelValue: string | null  // Current sprite key (v-model)
  show: boolean              // Whether the picker is visible
}>()

defineEmits<{
  'update:modelValue': [key: string | null]
  close: []
}>()
```

### Layout

```
+--------------------------------------------------+
|  Select Trainer Sprite                     [X]   |
+--------------------------------------------------+
|  [ Search sprites...                          ]  |
|                                                  |
|  [All] [Protagonists] [Gym Leaders] [Generic M]  |
|  [Elite/Champ] [Villains] [Grunts] [Generic F]   |
|  [Specialists] [Other]                            |
|                                                  |
|  +------+  +------+  +------+  +------+          |
|  | img  |  | img  |  | img  |  | img  |          |
|  | name |  | name |  | name |  | name |          |
|  +------+  +------+  +------+  +------+          |
|  +------+  +------+  +------+  +------+          |
|  | img  |  | img  |  | img  |  | img  |          |
|  | name |  | name |  | name |  | name |          |
|  +------+  +------+  +------+  +------+          |
|                                                  |
|  [Clear Selection]              [Cancel] [Select] |
+--------------------------------------------------+
```

### Behavior

1. **Category filter tabs** at the top filter the grid to show sprites from one category (or all)
2. **Search input** filters by label text (case-insensitive substring match)
3. **Grid display** shows sprite image (loaded from CDN) + label below each
4. **Selection** highlights the clicked sprite with a border/glow. The selected key is tracked in local state.
5. **Clear Selection** button sets the value to `null` (reverts to letter-initial fallback)
6. **Confirm** emits `update:modelValue` with the selected key and closes the picker
7. **Image error handling** hides broken sprites from the grid (in case a Showdown key is stale)
8. **Lazy loading** uses `loading="lazy"` on `<img>` tags since the grid may show 100+ sprites

### Styling

- Grid: CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))`
- Each cell: 80x80 sprite + label below, fixed height to maintain grid alignment
- Selected state: `border-color: $color-accent-teal` with `$shadow-glow-teal`
- Uses existing `$glass-bg`, `$glass-border` variables for the modal container
- Category tabs use existing `.tab-btn` pattern from `CharacterModal.vue`
- Sprite images use `image-rendering: pixelated` for consistency with Pokemon sprites

---

## Integration Points

Every location in the codebase where character avatars or letter-initial fallbacks currently render needs to be updated to resolve the sprite key via `useTrainerSprite()`. The rendering pattern changes from:

**Before:**
```vue
<img v-if="character.avatarUrl" :src="character.avatarUrl" />
<span v-else>{{ character.name.charAt(0) }}</span>
```

**After:**
```vue
<img v-if="resolvedAvatarUrl" :src="resolvedAvatarUrl" :alt="character.name" @error="handleAvatarError" />
<span v-else>{{ character.name.charAt(0) }}</span>
```

Where `resolvedAvatarUrl` is a computed that calls `getTrainerSpriteUrl(character.avatarUrl)`.

### Complete List of Integration Points

| # | File | Current Behavior | Change Required |
|---|------|-----------------|-----------------|
| 1 | `app/components/character/HumanCard.vue` (line 4) | `v-if="human.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. Add `@error` handler. |
| 2 | `app/components/character/CharacterModal.vue` (line 112) | `v-if="humanData.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. Add sprite picker button when `isEditing`. |
| 3 | `app/pages/gm/characters/[id].vue` (line 39) | `v-if="character.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. Add sprite picker button when `isEditing`. |
| 4 | `app/components/encounter/CombatantCard.vue` (line 16) | `v-if="avatarUrl"` uses computed that reads `avatarUrl` directly | Update computed to use `getTrainerSpriteUrl()`. |
| 5 | `app/components/encounter/PlayerCombatantCard.vue` (line 13) | `v-if="avatarUrl"` uses computed that reads `avatarUrl` directly | Update computed to use `getTrainerSpriteUrl()`. |
| 6 | `app/components/encounter/GroupCombatantCard.vue` (line 13) | `v-if="avatarUrl"` uses computed that reads `avatarUrl` directly | Update computed to use `getTrainerSpriteUrl()`. |
| 7 | `app/components/encounter/AddCombatantModal.vue` (line 82) | `v-if="human.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. |
| 8 | `app/components/encounter/GMActionModal.vue` (line 14) | Shows `displayName.charAt(0)` for humans (no avatar img at all) | Add avatar image using `getTrainerSpriteUrl()` before the initial fallback. |
| 9 | `app/components/vtt/VTTToken.vue` (line 20) | `v-if="avatarUrl"` uses computed that reads `avatarUrl` directly | Update computed to use `getTrainerSpriteUrl()`. |
| 10 | `app/components/group/PlayerLobbyView.vue` (line 16) | `v-if="player.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. |
| 11 | `app/components/group/InitiativeTracker.vue` (line 27) | Shows `name.charAt(0)` for all combatants (no avatar img) | Add avatar image for human combatants using `getTrainerSpriteUrl()`. |
| 12 | `app/components/group/CombatantDetailsPanel.vue` (line 15) | Shows `name.charAt(0)` (no avatar img) | Add avatar image for human combatants using `getTrainerSpriteUrl()`. |
| 13 | `app/components/scene/SceneCanvas.vue` (line 74) | `v-if="character.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. |
| 14 | `app/components/scene/SceneAddPanel.vue` (line 44) | `v-if="char.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. |
| 15 | `app/pages/group/_components/SceneView.vue` (line 83) | `v-if="character.avatarUrl"` renders raw URL | Use `getTrainerSpriteUrl()` to resolve key. |
| 16 | `app/pages/group/_components/LobbyView.vue` (line 31) | Has `avatarUrl` in type but may not render it | Verify and update to use `getTrainerSpriteUrl()`. |
| 17 | `app/pages/gm/create.vue` | No avatar selection in create forms | Add TrainerSpritePicker to both Quick Create and Full Create forms. |

### Sprite Picker Entry Points (Edit Triggers)

The sprite picker needs to be openable from these locations:

1. **`app/pages/gm/create.vue`** -- both Quick Create and Full Create forms get a "Choose Sprite" button near the Name field, opening the picker. The selected key is included in the create payload.
2. **`app/pages/gm/characters/[id].vue`** -- when in edit mode, clicking the avatar area opens the picker. The selected key is saved via the existing PUT endpoint.
3. **`app/components/character/CharacterModal.vue`** -- when in edit mode, clicking the avatar area opens the picker. The selected key is included in the save payload.

---

## Implementation Plan

Single phase, ordered steps:

### Step 1: Create constants file

Create `app/constants/trainerSprites.ts` with `TRAINER_SPRITE_CATEGORIES` and `TRAINER_SPRITE_CATALOG`. Populate the full catalog with 150-200 curated sprites from the Showdown trainers directory, categorized by role.

### Step 2: Create composable

Create `app/composables/useTrainerSprite.ts` with `getTrainerSpriteUrl()` and `isSpriteKey()`. This is a pure function composable with no state.

### Step 3: Create TrainerSpritePicker component

Create `app/components/character/TrainerSpritePicker.vue` with category tabs, search, grid display, selection, and clear/confirm actions.

### Step 4: Integrate picker into character creation

Add the sprite picker to `app/pages/gm/create.vue` (both Quick Create and Full Create forms). Include `avatarUrl` in the create payloads sent to the API.

### Step 5: Integrate picker into character editing

Add the sprite picker to `app/pages/gm/characters/[id].vue` (click avatar area when editing) and `app/components/character/CharacterModal.vue` (same pattern).

### Step 6: Update all avatar rendering locations

Update all 17 integration points listed above to resolve sprite keys via `getTrainerSpriteUrl()` instead of using `avatarUrl` as a raw URL. Add `@error` handlers where missing.

### Step 7: Update combatant-related components with no current avatar support

Update `GMActionModal.vue`, `InitiativeTracker.vue`, and `CombatantDetailsPanel.vue` to show trainer sprites for human combatants instead of just initials.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/constants/trainerSprites.ts` | Sprite catalog constant and category definitions |
| `app/composables/useTrainerSprite.ts` | URL resolution composable |
| `app/components/character/TrainerSpritePicker.vue` | Sprite selection modal component |

## Files to Modify

| File | Change |
|------|--------|
| `app/components/character/HumanCard.vue` | Resolve avatar via composable, add error handler |
| `app/components/character/CharacterModal.vue` | Resolve avatar via composable, add picker trigger in edit mode |
| `app/components/encounter/CombatantCard.vue` | Update `avatarUrl` computed to use composable |
| `app/components/encounter/PlayerCombatantCard.vue` | Update `avatarUrl` computed to use composable |
| `app/components/encounter/GroupCombatantCard.vue` | Update `avatarUrl` computed to use composable |
| `app/components/encounter/AddCombatantModal.vue` | Resolve avatar via composable |
| `app/components/encounter/GMActionModal.vue` | Add avatar image for human combatants |
| `app/components/vtt/VTTToken.vue` | Update `avatarUrl` computed to use composable |
| `app/components/group/PlayerLobbyView.vue` | Resolve avatar via composable |
| `app/components/group/InitiativeTracker.vue` | Add avatar for human combatants |
| `app/components/group/CombatantDetailsPanel.vue` | Add avatar for human combatants |
| `app/components/scene/SceneCanvas.vue` | Resolve avatar via composable |
| `app/components/scene/SceneAddPanel.vue` | Resolve avatar via composable |
| `app/pages/gm/characters/[id].vue` | Resolve avatar via composable, add picker trigger |
| `app/pages/gm/create.vue` | Add sprite picker to both create forms |
| `app/pages/group/_components/SceneView.vue` | Resolve avatar via composable |
| `app/pages/group/_components/LobbyView.vue` | Resolve avatar via composable |

---

## Implementation Log

(Updated as implementation progresses)

| Step | Status | Commit | Notes |
|------|--------|--------|-------|
| 1. Constants file | pending | - | - |
| 2. Composable | pending | - | - |
| 3. Picker component | pending | - | - |
| 4. Creation integration | pending | - | - |
| 5. Editing integration | pending | - | - |
| 6. Rendering updates | pending | - | - |
| 7. Missing avatar support | pending | - | - |
