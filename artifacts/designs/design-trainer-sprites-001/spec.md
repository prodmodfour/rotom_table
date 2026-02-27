# Specification

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

