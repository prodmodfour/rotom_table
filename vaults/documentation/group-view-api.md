# Group View API

REST endpoints under `/api/group` for Group View state management.

**Tab:** GET/PUT `/api/group/tab` — read and update the active tab state.

**Map:** GET/POST/DELETE `/api/group/map` — get, set, or clear the served map image.

**Wild spawn:** GET/POST/DELETE `/api/group/wild-spawn` — get, set, or clear the wild spawn preview.

State is stored in the [[singleton-models|GroupViewState singleton]].

## See also

- [[api-endpoint-layout]]
