---
review_id: code-review-139
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-003
domain: player-view
commits_reviewed:
  - 7dc6b2a
  - 1b747fc
  - 9323b32
  - 1684b4b
  - 24c0986
  - 2817204
  - 503ede6
  - ea9e960
  - 27891ee
  - 03853b2
  - 0706de5
files_reviewed:
  - app/stores/playerIdentity.ts
  - app/composables/usePlayerIdentity.ts
  - app/server/api/characters/[id]/player-view.get.ts
  - app/components/player/PlayerIdentityPicker.vue
  - app/components/player/PlayerNavBar.vue
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/player/PlayerPokemonTeam.vue
  - app/components/player/PlayerPokemonCard.vue
  - app/components/player/PlayerMoveList.vue
  - app/components/player/PlayerEncounterView.vue
  - app/components/player/PlayerCombatantInfo.vue
  - app/pages/player/index.vue
  - app/layouts/player.vue
  - app/server/utils/websocket.ts
  - app/server/routes/ws.ts
  - app/composables/useWebSocket.ts
  - app/types/api.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 4
reviewed_at: 2026-02-23T09:30:00Z
follows_up: (none -- first review)
---

## Review Scope

Review of feature-003 P0 Track A: Player View core implementation. 11 commits (7dc6b2a..0706de5) adding player identity (character picker with localStorage persistence), read-only character sheet, Pokemon team management, basic encounter view with information visibility rules, WebSocket player role, and bottom tab navigation. 11 new files + 6 modified files.

Focus areas: mobile-first architecture, component boundaries (props/emits), store design (ISP compliance), WebSocket protocol changes, file sizes, error handling, API endpoint design.

## Issues

### CRITICAL

#### C1: Player view does not refresh character data on WebSocket `character_update` events

**Files:** `app/pages/player/index.vue`

The design spec (Section 1.4) explicitly states that `refreshCharacterData()` should be called on WebSocket `character_update` events. The implementation does not wire this up. The `useWebSocket` composable's `onMessage` callback mechanism exists and is available, but the player page never registers a listener for `character_update` messages.

**Impact:** When the GM modifies the player's character (applies damage, changes stats, adds/removes status conditions, modifies inventory, heals, etc.), the player view will show stale data until the player manually refreshes the browser. This is the primary real-time sync mechanism for the player view -- without it, the character sheet and Pokemon team tabs are effectively static after initial load. This completely undermines the "real-time sync" acceptance criterion.

The `character_update` handler in `useWebSocket.ts` currently updates the `libraryStore`, but the player view uses the `playerIdentityStore` which is a completely separate store. Even if the library store updates, the player view won't react.

**Fix:** In `onMounted` of `pages/player/index.vue`, register a WebSocket message listener:

```typescript
const removeListener = onMessage((message) => {
  if (message.type === 'character_update' && playerStore.characterId) {
    // Check if the updated entity belongs to this player
    const data = message.data as any
    if (data.id === playerStore.characterId || playerStore.pokemonIds.includes(data.id)) {
      refreshCharacterData()
    }
  }
})

onUnmounted(() => {
  removeListener()
})
```

---

### HIGH

#### H1: Type badge SCSS duplicated across 3 components (~60 lines x 3)

**Files:** `PlayerPokemonCard.vue`, `PlayerMoveList.vue`, `PlayerCombatantInfo.vue`

The 18-line `.type--*` color block (normal, fire, water, electric, etc.) is copy-pasted identically in three separate component `<style scoped>` blocks. Additionally, `.stat-cell`, `.hp-bar-track`, `.hp-bar-fill`, and `.status-badge` styles are duplicated across `PlayerCharacterSheet.vue`, `PlayerPokemonCard.vue`, and `PlayerCombatantInfo.vue`.

The design spec planned a `app/assets/scss/components/_player-view.scss` file for shared styles, but it was not created. All scoped duplication is currently embedded in individual components.

**Impact:** Every future type color change or HP bar style update must be applied in 3 places. This is a maintenance burden that will compound as P1 adds more components (`PlayerCombatActions.vue`, `PlayerCombatantCard.vue`). The 18 type colors alone account for ~54 lines of pure duplication.

**Fix:** Create `app/assets/scss/components/_player-view.scss` with the shared styles (type badges, stat cells, HP bar, status badges). Import or use as global utility classes. Components reference the shared classes instead of re-declaring them.

---

#### H2: `PlayerCharacterSheet.vue` does not account for equipment evasion bonuses

**File:** `app/components/player/PlayerCharacterSheet.vue`, lines 248-256

The evasion calculation calls `calculateEvasion(baseStat, stage)` with only 2 arguments, but the `calculateEvasion` function accepts 4 parameters: `(baseStat, combatStage, evasionBonus, statBonus)`. The `evasionBonus` parameter corresponds to equipment-granted evasion (e.g., Light Shield = +2 evasion). The player sheet ignores this entirely.

```typescript
// Current (lines 248-256):
const physEvasion = computed(() =>
  calculateEvasion(props.character.stats.defense, props.character.stageModifiers.defense ?? 0)
)
```

The GM view likely accounts for equipment bonuses when calculating evasion. Showing different evasion values on the player view vs GM view will cause confusion during play.

**Severity note:** This is a code correctness issue, not a PTU rules question. The function signature already supports equipment bonuses -- they are just not passed through. Whether the equipment data is structured correctly for extraction is the follow-up question, but the omission of available parameters is the bug.

**Fix:** Extract the `evasionBonus` from the character's equipped items (if a shield or armor with `evasionBonus` is equipped) and pass it as the third argument. Check how the GM view calculates evasion and match the logic.

---

#### H3: Encounter polling continues silently on failure without backoff

**File:** `app/pages/player/index.vue`, lines 112-133

The `checkForActiveEncounter` function has a bare `catch {}` that silently swallows all errors. When the server is unreachable, the 3-second polling continues hammering the endpoint indefinitely with no backoff. This is particularly problematic for mobile devices on unreliable networks -- it will drain battery and generate noise in server logs.

```typescript
const checkForActiveEncounter = async () => {
  try {
    // ...
  } catch {
    // Silently continue polling  <-- no backoff, no error state, no retry limit
  }
}
```

**Fix:** Add a consecutive failure counter. After N consecutive failures (e.g., 5), either stop polling and show an error state, or exponentially back off the interval (3s -> 6s -> 12s -> cap at 30s). Reset the counter on success.

---

### MEDIUM

#### M1: `PlayerTab` type exported from a Vue component's `<script setup>` block

**File:** `app/components/player/PlayerNavBar.vue`, line 24

```typescript
export type PlayerTab = 'character' | 'team' | 'encounter'
```

This type is then imported in `pages/player/index.vue` line 70:

```typescript
import type { PlayerTab } from '~/components/player/PlayerNavBar.vue'
```

Exporting types from Vue SFC `<script setup>` blocks works but is fragile and unconventional. The recommended pattern in this project is to define shared types in `app/types/`. This type will also be needed by P1's `PlayerCombatActions.vue` for tab switching on turn notification.

**Fix:** Move `PlayerTab` to `app/types/player.ts` (or add to an existing types file). Import from there in both the component and the page.

---

#### M2: No `aria-label` on the "Switch Character" button

**File:** `app/pages/player/index.vue`, line 20-22

```html
<button class="player-top-bar__switch" @click="handleSwitchCharacter">
  <PhSwap :size="18" />
</button>
```

This icon-only button has no `aria-label`, making it invisible to screen readers. The design spec's P2 acceptance criteria include "aria-labels on all interactive elements," but P0 should establish the pattern since it is trivial to add now.

**Fix:** Add `aria-label="Switch character"` to the button.

---

#### M3: `alert()` used for error handling on character selection

**File:** `app/pages/player/index.vue`, line 151

```typescript
alert('Failed to select character: ' + (err.message || 'Unknown error'))
```

Using the browser's native `alert()` dialog is jarring on mobile, blocks the UI thread, and is inconsistent with the error handling pattern used elsewhere in the component (the `player-error` div with retry button). This should use the same error state mechanism.

**Fix:** Set an error ref and display it inline, or use a toast/notification pattern. Do not use `alert()`.

---

#### M4: `padding-bottom: 72px` hardcoded in 3 components for bottom nav clearance

**Files:** `PlayerCharacterSheet.vue` (line 284), `PlayerPokemonTeam.vue` (line 31), `PlayerEncounterView.vue` (line 112)

```scss
padding-bottom: 72px; // Clear bottom nav
```

The bottom nav is `56px` high + `env(safe-area-inset-bottom)`. The hardcoded `72px` accounts for the nav height plus some buffer, but if the nav height changes, all three files must be updated. This should be a SCSS variable or CSS custom property set once, especially since `safe-area-inset-bottom` can vary by device.

**Fix:** Define a `$player-nav-clearance` variable (or CSS custom property `--player-nav-height`) and reference it in all three components. Calculate it based on the actual nav height + padding.

---

## What Looks Good

1. **Clean ISP compliance.** The `playerIdentityStore` is correctly separated from the encounter store. Components that need identity data do not pull in encounter state, and vice versa. The composable (`usePlayerIdentity`) wraps the store with localStorage persistence and data fetching without leaking store internals.

2. **Component boundaries are well-defined.** Props flow down, emits flow up. `PlayerIdentityPicker` emits `select` rather than mutating state directly. `PlayerNavBar` emits `change` with the tab ID. `PlayerEncounterView` and `PlayerCombatantInfo` receive ownership identifiers as props rather than importing the identity store directly -- this makes them testable and reusable.

3. **Visibility rules are correctly implemented.** `PlayerCombatantInfo.vue` computes visibility based on entity ownership and combat side, matching the design spec's Section 5.1 table exactly. Enemies see HP percentage only, allies see exact HP + injuries, own entities see everything. Status conditions are always visible (correct per PTU -- visible effects).

4. **Mobile-first layout is solid.** The bottom nav uses `env(safe-area-inset-bottom)` for notch devices. Touch targets meet the 48px minimum. The sticky top bar with backdrop blur is a standard mobile pattern. Stats grids degrade to 2-column on 320px screens. Text overflow is handled with ellipsis throughout.

5. **WebSocket protocol changes are minimal and backward-compatible.** The `ClientInfo` type addition of `'player'` role and `characterId` field does not break existing GM/group connections. The `identify` handler gracefully handles the new fields. The `player_action` forwarding correctly filters by role AND encounter ID.

6. **File sizes are all well within limits.** The largest file is `PlayerCharacterSheet.vue` at 657 lines (mostly SCSS), well under the 800-line cap. All other files are under 500 lines. Good component decomposition -- `PlayerPokemonTeam` delegates to `PlayerPokemonCard` which delegates to `PlayerMoveList`.

7. **API endpoint design is clean.** The `/api/characters/:id/player-view` endpoint reuses the existing `serializeCharacter` utility, returns a clear `{ character, pokemon }` shape, and has proper error handling with HTTP status codes. The separation of character data from Pokemon array in the response is a good pattern for the player view.

8. **Cleanup is handled.** The poll interval is cleared in `onUnmounted`. The WebSocket reconnection watcher re-identifies and re-joins encounters correctly.

9. **Commit granularity is appropriate.** 11 commits for 11 new files + 6 modifications, each commit focused on a single logical unit (store, composable, API endpoint, component, page rewrite, docs).

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue (missing `character_update` WebSocket listener -- the player view will show stale data after any GM action) and three HIGH issues (SCSS duplication creating maintenance burden for P1, missing evasion bonus passthrough, and no polling backoff on failure) must be addressed before proceeding to P1.

## Required Changes

| ID | Severity | Summary | File(s) |
|----|----------|---------|---------|
| C1 | CRITICAL | Wire `character_update` WebSocket listener to call `refreshCharacterData()` | `app/pages/player/index.vue` |
| H1 | HIGH | Extract duplicated SCSS (type badges, stat cells, HP bar, status badges) to shared file | `PlayerPokemonCard.vue`, `PlayerMoveList.vue`, `PlayerCombatantInfo.vue`, `PlayerCharacterSheet.vue`, new `_player-view.scss` |
| H2 | HIGH | Pass equipment evasion bonus to `calculateEvasion()` in character sheet | `app/components/player/PlayerCharacterSheet.vue` |
| H3 | HIGH | Add failure backoff or retry limit to encounter polling | `app/pages/player/index.vue` |
| M1 | MEDIUM | Move `PlayerTab` type to `app/types/` instead of exporting from SFC | `PlayerNavBar.vue`, `pages/player/index.vue` |
| M2 | MEDIUM | Add `aria-label` to icon-only Switch Character button | `app/pages/player/index.vue` |
| M3 | MEDIUM | Replace `alert()` with inline error display for character selection failures | `app/pages/player/index.vue` |
| M4 | MEDIUM | Extract hardcoded `72px` bottom nav clearance to SCSS variable | `PlayerCharacterSheet.vue`, `PlayerPokemonTeam.vue`, `PlayerEncounterView.vue` |
