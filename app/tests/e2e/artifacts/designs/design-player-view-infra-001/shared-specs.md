# Shared Specifications

## Security Considerations

### Tunnel Security

| Risk | Mitigation |
|------|-----------|
| **Unauthorized access** | Cloudflare Tunnel URL is not discoverable (long random subdomain or custom domain). Share only with players. For extra security, Cloudflare Access (free tier: 50 users) can add login requirements |
| **Data exposure** | The app has no authentication -- anyone with the URL can see ALL data (all characters, all encounters). This is acceptable for a trusted friend group but unacceptable for public access |
| **HTTPS/WSS** | Cloudflare Tunnel provides automatic HTTPS and WSS. No self-signed certs. No mixed-content issues |
| **Tunnel token security** | The `cloudflared` service stores a tunnel token on the GM's machine. If compromised, an attacker could route traffic through the tunnel. Mitigation: standard OS security (locked screen, no sharing accounts) |

### Authentication (Not in Scope for Track B, but Critical Context)

The app currently has **zero authentication**. Any device that can reach the server has full access to all data and all actions (including GM actions). This is acceptable on a trusted LAN but becomes a real problem when the server is exposed via tunnel.

**Recommendation for Track C:** Implement lightweight role-based access:
- GM enters a "session code" that acts as a shared secret
- Players authenticate with the session code to get player-level access
- GM View requires a separate GM code (or is restricted to localhost)
- No user accounts, no passwords, no database -- just a runtime secret

This is NOT in Track B's scope but is a prerequisite for safely deploying the tunnel in production.

### Offline Data Security

| Risk | Mitigation |
|------|-----------|
| **IndexedDB data on shared devices** | Player data is stored in the browser's IndexedDB, unencrypted. On a shared/public device, another user could access it. Mitigation: PWA "clear data" option. In practice, players use their own phones |
| **Stale cached data** | Offline cache may contain outdated information. Mitigation: "Last synced" timestamp prominently displayed. Force-sync button |
| **Mutation replay attacks** | A malicious client could replay old mutations. Mitigation: Server validates `clientLastSync` timestamp and rejects mutations older than the server state |

### Data Exposure Scope

When a player syncs for offline use, they receive:
- Their own HumanCharacter (all fields)
- Their owned Pokemon (all fields)
- Reference data (MoveData, AbilityData, SpeciesData -- public game data, not sensitive)

They do NOT receive:
- Other players' characters or Pokemon
- Encounter state, turn order, NPC data
- GM notes, scene configurations
- Any administrative data

This scoping ensures that even if a player's device is compromised, only their own character data is exposed.

---


## Alternatives Considered and Rejected

### 1. Hosted Cloud Instance
Running the app on a VPS (DigitalOcean, Hetzner, etc.) would solve remote access permanently but:
- Monthly cost ($5-20) for a hobby tool
- Operational burden (updates, backups, monitoring, SSL renewal)
- SQLite is not designed for cloud deployment (no concurrent access from multiple server instances)
- Defeats the "run it at home" simplicity

### 2. Database Replication (CouchDB/PouchDB)
CouchDB + PouchDB would give automatic bidirectional replication, but requires migrating 14 Prisma models and 106 endpoints. Overkill -- only player data needs offline access, not the entire DB.

### 3. Tailscale as Primary Solution
Covered in the comparison matrix. Best security, worst player experience (requires app install).

### 4. WebRTC for P2P Data Sync
Peer-to-peer data sync without a server. But:
- Complex signaling server still needed
- No offline data persistence
- Unreliable through restrictive NATs
- The server already exists -- just make it reachable

### 5. Static Site Export + Git Sync
Export character data to a Git repo that players pull from. But:
- Requires Git knowledge (non-starter for casual players)
- No real-time capability
- Conflict resolution in Git is developer-level work

---


## Open Questions

1. **Domain requirement:** Does the GM already own a domain? If not, the auto-generated `*.trycloudflare.com` subdomain works but changes if the tunnel is recreated. The setup guide should cover both paths.

2. **Tailscale as fallback:** Should we document Tailscale as a secondary option for groups willing to install the app? It provides better security for sensitive campaigns.

3. **PWA scope:** Should the PWA scope cover only `/player` routes or the entire app? Recommendation: scope to `/player` only -- GM and Group views are meaningless without the server.

4. **Reference data updates:** When the GM re-seeds the database (new moves, new species), how does the PWA cache invalidate? Recommendation: version hash on reference data, service worker checks on each online load.

5. **Multi-device sync:** If a player uses the PWA on both phone and laptop, offline edits on one device could conflict with offline edits on the other. LWW with timestamps handles this correctly but the player might lose edits. Accept this limitation for P2; revisit with CRDTs if it becomes a problem.

---

