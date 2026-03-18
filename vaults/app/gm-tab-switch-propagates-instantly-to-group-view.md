Clicking a group view tab button (Lobby, Scene, Encounter, Map) in the [[gm-navigation-bar]] immediately switches the [[group-view-page]] to that tab. The active button in the GM toolbar gets an `[active]` visual state to indicate the current selection.

Observed: switching from Lobby to Encounter showed the "Waiting for Encounter" screen on the group view within ~1 second. Switching to Scene showed "No Active Scene". Switching back to Lobby restored the character card list. Each switch propagates through the [[group-view-websocket-sync]] channel.

The selected tab button in the GM toolbar does not visually indicate whether the tab switch reached the group view — there is no confirmation feedback beyond the button's active state.

## See also

- [[group-view-tab-state]] — the persisted tab state that these buttons modify
- [[group-view-polls-as-websocket-fallback]] — the fallback that catches missed tab switches
