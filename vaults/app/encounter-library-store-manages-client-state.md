# Encounter Library Store Manages Client State

The `encounterLibrary` Pinia store in `app/stores/encounterLibrary.ts` manages all template state on the client side.

**State** holds: `templates` (array of all fetched templates), `selectedTemplateId`, `loading`, `error`, and `filters` (search string, category, sortBy, sortOrder).

**Getters** provide client-side filtering and sorting. The `filteredTemplates` getter applies the category filter, then a case-insensitive search across name, description, and tags, then sorts by the chosen field and direction. Other getters derive `categories` and `allTags` as unique sets from all templates.

**Actions** map to the [[encounter-template-api-endpoints]]: `fetchTemplates`, `createTemplate`, `createFromEncounter`, `updateTemplate`, `deleteTemplate`. The `duplicateTemplate` action works [[encounter-template-duplicate-clones-client-side|client-side]] by reading the original template from state and calling `createTemplate` with cloned data.

The main encounter store (`app/stores/encounter.ts`) has a separate `loadFromTemplate` action that calls the [[encounter-template-load-endpoint-generates-pokemon|load endpoint]] and sets the returned encounter as active.

## See also

- [[encounter-library-search-filters-templates-by-name-description-tags]] — the UI that drives the store's filter state
- [[encounter-library-sort-controls]] — the UI that drives the store's sort state


- [[all-stores-use-pinia-options-api]]
- [[no-store-imports-another-store]]