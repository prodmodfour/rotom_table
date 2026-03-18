# Grid Config Type

`GridConfig` in `types/spatial.ts` defines the VTT grid state: `enabled`, `width`, `height`, `cellSize` (pixels per cell), optional `background` image URL, `isometric` flag (controls [[vtt-dual-mode-rendering]]), `cameraAngle` (0–3 cardinal rotations for [[isometric-camera-rotates-cardinal-directions]]), and `maxElevation` (default 5, for [[elevation-cost-charges-per-level-change]]).

The config is persisted per encounter via the `grid-config.put` API endpoint and broadcast to spectators through [[vtt-websocket-events-sync-state]].

## See also

- [[battle-grid-settings-panel]] — the UI that edits this config
- [[battle-grid-dimensions-display]] — shows the width×height from this config
