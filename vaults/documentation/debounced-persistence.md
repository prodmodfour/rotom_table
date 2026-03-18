# Debounced Persistence

Both fog-of-war and terrain use `debouncedSave` with cleanup on unmount for server persistence. Losing the component mid-save can drop state.

`useFogPersistence` and `useTerrainPersistence` composables handle this pattern, wired into [[vtt-component-composable-map|VTTContainer]].

## See also

- [[vtt-grid-persistence-apis]] — the server endpoints these composables call
- [[fog-of-war-system]] — fog state that uses debounced persistence
- [[terrain-type-system]] — terrain state that uses debounced persistence
