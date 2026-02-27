---
cap_id: player-view-C079
name: player-view-C079
type: —
domain: player-view
---

### player-view-C079
- **name:** PlayerNavBar component
- **type:** component
- **location:** `app/components/player/PlayerNavBar.vue`
- **game_concept:** Bottom tab navigation for player view
- **description:** Fixed bottom navigation bar with 4 tabs: Character (PhUser), Team (PhPawPrint), Encounter (PhSword), Scene (PhMapPin). Shows notification badge dot on Encounter tab when there is an active encounter or pending requests, and on Scene tab when a scene is active. Active tab is highlighted with scarlet color and icon glow. Includes 4K scaling and safe-area-inset-bottom for mobile notches.
- **inputs:** activeTab, hasActiveEncounter?, hasActiveScene?, hasPendingRequests?
- **outputs:** Emits 'change' with PlayerTab value
- **accessible_from:** player
