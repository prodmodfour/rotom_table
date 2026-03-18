# Horizontal Layer Coupling

The app organizes code by technical layer (components, composables, stores, utils, types, constants, server/api, server/services) rather than by domain. A single domain feature spans 6+ directories.

For example, working on Pokemon switching requires touching:
- `components/encounter/` — switch UI
- `composables/useSwitching.ts` — switch modal logic
- `composables/useSwitchModalState.ts` — switch state management
- `stores/encounter.ts` — switch action proxies
- `server/api/encounters/[id]/switch.post.ts` — switch route
- `server/api/encounters/[id]/recall.post.ts` — recall route
- `server/api/encounters/[id]/release.post.ts` — release route
- `server/services/switching.service.ts` — switch validation and execution
- `types/encounter.ts` — switch-related type definitions
- `utils/` — switch-related utility functions

This is the [[shotgun-surgery-smell]] at the directory level. A domain change requires edits across many directories. Finding all related code requires knowing naming conventions or grepping. There is no structural enforcement that related code stays in sync.

The 64 composables in a single flat directory ([[composable-domain-grouping]]) are a specific symptom — domain grouping exists only as a naming convention, not as directory boundaries. The 158 components across 18 subdirectories have some domain grouping, but the boundaries are inconsistent (e.g., `components/encounter/` contains both combat and switching UI).

## See also

- [[shotgun-surgery-smell]] — the smell this exemplifies
- [[divergent-change-smell]] — layers change for multiple unrelated domain reasons
- [[composable-domain-grouping]] — informal domain classification within the flat directory
- [[single-responsibility-principle]] — layers lack domain cohesion
- [[monolithic-mechanic-integration]] — the mechanic-level consequence of horizontal organization
- [[domain-module-architecture]] — a potential restructuring to address this
- [[plugin-mechanic-architecture]] — a more radical restructuring that makes mechanics self-contained plugins
- [[kill-the-api-directory]] — a destructive proposal to collapse the 158 file-based routes into domain-scoped controllers
- [[separation-of-concerns]] — organizing by technical layer rather than by domain mixes concerns at the directory level
