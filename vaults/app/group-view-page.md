# Group View Page

The `/group` route renders a full-screen display intended for a TV or shared screen. It uses the `group` layout and dynamically renders one of four tab components based on the [[group-view-tab-state]]:

- **lobby** → [[group-view-lobby-tab]]
- **scene** → [[group-view-scene-display]]
- **encounter** → [[group-view-encounter-tab]]
- **map** → [[group-view-map-tab]]

Tab switches use a Vue `<Transition>` with a 0.3-second fade animation. The page title is "PTU - Group View".

There are no navigation controls on this page — the GM controls which tab is shown via the toggle buttons in the [[gm-navigation-bar]]. The page receives tab changes through [[group-view-websocket-sync]] and falls back to [[group-view-polls-as-websocket-fallback]].

## See also

- [[landing-page]] — links to this page as "Group View"
- [[group-view-layout-optimized-for-tv]]
