The `settings` Pinia store is the only store that uses `localStorage` for persistence (key: `ptu-settings`). It stores damage mode, default grid dimensions, and default cell size.

When the store initializes on a fresh browser (no localStorage entry), it falls back to built-in defaults: `damageMode: 'rolled'`, `defaultGridWidth: 20`, `defaultGridHeight: 15`, `defaultCellSize: 40`. Every setter method auto-calls `saveSettings()` to write back to localStorage immediately.

The store guards client-only code with `import.meta.client` since Nuxt could theoretically evaluate store code in SSR context (though the app runs as a [[server-runs-as-spa-with-api-backend|SPA]]).

This local-only persistence means settings are per-browser, not per-user or per-campaign — a different browser or cleared storage resets to defaults.

## See also

- [[all-stores-use-pinia-options-api]]
- [[player-identity-persists-via-local-storage]] — another localStorage usage, managed by the player identity composable rather than a Pinia store