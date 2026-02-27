# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Architecture Concepts

### Tech Stack
- **Framework**: Nuxt 3 (SPA mode, `ssr: false`)
- **Backend**: Nitro server with 106 REST API endpoints
- **Database**: SQLite with Prisma ORM (`app/prisma/schema.prisma`)
- **State**: 13 Pinia stores (auto-registered via `@pinia/nuxt`)
- **Real-time**: WebSocket for GM-Group synchronization
- **Styling**: SCSS with global variables
- **Testing**: Vitest (unit) + UX exploration sessions (Playwright browser automation)

### Solid Principles
1. Single Responsibility Principle (SRP)
"A module should have one, and only one, reason to change."

In Your Nuxt Components:
Avoid "God Components" that handle UI, data fetching, and complex business logic simultaneously.

Bad: A ChatWindow.vue that fetches messages, formats timestamps, handles WebSocket connections, and renders the UI.

Good:

ChatWindow.vue: Only handles layout.

MessageList.vue: Renders the list.

useChatMessages() (Composable): Handles fetching and WebSocket sync.

utils/date.ts: Handles timestamp formatting.

In Your Nitro Backend (106 Endpoints):
With 106 endpoints, your API routes shouldn't contain business logic.

Apply SRP: Use a Service Layer.

Controller (server/api/users.get.ts): Parses the request, calls the service, returns JSON.

Service (server/services/userService.ts): Contains the actual business logic (validation, complexity).

Repository (Prisma): Only talks to the DB.

2. Open/Closed Principle (OCP)
"Software entities should be open for extension, but closed for modification."

In Your UI (SCSS & Components):
You shouldn't need to edit a reusable component's source code just to slightly change its style or content.

Mechanism: Use Slots and Props.

Example: Instead of hardcoding a "Save" button inside a Modal.vue, use a <slot name="footer" />. This allows you to insert a "Save", "Delete", or "Confirm" button without modifying the Modal.vue file itself.

In Your Nitro Server:

Mechanism: H3 Interceptors / Middleware.

If you need to add logging or authentication to your API, you shouldn't modify every single one of your 106 endpoints. Instead, you write a middleware (server/middleware/auth.ts) that extends the request handling pipeline.

3. Liskov Substitution Principle (LSP)
"Objects of a superclass shall be replaceable with objects of its subclasses without breaking the application."

In TypeScript & Prisma:
This applies when you have polymorphic data or generic services.

Scenario: You have a generic sendNotification(user) function.

Application: Whether the user is a GuestUser or a AdminUser, the function should work without crashing. You ensure this by defining shared interfaces (e.g., interface User { email: string }) in your types/ folder so that distinct Prisma models can essentially "wear the same hat."

4. Interface Segregation Principle (ISP)
"Clients should not be forced to depend upon interfaces that they do not use."

In Your Pinia Stores (13 Stores):
Don't create one massive useGlobalStore that contains everything. You are already doing this right by having 13 distinct stores.

Refinement: Be careful with "Store coupling." If Component A only needs user.preferences, don't force it to import a store that also triggers a fetch for user.orderHistory.

In Your Composables:

Bad: A composable useUserData() that returns { user, orders, settings, invoices, friends }.

Good: Break it down. useUser() and useUserOrders(). A component requesting the user profile shouldn't trigger a database query for invoices.

5. Dependency Inversion Principle (DIP)
"Depend upon abstractions, not concretions."

In Your Testing (Playwright + Vitest):
This is the most valuable principle for testing. Your components shouldn't import axios or fetch directly; they should use a wrapper or composable that can be mocked.

Scenario: Your LoginForm.vue needs to call the API.

Violation: Importing axios directly inside the component.

Application: Use a useAuth() composable.

In Dev/Prod: useAuth calls your real Nitro API.

In Vitest: You mock useAuth to return a fake success immediately, keeping your unit tests fast and independent of the backend.

### Project Structure
```
app/
├── pages/           # File-based routing (gm/, group/, player/)
├── layouts/         # Role-based layouts (gm, group, player, default)
├── components/      # 73 auto-imported components by domain
├── composables/     # 19 auto-imported composables for shared logic
├── stores/          # 13 Pinia stores for state management
├── types/           # 11 TypeScript type definition files
├── utils/           # captureRate, diceRoller, restHealing
├── constants/       # combatManeuvers, statusConditions
├── prisma/          # Schema, seeds, database
├── tests/           # Vitest (unit) + e2e artifacts (tickets, matrix, reviews)
├── server/
│   ├── api/         # REST endpoints across 10 domain categories
│   ├── services/    # Business logic (combatant, encounter, entity-update, pokemon-generator)
│   ├── routes/      # WebSocket handler (ws.ts)
│   └── utils/       # Prisma client, websocket, servedMap, wildSpawnState, pokemon-nickname
└── assets/scss/     # Global styles and variables
```

### Triple-View System
- **GM View** (`/gm`): Full control — spawn characters, edit stats, manage NPC turns, all information visible
- **Group View** (`/group`): TV/projector display — 4 tabs (lobby, scene, encounter, map) managed via `GroupViewState` singleton. Cross-tab sync via BroadcastChannel. Store: `groupViewTabs`
- **Player View** (`/player`): Individual player interface

### Data Models (14 Prisma models)
- **HumanCharacter**: Players or NPCs with stats, rest/healing tracking, linked to their Pokemon
- **Pokemon**: Separate sheets with stats, moves, abilities, origin field, linked to owning character
- **Encounter**: Three-sided combat (Players, Allies, Enemies) with initiative, VTT grid config, fog/terrain state
- **MoveData / AbilityData / SpeciesData**: Reference data for game mechanics
- **EncounterTable / EncounterTableEntry / TableModification / ModificationEntry**: Weighted spawn tables
- **EncounterTemplate**: Saved encounter setups for reuse
- **Scene**: Narrative scenes with characters, Pokemon, groups, weather, habitat link
- **GroupViewState**: Singleton tracking active tab and scene
- **AppSettings**: Damage mode, VTT defaults

### Combat Automation
- Initiative sorting: Speed + bonuses
- Turn progression with action tracking
- Set damage application (dice roller utility available for capture and future rolled mode)
- Combat stages (-6 to +6 multipliers)
- Accuracy check system (d20 vs AC with natural 1/20 handling)
- PTU maneuvers: Push, Sprint, Trip, Grapple, Intercept, Take a Breather
- Injury system with HP marker tracking (50%, 0%, -50%, -100%)
- Undo/redo system (50-snapshot history)
- Move history and effect logging
- Trainer (League) vs Full Contact battle modes with separate trainer/pokemon phases
- Capture mechanics (full PTU capture rate formula)

### Scene System
Narrative scenes linking characters, Pokemon, and groups to a location with weather. Scene-to-encounter conversion via `StartEncounterModal`. Components in `components/scene/` (7 files). APIs in `server/api/scenes/` (17 endpoints).

### VTT Grid
Full tactical grid for encounters. 11 components (`components/vtt/`), 7 composables (`useCanvasRendering`, `useCanvasDrawing`, `useGridMovement`, `useGridInteraction`, `useGridRendering`, `useTerrainPersistence`, `useRangeParser`), 5 stores (`encounterGrid`, `fogOfWar`, `terrain`, `measurement`, `selection`). Features: PTU diagonal movement (alternating 1m/2m), fog of war (3-state: hidden/revealed/explored), terrain painter (6 types with movement costs), measurement tools (distance/burst/cone/line/blast), A* pathfinding, token management.

### Encounter Tables & Templates
Weighted Pokemon spawn tables with density tiers, sub-habitat modifications, level range overrides. Encounter templates for reusable setups. JSON export/import. Stores: `encounterTables`, `encounterLibrary`. APIs in `server/api/encounter-tables/` (18 endpoints) and `server/api/encounter-templates/` (7 endpoints).

### Capture System
Full PTU capture rate calculation — base 100 adjusted by level, HP, evolution stage, status conditions (persistent vs volatile), injury/stuck/slow modifiers. Server endpoints (`/api/capture/rate`, `/api/capture/attempt`) and client composable (`useCapture`). Accuracy roll for Poke Ball throws (AC 6).

### Rest & Healing
PTU rest mechanics — 30-minute rest, extended rest (4+ hours), Pokemon Center, injury healing, new day reset. Composable: `useRestHealing`. Per-entity DB tracking (lastInjuryTime, restMinutesToday, injuriesHealedToday, drainedAp). Global new day endpoint (`/api/game/new-day`).

### Real-time Sync
WebSocket (`/ws`) handles GM-to-Group synchronization with role-based broadcasting:

**Client → Server:**
- `identify` — client identifies as gm/group/player
- `join_encounter` / `leave_encounter` — encounter room management
- `sync_request` / `tab_sync_request` — request state sync

**Broadcast events (relayed by server):**
- Combat: `turn_change`, `damage_applied`, `heal_applied`, `status_change`, `move_executed`, `combatant_added`, `combatant_removed`
- Encounter: `encounter_update`, `serve_encounter`, `encounter_unserved`
- VTT: `movement_preview`
- Scene: `scene_update`
- Player: `player_action` (group → GM only)
- Entity: `character_update` (broadcast to all)

### Sprite Sources
- Gen 5 and below: Pokemon Black 2/White 2 sprites
- Gen 6+: Latest 3D game sprites

### Icons
- **Use Phosphor Icons** instead of emojis for UI elements
- Phosphor Icons are installed at the project root level
- Import and use icon components rather than emoji characters

### Testing
- **Unit**: Vitest — `app/tests/unit/` covering composables, API, stores, components
- **UX Exploration**: Playwright browser automation via AI personas (see UX Sessions below)
- Config: `app/vitest.config.ts`

## Git & Attribution Rules

- **Never push commits as Claude** - Do not use Claude or any AI identity as the commit author
- **Never include AI attribution** - Do not add "Co-Authored-By: Claude" or similar AI attribution lines
- **No AI-generated mentions** - Do not mention that code was AI-generated in commits, comments, or documentation
- Commits should appear as if written by the human developer

## Commit Guidelines

### CRITICAL: Small, Frequent Commits

**Commit early and often. Do NOT batch multiple changes into one commit.**

- After completing ANY single logical change, commit immediately
- One file changed? Commit it
- One function added? Commit it
- One bug fixed? Commit it
- Do NOT wait until "everything is done" to commit
- Do NOT combine unrelated changes in one commit

**Examples of correct granularity:**
- `fix: correct damage calculation for steel types` (1 file)
- `refactor: extract useGridMovement composable` (2-3 files)
- `feat: add fog of war toggle button` (1 component)

**Examples of commits that are TOO LARGE:**
- "feat: add fog of war system" (10+ files - should be 3-5 commits)
- "refactor: improve encounter system" (vague, too broad)

### Other Guidelines

- **Conventional commits** - Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Descriptive messages** - Include what changed and why
- **Only commit relevant files** - Don't include unrelated changes, test artifacts, or logs
- **Don't wait to be asked** - Proactively commit after completing meaningful work

## PTU Rules Reference

The `books/markdown/` directory contains the complete PTU 1.05 ruleset. When implementing game logic, reference:
- `core/` for mechanics and rules (12 chapter files: `01-introduction.md` through `11-running-the-game.md`)
- `pokedexes/` for Pokemon stats and data (per-Pokemon files in `gen1/` through `gen8/` + `hisui/`)
- `errata-2.md` for rule corrections

## Feature Development Pattern

Use **incremental multi-tier delivery** for non-trivial features. Break the feature into priority tiers (P0/P1/P2), implement each tier separately, and run code review + rules review gates between tiers before proceeding. This pattern was proven effective in design-testability-001 (37 commits, 0 regressions, bugs caught early at each tier boundary).

**Why:** Focused review at each tier catches bugs before they propagate. P0 bugs don't infect P1/P2 code. Reviewers context-switch less. Regression testing after each tier is smaller and faster.

**Reference implementation:** `captureRate.ts` (pure calculation utility) → `damageCalculation.ts` (same pattern applied to damage).

## Design Decrees

Binding human rulings on ambiguous design decisions. Skills discover ambiguity and create `decree-need` tickets. The human runs `/address_design_decrees` to make rulings, which are recorded as decree files.

- **Decrees live in:** `decrees/decree-NNN.md` (project root)
- **Decree-need tickets:** `artifacts/tickets/open/decree/decree-need-NNN.md`
- **Authority:** Decrees override all skill-level rulings. Violations are CRITICAL severity.
- **Command:** `/address_design_decrees` — scan open decree-needs, facilitate human rulings, record decrees
- **Skills affected:** All reviewers check decrees before reviewing. Implementation Auditor uses decrees to resolve ambiguity. Developer follows decrees during implementation.

## UX Exploration Sessions

Simulated play sessions where 5 AI personas interact with the live app through real browsers (Playwright). Each persona has a fixed device, viewport, personality, and PTU knowledge level.

- **Party profiles:** `ux-sessions/party.md` (5 fixed personas: Kaelen GM, Mira/Dex/Spark/Riven players)
- **Scenarios:** `ux-sessions/scenarios/ux-session-NNN.md`
- **Reports:** `ux-sessions/reports/ux-session-NNN/`
- **Command:** `/ux_session ux-session-NNN` — orchestrates 7-slave session (5 browser + narrator + ticket creator)
- **Blocking milestones:** No dev work during UX sessions. After session, tickets are created from findings.
- **Roadmap:** ux-session-001 (basic combat) → 002 (scenes) → 003 (VTT) → 004 (capture) → 005 (comprehensive)
