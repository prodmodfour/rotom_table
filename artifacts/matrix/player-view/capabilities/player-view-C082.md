---
cap_id: player-view-C082
name: player-view-C082
type: —
domain: player-view
---

### player-view-C082
- **name:** Tab slide transitions
- **type:** component
- **location:** `app/pages/player/index.vue` — tabTransitionName, TAB_ORDER
- **game_concept:** Mobile-like swipe-direction tab transitions
- **description:** Tracks tab order (character=0, team=1, encounter=2, scene=3) and sets transition direction based on whether the new tab index is higher (slide-left) or lower (slide-right) than the previous. Creates a natural mobile-like feel when switching between tabs.
- **inputs:** activeTab watcher
- **outputs:** tabTransitionName ('tab-slide-left' | 'tab-slide-right')
- **accessible_from:** player
