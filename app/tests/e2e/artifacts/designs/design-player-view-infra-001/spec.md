# Specification

## Solution Comparison Matrix

### Tunnel Solutions (for Remote In-Session Access)

| Criterion | Tailscale | Cloudflare Tunnel | ngrok | Bore |
|-----------|-----------|-------------------|-------|------|
| **What it does** | Mesh VPN -- all devices join a private network | HTTP/WS tunnel through Cloudflare's edge network | HTTP/TCP tunnel through ngrok's servers | Simple open-source TCP tunnel |
| **Setup complexity** | Install app, sign in with Google/GitHub. Each player must also install Tailscale | Install `cloudflared`, run one command. Players need nothing -- just a URL | Install binary, run one command. Players just use a URL | Install binary, run one command. Free public relay at `bore.pub` available, or self-host |
| **Cost (free tier)** | Free: 3 users, 100 devices | Free: unlimited tunnels, 100k concurrent WS connections | Free: 1 tunnel, 2h session limit, 1GB/month bandwidth, interstitial warning page | Free (public relay) or self-hosted ($5-10/month VPS) |
| **Persistent URL** | Yes -- `machine-name.tailnet-name.ts.net` (Tailscale Funnel) or Tailscale IP | Yes -- custom subdomain on your Cloudflare domain, or auto-generated | No (free) / Yes ($8/month "Personal" plan) | No (unless self-hosted with fixed domain) |
| **WebSocket support** | Full (it's a VPN -- any protocol works) | Yes -- proxied natively, no config needed. Free tier: 100s idle timeout (keepalive pings required) | Yes -- supported across all plans | Yes (raw TCP) |
| **Reliability** | Excellent -- peer-to-peer with relay fallback (DERP servers). Works through CGNAT, double NAT | Excellent -- Cloudflare's global edge network. Reconnects automatically | Moderate -- free tier sessions expire after 2 hours | Depends on self-hosted relay availability |
| **Security** | WireGuard encryption. Only tailnet members can access. Zero-trust by default | HTTPS with Cloudflare SSL. Access policies available (Zero Trust). Tunnel token auth | HTTPS with ngrok SSL. Free tier has no auth. Paid tier has OAuth/IP whitelist | HMAC-based auth on relay. No HTTPS unless you add TLS yourself |
| **Player experience** | Must install Tailscale app (phone or desktop). Then access via Tailscale IP or MagicDNS name | Click a URL. Nothing to install. Works on any browser | Click a URL. Free tier shows interstitial warning page before connecting | Click a URL (if self-hosted properly) |
| **GM effort per session** | Start Tailscale (if not auto-starting) + start server | Start server. Tunnel auto-starts as system service | Start server + start ngrok. Free tier: share new URL each session | Start server + start bore client |
| **Verdict** | Best security. But requires ALL players to install Tailscale -- friction too high for casual group | **Best overall.** Zero player friction, free, persistent URL, WebSocket support, auto-HTTPS | Viable but costly for persistence. Free tier too limited (2h, interstitial) | Not viable -- no HTTPS, no persistent URLs, public relay has no SLA |

### Offline-First Approaches (for Out-of-Session Character Management)

| Criterion | Full PWA + IndexedDB | Export/Import JSON | Hosted Cloud Instance |
|-----------|---------------------|--------------------|-----------------------|
| **What it does** | Service worker caches the app shell. IndexedDB stores character data. Background sync pushes changes when server is available | Player exports character as JSON file, edits offline, imports back | Run the server on a cloud VPS (always-on) |
| **Setup complexity** | Zero for players (PWA installs from browser). Dev effort: moderate (service worker, IndexedDB layer, sync logic, conflict resolution) | Zero for players. Dev effort: minimal (JSON export/import endpoints) | High for GM (VPS setup, domain, SSL, backups). Dev effort: minimal (already deployable) |
| **Works offline** | Yes -- full character sheet viewing and editing | Partial -- player must manually export before going offline | No (requires internet, but always available) |
| **Conflict resolution** | Needed -- offline edits may conflict with GM changes. Last-write-wins with field-level versioning | Not needed -- import is explicit and player-initiated | Not needed -- single source of truth |
| **Data freshness** | Stale until sync. Player sees their last-synced state | Stale until re-export. Player must remember to export | Always fresh |
| **Cost** | Free | Free | $5-20/month VPS |
| **Verdict** | Best UX but highest dev complexity. Worth it for P2 | **Good P0 stopgap.** Simple, no new infrastructure, covers 80% of the use case | Not viable -- ongoing cost, operational burden, overkill for a hobby tool |

---


## Recommended Architecture: Hybrid (Cloudflare Tunnel + PWA)

The recommended approach combines two strategies for two distinct use cases:

### In-Session (Server Running)
**Cloudflare Tunnel** provides zero-friction remote access. Players open a URL -- no VPN app, no config. The GM starts the server; the tunnel auto-starts as a system service. WebSocket combat sync works natively through Cloudflare.

### Out-of-Session (Server Off)
**Progressive Web App with offline caching** lets players view and edit character sheets without the server. Data syncs automatically when the server becomes available (next session start). For the initial implementation, a simpler **JSON export/import** approach serves as a stopgap.

### Why Not Tailscale?
Tailscale is technically superior (WireGuard encryption, peer-to-peer, mesh network). But it requires **every player** to install the Tailscale app and create an account. For a casual tabletop group, this friction is too high. Cloudflare Tunnel requires **nothing** from players -- they just open a URL.

### Why Not ngrok?
ngrok's free tier is too restrictive: 2-hour session limits, 1GB bandwidth cap, interstitial warning pages, and ephemeral URLs. A typical PTU session runs 3-5 hours. The paid tier ($8/month) solves these issues but Cloudflare Tunnel offers the same features for free.

### Why Not a Hosted Instance?
Running on a cloud VPS adds ongoing cost ($5-20/month), operational complexity (backups, updates, monitoring), and defeats the purpose of a simple local tool. The GM's machine IS the server -- the tunnel just makes it reachable.

---


## In-Session Architecture

### Network Topology

```
[Player Phone/Laptop]                [GM's Machine]
        |                                  |
        | HTTPS/WSS                        | localhost:3000
        v                                  v
[Cloudflare Edge] <-- tunnel --> [cloudflared daemon] --> [Nitro Server]
        |                                                      |
        | (also works for LAN)                                 v
        v                                                [SQLite DB]
[Group View TV]
```

### Connection Flow

1. **GM starts session:** Runs `npm run dev` (or production build). `cloudflared` is already running as a system service, auto-tunneling port 3000.
2. **Player connects:** Opens `https://ptu.gm-domain.example.com` (or the auto-generated `*.trycloudflare.com` subdomain). Cloudflare routes the request through the tunnel to the GM's machine.
3. **WebSocket upgrade:** Player's browser negotiates `wss://` connection. Cloudflare proxies the WebSocket through the tunnel transparently. The Nitro WebSocket handler at `/ws` receives it as a normal connection.
4. **LAN fallback:** Players on the same LAN can still use `http://<gm-local-ip>:3000` directly. No tunnel overhead.

### WebSocket Through Tunnel

The existing WebSocket implementation (`app/server/routes/ws.ts` and `app/composables/useWebSocket.ts`) already constructs the WS URL dynamically from `window.location`:

```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const wsUrl = `${protocol}//${window.location.host}/ws`
```

This means:
- Through Cloudflare Tunnel: `wss://ptu.example.com/ws` (auto-HTTPS)
- On LAN: `ws://192.168.1.50:3000/ws`

No code changes needed for WebSocket connectivity through the tunnel. Cloudflare natively proxies WebSocket connections. The free tier enforces a 100-second idle timeout (connection drops if no data flows for 100s), so the server must send periodic keepalive pings to maintain connections during combat pauses. The current `useWebSocket.ts` does not send keepalive pings -- this must be added in P1.

### Reconnection Behavior

The current `useWebSocket` composable has exponential backoff reconnection (up to 5 attempts, max 30s delay). This is adequate for tunnel-based connections, which may experience brief disconnects during Cloudflare edge re-routing. No changes needed for P0.

For P1, the reconnection strategy should be enhanced:
- Add WebSocket keepalive pings (every 30-60s) to prevent Cloudflare's 100-second idle timeout during combat pauses
- Increase `MAX_RECONNECT_ATTEMPTS` for tunnel connections (tunnel recovery can take 10-30s)
- Add a "connection lost" banner in the Player View UI
- Distinguish between "server unreachable" and "tunnel down" errors

---


## Out-of-Session Architecture

### P0: JSON Export/Import (Stopgap)

The simplest approach for out-of-session character management. No new infrastructure needed.

**Flow:**
1. During a session (or when the server is running), the player navigates to their character sheet in the Player View
2. Player taps "Export Character" -- downloads a JSON file containing their HumanCharacter + all owned Pokemon
3. Between sessions, player can view the JSON (read-only, or through a standalone viewer page)
4. Next session, player taps "Import Character" to push any offline changes back

**Limitations:**
- Manual process -- player must remember to export
- No offline editing UI (just raw data)
- Import conflicts must be handled (what if GM changed stats during session?)

**Why it works for P0:**
- Between-session character management is mostly **read-only** (reviewing stats, planning)
- Actual stat changes (leveling up) typically happen at the table with GM guidance
- The tunnel solves the "I need to check my character's moves" case -- player can access the server whenever the GM runs it, even briefly

### P1: Cloudflare Tunnel Auto-Start

Reduce GM friction to near-zero:
1. `cloudflared` runs as a system service (auto-starts on boot)
2. The PTU server starts via a desktop shortcut or system service
3. Players bookmark the stable tunnel URL
4. When GM turns on their computer, the server + tunnel are available automatically

This covers "I want to check my character between sessions" for most cases -- the GM's computer just needs to be on (which it likely is during evening hours).

### P2: PWA with Offline Cache + Background Sync

Full offline-first experience for players:

**Architecture:**

```
[Player's Browser]
      |
      v
[Service Worker] --> [IndexedDB Cache]
      |                     |
      | (when online)       | (when offline)
      v                     v
[Nitro API]           [Cached Character Data]
      |
      v
[SQLite DB]
```

**Components:**

1. **Service Worker (via `@vite-pwa/nuxt`)**
   - Caches the app shell (HTML, JS, CSS, images) for offline access
   - Intercepts API requests: serve from cache when offline, sync when online
   - Registers for Background Sync to push queued changes

2. **IndexedDB Storage Layer**
   - Stores player's character data (HumanCharacter + owned Pokemon) locally
   - Versioned records with `lastSyncedAt` timestamp
   - Stores a queue of pending mutations (changes made while offline)

3. **Sync Service (`composables/useOfflineSync.ts`)**
   - On connection: pull latest server state, merge with local changes
   - On mutation (offline): queue the change in IndexedDB
   - On reconnection: replay queued mutations against the server

4. **Conflict Resolution (see dedicated section below)**

---


## Data Sync Model

### What Data Needs to Sync

Players only need their own data. The sync scope per player is:

| Data | Direction | Size Estimate | Frequency |
|------|-----------|--------------|-----------|
| HumanCharacter (own) | Bidirectional | ~2 KB | Every session + between-session edits |
| Pokemon (owned, ~6 active) | Bidirectional | ~3 KB each, ~18 KB total | Every session + between-session edits |
| MoveData (reference) | Server -> Client only | ~200 KB (all moves) | Rarely changes (seed data) |
| AbilityData (reference) | Server -> Client only | ~50 KB | Rarely changes |
| SpeciesData (reference) | Server -> Client only | ~500 KB | Rarely changes |

Total sync payload per player: **~20 KB mutable + ~750 KB reference (cached once)**

### Sync Protocol

```
Player opens app (online):
  1. Service worker serves cached app shell immediately
  2. Composable checks for pending offline mutations in IndexedDB
  3. If pending mutations exist:
     a. Pull current server state for affected entities
     b. Run conflict resolution (see below)
     c. Push resolved mutations to server
     d. Update local cache with server response
  4. If no pending mutations:
     a. Pull fresh character + Pokemon data from server
     b. Update IndexedDB cache

Player opens app (offline):
  1. Service worker serves cached app shell
  2. Composable loads character data from IndexedDB
  3. Player views/edits data -- all changes queued in IndexedDB
  4. "Offline" indicator shown in UI
  5. When connectivity returns: Background Sync triggers step 2-3 from online flow
```

### Sync Endpoints (New)

```
GET  /api/player/sync/:characterId
  Returns: { character: HumanCharacter, pokemon: Pokemon[], lastModified: ISO8601 }

POST /api/player/sync/:characterId
  Body: { mutations: Mutation[], clientLastSync: ISO8601 }
  Returns: { resolved: ResolvedState, conflicts: Conflict[] }
```

### What Players Can Edit Offline

| Field Category | Editable Offline? | Rationale |
|---------------|-------------------|-----------|
| Character background, personality, goals | Yes | Flavor text, no mechanical impact |
| Character notes | Yes | Personal notes |
| Pokemon nicknames | Yes | No mechanical impact |
| Pokemon held items | Yes | Planning for next session |
| Pokemon move order/selection (from known moves) | Yes | Move management |
| Character stats (HP, Attack, etc.) | **No** | Stat changes require GM context (leveling, items) |
| Pokemon stats | **No** | Same -- requires GM oversight |
| Pokemon moves (learning new moves) | **No** | Requires level-up process with GM |
| Equipment changes | **No** | Equipment affects stats, needs GM |
| Money/inventory | **No** | Economy is GM-controlled |

This is a conservative scope. The principle: **if it affects combat mechanics, it requires the server (and implicitly, GM oversight).** Flavor and planning edits are safe for offline.

---


## Conflict Resolution

### When Conflicts Happen

A conflict occurs when:
1. Player goes offline, edits their character's `background` field
2. While offline, the GM (at a different session or via admin) also edits that character's `background`
3. Player comes back online, sync detects both sides changed the same field

### Resolution Strategy: Last-Write-Wins with Field-Level Granularity

**Why LWW (Last-Write-Wins):**
- Simple to implement and reason about
- The data model is not collaborative (one player per character, one GM as admin)
- Conflicts are rare (GM almost never edits player flavor text; players almost never edit stats)
- Field-level granularity prevents false conflicts (changing `background` does not conflict with changing `notes`)

**Algorithm:**

```typescript
interface SyncMutation {
  entityType: 'character' | 'pokemon'
  entityId: string
  field: string
  oldValue: unknown    // value when player started editing
  newValue: unknown    // player's new value
  timestamp: string    // ISO8601 when mutation was made
}

function resolveConflict(
  mutation: SyncMutation,
  serverState: Record<string, unknown>,
  serverLastModified: string
): 'apply' | 'reject' | 'conflict' {
  const serverValue = serverState[mutation.field]

  // No conflict: server value hasn't changed since player's snapshot
  if (serverValue === mutation.oldValue) {
    return 'apply'
  }

  // Server changed, player also changed: real conflict
  // LWW: compare timestamps
  if (new Date(mutation.timestamp) > new Date(serverLastModified)) {
    return 'apply'  // Player's edit is newer
  }

  return 'conflict' // Server's edit is newer -- notify player
}
```

**Conflict Notification:**
When a conflict is detected and the server version wins, the player sees a toast notification: "Your changes to [field] were overwritten by a newer version from the GM. Your version: [value]. Current version: [server value]."

Players cannot force-overwrite GM changes. This maintains GM authority over game state.

---


## GM Setup Guide

### P0: LAN-Only (No Setup Required)

Players on the same WiFi network connect to `http://<gm-ip>:3000`. This already works.

### P1: Cloudflare Tunnel (One-Time Setup, ~15 minutes)

**Prerequisites:**
- Free Cloudflare account (sign up at cloudflare.com)
- Own a domain name (optional -- Cloudflare provides auto-generated subdomains)

**Steps:**

1. **Create a Cloudflare account** at [cloudflare.com](https://cloudflare.com)
2. **Go to Zero Trust > Networks > Tunnels** in the Cloudflare dashboard
3. **Click "Create a tunnel"**, name it (e.g., "PTU Session Helper")
4. **Copy the installation command** shown in the dashboard
5. **Paste and run it** in a terminal on the GM's machine -- this installs `cloudflared` and registers it as a system service
6. **Configure the tunnel route**: set the hostname (e.g., `ptu.yourdomain.com` or accept the auto-generated subdomain) and point it to `http://localhost:3000`
7. **Done.** Share the URL with players. The tunnel auto-starts on boot.

**Per-Session Effort:** Zero (if GM's computer is on and the server is running).

**Future enhancement (P1):** A "Start Session" button in the GM View that shows the tunnel URL and a QR code for players to scan.

### P2: PWA (No GM Setup)

Players install the PWA from their browser (prompted automatically by the service worker). No GM action needed beyond the P1 tunnel setup.

---


## Phase Plan

### P0: LAN-Only Improvements + Export/Import

**Goal:** Make the existing LAN setup work better. Add basic data portability.

**Scope:**
- Player identity system (character picker with localStorage persistence) -- **Track A dependency**
- JSON export endpoint: `GET /api/player/export/:characterId` returns character + Pokemon as JSON
- JSON import endpoint: `POST /api/player/import/:characterId` accepts and merges exported JSON
- Export/Import UI buttons in the Player View character sheet
- Server address display in GM View (show LAN IP + port for players to connect)

**Files to Create:**
- `app/server/api/player/export/[characterId].get.ts` -- export endpoint
- `app/server/api/player/import/[characterId].post.ts` -- import endpoint

**Files to Modify:**
- Player View pages (Track A delivers these; P0 infra adds export/import buttons)
- GM View dashboard (add server address display)

**Effort:** Small (2-3 days)

### P1: Cloudflare Tunnel Integration

**Goal:** One-click remote access for players. Stable URL. Auto-start.

**Scope:**
- Documentation/script for GM to set up Cloudflare Tunnel (one-time)
- Tunnel URL configuration in app settings (`AppSettings` model)
- "Session URL" display in GM View with QR code generation
- Connection status indicator in Player View (LAN vs tunnel, latency)
- Enhanced WebSocket reconnection for tunnel connections (longer timeouts, connection-lost banner)
- WebSocket keepalive pings (every 30-60s) to prevent Cloudflare's 100-second idle timeout
- `nuxt.config.ts` adjustments for tunnel-friendly CORS and WebSocket proxy

**Files to Create:**
- `app/server/api/settings/tunnel.get.ts` -- get tunnel URL config
- `app/server/api/settings/tunnel.put.ts` -- save tunnel URL config
- `app/components/gm/SessionUrlDisplay.vue` -- QR code + URL display
- `app/components/player/ConnectionStatus.vue` -- connection indicator
- `scripts/setup-tunnel.sh` -- helper script for tunnel setup (optional)
- `docs/REMOTE_ACCESS_SETUP.md` -- GM setup guide

**Files to Modify:**
- `app/prisma/schema.prisma` -- add `tunnelUrl` to `AppSettings`
- `app/composables/useWebSocket.ts` -- enhanced reconnection for tunnel
- `app/nuxt.config.ts` -- CORS and proxy configuration for tunnel

**Effort:** Medium (4-5 days)

### P2: PWA + Offline Support

**Goal:** Players can view and edit (limited) character data without the server running.

**Scope:**
- PWA module integration (`@vite-pwa/nuxt`)
- Service worker with app shell caching (Workbox precache)
- IndexedDB storage layer for character/Pokemon data
- Offline sync composable with mutation queue
- Background Sync for pushing offline changes
- Sync endpoints (`GET/POST /api/player/sync/:characterId`)
- Conflict resolution with LWW + field-level granularity
- Offline indicator in Player View UI
- Reference data caching (MoveData, AbilityData, SpeciesData)
- "Last synced" timestamp display

**Files to Create:**
- `app/composables/useOfflineSync.ts` -- sync orchestrator
- `app/composables/useIndexedDB.ts` -- IndexedDB wrapper (or use `idb` library)
- `app/server/api/player/sync/[characterId].get.ts` -- pull sync endpoint
- `app/server/api/player/sync/[characterId].post.ts` -- push sync endpoint
- `app/utils/conflictResolution.ts` -- LWW conflict resolver
- `app/components/player/OfflineIndicator.vue` -- offline/syncing status
- `app/components/player/SyncConflictToast.vue` -- conflict notification
- `app/types/sync.ts` -- SyncMutation, Conflict, SyncState types

**Files to Modify:**
- `app/nuxt.config.ts` -- add `@vite-pwa/nuxt` module, PWA config
- `app/package.json` -- add `@vite-pwa/nuxt`, `idb` dependencies
- Player View character sheet pages -- integrate offline data source
- `app/composables/useWebSocket.ts` -- integrate with sync lifecycle

**Effort:** Large (8-10 days)

**Dependency:** P2 depends on Track A delivering the Player View character sheet UI. Offline caching is meaningless without a UI to display the cached data.

---


## Technical Deep Dive: Cloudflare Tunnel + Nuxt 3 SPA

### Why Cloudflare Tunnel Works Well Here

1. **SPA mode (`ssr: false`)**: The entire frontend is static files served by Nitro. Cloudflare's edge caches static assets aggressively, making the initial page load fast even through a tunnel.

2. **API calls are standard HTTP**: All 106 REST endpoints use standard `GET/POST/PUT/DELETE`. Cloudflare proxies these transparently.

3. **WebSocket is a single upgrade**: The `/ws` endpoint uses standard WebSocket upgrade. Cloudflare supports this natively on the free tier with up to 100,000 concurrent connections. Connections have a 100-second idle timeout, so keepalive pings (every 30-60s) are required to maintain long-lived connections during sessions.

4. **No SSR complications**: Since there is no server-side rendering, there are no issues with Cloudflare caching dynamic HTML or interfering with SSR hydration.

### Configuration Changes for Tunnel

```typescript
// nuxt.config.ts additions for tunnel support
export default defineNuxtConfig({
  // ... existing config ...

  nitro: {
    experimental: {
      websocket: true
    },
    // Allow connections from Cloudflare tunnel
    routeRules: {
      '/ws': {
        // WebSocket routes should not be cached
        headers: { 'Cache-Control': 'no-store' }
      }
    }
  },

  // Vite dev server needs to accept connections from tunnel hostname
  vite: {
    server: {
      hmr: {
        // In development with tunnel, HMR needs explicit client config
        // (not needed in production build)
        clientPort: 443,
        protocol: 'wss'
      }
    }
  }
})
```

### `cloudflared` Configuration

```yaml
# ~/.cloudflared/config.yml (created during dashboard setup)
tunnel: <tunnel-id>
credentials-file: /home/gm/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: ptu.example.com
    service: http://localhost:3000
  - service: http_status:404
```

### Quick Tunnel (Development/Testing)

For quick testing without domain setup:

```bash
cloudflared tunnel --url http://localhost:3000
```

This generates a random `*.trycloudflare.com` URL immediately. Useful for:
- Testing the tunnel setup before committing to a domain
- One-off remote sessions where URL persistence doesn't matter
- GM wants to let a remote player join without prior setup

---


## Technical Deep Dive: PWA Architecture

### Module Configuration

```typescript
// nuxt.config.ts PWA additions (P2)
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'  // Add PWA module
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'PTU Session Helper - Player',
      short_name: 'PTU Player',
      description: 'Pokemon Tabletop United player interface',
      theme_color: '#1a1a2e',
      background_color: '#1a1a2e',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/player',
      scope: '/player',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      // Cache app shell
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      // Runtime caching for API routes
      runtimeCaching: [
        {
          // Cache reference data (moves, abilities, species) -- stale-while-revalidate
          urlPattern: /^\/api\/(moves|abilities|species)/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'ptu-reference-data',
            expiration: { maxAgeSeconds: 7 * 24 * 60 * 60 } // 7 days
          }
        },
        {
          // Player's own data -- network-first with fallback to cache
          urlPattern: /^\/api\/player\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'ptu-player-data',
            networkTimeoutSeconds: 3
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600 // Check for app updates every hour
    }
  }
})
```

### IndexedDB Schema

```typescript
// types/sync.ts

interface SyncMutation {
  id: string                    // UUID
  entityType: 'character' | 'pokemon'
  entityId: string
  field: string
  oldValue: unknown
  newValue: unknown
  timestamp: string             // ISO8601
  status: 'pending' | 'synced' | 'conflicted'
}

interface CachedEntity {
  id: string
  entityType: 'character' | 'pokemon'
  data: Record<string, unknown>
  lastSyncedAt: string          // ISO8601
  lastModifiedLocally: string | null
}

interface SyncState {
  characterId: string
  lastSuccessfulSync: string    // ISO8601
  pendingMutations: number
  isOnline: boolean
  isSyncing: boolean
}

// IndexedDB stores:
// 'entities' -- CachedEntity records (character + pokemon)
// 'mutations' -- SyncMutation queue
// 'reference' -- MoveData, AbilityData, SpeciesData (read-only cache)
// 'syncState' -- SyncState metadata
```

### Offline Sync Composable

```typescript
// composables/useOfflineSync.ts (P2 -- high-level sketch)

export function useOfflineSync(characterId: Ref<string | null>) {
  const isOnline = useOnline()       // from @vueuse/core or manual
  const isSyncing = ref(false)
  const pendingCount = ref(0)
  const lastSynced = ref<string | null>(null)
  const conflicts = ref<SyncConflict[]>([])

  // Pull fresh data from server (or serve from IndexedDB if offline)
  async function loadCharacterData(): Promise<CharacterWithPokemon | null> { /* ... */ }

  // Queue a mutation (works offline)
  async function mutate(mutation: Omit<SyncMutation, 'id' | 'status' | 'timestamp'>): Promise<void> { /* ... */ }

  // Sync pending mutations with server
  async function sync(): Promise<SyncResult> { /* ... */ }

  // Watch online status and auto-sync
  watch(isOnline, (online) => {
    if (online && pendingCount.value > 0) {
      sync()
    }
  })

  return {
    isOnline: readonly(isOnline),
    isSyncing: readonly(isSyncing),
    pendingCount: readonly(pendingCount),
    lastSynced: readonly(lastSynced),
    conflicts: readonly(conflicts),
    loadCharacterData,
    mutate,
    sync
  }
}
```

---

