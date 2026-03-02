# App CLAUDE.md

Context for working within the Nuxt 3 application (`app/`).

## SOLID Principles

### 1. Single Responsibility Principle (SRP)
"A module should have one, and only one, reason to change."

**In Nuxt Components:**
Avoid "God Components" that handle UI, data fetching, and complex business logic simultaneously.

Bad: A ChatWindow.vue that fetches messages, formats timestamps, handles WebSocket connections, and renders the UI.

Good:
- ChatWindow.vue: Only handles layout.
- MessageList.vue: Renders the list.
- useChatMessages() (Composable): Handles fetching and WebSocket sync.
- utils/date.ts: Handles timestamp formatting.

**In the Nitro Backend (106 Endpoints):**
API routes shouldn't contain business logic. Use a Service Layer:
- Controller (`server/api/users.get.ts`): Parses the request, calls the service, returns JSON.
- Service (`server/services/userService.ts`): Contains the actual business logic (validation, complexity).
- Repository (Prisma): Only talks to the DB.

### 2. Open/Closed Principle (OCP)
"Software entities should be open for extension, but closed for modification."

**In UI (SCSS & Components):**
Use Slots and Props. Instead of hardcoding a "Save" button inside a Modal.vue, use a `<slot name="footer" />`. This allows inserting a "Save", "Delete", or "Confirm" button without modifying Modal.vue itself.

**In the Nitro Server:**
Use H3 Interceptors / Middleware. To add logging or authentication, write a middleware (`server/middleware/auth.ts`) that extends the request handling pipeline rather than modifying every endpoint.

### 3. Liskov Substitution Principle (LSP)
"Objects of a superclass shall be replaceable with objects of its subclasses without breaking the application."

Applies to polymorphic data or generic services. Whether a `GuestUser` or `AdminUser`, a generic `sendNotification(user)` should work without crashing. Define shared interfaces (e.g., `interface User { email: string }`) in `types/` so distinct Prisma models can share the same contract.

### 4. Interface Segregation Principle (ISP)
"Clients should not be forced to depend upon interfaces that they do not use."

**In Pinia Stores:** Don't create one massive useGlobalStore. Be careful with store coupling — if Component A only needs `user.preferences`, don't force it to import a store that also triggers a fetch for `user.orderHistory`.

**In Composables:** Break down `useUserData()` returning `{ user, orders, settings, invoices, friends }` into `useUser()` and `useUserOrders()`. A component requesting the user profile shouldn't trigger a database query for invoices.

### 5. Dependency Inversion Principle (DIP)
"Depend upon abstractions, not concretions."

Components shouldn't import axios or fetch directly; use a composable that can be mocked. In Vitest, mock `useAuth()` to return a fake success immediately, keeping unit tests fast and independent of the backend.

## Triple-View System
- **GM View** (`/gm`): Full control — spawn characters, edit stats, manage NPC turns, all information visible
- **Group View** (`/group`): TV/projector display — 4 tabs (lobby, scene, encounter, map) managed via `GroupViewState` singleton. Cross-tab sync via BroadcastChannel. Store: `groupViewTabs`
- **Player View** (`/player`): Individual player interface

## Domain Systems

Detailed architecture in descendant CLAUDE.md files:
- **Combat & encounters**: See `components/encounter/CLAUDE.md` for turn lifecycle, damage flow, battle modes
- **VTT grid**: See `components/vtt/CLAUDE.md` for rendering pipeline, coordinate spaces, PTU movement rules
- **Scenes**: See `components/scene/CLAUDE.md` for scene-to-encounter conversion, deferred features
- **Stores**: See `stores/CLAUDE.md` for scope classification, undo/redo, WebSocket sync
- **Composables**: See `composables/CLAUDE.md` for domain grouping, dependency chains
- **Services**: See `server/services/CLAUDE.md` for service patterns, Pokemon generation entry point
- **Types**: See `types/CLAUDE.md` for combatant hierarchy, Prisma-derived vs hand-written

## Testing
- **Unit**: Vitest — `app/tests/unit/` covering composables, API, stores, components
- **UX Exploration**: Playwright browser automation via AI personas (see `ux-sessions/CLAUDE.md`)
- Config: `app/vitest.config.ts`
